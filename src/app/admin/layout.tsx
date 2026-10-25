"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AdminDemoGate, {
  AdminDemoLogout,
} from "@/components/AdminDemoGate";

const menu = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Data Booking" },
  { href: "/admin/rooms", label: "Tipe Kamar" },
  { href: "/admin/room-units", label: "Nomor Kamar" },
];

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AdminDemoGate>
      <div className="min-h-screen bg-[#f8f5ef] text-[#173e35]">
        <div className="lg:grid lg:min-h-screen lg:grid-cols-[240px_1fr]">
          <aside className="bg-[#173e35] p-6 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
            <Link
              href="/"
              className="text-2xl font-semibold tracking-[0.16em]"
            >
              SÉLA
              <span className="ml-2 text-xs font-normal">
                STAY
              </span>
            </Link>

            <p className="mt-2 text-xs text-white/60">
              Hotel Management · Demo
            </p>

            <nav
              aria-label="Navigasi admin"
              className="mt-8 flex flex-wrap gap-3 lg:flex-col"
            >
              {menu.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`min-h-11 rounded-xl px-4 py-3 text-sm transition ${
                      active
                        ? "bg-white/15 font-semibold text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <Link
                href="/"
                className="min-h-11 rounded-xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Lihat Website ↗
              </Link>
            </nav>

            <div className="mt-8 border-t border-white/15 pt-5 lg:mt-auto">
              <AdminDemoLogout />

              <p className="mt-4 text-xs leading-6 text-white/60">
                Data demo tersimpan di browser ini.
              </p>
            </div>
          </aside>

          <div className="min-w-0">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#173e35]/10 bg-white/70 px-5 py-5 md:px-8">
              <div>
                <p className="text-xs tracking-widest text-[#97733e]">
                  ADMIN WORKSPACE
                </p>

                <p className="mt-1 text-sm text-[#63716a]">
                  Kelola perjalanan tamu SÉLA Stay.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#63716a]">
                  Admin
                </span>

                <span className="rounded-full border border-[#173e35]/15 bg-[#e8efe6] px-4 py-2 text-xs font-semibold">
                  Mode Demo
                </span>
              </div>
            </header>

            <main className="p-5 md:p-8">
              {children}
            </main>

            <footer className="px-5 pb-6 text-xs leading-6 text-[#63716a] md:px-8">
              © 2026 SÉLA Stay · Login dan pengelolaan hotel
              merupakan simulasi. Data tidak tersinkron
              antarperangkat.
            </footer>
          </div>
        </div>
      </div>
    </AdminDemoGate>
  );
}