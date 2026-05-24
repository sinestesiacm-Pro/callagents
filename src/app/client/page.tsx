"use client";

import { useState } from "react";

export default function ClientPage() {
  const [phone, setPhone] = useState("");
  const [context, setContext] = useState("");
  const [instructions, setInstructions] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [status, setStatus] = useState<
    "idle" | "calling" | "success" | "error" | "ai_loading"
  >("idle");
  const [message, setMessage] = useState("");
  const [callId, setCallId] = useState<string | null>(null);

  function applyRestaurantPreset() {
    setContext(`App inventario per ristoranti e hotel:
- Basta UNA FOTO alla fattura per registrare tutto automaticamente
- Controlla cosa hai in magazzino, eviti sprechi e perdite
- Risparmi TEMPO (niente data entry manuale) E DENARO (meno sprechi, controllo reale)

Obiettivo: fissare appuntamento DI PERSONA con Carlos.`);
    setInstructions(`IL TUO NOME: Andrea. TONO: Cordiale, educato. PARLA con calma, UNA domanda alla volta.

APERTURA: "Buongiorno, parlo con il titolare? Mi chiamo Andrea di Martinez Soluzioni. La disturbo?" → Aspetta. → "Lavoriamo con ristoranti e molti hanno problemi con l'inventario. Posso farle una domanda veloce?"

DOMANDE (una alla volta):
1. "Come gestite l'inventario oggi?"
2. "Quanto tempo vi porta via?"
3. "Avete mai perso prodotti per mancanza di controllo?"

PRODOTTO (solo dopo le risposte): "Abbiamo un'app dove fa una foto alla fattura e registra tutto in automatico. Carlos, il nostro esperto, puo passare di persona a farle vedere come funziona. Senza impegno."

CHIUSURA: appuntamento DI PERSONA con Carlos.
EMAIL: pronuncia i NUMERI come cifre ("0204" = "zero due zero quattro"), MAI lettera per lettera.`);
  }

  async function handleCall() {
    if (!phone.trim()) return;
    setStatus("calling");
    setMessage("Avvio chiamata...");
    try {
      const res = await fetch("/api/calls/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          agentType: "outbound_sales",
          context: `${context}\n\nISTRUZIONI SPECIALI:\n${instructions}`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("Chiamata in corso...");
        setCallId(data.callId);
      } else {
        setStatus("error");
        setMessage(data.error || "Errore");
      }
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Errore di connessione");
    }
  }

  async function handleHangup() {
    if (!callId) return;
    setMessage("Chiusura in corso...");
    try {
      await fetch("/api/calls/hangup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId }),
      });
      setStatus("idle");
      setMessage("");
      setCallId(null);
    } catch {
      setStatus("error");
      setMessage("Errore nella chiusura");
    }
  }

  async function handleAiSearch() {
    if (!aiQuery.trim()) return;
    setStatus("ai_loading");
    setAiResult("");
    try {
      const res = await fetch("/api/ai/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiResult(data.result);
        if (!context) setContext(data.result);
      } else {
        setAiResult("Errore: " + (data.error || "sconosciuto"));
      }
    } catch (e) {
      setAiResult("Errore: " + (e instanceof Error ? e.message : "connessione"));
    }
    setStatus("idle");
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-margin-desktop md:flex-row">
      {/* Left: Call Panel */}
      <div className="flex w-full flex-col gap-6 md:w-2/3">
        <section className="flex flex-col gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-on-surface">
              <span className="material-symbols-outlined text-primary">phone_in_talk</span>
              Dati Chiamata
            </h2>
            <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-medium text-on-secondary-container">
              Agente Pronto
            </span>
          </header>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-on-surface-variant">
                Numero di Telefono
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline">
                  dialpad
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+393899163911"
                  disabled={status === "calling" || status === "success"}
                  className="w-full rounded-lg border border-outline-variant bg-surface py-2.5 pl-9 pr-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-on-surface-variant">
                Preset Rapido
              </label>
              <button
                onClick={applyRestaurantPreset}
                className="flex items-center justify-center gap-2 rounded-full bg-primary-container/20 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary-container/30 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">restaurant</span>
                Ristoranti
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">
              Contesto della Chiamata
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Es: Il cliente ha un ristorante a Milano, 30 coperti..."
              rows={3}
              disabled={status === "calling" || status === "success"}
              className="w-full rounded-lg border border-outline-variant bg-surface py-2.5 px-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow disabled:opacity-50 resize-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">
              Istruzioni per l&apos;Agente AI
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Sii cortese, non insistere, fissa un appuntamento..."
              rows={2}
              disabled={status === "calling" || status === "success"}
              className="w-full rounded-lg border border-outline-variant bg-surface py-2.5 px-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow disabled:opacity-50 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            {status === "success" ? (
              <>
                <button
                  onClick={handleHangup}
                  className="rounded-full bg-error px-6 py-3 text-sm font-semibold text-on-error hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  Chiudi Chiamata
                </button>
                <button
                  onClick={() => { setStatus("idle"); setCallId(null); setMessage(""); }}
                  className="rounded-full border border-outline-variant px-6 py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Nuova
                </button>
              </>
            ) : (
              <button
                onClick={handleCall}
                disabled={!phone.trim() || status === "calling"}
                className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">call</span>
                {status === "calling" ? "Chiamando..." : "Chiama Ora"}
              </button>
            )}
          </div>
        </section>

        {message && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              status === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : status === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-blue-100 bg-blue-50 text-blue-800"
            }`}
          >
            <p className="font-medium">{message}</p>
            {callId && <p className="mt-1 font-mono text-[11px] opacity-60">{callId}</p>}
          </div>
        )}
      </div>

      {/* Right: AI + Info */}
      <div className="flex w-full flex-col gap-6 md:w-1/3">
        <section className="relative flex flex-col gap-4 overflow-hidden rounded-xl border border-outline-variant/10 bg-gradient-to-br from-surface-container-low to-surface-container-highest p-5 shadow-sm">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-container/30 blur-3xl" />
          <header className="z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface">Assistente IA</h3>
              <p className="text-xs text-on-surface-variant">Generazione dinamica</p>
            </div>
          </header>
          <textarea
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Descrivi il settore e l'IA genera un pitch..."
            rows={3}
            className="z-10 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest/80 py-2.5 px-3 text-sm text-on-surface placeholder:text-outline focus:border-primary/30 focus:ring-1 focus:ring-primary/10 outline-none transition-colors resize-none backdrop-blur-sm"
          />
          <button
            onClick={handleAiSearch}
            disabled={!aiQuery.trim() || status === "ai_loading"}
            className="z-10 flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/5 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">magic_button</span>
            {status === "ai_loading" ? "Generando..." : "Genera Contesto"}
          </button>
          {aiResult && (
            <div className="z-10 rounded-lg border border-outline-variant/20 bg-surface-container-lowest/80 p-4 backdrop-blur-sm">
              <p className="mb-2 text-[11px] text-outline">Risultato:</p>
              <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                {aiResult}
              </p>
              <button
                onClick={() => setContext(aiResult)}
                className="mt-3 text-[11px] font-medium text-primary hover:underline"
              >
                Usa come contesto
              </button>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
          <header className="border-b border-outline-variant/20 bg-surface-container px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">info</span>
              Info Agente
            </h3>
          </header>
          <div className="divide-y divide-outline-variant/10">
            {[
              ["Modello Vocale", "11labs-Andrea"],
              ["Lingua", "Italiano (it-IT)"],
              ["Agente", "Andrea · Outbound Sales"],
              ["Framework", "SPIN + BANT"],
              ["Numero", "+19129158944"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between px-5 py-3 text-sm hover:bg-surface-container-low transition-colors">
                <span className="text-on-surface-variant">{label}</span>
                <span className="font-mono text-[13px] text-on-surface">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
