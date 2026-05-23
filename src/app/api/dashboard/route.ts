import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { calls, leads } from "@/db/schema";
import { sql, eq, count } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();

    const [leadCount] = await db
      .select({ value: count() })
      .from(leads);
    const totalLeads = leadCount?.value ?? 0;

    const [callCount] = await db
      .select({ value: count() })
      .from(calls);
    const totalCalls = callCount?.value ?? 0;

    const [completed] = await db
      .select({ value: count() })
      .from(calls)
      .where(eq(calls.status, "completed"));
    const completedCalls = completed?.value ?? 0;

    const [failed] = await db
      .select({ value: count() })
      .from(calls)
      .where(eq(calls.status, "failed"));
    const failedCalls = failed?.value ?? 0;

    const [positive] = await db
      .select({ value: count() })
      .from(calls)
      .where(eq(calls.sentiment, "Positive"));
    const positiveSentiment = positive?.value ?? 0;

    const leadStageDistribution = await db
      .select({
        stage: leads.stage,
        count: count(),
      })
      .from(leads)
      .groupBy(leads.stage);

    const recentCalls = await db
      .select({
        id: calls.id,
        retellCallId: calls.retellCallId,
        direction: calls.direction,
        status: calls.status,
        sentiment: calls.sentiment,
        durationMs: calls.durationMs,
        createdAt: calls.createdAt,
      })
      .from(calls)
      .orderBy(sql`${calls.createdAt} DESC`)
      .limit(10);

    return NextResponse.json({
      metrics: {
        totalLeads,
        totalCalls,
        completedCalls,
        failedCalls,
        successRate:
          totalCalls > 0
            ? Math.round((completedCalls / totalCalls) * 100)
            : 0,
        positiveSentimentRate:
          completedCalls > 0
            ? Math.round((positiveSentiment / completedCalls) * 100)
            : 0,
      },
      leadStages: leadStageDistribution,
      recentCalls,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
