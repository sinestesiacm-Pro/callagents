import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { calls, leads } from "@/db/schema";
import { inboundSalesAgent } from "@/agents";
import { createRetellAgent } from "@/retell";
import { getRetellClient } from "@/retell/client";
import { toRetellLanguage } from "@/retell/language";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const {
      phoneNumber = process.env.RETEL_PHONE_NUMBER || "+19129158944",
      voiceId = process.env.DEFAULT_VOICE_ID || "11labs-Andrea",
      language = "it",
    } = body;

    // Create inbound agent
    const { agentId, version } = await createRetellAgent(
      inboundSalesAgent,
      voiceId,
      language,
      {
        company: "Martinez Soluzioni",
        agent_name: inboundSalesAgent.name,
        lead_language: language,
      }
    );

    // Register as inbound agent on phone number
    const client = getRetellClient();
    await client.phoneNumber.update(phoneNumber, {
      inbound_agent_id: agentId,
    } as unknown as Parameters<typeof client.phoneNumber.update>[1]);

    return NextResponse.json({
      success: true,
      inboundAgentId: agentId,
      phoneNumber,
      message: "Agente inbound configurado. Las llamadas entrantes seran atendidas automaticamente.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
