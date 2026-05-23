import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { calls, leads, followUps } from "@/db/schema";
import { eq } from "drizzle-orm";
import { processWebhookPayload } from "@/retell";
import type { WebhookPayload } from "@/retell/types";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const payload = processWebhookPayload(body);

    console.log(`📞 Webhook received: ${payload.event} - Call: ${payload.call_id}`);

    const [existingCall] = await db
      .select()
      .from(calls)
      .where(eq(calls.retellCallId, payload.call_id))
      .limit(1);

    if (!existingCall) {
      console.warn(`Call not found in DB: ${payload.call_id}`);
      return NextResponse.json({ received: true });
    }

    switch (payload.event) {
      case "call_started":
        await db
          .update(calls)
          .set({
            status: "in_progress",
            startedAt: new Date(payload.start_timestamp),
          })
          .where(eq(calls.id, existingCall.id));
        break;

      case "call_ended":
        await db
          .update(calls)
          .set({
            status: "completed",
            endedAt: new Date(payload.end_timestamp || Date.now()),
            durationMs: payload.end_timestamp && payload.start_timestamp
              ? payload.end_timestamp - payload.start_timestamp
              : null,
            disconnectionReason: payload.disconnection_reason,
            recordingUrl: payload.recording_url,
          })
          .where(eq(calls.id, existingCall.id));

        // Trigger follow-up agent logic
        await handlePostCallActions(existingCall.id, payload);

        // Update lead last contacted
        if (existingCall.leadId) {
          await db
            .update(leads)
            .set({ lastContactedAt: new Date(), updatedAt: new Date() })
            .where(eq(leads.id, existingCall.leadId));
        }
        break;

      case "call_analyzed":
        if (payload.call_analysis) {
          const analysis = payload.call_analysis;
          await db
            .update(calls)
            .set({
              transcript: payload.transcript,
              transcriptJson: payload.transcript_object || null,
              callSuccessful: analysis.call_successful,
              callSummary: analysis.call_summary,
              sentiment: analysis.user_sentiment,
              analysisData: analysis.custom_analysis_data || {},
            })
            .where(eq(calls.id, existingCall.id));
        }
        break;

      case "error":
        await db
          .update(calls)
          .set({
            status: "failed",
            disconnectionReason: payload.disconnection_reason || "Webhook error",
          })
          .where(eq(calls.id, existingCall.id));
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handlePostCallActions(
  callId: string,
  payload: WebhookPayload
) {
  const db = getDb();
  const [call] = await db
    .select()
    .from(calls)
    .where(eq(calls.id, callId))
    .limit(1);

  if (!call) return;

  const transcript = (payload.transcript || "").toLowerCase();
  const summary = payload.call_analysis?.call_summary || "Call completed";
  const sentiment = payload.call_analysis?.user_sentiment || "Neutral";

  // Detect if agent offered to send a link
  const shouldSendLink =
    transcript.includes("mando il link") ||
    transcript.includes("ti mando") ||
    transcript.includes("invio il link") ||
    transcript.includes("mando link") ||
    transcript.includes("prova gratuita");

  const followUpType = shouldSendLink ? "sms" : callbackStrategy(sentiment);
  const followUpContent = shouldSendLink
    ? `Ciao! Come promesso, ecco il sito di Martinez Soluzioni: https://martinezsoluzioni.com\n\nA presto!`
    : `Post-call follow-up. Summary: ${summary}. Sentiment: ${sentiment}`;

  // Create immediate follow-up if link was promised
  const scheduledAt = shouldSendLink
    ? new Date() // immediately
    : new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h default

  if (call.leadId) {
    await db.insert(followUps).values({
      callId: call.id,
      leadId: call.leadId,
      type: followUpType,
      status: shouldSendLink ? "pending" : "pending",
      content: followUpContent,
      scheduledAt,
    });
  } else {
    // No leadId: store by phone number if available
    const phone = call.toNumber || "";
    if (phone && shouldSendLink) {
      await db.insert(followUps).values({
        callId: call.id,
        type: followUpType,
        status: "pending",
        content: followUpContent,
        scheduledAt,
      });
    }
  }

  // Log to console so user can see it immediately
  if (shouldSendLink) {
    console.log("LINK SEND TRIGGERED:", {
      phone: call.toNumber,
      content: followUpContent,
      callId: call.id,
    });
  }
}

function callbackStrategy(
  sentiment: string
): "email" | "sms" | "callback" {
  if (sentiment === "Positive") return "email";
  if (sentiment === "Negative") return "email";
  return "callback";
}
