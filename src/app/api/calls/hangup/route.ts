import { NextRequest, NextResponse } from "next/server";
import { getRetellClient } from "@/retell/client";

export async function POST(req: NextRequest) {
  try {
    const { callId } = await req.json();

    if (!callId) {
      return NextResponse.json({ error: "callId is required" }, { status: 400 });
    }

    const client = getRetellClient();
    await client.call.stop(callId);

    return NextResponse.json({ success: true, callId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
