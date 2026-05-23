import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { calls, leads, followUps } from "@/db/schema";
import { eq } from "drizzle-orm";
import { processWebhookPayload } from "@/retell";
import type { WebhookPayload } from "@/retell/types";
import { sendSms } from "@/lib/sms";

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

    let callRecord = existingCall;

    // Inbound calls arrive without pre-created DB record
    if (!callRecord) {
      if (payload.direction === "inbound" || payload.call_type === "inbound") {
        const [created] = await db
          .insert(calls)
          .values({
            retellCallId: payload.call_id,
            direction: "inbound",
            status: "in_progress",
            agentType: "inbound_sales",
            fromNumber: payload.from_number,
            toNumber: payload.to_number,
            startedAt: payload.start_timestamp
              ? new Date(payload.start_timestamp)
              : new Date(),
          })
          .returning();
        callRecord = created || null;
      }
    }

    if (!callRecord) {
      console.warn(`Call not found and not created: ${payload.call_id}`);
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
          .where(eq(calls.id, callRecord.id));
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
          .where(eq(calls.id, callRecord.id));

        if (callRecord.leadId) {
          await db
            .update(leads)
            .set({ lastContactedAt: new Date(), updatedAt: new Date() })
            .where(eq(leads.id, callRecord.leadId));
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
            .where(eq(calls.id, callRecord.id));
        }

        // Transcript arrives HERE — do link detection + SMS now
        await handlePostCallActions(callRecord.id, payload);
        break;

      case "error":
        await db
          .update(calls)
          .set({
            status: "failed",
            disconnectionReason: payload.disconnection_reason || "Webhook error",
          })
          .where(eq(calls.id, callRecord.id));
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
  const summary = payload.call_analysis?.call_summary || "";
  const sentiment = payload.call_analysis?.user_sentiment || "Neutral";

  // ── Detect booked appointment ──
  const appointment = detectAppointment(transcript, summary);
  const shouldSendLink =
    transcript.includes("mando il link") ||
    transcript.includes("ti mando") ||
    transcript.includes("invio il link") ||
    transcript.includes("mando link") ||
    transcript.includes("prova gratuita");

  // Prevent double processing
  const [existingFollowUp] = await db
    .select()
    .from(followUps)
    .where(eq(followUps.callId, call.id))
    .limit(1);

  if (existingFollowUp) return;

  let followUpType: string;
  let followUpContent: string;
  let followUpStatus = "pending";
  let scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  if (appointment) {
    followUpType = "appointment";
    followUpContent = `APPUNTAMENTO: ${appointment}\n\nRiassunto: ${summary}`;
    followUpStatus = "pending";
    scheduledAt = new Date();

    // Update call metadata with appointment info
    const currentMeta = (call.metadata as Record<string, unknown>) || {};
    await db
      .update(calls)
      .set({
        metadata: { ...currentMeta, appuntamento: appointment },
      })
      .where(eq(calls.id, call.id));

    // Update lead stage if exists
    if (call.leadId) {
      await db
        .update(leads)
        .set({
          stage: "demo_scheduled",
          notes: `Appuntamento: ${appointment}`.trim(),
          updatedAt: new Date(),
        })
        .where(eq(leads.id, call.leadId));
    }

    console.log("📅 APPUNTAMENTO RILEVATO:", appointment);
  } else if (shouldSendLink) {
    followUpType = "sms";
    followUpContent = `Ciao! Come promesso, ecco il sito: martinezsoluzioni.com - A presto!`;
    scheduledAt = new Date();

    if (call.toNumber) {
      try {
        await sendSms(call.toNumber, followUpContent);
        followUpStatus = "sent";
      } catch {
        followUpStatus = "failed";
      }
    }
  } else {
    followUpType = callbackStrategy(sentiment);
    followUpContent = `Post-call follow-up. Summary: ${summary}. Sentiment: ${sentiment}`;
  }

  if (call.leadId) {
    await db.insert(followUps).values({
      callId: call.id,
      leadId: call.leadId,
      type: followUpType,
      status: followUpStatus,
      content: followUpContent,
      scheduledAt,
    });
  } else if (appointment || shouldSendLink) {
    await db.insert(followUps).values({
      callId: call.id,
      type: followUpType,
      status: followUpStatus,
      content: followUpContent,
      scheduledAt,
    });
  }
}

function detectAppointment(transcript: string, summary: string): string | null {
  const text = `${transcript} ${summary}`.toLowerCase();

  const dayPatterns = [
    "lunedì", "martedì", "mercoledì", "mercoledi",
    "giovedì", "venerdì", "sabato", "domenica",
    "domani", "dopodomani",
  ];

  const foundDay = dayPatterns.find((d) => text.includes(d));
  if (!foundDay) return null;

  // Look for time nearby: "alle 10", "ore 15", "15:00", "10.30"
  const timeMatch = text.match(
    /(?:alle|ore|per le)\s*(\d{1,2})(?::|\.|e\s*)?(\d{2})?/i
  );
  const timeStr = timeMatch
    ? `${timeMatch[1]}${timeMatch[2] ? ":" + timeMatch[2] : ":00"}`
    : "orario da confermare";

  // Look for email if present
  const emailMatch = text.match(
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
  );
  const emailStr = emailMatch ? ` | email: ${emailMatch[0]}` : "";

  return `${foundDay} alle ${timeStr}${emailStr}`;
}

function callbackStrategy(
  sentiment: string
): "email" | "sms" | "callback" {
  if (sentiment === "Positive") return "email";
  if (sentiment === "Negative") return "email";
  return "callback";
}
