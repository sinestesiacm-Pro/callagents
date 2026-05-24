"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

interface DashboardData {
  metrics: { totalLeads: number; totalCalls: number; completedCalls: number; failedCalls: number; successRate: number; positiveSentimentRate: number };
  leadStages: { stage: string; count: number }[];
  recentCalls: { id: string; direction: string; status: string; sentiment: string | null; durationMs: number | null; createdAt: string }[];
}

const PIE_COLORS = ["#005ab4", "#465f88", "#e0e2eb"];

export default function DashboardPage() {
  const { lang } = useLang();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => { if (json.metrics) setData(json); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-sm text-on-surface-variant">{t(lang, "common.loading")}</div>;
  if (!data) return <div className="flex items-center justify-center h-64 text-sm text-on-surface-variant">{t(lang, "dashboard.no_data")}</div>;

  const { metrics } = data;

  const stageData = data.leadStages.filter((s) => s.count > 0).map((s) => ({
    name: s.stage.replace(/_/g, " "),
    value: s.count,
  }));

  const sentimentData = [
    { name: "Positivo", value: data.recentCalls.filter((c) => c.sentiment === "Positive").length || metrics.positiveSentimentRate },
    { name: "Neutro", value: data.recentCalls.filter((c) => c.sentiment === "Neutral").length },
    { name: "Negativo", value: data.recentCalls.filter((c) => c.sentiment === "Negative").length },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 p-margin-desktop">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{t(lang, "dashboard.title")}</h1>
          <p className="text-sm text-on-surface-variant">{t(lang, "dashboard.subtitle")}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t(lang, "dashboard.leads"), value: metrics.totalLeads, icon: "group", bg: "bg-primary-container/30 text-primary" },
          { label: t(lang, "dashboard.calls"), value: metrics.totalCalls, icon: "call", bg: "bg-secondary-container/60 text-on-secondary-container" },
          { label: t(lang, "dashboard.success"), value: `${metrics.successRate}%`, icon: "check_circle", bg: "bg-surface-variant text-tertiary" },
          { label: t(lang, "dashboard.sentiment_pos"), value: `${metrics.positiveSentimentRate}%`, icon: "mood", bg: "bg-surface-container-high text-on-surface-variant" },
        ].map((m) => (
          <div key={m.label} className="flex flex-col justify-between rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 flex items-start justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.bg}`}>
                <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
              </span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">{m.label}</p>
              <p className="mt-1 text-2xl font-bold text-on-surface">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm lg:col-span-2">
          <h3 className="text-base font-semibold text-on-surface">{t(lang, "dashboard.pipeline")}</h3>
          {stageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stageData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e2eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#717785" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#717785" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e0e2eb",
                    borderRadius: "12px",
                    fontSize: "13px",
                    color: "#181c22",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stageData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${220 + i * 20}, 70%, ${55 - i * 5}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-xs text-on-surface-variant">{t(lang, "dashboard.no_data")}</div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
          <h3 className="w-full text-base font-semibold text-on-surface">{t(lang, "dashboard.sentiment_chart")}</h3>
          {sentimentData.reduce((a, b) => a + b.value, 0) > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                    {sentimentData.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e0e2eb", borderRadius: "10px", fontSize: "12px", color: "#181c22" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4">
                {sentimentData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-on-surface">
                      {s.name === "Positivo" ? t(lang, "dashboard.positive") : s.name === "Neutro" ? t(lang, "dashboard.neutral") : t(lang, "dashboard.negative")}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[180px] items-center justify-center text-xs text-on-surface-variant">{t(lang, "dashboard.no_data")}</div>
          )}
        </div>
      </div>

      {/* Recent Calls */}
      <div className="overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest px-6 py-4">
          <h3 className="text-base font-semibold text-on-surface">{t(lang, "dashboard.recent")}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low text-xs text-on-surface-variant">
                <th className="px-5 py-3 font-medium">Direzione</th>
                <th className="px-5 py-3 font-medium">Stato</th>
                <th className="px-5 py-3 font-medium">Sentiment</th>
                <th className="px-5 py-3 font-medium">Durata</th>
                <th className="px-5 py-3 text-right font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="text-on-surface">
              {data.recentCalls.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-on-surface-variant">{t(lang, "dashboard.no_calls")}</td></tr>
              ) : (
                data.recentCalls.map((call) => (
                  <tr key={call.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-5 py-3 capitalize">{call.direction}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        call.status === "completed" ? "bg-green-50 text-green-700" :
                        call.status === "failed" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          call.status === "completed" ? "bg-green-500" : call.status === "failed" ? "bg-red-500" : "bg-yellow-500"
                        }`} />
                        {call.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">{call.sentiment || "N/A"}</td>
                    <td className="px-5 py-3 font-mono text-on-surface-variant">
                      {call.durationMs ? `${Math.round(call.durationMs / 1000)}s` : "-"}
                    </td>
                    <td className="px-5 py-3 text-right text-on-surface-variant">
                      {new Date(call.createdAt).toLocaleDateString("it-IT")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
