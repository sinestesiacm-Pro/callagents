"use client";

import { useState } from "react";

export default function CallPage() {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "calling" | "success" | "hangingup" | "error">("idle");
  const [message, setMessage] = useState("");
  const [callId, setCallId] = useState<string | null>(null);

  async function handleCall() {
    if (!phone) return;
    setStatus("calling");
    setMessage("Creando agente y llamando...");

    try {
      const res = await fetch("/api/calls/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, agentType: "outbound_sales" }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Llamada en curso...");
        setCallId(data.callId);
      } else {
        setStatus("error");
        setMessage(data.error || "Unknown error");
      }
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Failed to connect");
    }
  }

  async function handleHangup() {
    if (!callId) return;
    setStatus("hangingup");
    setMessage("Colgando...");

    try {
      const res = await fetch("/api/calls/hangup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("idle");
        setMessage("Llamada finalizada.");
        setCallId(null);
      } else {
        setStatus("error");
        setMessage(data.error || "Error al colgar");
      }
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Failed to hang up");
    }
  }

  function handleReset() {
    setStatus("idle");
    setMessage("");
    setCallId(null);
  }

  const statusColors: Record<string, string> = {
    idle: "",
    calling: "bg-blue-900/50 border-blue-700 text-blue-300",
    success: "bg-green-900/50 border-green-700 text-green-300",
    hangingup: "bg-yellow-900/50 border-yellow-700 text-yellow-300",
    error: "bg-red-900/50 border-red-700 text-red-300",
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">N-tropy Call</h1>
          <p className="text-gray-400 text-sm mt-1">Make an outbound sales call</p>
          <p className="text-gray-500 text-xs mt-1">From: +19129158944</p>
        </div>

        <div className="space-y-3">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+393899163911"
            disabled={status === "calling" || status === "success" || status === "hangingup"}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />

          {status === "idle" || status === "error" ? (
            <button
              onClick={handleCall}
              disabled={!phone}
              className="w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed"
            >
              {status === "error" ? "Retry Call" : "Call Now"}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleHangup}
                disabled={status === "hangingup"}
                className="flex-1 py-3 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {status === "hangingup" ? "Colgando..." : "Hang Up"}
              </button>
              {status === "success" && (
                <button
                  onClick={handleReset}
                  className="px-4 py-3 rounded-lg font-medium transition-colors bg-gray-700 hover:bg-gray-600"
                >
                  New
                </button>
              )}
            </div>
          )}
        </div>

        {message && (
          <div className={`p-4 rounded-lg text-sm border ${statusColors[status]}`}>
            <p className="font-medium">{message}</p>
            {callId && (
              <p className="text-xs mt-1 opacity-60">Call ID: {callId}</p>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>Outbound Sales Agent using SPIN Selling + BANT</p>
          <p>Max duration: 10 min · Language: Spanish</p>
        </div>
      </div>
    </div>
  );
}
