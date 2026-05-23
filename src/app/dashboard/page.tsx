"use client";

import { useEffect, useState } from "react";

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || json.error) {
          setError(json.error || `HTTP ${r.status}`);
          return;
        }
        if (json.metrics) {
          setData(json);
        } else {
          setError("Invalid response format");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <h2 className="font-bold mb-1">Database Connection Error</h2>
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-2 text-red-500">
            Make sure DATABASE_URL is set in .env and the SQL schema was executed in Supabase.
          </p>
        </div>
      </div>
    );
  }
  if (!data) return <div className="p-8 text-red-500">Failed to load dashboard</div>;

  const { metrics } = data;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">CallAgents Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Leads" value={metrics.totalLeads} />
        <MetricCard label="Total Calls" value={metrics.totalCalls} />
        <MetricCard label="Success Rate" value={`${metrics.successRate}%`} />
        <MetricCard
          label="Positive Sentiment"
          value={`${metrics.positiveSentimentRate}%`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Lead Pipeline</h2>
          <div className="space-y-2">
            {data.leadStages.length === 0 ? (
              <p className="text-gray-400 text-sm">No leads yet</p>
            ) : (
              data.leadStages.map((stage) => (
                <div key={stage.stage} className="flex justify-between text-sm">
                  <span className="capitalize">
                    {stage.stage.replace(/_/g, " ")}
                  </span>
                  <span className="font-mono">{stage.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Recent Calls</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.recentCalls.length === 0 ? (
              <p className="text-gray-400 text-sm">No calls yet</p>
            ) : (
              data.recentCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex justify-between items-center text-sm border-b pb-1"
                >
                  <div>
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-1 ${
                        call.status === "completed"
                          ? "bg-green-500"
                          : call.status === "failed"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                      }`}
                    />
                    {call.direction}
                  </div>
                  <span className="text-gray-500">
                    {call.sentiment || "N/A"}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {new Date(call.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="border rounded-lg p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
