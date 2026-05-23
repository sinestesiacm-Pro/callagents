"use client";

import { useEffect, useState } from "react";

interface CallRecord {
  id: string;
  retellCallId: string | null;
  direction: string;
  status: string;
  sentiment: string | null;
  toNumber: string | null;
  transcript: string | null;
  callSummary: string | null;
  analysisData: Record<string, unknown> | null;
  durationMs: number | null;
  createdAt: string;
}

export default function AdminPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [selected, setSelected] = useState<CallRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalls();
    const interval = setInterval(fetchCalls, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchCalls() {
    try {
      const r = await fetch("/api/admin/calls");
      const data = await r.json();
      setCalls(data.calls || []);
    } finally {
      setLoading(false);
    }
  }

  function parseAppointment(summary: string | null): string | null {
    if (!summary) return null;
    const lower = summary.toLowerCase();
    if (
      lower.includes("appuntamento") ||
      lower.includes("scheduled") ||
      lower.includes("agreed to")
    ) {
      return summary;
    }
    return null;
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-sm text-zinc-500">
        Caricamento...
      </div>
    );

  return (
    <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-7xl">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/[0.06] bg-white/[0.01] p-4 overflow-y-auto shrink-0">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-1">
          Chiamate recenti
        </h2>
        {calls.length === 0 ? (
          <p className="text-xs text-zinc-600 px-1">Nessuna chiamata</p>
        ) : (
          <div className="space-y-1">
            {calls.map((call) => {
              const appt = parseAppointment(call.callSummary);
              return (
                <button
                  key={call.id}
                  onClick={() => setSelected(call)}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all ${
                    selected?.id === call.id
                      ? "bg-white/[0.06] border border-white/[0.1]"
                      : "border border-transparent hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        call.status === "completed"
                          ? "bg-emerald-500"
                          : call.status === "failed"
                            ? "bg-red-500"
                            : "bg-amber-500"
                      }`}
                    />
                    <span className="text-[10px] text-zinc-600">
                      {new Date(call.createdAt).toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] mt-1.5 text-zinc-500">
                    {call.toNumber || "Sconosciuto"}
                  </p>
                  {appt ? (
                    <p className="text-[11px] mt-1 text-emerald-400/80 line-clamp-2">
                      Appuntamento
                    </p>
                  ) : (
                    <p className="text-[11px] mt-1 text-zinc-400 line-clamp-2">
                      {call.callSummary || "In attesa..."}
                    </p>
                  )}
                  {call.sentiment && (
                    <span
                      className={`text-[10px] mt-1 inline-block ${
                        call.sentiment === "Positive"
                          ? "text-emerald-500"
                          : call.sentiment === "Negative"
                            ? "text-red-400"
                            : "text-zinc-500"
                      }`}
                    >
                      {call.sentiment}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-10 w-10 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <svg
                className="h-5 w-5 text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <p className="text-sm text-zinc-500">
              Seleziona una chiamata per vedere i dettagli
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Le chiamate appaiono qui in tempo reale
            </p>
          </div>
        ) : (
          <div className="max-w-3xl space-y-6 animate-in fade-in">
            {/* Header */}
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Dettagli Chiamata
              </h2>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Stat
                  label="Stato"
                  value={selected.status}
                  color={selected.status === "completed" ? "emerald" : selected.status === "failed" ? "red" : "amber"}
                />
                <Stat label="Direzione" value={selected.direction} />
                <Stat label="Sentiment" value={selected.sentiment || "N/A"} />
                <Stat
                  label="Durata"
                  value={
                    selected.durationMs
                      ? `${Math.round(selected.durationMs / 1000)}s`
                      : "N/A"
                  }
                />
                <Stat label="Data" value={new Date(selected.createdAt).toLocaleDateString("it-IT")} />
                <Stat label="Numero" value={selected.toNumber || "N/A"} mono />
              </div>
            </div>

            {/* Summary */}
            {selected.callSummary ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                  Riassunto
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {selected.callSummary}
                </p>
              </div>
            ) : null}

            {/* Transcript */}
            {selected.transcript ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
                  Trascrizione
                </h3>
                <div className="space-y-2 max-h-[32rem] overflow-y-auto">
                  {selected.transcript.split("\n").map((line, i) => {
                    const isAgent =
                      line.startsWith("Agent:") ||
                      line.startsWith("Agente:");
                    return (
                      <div
                        key={i}
                        className={`px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                          isAgent
                            ? "bg-blue-500/[0.06] border border-blue-500/[0.1] text-blue-200/90"
                            : "bg-white/[0.02] border border-white/[0.04] text-zinc-300"
                        }`}
                      >
                        <span className="text-[10px] font-medium text-zinc-500 mr-2">
                          {isAgent ? "Marco" : "Cliente"}
                        </span>
                        {line.replace(/^(Agent|Agente|User|Customer):\s*/i, "")}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : selected.status === "completed" ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                <p className="text-sm text-zinc-500">
                  Trascrizione in elaborazione...
                </p>
                <p className="text-xs text-zinc-600 mt-1">
                  Retell sta processando la chiamata. Ricarica tra qualche
                  secondo.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
  mono,
}: {
  label: string;
  value: string;
  color?: string;
  mono?: boolean;
}) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400",
    red: "text-red-400",
    amber: "text-amber-400",
  };
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
        {label}
      </p>
      <p
        className={`mt-1 text-sm ${mono ? "font-mono" : ""} ${color ? colorMap[color] || "text-zinc-300" : "text-zinc-300"}`}
      >
        {value}
      </p>
    </div>
  );
}
