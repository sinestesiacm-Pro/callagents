"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

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
  metadata: Record<string, unknown> | null;
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
  const { lang } = useLang();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [selected, setSelected] = useState<CallRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDetail, setShowDetail] = useState(false);

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
      if (data.calls?.length && !selected) { setSelected(data.calls[0]); }
    } finally { setLoading(false); }
  }

  function select(call: CallRecord) {
    setSelected(call);
    setShowDetail(true);
  }

  const filtered = calls.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.toNumber && c.toNumber.includes(q)) || (c.callSummary && c.callSummary.toLowerCase().includes(q));
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-sm text-on-surface-variant">{t(lang, "common.loading")}</div>;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar - hidden on mobile when detail is shown */}
      <aside className={`flex w-full shrink-0 flex-col border-r border-outline-variant/20 bg-surface md:w-80 ${showDetail ? "hidden md:flex" : "flex"}`}>
        <div className="sticky top-0 z-10 border-b border-outline-variant/20 bg-surface/95 p-4 backdrop-blur">
          <h2 className="mb-3 text-lg font-semibold text-on-surface">{t(lang, "admin.title")}</h2>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t(lang, "admin.search")}
              className="w-full rounded-lg border-none bg-surface-container py-2.5 pl-10 pr-3 text-sm text-on-surface placeholder:text-outline outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-3 text-xs text-on-surface-variant">{t(lang, "admin.empty")}</p>
          ) : (
            filtered.map((call) => {
              const appt = parseAppointment(call.callSummary);
              return (
                <button key={call.id} onClick={() => select(call)}
                  className={`flex w-full flex-col rounded-lg p-3 text-left transition-colors ${
                    selected?.id === call.id
                      ? "border border-primary/20 bg-primary-container/10"
                      : "hover:bg-surface-container-low"
                  }`}>
                  <div className="flex w-full items-start justify-between">
                    <span className="text-xs font-semibold text-on-surface">{call.toNumber || (lang === "it" ? "Sconosciuto" : "Desconocido")}</span>
                    <span className="text-[10px] text-on-surface-variant">
                      {new Date(call.createdAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <span className="truncate pr-2 text-[11px] text-on-surface-variant">
                      {appt ? t(lang, "admin.appointment") : call.callSummary || "..."}
                    </span>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${
                      call.status === "completed" ? "bg-green-500" : call.status === "failed" ? "bg-red-500" : "bg-yellow-500"
                    }`} />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Detail - shown when selected AND on mobile with showDetail */}
      <main className={`flex-1 overflow-y-auto bg-gradient-to-br from-surface-container-lowest to-surface-container-low ${!showDetail && !selected ? "hidden md:flex md:items-center md:justify-center" : "flex flex-col"}`}>
        {/* Mobile back button */}
        <div className="sticky top-0 z-10 flex md:hidden items-center gap-2 border-b border-outline-variant/20 bg-surface/95 px-4 py-3 backdrop-blur">
          <button onClick={() => setShowDetail(false)} className="flex items-center gap-1 text-sm text-primary font-medium">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            {t(lang, "admin.title")}
          </button>
        </div>

        {!selected || (!showDetail && typeof window !== "undefined" && window.innerWidth < 768) ? (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-6">
            <span className="material-symbols-outlined mb-4 text-5xl text-outline-variant">description</span>
            <p className="text-sm text-on-surface-variant">{t(lang, "admin.select")}</p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-5xl flex flex-col gap-6 p-4 sm:p-6 md:p-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl sm:text-2xl font-bold text-on-surface">{t(lang, "admin.detail")}</h1>
              <p className="text-sm text-on-surface-variant">
                {selected.toNumber} · {new Date(selected.createdAt).toLocaleString("it-IT")}
              </p>
            </div>

            {/* Stats - stack vertically on mobile */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: t(lang, "admin.direction"), value: selected.direction, icon: "call_made" },
                { label: t(lang, "admin.duration"), value: selected.durationMs ? `${Math.round(selected.durationMs / 1000)}s` : "N/A", icon: "schedule" },
                { label: t(lang, "admin.sentiment"), value: selected.sentiment || "N/A", icon: "sentiment_satisfied", color: selected.sentiment === "Positive" ? "text-green-600" : undefined },
                { label: t(lang, "admin.status"), value: selected.status, icon: "check_circle" },
                { label: t(lang, "admin.date"), value: new Date(selected.createdAt).toLocaleDateString("it-IT"), icon: "calendar_today" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1 rounded-xl border border-outline-variant/20 bg-surface-container-lowest/70 p-4 backdrop-blur-sm shadow-sm">
                  <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">{stat.icon}</span> {stat.label}
                  </span>
                  <span className={`text-sm font-semibold text-on-surface ${stat.color || ""}`}>{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Summary + Transcript stack on mobile */}
            <div className="flex flex-col gap-6 lg:flex-row">
              {selected.callSummary && (
                <div className="flex flex-col gap-4 lg:w-1/3">
                  <div className="flex h-full flex-col gap-4 rounded-2xl border border-primary/10 bg-surface-container-lowest/80 p-5 backdrop-blur-sm shadow-sm">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
                      {t(lang, "admin.summary")}
                    </h3>
                    <div className="flex-1 space-y-3 text-sm text-on-surface-variant leading-relaxed">
                      <p>{(selected.metadata as Record<string, string>)?.[lang === "it" ? "summaryIt" : "summaryEs"] || selected.callSummary}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className={`flex flex-col ${selected.callSummary ? "lg:w-2/3" : "w-full"}`}>
                <div className="flex flex-1 min-h-0 flex-col rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
                  <div className="flex items-center justify-between rounded-t-2xl border-b border-outline-variant/20 bg-surface-container/50 px-5 py-3">
                    <h3 className="text-base font-semibold text-on-surface">{t(lang, "admin.transcript")}</h3>
                  </div>
                  {selected.transcript ? (
                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                      {selected.transcript.split("\n").map((line, i) => {
                        const isAgent = line.startsWith("Agent:") || line.startsWith("Agente:");
                        return (
                          <div key={i} className={`flex flex-col gap-1 max-w-[90%] ${isAgent ? "mr-auto" : "ml-auto items-end"}`}>
                            <div className={`flex items-center gap-2 text-[11px] text-on-surface-variant ${isAgent ? "ml-1" : "mr-1"}`}>
                              {isAgent ? (
                                <><span className="material-symbols-outlined text-[14px]">support_agent</span><span>{t(lang, "admin.agent")}</span></>
                              ) : (
                                <><span>{t(lang, "admin.client")}</span><span className="material-symbols-outlined text-[14px]">person</span></>
                              )}
                            </div>
                            <div className={`rounded-2xl p-3 sm:p-4 text-sm leading-relaxed ${
                              isAgent ? "rounded-tl-sm bg-surface-container-high text-on-surface shadow-sm" : "rounded-tr-sm bg-primary text-on-primary shadow-md"
                            }`}>
                              {line.replace(/^(Agent|Agente|User|Customer):\s*/i, "")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center p-4">
                      <p className="text-sm text-on-surface-variant text-center">
                        {selected.status === "completed" ? t(lang, "admin.processing") : t(lang, "admin.in_progress")}
                      </p>
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
