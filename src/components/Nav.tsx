"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { t, type Lang } from "@/lib/i18n";

const links = [
  { href: "/client", key: "nav.chiamate" },
  { href: "/admin", key: "nav.trascrizioni" },
  { href: "/dashboard", key: "nav.analisi" },
];

export default function Nav() {
  const pathname = usePathname();
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);

  function toggleLang() {
    setLang(lang === "it" ? "es" : "it");
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl">
          <Link href="/client" className="text-xl font-bold text-primary tracking-tight shrink-0">
            N-tropy Call
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors py-2 ${
                  pathname === link.href
                    ? "text-secondary font-semibold border-b-2 border-secondary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {t(lang, link.key)}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden lg:block text-sm text-on-surface-variant">
              +19129158944
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-primary text-on-primary px-4 py-1.5 text-xs font-medium">
              Martinez Soluzioni
            </span>

            {/* Language toggle desktop */}
            <button
              onClick={toggleLang}
              className="hidden md:flex items-center gap-1 rounded-full border border-outline-variant/40 px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <span className={`${lang === "it" ? "opacity-100" : "opacity-40"}`}>IT</span>
              <span className="text-outline-variant">/</span>
              <span className={`${lang === "es" ? "opacity-100" : "opacity-40"}`}>ES</span>
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="relative flex md:hidden h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
              aria-label={open ? "Chiudi menu" : "Apri menu"}
            >
              <div className="flex flex-col items-center justify-center w-5 h-5">
                <span
                  className={`block h-[1.5px] w-5 bg-on-surface rounded-full transition-all duration-300 ${
                    open ? "rotate-45 translate-y-[1.5px]" : "-translate-y-[5px]"
                  }`}
                />
                <span
                  className={`block h-[1.5px] w-5 bg-on-surface rounded-full transition-all duration-300 ${
                    open ? "opacity-0 scale-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`block h-[1.5px] w-5 bg-on-surface rounded-full transition-all duration-300 ${
                    open ? "-rotate-45 -translate-y-[1.5px]" : "translate-y-[5px]"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-surface border-l border-outline-variant/20 shadow-xl transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
          <span className="text-lg font-bold text-primary">N-tropy Call</span>
          <button
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 flex flex-col gap-1 p-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-primary-container/20 text-primary"
                  : "text-on-surface hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {link.key === "nav.chiamate" ? "phone_in_talk" : link.key === "nav.trascrizioni" ? "description" : "analytics"}
              </span>
              {t(lang, link.key)}
            </Link>
          ))}

          <hr className="my-3 border-outline-variant/20" />

          {/* Language switch */}
          <div className="px-2">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">
              {t(lang, "nav.lingua")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setLang("it")}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all ${
                  lang === "it"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                Italiano
              </button>
              <button
                onClick={() => setLang("es")}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all ${
                  lang === "es"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                Español
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-outline-variant/20 px-5 py-4">
          <p className="text-xs text-on-surface-variant">+19129158944</p>
          <p className="mt-0.5 text-[11px] text-outline">Martinez Soluzioni</p>
        </div>
      </aside>
    </>
  );
}
