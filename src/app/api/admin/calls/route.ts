import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { calls } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();

    const callList = await db
      .select({
        id: calls.id,
        retellCallId: calls.retellCallId,
        direction: calls.direction,
        status: calls.status,
        sentiment: calls.sentiment,
        toNumber: calls.toNumber,
        transcript: calls.transcript,
        callSummary: calls.callSummary,
        analysisData: calls.analysisData,
        durationMs: calls.durationMs,
        createdAt: calls.createdAt,
      })
      .from(calls)
      .orderBy(sql`${calls.createdAt} DESC`)
      .limit(50);

    return NextResponse.json({ calls: callList });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
