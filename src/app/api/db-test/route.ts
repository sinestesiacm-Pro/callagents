import { NextResponse } from "next/server";
import postgres from "postgres";

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ connected: false, error: "DATABASE_URL not set" }, { status: 500 });
  }

  try {
    const sql = postgres(url, {
      max: 1,
      ssl: true,
      connect_timeout: 10,
      idle_timeout: 10,
    });

    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `;

    const leadsCount = await sql`SELECT count(*)::int as c FROM leads`;
    const agentCount = await sql`SELECT count(*)::int as c FROM agent_configs`;

    await sql.end();

    return NextResponse.json({
      connected: true,
      tables: tables.map((r: Record<string, string>) => r.table_name),
      leadsCount: (leadsCount[0] as Record<string, number>).c,
      agentConfigs: (agentCount[0] as Record<string, number>).c,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const cause =
      error instanceof Error && error.cause
        ? String(error.cause)
        : "no cause";
    return NextResponse.json(
      { connected: false, error: message, cause },
      { status: 500 }
    );
  }
}
