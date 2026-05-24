"use client";

import { useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { presets } from "@/lib/presets";
import { CallAnimation } from "@/components/CallAnimation";

export default function ClientPage() {
  const { lang } = useLang();
  const [phone, setPhone] = useState("");
  const [context, setContext] = useState("");
  const [instructions, setInstructions] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "calling" | "success" | "error" | "ai_loading">("idle");
  const [message, setMessage] = useState("");
  const [callId, setCallId] = useState<string | null>(null);

  function applyPreset(id: string) {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setActivePreset(id);
    setContext(p.context[lang] || p.context.it);
    setInstructions(p.instructions[lang] || p.instructions.it);
  }

  async function handleCall() {
    if (!phone.trim()) return;
    setStatus("calling");
    setMessage(lang === "it" ? "Avvio chiamata..." : "Iniciando llamada...");
    try {
      const res = await fetch("/api/calls/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, agentType: "outbound_sales", context: `${context}\n\nISTRUZIONI SPECIALI:\n${instructions}` }),
      });
      const data = await res.json();
      if (res.ok) { setStatus("success"); setMessage(lang === "it" ? "Chiamata in corso..." : "Llamada en curso..."); setCallId(data.callId); }
      else { setStatus("error"); setMessage(data.error || (lang === "it" ? "Errore" : "Error")); }
    } catch (e) { setStatus("error"); setMessage(e instanceof Error ? e.message : (lang === "it" ? "Errore di connessione" : "Error de conexión")); }
  }

  async function handleHangup() {
    if (!callId) return;
    setMessage(lang === "it" ? "Chiusura in corso..." : "Colgando...");
    try {
      await fetch("/api/calls/hangup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callId }) });
      setStatus("idle"); setMessage(""); setCallId(null);
    } catch { setStatus("error"); setMessage(lang === "it" ? "Errore nella chiusura" : "Error al colgar"); }
  }

  async function handleAiSearch() {
    if (!aiQuery.trim()) return;
    setStatus("ai_loading"); setAiResult("");
    try {
      const res = await fetch("/api/ai/context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: aiQuery }) });
      const data = await res.json();
      if (res.ok) { setAiResult(data.result); if (!context) setContext(data.result); }
      else setAiResult((lang === "it" ? "Errore: " : "Error: ") + (data.error || (lang === "it" ? "sconosciuto" : "desconocido")));
    } catch (e) { setAiResult((lang === "it" ? "Errore: " : "Error: ") + (e instanceof Error ? e.message : (lang === "it" ? "connessione" : "conexión"))); }
    setStatus("idle");
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-8 md:flex-row">
      <div className="flex w-full flex-col gap-6 md:w-2/3">
        <section className="flex flex-col gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 sm:p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-on-surface">
              <span className="material-symbols-outlined text-primary">phone_in_talk</span>
              {t(lang, "client.title")}
            </h2>
            <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-medium text-on-secondary-container">
              {t(lang, "client.agent_ready")}
            </span>
          </header>

          {/* Preset selector */}
          <div>
            <label className="text-xs font-medium text-on-surface-variant block mb-2">
              {lang === "it" ? "Settore del cliente" : "Sector del cliente"}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-all ${
                    activePreset === p.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-outline-variant/40 text-on-surface-variant hover:border-primary/30 hover:bg-surface-container-low"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                  {p.label[lang]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-on-surface-variant">{t(lang, "client.phone")}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline">dialpad</span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+393899163911"
                  disabled={status === "calling" || status === "success"}
                  className="w-full rounded-lg border border-outline-variant bg-surface py-2.5 pl-9 pr-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow disabled:opacity-50" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">{t(lang, "client.context")}</label>
            <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={3}
              disabled={status === "calling" || status === "success"}
              placeholder={t(lang, "client.context_placeholder")}
              className="w-full rounded-lg border border-outline-variant bg-surface py-2.5 px-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow disabled:opacity-50 resize-none" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">{t(lang, "client.instructions")}</label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3}
              disabled={status === "calling" || status === "success"}
              placeholder={t(lang, "client.instructions_placeholder")}
              className="w-full rounded-lg border border-outline-variant bg-surface py-2.5 px-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow disabled:opacity-50 resize-none font-mono text-xs leading-relaxed" />
          </div>

          <div className="flex justify-end gap-3">
            {status === "success" ? (
              <button onClick={() => { setStatus("idle"); setCallId(null); setMessage(""); setActivePreset(null); }}
                className="rounded-full border border-outline-variant px-6 py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
                {t(lang, "client.new")}
              </button>
            ) : status === "calling" ? (
              <button disabled className="flex items-center gap-2 rounded-full bg-primary/50 px-8 py-3 text-sm font-semibold text-on-primary cursor-wait">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t(lang, "client.calling")}
              </button>
            ) : (
              <button onClick={handleCall} disabled={!phone.trim()}
                className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm">
                <span className="material-symbols-outlined text-[20px]">call</span>
                {t(lang, "client.call")}
              </button>
            )}
          </div>
        </section>

        {status === "calling" || status === "success" ? (
          <div className="rounded-2xl border border-white/10 bg-surface-container-lowest/90 backdrop-blur-xl p-6 shadow-lg">
            <CallAnimation phone={phone} />
            <div className="flex justify-center mt-4">
              <button onClick={handleHangup} className="rounded-full border border-red-200 bg-red-50 px-8 py-3 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors active:scale-[0.98]">
                {t(lang, "client.hangup")}
              </button>
            </div>
          </div>
        ) : message ? (
          <div className={`rounded-xl border p-4 text-sm ${status === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-blue-100 bg-blue-50 text-blue-800"}`}>
            <p className="font-medium">{message}</p>
            {callId && <p className="mt-1 font-mono text-[11px] opacity-60">{callId}</p>}
          </div>
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-6 md:w-1/3">
        <section className="relative flex flex-col gap-4 overflow-hidden rounded-xl border border-outline-variant/10 bg-gradient-to-br from-surface-container-low to-surface-container-highest p-5 shadow-sm">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-container/30 blur-3xl" />
          <header className="z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface">{t(lang, "client.ai_title")}</h3>
              <p className="text-xs text-on-surface-variant">{t(lang, "client.ai_subtitle")}</p>
            </div>
          </header>
          <textarea value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} rows={3}
            placeholder={t(lang, "client.ai_placeholder")}
            className="z-10 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest/80 py-2.5 px-3 text-sm text-on-surface placeholder:text-outline focus:border-primary/30 focus:ring-1 focus:ring-primary/10 outline-none transition-colors resize-none backdrop-blur-sm" />
          <button onClick={handleAiSearch} disabled={!aiQuery.trim() || status === "ai_loading"}
            className="z-10 flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/5 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors">
            <span className="material-symbols-outlined text-[18px]">magic_button</span>
            {status === "ai_loading" ? t(lang, "client.ai_generating") : t(lang, "client.ai_generate")}
          </button>
          {aiResult && (
            <div className="z-10 rounded-lg border border-outline-variant/20 bg-surface-container-lowest/80 p-4 backdrop-blur-sm">
              <p className="mb-2 text-[11px] text-outline">{t(lang, "client.ai_result")}</p>
              <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">{aiResult}</p>
              <button onClick={() => setContext(aiResult)} className="mt-3 text-[11px] font-medium text-primary hover:underline">{t(lang, "client.ai_use")}</button>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
          <header className="border-b border-outline-variant/20 bg-surface-container px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">info</span>
              {t(lang, "client.info_title")}
            </h3>
          </header>
          <div className="divide-y divide-outline-variant/10">
            {[
              [t(lang, "client.info_voice"), "11labs-Andrea"],
              [t(lang, "client.info_lang"), "Italiano (it-IT)"],
              [t(lang, "client.info_agent"), "Andrea · Outbound Sales"],
              [t(lang, "client.info_framework"), "SPIN + BANT"],
              [t(lang, "client.info_number"), "+19129158944"],
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
