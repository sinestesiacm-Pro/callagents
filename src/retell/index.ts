import { getRetellClient } from "./client";

export { getRetellClient } from "./client";
import type { AgentDefinition } from "@/agents/types";
import { toRetellLanguage } from "./language";
import type { RetellCallResponse, WebhookPayload } from "./types";

export async function createRetellAgent(
  agent: AgentDefinition,
  voiceId: string,
  language: string = "es",
  dynamicVars: Record<string, string> = {}
): Promise<{ agentId: string; version: number }> {
  const client = getRetellClient();
  let prompt = agent.systemPrompt;
  for (const [key, value] of Object.entries(dynamicVars)) {
    prompt = prompt.replaceAll(`{{${key}}}`, value);
  }

  const llmRaw = await client.llm.create({
    model: "gpt-4.1",
    general_prompt: prompt,
    begin_message: "",
    general_tools: [],
  } as unknown as Parameters<typeof client.llm.create>[0]);

  const llmId = (llmRaw as unknown as Record<string, unknown>).llm_id as string;

  const agentResp = await client.agent.create({
    agent_name: agent.name,
    response_engine: {
      llm_id: llmId,
      type: "retell-llm" as const,
    },
    voice_id: voiceId,
    language: toRetellLanguage(language),
    enable_backchannel: true,
    backchannel_frequency: 0.3,
    responsiveness: 1,
    interruption_sensitivity: 0.2,
    end_call_after_silence_ms: 10000,
    max_call_duration_ms: 600000,
    boosted_keywords: ["demo", "precio", "prueba", "competencia", "urgente"],
    ambient_sound: "coffee-shop",
    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/calls/webhook`,
    webhook_events: ["call_started", "call_ended", "call_analyzed"],
  } as unknown as Parameters<typeof client.agent.create>[0]);

  // Publish version 1 so agent is usable for outbound calls
  try {
    await client.agent.publish(agentResp.agent_id, {
      version: agentResp.version,
    } as unknown as Parameters<typeof client.agent.publish>[1]);
  } catch (e) {
    console.warn("Could not publish agent version (may already be published):", e);
  }

  return { agentId: agentResp.agent_id, version: agentResp.version };
}

export async function assignAgentToPhone(
  agentId: string,
  version: number,
  phoneNumber: string
): Promise<void> {
  const client = getRetellClient();
  await client.phoneNumber.update(phoneNumber, {
    outbound_agents: [
      {
        agent_id: agentId,
        agent_version: version,
        weight: 1,
      },
    ],
  } as unknown as Parameters<typeof client.phoneNumber.update>[1]);
}

export async function makePhoneCall(
  fromNumber: string,
  toNumber: string,
  metadata: Record<string, string> = {}
): Promise<RetellCallResponse> {
  const client = getRetellClient();
  const call = await client.call.createPhoneCall({
    from_number: fromNumber,
    to_number: toNumber,
    retell_llm_dynamic_variables: metadata,
  } as unknown as Parameters<typeof client.call.createPhoneCall>[0]);

  return {
    call_id: (call as unknown as Record<string, unknown>).call_id as string,
    status: "registered",
    call_type: "outbound",
    from_number: fromNumber,
    to_number: toNumber,
    direction: "outbound",
    start_timestamp: Date.now(),
  };
}

export async function getCallDetails(
  callId: string
): Promise<RetellCallResponse> {
  const client = getRetellClient();
  const raw = (await client.call.retrieve(callId)) as unknown as Record<string, unknown>;

  return {
    call_id: (raw.call_id as string) || callId,
    status: (raw.call_status as RetellCallResponse["status"]) || "ended",
    call_type: (raw.call_type as "inbound" | "outbound") || "outbound",
    from_number: (raw.from_number as string) || "",
    to_number: (raw.to_number as string) || "",
    direction: (raw.direction as "inbound" | "outbound") || "outbound",
    start_timestamp: (raw.start_timestamp as number) || 0,
    end_timestamp: raw.end_timestamp as number | undefined,
    transcript: raw.transcript as string | undefined,
    transcript_object:
      raw.transcript_object as RetellCallResponse["transcript_object"],
    recording_url: raw.recording_url as string | undefined,
    disconnection_reason: raw.disconnection_reason as string | undefined,
    call_analysis: raw.call_analysis as RetellCallResponse["call_analysis"],
  };
}

export function processWebhookPayload(
  body: unknown
): WebhookPayload {
  const data = body as Record<string, unknown>;

  return {
    call_id: data.call_id as string,
    event: data.event as WebhookPayload["event"],
    access_token: data.access_token as string,
    call_type: (data.call_type as "inbound" | "outbound") || "outbound",
    from_number: data.from_number as string,
    to_number: data.to_number as string,
    direction: (data.direction as "inbound" | "outbound") || "outbound",
    start_timestamp: data.start_timestamp as number,
    end_timestamp: data.end_timestamp as number,
    transcript: data.transcript as string,
    transcript_object:
      data.transcript_object as WebhookPayload["transcript_object"],
    recording_url: data.recording_url as string,
    disconnection_reason: data.disconnection_reason as string,
    call_analysis: data.call_analysis as WebhookPayload["call_analysis"],
    retell_llm_dynamic_variables:
      data.retell_llm_dynamic_variables as Record<string, string>,
  };
}
