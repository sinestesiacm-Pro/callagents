"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n";

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<LanguageCtx>({ lang: "it", setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("it");

  useEffect(() => {
    const stored = localStorage.getItem("lang") as Lang | null;
    if (stored === "es" || stored === "it") setLang(stored);
  }, []);

  function change(l: Lang) {
    setLang(l);
    localStorage.setItem("lang", l);
  }

  return <Ctx.Provider value={{ lang, setLang: change }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}
