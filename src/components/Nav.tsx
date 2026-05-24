"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/client", label: "Chiamate", icon: "phone_in_talk" },
  { href: "/admin", label: "Trascrizioni", icon: "description" },
  { href: "/dashboard", label: "Analisi", icon: "analytics" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 items-center justify-between px-margin-desktop max-w-7xl">
        <div className="flex items-center gap-8">
          <Link href="/client" className="text-xl font-bold text-primary tracking-tight">
            CallAgents
          </Link>
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
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden lg:block text-sm text-on-surface-variant">
            +19129158944
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary text-on-primary px-4 py-1.5 text-xs font-medium">
            Martinez Soluzioni
          </span>
        </div>
      </div>
    </nav>
  );
}
