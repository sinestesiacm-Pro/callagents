import { NextRequest, NextResponse } from "next/server";
import {
  orchestratorAgent,
  outboundSalesAgent,
  inboundSalesAgent,
  objectionHandlerAgent,
  followUpAgent,
} from "@/agents";
import type { AgentDefinition } from "@/agents/types";

const agentRegistry: Record<string, AgentDefinition> = {
  orchestrator: orchestratorAgent,
  outbound_sales: outboundSalesAgent,
  inbound_sales: inboundSalesAgent,
  objection_handler: objectionHandlerAgent,
  follow_up: followUpAgent,
};

export async function GET() {
  const agents = Object.entries(agentRegistry).map(([, agent]) => ({
    type: agent.type,
    name: agent.name,
    description: agent.description,
    languages: agent.languages,
    handoffTriggers: agent.handoffTriggers,
    beginMessage: agent.beginMessage?.substring(0, 80) + "...",
  }));

  return NextResponse.json({ agents });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentType, language, voiceId, isActive } = body;

    if (!agentType || !agentRegistry[agentType]) {
      return NextResponse.json(
        { error: "Invalid agent type", available: Object.keys(agentRegistry) },
        { status: 400 }
      );
    }

    const agent = agentRegistry[agentType];

    return NextResponse.json({
      created: true,
      agent: {
        type: agent.type,
        name: agent.name,
        language: language || "es",
        voiceId: voiceId || process.env.DEFAULT_VOICE_ID,
        isActive: isActive ?? true,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
