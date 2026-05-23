"use client";

import { useState } from "react";

export default function ClientPage() {
  const [phone, setPhone] = useState("");
  const [context, setContext] = useState("");
  const [instructions, setInstructions] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [status, setStatus] = useState<"idle" | "calling" | "success" | "error" | "ai_loading">("idle");
  const [message, setMessage] = useState("");
  const [callId, setCallId] = useState<string | null>(null);

  function applyRestaurantPreset() {
    setContext(`App inventario per ristoranti e hotel:
- Basta UNA FOTO alla fattura per registrare tutto automaticamente
- Controlla cosa hai in magazzino, eviti sprechi e perdite
- Risparmi TEMPO (niente data entry manuale) E DENARO (meno sprechi, controllo reale)
- Sito: https://martinezsoluzioni.com

Obiettivo chiamata: fissare un appuntamento telefonico con Carlo (il titolare) per una demo personalizzata.`);
    setInstructions(`TONO: Diretto, pratico, risolutivo.

PITCH INIZIALE: "Sono di Martinez Soluzioni. Abbiamo un'app per l'inventario che ti fa risparmiare tempo E denaro: fai una foto alla fattura, registra tutto da sola e controlli in tempo reale cosa hai in magazzino. Cosi eviti sprechi e perdite. Hai 1 minuto?"

DOMANDE:
1. "Come gestisci l'inventario oggi? Carta, Excel, software?"
2. "Ti e mai capitato di buttare via prodotti scaduti perche non avevi controllo?"
3. "Quanto tempo perdi a settimana a inserire fatture e controllare la dispensa?"

OBIEZIONI:
- "Uso gia un software" → "Capito. Il nostro si integra e ti fa risparmiare il data entry manuale. Una prova di 30 secondi?"
- "Non ho tempo" → "Proprio per farti risparmiare tempo chiamo. 1 minuto?"

CHIUSURA: NON mandare link. Proponi invece una CHIAMATA DI APPROFONDIMENTO con Carlo, il titolare di Martinez Soluzioni.
- "Senti, ti propongo una cosa: ti fisso una chiamata di 10 minuti con Carlo, il nostro esperto. Lui ti fa vedere come funziona su misura per il tuo ristorante. Ti va bene domani mattina o pomeriggio?"
- Se dice si: "Perfetto, prendo nota. Ti confermo l'orario via SMS. Intanto se vuoi dare un'occhiata al sito: martinezsoluzioni.com"
- Se dice no: "Nessun problema. Ti lascio il sito martinezsoluzioni.com. Se cambi idea, richiamaci pure."

IMPORTANTE: L'obiettivo e FISSARE UN APPUNTAMENTO TELEFONICO CON CARLO, non mandare link. Solo se proprio non vuole, lascia il sito web.`);
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
    setMessage("Chiusura chiamata...");

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

  const statusBg: Record<string, string> = {
    idle: "",
    calling: "bg-blue-900/50 border-blue-700 text-blue-300",
    success: "bg-green-900/50 border-green-700 text-green-300",
    error: "bg-red-900/50 border-red-700 text-red-300",
    ai_loading: "bg-purple-900/50 border-purple-700 text-purple-300",
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Martinez Soluzioni</h1>
            <p className="text-xs text-gray-400">CallAgents · Chiamate Automatiche</p>
          </div>
          <span className="text-sm text-gray-400">+19129158944</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Call Controls */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">Nuova Chiamata</h2>
              <button
                onClick={applyRestaurantPreset}
                className="text-xs px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 transition-colors font-medium"
              >
                Preset Ristoranti
              </button>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Numero di telefono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+393899163911"
                disabled={status === "calling" || status === "success"}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Contesto / Informazioni da trasmettere</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Es: Il cliente e interessato a sviluppo web e automazione. Ha gia parlato con noi via email."
                rows={3}
                disabled={status === "calling" || status === "success"}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Istruzioni personalizzate (controllo totale)
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Es: Presentati come Martina. Non parlare di prezzi. Offri subito una consulenza gratuita. Sii piu informale. Non interrompere mai il cliente."
                rows={3}
                disabled={status === "calling" || status === "success"}
                className="w-full px-4 py-3 bg-gray-900 border border-yellow-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 disabled:opacity-50 resize-none"
              />
            </div>

            {status === "success" ? (
              <div className="flex gap-3">
                <button
                  onClick={handleHangup}
                  className="flex-1 py-3 rounded-lg font-medium bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Chiudi Chiamata
                </button>
                <button
                  onClick={() => { setStatus("idle"); setCallId(null); setMessage(""); }}
                  className="px-4 py-3 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  Nuova
                </button>
              </div>
            ) : (
              <button
                onClick={handleCall}
                disabled={!phone.trim() || status === "calling"}
                className="w-full py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status === "calling" ? "Chiamando..." : "Chiama Ora"}
              </button>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-lg text-sm border ${statusBg[status]}`}>
              <p className="font-medium">{message}</p>
              {callId && <p className="text-xs mt-1 opacity-60">ID: {callId}</p>}
            </div>
          )}
        </div>

        {/* Right: AI + Info */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
            <h2 className="font-semibold text-lg">Assistente IA</h2>
            <p className="text-xs text-gray-400">
              Descrivi cosa ti serve e l&apos;IA genera il contesto per l&apos;agente.
            </p>

            <textarea
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Es: Voglio vendere sviluppo web a un'azienda di logistica. Prepara un pitch persuasivo."
              rows={3}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />

            <button
              onClick={handleAiSearch}
              disabled={!aiQuery.trim() || status === "ai_loading"}
              className="w-full py-3 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === "ai_loading" ? "Generando..." : "Genera Contesto"}
            </button>

            {aiResult && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Risultato:</p>
                <p className="text-sm whitespace-pre-wrap">{aiResult}</p>
                <button
                  onClick={() => setContext(aiResult)}
                  className="mt-3 text-xs text-purple-400 hover:text-purple-300"
                >
                  Usa come contesto
                </button>
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="font-semibold text-sm mb-3">Informazioni</h3>
            <div className="text-xs text-gray-400 space-y-2">
              <p>Numero uscente: +19129158944</p>
              <p>Voce: 11labs-Andrea (femminile, italiana)</p>
              <p>Agente: Outbound Sales (SPIN + BANT)</p>
              <p>Lingua: Italiano</p>
              <p className="text-gray-500 mt-3">
                Le "Istruzioni personalizzate" hanno massima priorita nel prompt. 
                Puoi controllare tono, strategia, obiezioni e comportamento.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
