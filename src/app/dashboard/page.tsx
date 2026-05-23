"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardData {
  metrics: {
    totalLeads: number;
    totalCalls: number;
    completedCalls: number;
    failedCalls: number;
    successRate: number;
    positiveSentimentRate: number;
  };
  leadStages: { stage: string; count: number }[];
  recentCalls: {
    id: string;
    direction: string;
    status: string;
    sentiment: string | null;
    durationMs: number | null;
    createdAt: string;
  }[];
}

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.metrics) setData(json);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-sm text-zinc-500">
        Caricamento...
      </div>
    );

  if (!data)
    return (
      <div className="flex items-center justify-center h-64 text-sm text-zinc-500">
        Nessun dato disponibile
      </div>
    );

  const { metrics } = data;

  const sentimentData = [
    { name: "Positive", value: data.leadStages.filter((s) => s.stage === "demo_scheduled" || s.stage === "closed_won").reduce((a, b) => a + b.count, 0) || metrics.positiveSentimentRate },
    { name: "Negative", value: data.leadStages.filter((s) => s.stage === "closed_lost" || s.stage === "unqualified").reduce((a, b) => a + b.count, 0) },
    { name: "Pending", value: data.leadStages.filter((s) => s.stage === "new" || s.stage === "contacted" || s.stage === "qualified").reduce((a, b) => a + b.count, 0) },
  ];

  const stageData = data.leadStages
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.stage.replace(/_/g, " "),
      value: s.count,
    }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Analisi</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Panoramica delle chiamate e della pipeline.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <MetricCard label="Lead Totali" value={metrics.totalLeads} />
        <MetricCard label="Chiamate" value={metrics.totalCalls} />
        <MetricCard label="Tasso Successo" value={`${metrics.successRate}%`} accent />
        <MetricCard label="Sentiment +" value={`${metrics.positiveSentimentRate}%`} accent />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
            Pipeline Lead
          </h3>
          {stageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stageData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#d4d4d8",
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="url(#barGrad)" />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-xs text-zinc-600">
              Nessun lead nella pipeline
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
            Sentiment
          </h3>
          {sentimentData.reduce((a, b) => a + b.value, 0) > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sentimentData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#d4d4d8",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-xs text-zinc-600">
              Nessun dato sentiment
            </div>
          )}
        </div>
      </div>

      {/* Recent calls table */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
          Chiamate Recenti
        </h3>
        {data.recentCalls.length === 0 ? (
          <p className="text-xs text-zinc-600">Nessuna chiamata</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 font-medium">Direzione</th>
                  <th className="text-left py-3 px-3 font-medium">Stato</th>
                  <th className="text-left py-3 px-3 font-medium">Sentiment</th>
                  <th className="text-left py-3 px-3 font-medium">Durata</th>
                  <th className="text-right py-3 px-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.recentCalls.map((call) => (
                  <tr
                    key={call.id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-3 text-zinc-300 capitalize">
                      {call.direction}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 ${
                          call.status === "completed"
                            ? "text-emerald-400"
                            : call.status === "failed"
                              ? "text-red-400"
                              : "text-amber-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            call.status === "completed"
                              ? "bg-emerald-500"
                              : call.status === "failed"
                                ? "bg-red-500"
                                : "bg-amber-500"
                          }`}
                        />
                        {call.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-400">
                      {call.sentiment || "N/A"}
                    </td>
                    <td className="py-3 px-3 text-zinc-500 font-mono">
                      {call.durationMs
                        ? `${Math.round(call.durationMs / 1000)}s`
                        : "-"}
                    </td>
                    <td className="py-3 px-3 text-right text-zinc-600">
                      {new Date(call.createdAt).toLocaleDateString("it-IT")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-5 py-4 ${
        accent
          ? "border-blue-500/10 bg-blue-500/[0.03]"
          : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          accent ? "text-blue-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
