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
  analysisData: unknown;
  durationMs: number | null;
  createdAt: string;
}

export default function AdminPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [selected, setSelected] = useState<CallRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/calls")
      .then((r) => r.json())
      .then((data) => setCalls(data.calls || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-white">Caricamento...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-800 p-4 overflow-y-auto h-screen">
        <h1 className="text-lg font-bold mb-4">Chiamate</h1>
        {calls.length === 0 ? (
          <p className="text-gray-500 text-sm">Nessuna chiamata</p>
        ) : (
          <div className="space-y-2">
            {calls.map((call) => (
              <button
                key={call.id}
                onClick={() => setSelected(call)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                  selected?.id === call.id
                    ? "bg-blue-900/50 border border-blue-700"
                    : "bg-gray-800 border border-gray-700 hover:bg-gray-750"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      call.status === "completed"
                        ? "bg-green-500"
                        : call.status === "failed"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  />
                  <span className="text-xs text-gray-400">
                    {new Date(call.createdAt).toLocaleString("it-IT")}
                  </span>
                </div>
                <p className="font-mono text-xs mt-1 text-gray-400">
                  {call.toNumber || "N/A"}
                </p>
                <p className="text-xs mt-1 truncate">
                  {call.callSummary || "Nessun riassunto"}
                </p>
                {call.sentiment && (
                  <span
                    className={`text-xs ${
                      call.sentiment === "Positive"
                        ? "text-green-400"
                        : call.sentiment === "Negative"
                          ? "text-red-400"
                          : "text-gray-400"
                    }`}
                  >
                    {call.sentiment}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 p-6 overflow-y-auto h-screen">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Seleziona una chiamata per vedere i dettagli
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-xl font-bold">Dettagli Chiamata</h2>
              <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                <div>
                  <span className="text-gray-400">Stato: </span>
                  {selected.status}
                </div>
                <div>
                  <span className="text-gray-400">Direzione: </span>
                  {selected.direction}
                </div>
                <div>
                  <span className="text-gray-400">Sentiment: </span>
                  {selected.sentiment || "N/A"}
                </div>
                <div>
                  <span className="text-gray-400">Numero: </span>
                  {selected.toNumber || "N/A"}
                </div>
                <div>
                  <span className="text-gray-400">Durata: </span>
                  {selected.durationMs
                    ? `${Math.round(selected.durationMs / 1000)}s`
                    : "N/A"}
                </div>
                <div>
                  <span className="text-gray-400">Data: </span>
                  {new Date(selected.createdAt).toLocaleString("it-IT")}
                </div>
              </div>
            </div>

            {/* Summary */}
            {selected.callSummary ? (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="font-semibold text-sm mb-2">Riassunto</h3>
                <p className="text-sm text-gray-300">{selected.callSummary}</p>
              </div>
            ) : null}

            {/* Analysis Data */}
            {selected.analysisData ? (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="font-semibold text-sm mb-2">Dati Analisi</h3>
                <pre className="text-xs text-gray-400 overflow-auto">
                  {JSON.stringify(selected.analysisData, null, 2)}
                </pre>
              </div>
            ) : null}

            {/* Transcript */}
            {selected.transcript ? (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="font-semibold text-sm mb-2">Trascrizione</h3>
                <div className="text-sm space-y-2 max-h-96 overflow-y-auto">
                  {selected.transcript.split("\n").map((line, i) => {
                    const isAgent = line.startsWith("Agent:") || line.startsWith("Agente:");
                    return (
                      <p
                        key={i}
                        className={`p-2 rounded ${
                          isAgent
                            ? "bg-blue-900/30 text-blue-200"
                            : "bg-gray-700/30 text-gray-300"
                        }`}
                      >
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-500 text-sm">
                  Trascrizione non ancora disponibile (attendi elaborazione Retell)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
