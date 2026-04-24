"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function navItemClass(active: boolean) {
  return active
    ? "block rounded-md bg-white/70 px-3 py-2 font-medium text-slate-900 shadow-sm ring-1 ring-emerald-950/10"
    : "block rounded-md px-3 py-2 font-medium text-slate-700 transition hover:bg-white/45";
}

export default function AppSidebar() {
  const pathname = usePathname();
  const isDashboard = pathname === "/";
  const isPetsNav = pathname === "/pets" || pathname.startsWith("/pets/");

  return (
    <aside className="hidden w-64 shrink-0 border-r border-emerald-950/10 bg-eucalyptus md:flex md:flex-col">
      <div className="border-b border-emerald-950/10 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Novellia
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-900">Pets</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 text-sm" aria-label="Main">
        <Link href="/" className={navItemClass(isDashboard)}>
          Dashboard
        </Link>
        <Link href="/pets" className={navItemClass(isPetsNav)}>
          Pets
        </Link>
      </nav>
    </aside>
  );
}
