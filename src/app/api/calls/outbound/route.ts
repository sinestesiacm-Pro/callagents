import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { calls, leads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { orchestratorAgent, outboundSalesAgent } from "@/agents";
import { createRetellAgent, assignAgentToPhone, makePhoneCall } from "@/retell";
import { parsePhoneToE164 } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const {
      leadId,
      phone,
      campaignId,
      context,
      agentType = "outbound_sales",
      fromNumber = process.env.RETEL_PHONE_NUMBER || "+19129158944",
    } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "phone is required" },
        { status: 400 }
      );
    }

    let lead = null;
    const phoneToCall = parsePhoneToE164(phone);

    if (leadId) {
      [lead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, leadId))
        .limit(1);
    }

    const agent =
      agentType === "outbound_sales" ? outboundSalesAgent : orchestratorAgent;

    const dynamicVars: Record<string, string> = {
      lead_name: lead?.fullName || "there",
      lead_company: lead?.company || "",
      lead_role: lead?.role || "",
      lead_language: lead?.language || "es",
      company: "Martinez Soluzioni",
      agent_name: agent.name,
      product_name: "servizi digitali",
      campaign_id: campaignId || "",
      client_context: context || "",
    };

    const voiceId = process.env.DEFAULT_VOICE_ID || "11labs-Marco";
    const lang = lead?.language || "it";

    // Step 1: Create and publish agent
    const { agentId: retellAgentId, version } = await createRetellAgent(
      agent, voiceId, lang, dynamicVars
    );

    // Step 2: Assign agent to phone number
    await assignAgentToPhone(retellAgentId, version, fromNumber);

    // Step 3: Make the call
    const callMetadata: Record<string, string> = {
      lead_id: leadId || "",
      agent_type: agentType,
      lead_name: lead?.fullName || "",
    };
    const call = await makePhoneCall(fromNumber, phoneToCall, callMetadata);

    // Step 4: Save to database
    await db.insert(calls).values({
      retellCallId: call.call_id,
      leadId: leadId || null,
      direction: "outbound",
      status: "in_progress",
      agentType: agentType,
      fromNumber,
      toNumber: phoneToCall,
      metadata: { campaignId, retellAgentId, dynamicVars },
      startedAt: new Date(),
    });

    if (lead && leadId) {
      await db
        .update(leads)
        .set({
          lastContactedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId));
    }

    return NextResponse.json({
      success: true,
      callId: call.call_id,
      retellAgentId,
      from: fromNumber,
      to: phoneToCall,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
