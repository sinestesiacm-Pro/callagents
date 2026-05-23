"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/client", label: "Chiamate" },
  { href: "/admin", label: "Trascrizioni" },
  { href: "/dashboard", label: "Analisi" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0a0a0a]/60">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/client" className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-md bg-gradient-to-br from-blue-500 to-purple-600" />
            <span className="text-sm font-semibold tracking-tight text-white">
              CallAgents
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            Martinez Soluzioni
          </span>
          <span className="h-6 w-px bg-white/[0.08] hidden sm:block" />
          <span className="text-[11px] text-zinc-400 font-mono">
            +19129158944
          </span>
        </div>
      </div>
    </nav>
  );
}
