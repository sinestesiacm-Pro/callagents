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

function parseAppointment(summary: string | null): string | null {
  if (!summary) return null;
  const lower = summary.toLowerCase();
  if (lower.includes("appuntamento") || lower.includes("scheduled") || lower.includes("agreed to")) return summary;
  return null;
}

export default function AdminPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [selected, setSelected] = useState<CallRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
      if (data.calls?.length && !selected) setSelected(data.calls[0]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = calls.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.toNumber && c.toNumber.includes(q)) ||
      (c.callSummary && c.callSummary.toLowerCase().includes(q))
    );
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-sm text-on-surface-variant">Caricamento...</div>;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-outline-variant/20 bg-surface">
        <div className="sticky top-0 z-10 border-b border-outline-variant/20 bg-surface/95 p-4 backdrop-blur">
          <h2 className="mb-3 text-lg font-semibold text-on-surface">Cronologia</h2>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca numero o riassunto..."
              className="w-full rounded-lg border-none bg-surface-container py-2 pl-10 pr-3 text-sm text-on-surface placeholder:text-outline outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-3 text-xs text-on-surface-variant">Nessuna chiamata</p>
          ) : (
            filtered.map((call) => {
              const appt = parseAppointment(call.callSummary);
              return (
                <button
                  key={call.id}
                  onClick={() => setSelected(call)}
                  className={`flex w-full flex-col rounded-lg p-3 text-left transition-colors ${
                    selected?.id === call.id
                      ? "border border-primary/20 bg-primary-container/10"
                      : "hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex w-full items-start justify-between">
                    <span className="text-xs font-semibold text-on-surface">
                      {call.toNumber || "Sconosciuto"}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      {new Date(call.createdAt).toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <span className="truncate pr-2 text-[11px] text-on-surface-variant">
                      {appt ? "Appuntamento" : call.callSummary || "In attesa..."}
                    </span>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        call.status === "completed"
                          ? "bg-green-500"
                          : call.status === "failed"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                      }`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-surface-container-lowest to-surface-container-low p-6 md:p-8">
        {!selected ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined mb-4 text-5xl text-outline-variant">description</span>
            <p className="text-sm text-on-surface-variant">Seleziona una chiamata per vedere la trascrizione</p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-on-surface">Dettaglio Chiamata</h1>
                <p className="text-sm text-on-surface-variant">
                  {selected.toNumber} ·{" "}
                  {new Date(selected.createdAt).toLocaleString("it-IT")}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {[
                { label: "Direzione", value: selected.direction, icon: "call_made" },
                {
                  label: "Durata",
                  value: selected.durationMs
                    ? `${Math.round(selected.durationMs / 1000)}s`
                    : "N/A",
                  icon: "schedule",
                },
                {
                  label: "Sentiment",
                  value: selected.sentiment || "N/A",
                  icon: "sentiment_satisfied",
                  color: selected.sentiment === "Positive" ? "text-green-600" : undefined,
                },
                { label: "Stato", value: selected.status, icon: "check_circle" },
                {
                  label: "Data",
                  value: new Date(selected.createdAt).toLocaleDateString("it-IT"),
                  icon: "calendar_today",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col gap-1 rounded-xl border border-outline-variant/20 bg-surface-container-lowest/70 p-4 backdrop-blur-sm shadow-sm"
                >
                  <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">{stat.icon}</span>
                    {stat.label}
                  </span>
                  <span className={`text-sm font-semibold text-on-surface ${stat.color || ""}`}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Summary */}
              {selected.callSummary && (
                <div className="flex flex-col gap-4 lg:col-span-1">
                  <div className="flex h-full flex-col gap-4 rounded-2xl border border-primary/10 bg-surface-container-lowest/80 p-5 backdrop-blur-sm shadow-sm">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
                      Sintesi AI
                    </h3>
                    <div className="flex-1 space-y-3 text-sm text-on-surface-variant leading-relaxed">
                      <p>{selected.callSummary}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transcript */}
              <div className="flex flex-col lg:col-span-2">
                <div className="flex h-[500px] flex-col rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
                  <div className="flex items-center justify-between rounded-t-2xl border-b border-outline-variant/20 bg-surface-container/50 px-5 py-3">
                    <h3 className="text-base font-semibold text-on-surface">Trascrizione</h3>
                  </div>
                  {selected.transcript ? (
                    <div className="flex-1 space-y-5 overflow-y-auto p-5">
                      {selected.transcript.split("\n").map((line, i) => {
                        const isAgent = line.startsWith("Agent:") || line.startsWith("Agente:");
                        return (
                          <div
                            key={i}
                            className={`flex flex-col gap-1 max-w-[85%] ${
                              isAgent ? "mr-auto" : "ml-auto items-end"
                            }`}
                          >
                            <div
                              className={`flex items-center gap-2 text-xs text-on-surface-variant ${
                                isAgent ? "ml-1" : "mr-1"
                              }`}
                            >
                              {isAgent ? (
                                <>
                                  <span className="material-symbols-outlined text-[14px]">support_agent</span>
                                  <span>Agente</span>
                                </>
                              ) : (
                                <>
                                  <span>Cliente</span>
                                  <span className="material-symbols-outlined text-[14px]">person</span>
                                </>
                              )}
                            </div>
                            <div
                              className={`rounded-2xl p-4 text-sm leading-relaxed ${
                                isAgent
                                  ? "rounded-tl-sm bg-surface-container-high text-on-surface shadow-sm"
                                  : "rounded-tr-sm bg-primary text-on-primary shadow-md"
                              }`}
                            >
                              {line.replace(/^(Agent|Agente|User|Customer):\s*/i, "")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : selected.status === "completed" ? (
                    <div className="flex flex-1 items-center justify-center">
                      <p className="text-sm text-on-surface-variant">Trascrizione in elaborazione...</p>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center">
                      <p className="text-sm text-on-surface-variant">Chiamata in corso. La trascrizione apparirà qui.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
