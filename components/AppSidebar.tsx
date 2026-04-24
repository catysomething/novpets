"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function navItemClass(active: boolean) {
  return active
    ? "block rounded-md bg-slate-100 px-3 py-2 font-medium text-slate-900"
    : "block rounded-md px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100";
}

export default function AppSidebar() {
  const pathname = usePathname();
  const isDashboard = pathname === "/";
  const isPetsNav =
    pathname === "/pets" || pathname.startsWith("/pets/");

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
      <div className="border-b border-slate-200 px-6 py-5">
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
