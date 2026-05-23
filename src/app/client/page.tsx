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
- Sito: https://martinezsoluzioni.com

Obiettivo chiamata: fissare un appuntamento DI PERSONA con Carlos (il titolare).`);
    setInstructions(`TONO: Cordiale, educato, da persona che chiama per aiutare, NON per vendere subito. PARLA con calma, fai UNA domanda alla volta. Non essere invadente.

IL TUO NOME: Marco. Presentati come Marco di Martinez Soluzioni.

IDENTIFICA IL GENERE DEL CLIENTE: se e uomo usa "Signor", se e donna "Signora". In base al nome o alla voce.

APERTURA (30 secondi, IMPORTANTE: prima conosci, POI proponi):
"Buongiorno, parlo con il titolare del ristorante? Mi chiamo Marco, chiamo da Martinez Soluzioni. La disturbo?"
→ Aspetta risposta.
→ "Guardi, la chiamo perche lavoriamo con diversi ristoranti e ho visto che molti hanno lo stesso problema con la gestione dell'inventario. Volevo solo capire se anche per voi e una cosa che vi porta via tempo. Posso farle una domanda veloce?"

DOMANDE (UNA alla volta, aspetta la risposta. NON parlare del prodotto finche non hai capito il loro problema):
1. "Come gestite l'inventario oggi? Usate carta, Excel, qualche software?"
2. (Se dicono che e un problema) "Ah ecco, lo sento spesso. Quanto tempo vi porta via ogni settimana?"
3. "Le e mai capitato di perdere prodotti o fare ordini sbagliati perche non avevate il controllo?"

SOLO DOPO queste risposte, introduci il prodotto con NATURALEZZA:
"Guardi, proprio per questo abbiamo creato una soluzione molto semplice: un'app dove fa una foto alla fattura e registra tutto in automatico. Niente piu data entry. Se vuole, Carlos, il nostro esperto, puo passare personalmente al suo ristorante per farle vedere come funziona su misura per lei. Senza impegno. Che ne dice?"

OBIEZIONI:
- "Uso gia un software" → "Ah bene, e contento? Funziona bene o le porta via tempo lo stesso?"
- "Non ho tempo" → "Lo capisco benissimo. Pero mi dica solo: l'inventario e una cosa che vi pesa o no?"
- "Non mi interessa" → "Nessun problema, la ringrazio comunque per il tempo. Le lascio il sito martinezsoluzioni.com. Buona giornata!"

CHIUSURA: obiettivo = appuntamento DI PERSONA con Carlos.
- Se interessato: "Allora se le va fissiamo un appuntamento: Carlos passa da lei, le fa vedere tutto di persona. Che giorno le andrebbe bene?"
- Se titubante: "Guardi, provare non costa niente. Carlos viene, le mostra in 10 minuti e poi decide lei. Se non le interessa, nessun problema. Che ne dice?"

QUANDO PRENDI UN APPUNTAMENTO DI PERSONA:
- RIPETI data e ora: "Quindi confermiamo che Carlos passa da lei [giorno] alle [ora], giusto?"
- Chiedi l'indirizzo del ristorante (NON solo email): "Mi lascia l'indirizzo del ristorante cosi Carlos sa dove venire?"
- Poi chiedi email per la conferma scritta.

QUANDO CONFERMI EMAIL (MOLTO IMPORTANTE):
- I NUMERI si pronunciano come CIFRE, NON lettera per lettera:
  Esempio: "0204" si dice "zero due zero quattro"
  MAI dire "zeta-erre-o..." per i numeri.
- Solo la parte con le lettere (@gmail.com) va detta lettera per lettera.
- Esempio completo: "zero due zero quattro chiocciola gmail punto com. Corretto?"
- Fai la conferma e aspetta che il cliente dica si o no. Se dice no, chiedi di ripetere.

NON PARLARE TROPPO. Ascolta piu di quanto parli. MAI dire subito "ho un'app fantastica". Prima fai parlare loro.`);
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
      setAiResult(
        "Errore: " + (e instanceof Error ? e.message : "connessione")
      );
    }
    setStatus("idle");
  }

  const statusColors: Record<string, string> = {
    idle: "",
    calling: "border-blue-500/30 bg-blue-500/5 text-blue-400",
    success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    error: "border-red-500/30 bg-red-500/5 text-red-400",
    ai_loading: "border-purple-500/30 bg-purple-500/5 text-purple-400",
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Nuova Chiamata</h1>
        <p className="mt-1 text-sm text-zinc-400">
          L&apos;agente Marco chiamerà il numero e seguirà le tue istruzioni.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main call card */}
        <div className="lg:col-span-3 space-y-5">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-300">
                Dati chiamata
              </h2>
              <button
                onClick={applyRestaurantPreset}
                className="text-[11px] px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors font-medium"
              >
                Preset Ristoranti
              </button>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                Numero di telefono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+393899163911"
                disabled={status === "calling" || status === "success"}
                className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 focus:outline-none focus:ring-0 disabled:opacity-40 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                Contesto
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Informazioni sul cliente, settore, esigenze..."
                rows={3}
                disabled={status === "calling" || status === "success"}
                className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 focus:outline-none focus:ring-0 disabled:opacity-40 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                Istruzioni personalizzate
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Tono, strategia, obiezioni specifiche..."
                rows={3}
                disabled={status === "calling" || status === "success"}
                className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 focus:outline-none focus:ring-0 disabled:opacity-40 transition-colors resize-none"
              />
            </div>

            {status === "success" ? (
              <div className="flex gap-3">
                <button
                  onClick={handleHangup}
                  className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 py-3 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  Chiudi Chiamata
                </button>
                <button
                  onClick={() => {
                    setStatus("idle");
                    setCallId(null);
                    setMessage("");
                  }}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Nuova
                </button>
              </div>
            ) : (
              <button
                onClick={handleCall}
                disabled={!phone.trim() || status === "calling"}
                className="w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {status === "calling" ? "Chiamando..." : "Chiama Ora"}
              </button>
            )}
          </div>

          {message && (
            <div
              className={`rounded-xl border p-4 text-sm ${statusColors[status]}`}
            >
              <p className="font-medium">{message}</p>
              {callId && (
                <p className="text-[11px] mt-1 opacity-50 font-mono">
                  {callId}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* AI assistant */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
            <h2 className="text-sm font-medium text-zinc-300">
              Assistente IA
            </h2>
            <textarea
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Descrivi il settore o il prodotto e l'IA genera un pitch..."
              rows={3}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 focus:outline-none focus:ring-0 transition-colors resize-none"
            />
            <button
              onClick={handleAiSearch}
              disabled={!aiQuery.trim() || status === "ai_loading"}
              className="w-full rounded-xl border border-purple-500/20 bg-purple-500/5 py-2.5 text-sm font-medium text-purple-400 hover:bg-purple-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {status === "ai_loading" ? "Generando..." : "Genera Contesto"}
            </button>
            {aiResult && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[11px] text-zinc-500 mb-2">Risultato:</p>
                <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {aiResult}
                </p>
                <button
                  onClick={() => setContext(aiResult)}
                  className="mt-3 text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Usa come contesto
                </button>
              </div>
            )}
          </div>

          {/* Info card */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="text-sm font-medium text-zinc-300 mb-4">Info</h3>
            <div className="space-y-3 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Numero</span>
                <span className="font-mono text-zinc-300">+19129158944</span>
              </div>
              <div className="flex justify-between">
                <span>Voce</span>
                <span className="text-zinc-300">11labs-Marco</span>
              </div>
              <div className="flex justify-between">
                <span>Agente</span>
                <span className="text-zinc-300">Marco · Outbound</span>
              </div>
              <div className="flex justify-between">
                <span>Lingua</span>
                <span className="text-zinc-300">Italiano</span>
              </div>
              <div className="flex justify-between">
                <span>Framework</span>
                <span className="text-zinc-300">SPIN + BANT</span>
              </div>
              <hr className="border-white/[0.06]" />
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Le istruzioni personalizzate hanno priorità massima nel prompt.
                Puoi controllare tono, strategia, obiezioni e comportamento
                dell&apos;agente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
