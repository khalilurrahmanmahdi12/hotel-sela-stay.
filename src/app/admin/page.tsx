"use client";

import Link from "next/link";
import { rupiah, useAdminBookings } from "@/lib/useAdminBookings";

type ChartItem = {
  label: string;
  value: number;
};

function BarChart({
  title,
  description,
  items,
  money = false,
}: {
  title: string;
  description: string;
  items: ChartItem[];
  money?: boolean;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <section className="min-w-0 rounded-2xl border border-[#173e35]/10 bg-white p-5 md:p-6">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="mt-2 text-xs leading-6 text-[#63716a]">
        {description}
      </p>

      {items.length === 0 ? (
        <p className="mt-8 rounded-xl bg-[#f8f5ef] p-5 text-sm text-[#63716a]">
          Grafik akan muncul setelah ada pembayaran demo.
        </p>
      ) : (
        <ul className="mt-7 space-y-6">
          {items.map((item) => (
            <li key={item.label}>
              <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                <span>{item.label}</span>
                <span className="font-semibold">
                  {money ? rupiah(item.value) : `${item.value} booking`}
                </span>
              </div>

              <div
                aria-hidden="true"
                className="h-4 overflow-hidden rounded-full bg-[#edf0e9]"
              >
                <div
                  className="h-full rounded-full bg-[#173e35]"
                  style={{
                    width: `${(item.value / max) * 100}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AdminDashboard() {
  const { bookings, error, skipped } = useAdminBookings();

  const totalRevenue = bookings.reduce(
    (total, booking) => total + booking.total,
    0,
  );

  const totalNights = bookings.reduce(
    (total, booking) => total + booking.nights,
    0,
  );

  const roomGroups = new Map<
    string,
    { count: number; revenue: number }
  >();

  const methodGroups = new Map<string, number>();

  for (const booking of bookings) {
    const current = roomGroups.get(booking.roomName) ?? {
      count: 0,
      revenue: 0,
    };

    roomGroups.set(booking.roomName, {
      count: current.count + 1,
      revenue: current.revenue + booking.total,
    });

    methodGroups.set(
      booking.methodName,
      (methodGroups.get(booking.methodName) ?? 0) + 1,
    );
  }

  const roomCounts = [...roomGroups.entries()]
    .map(([label, group]) => ({
      label,
      value: group.count,
    }))
    .sort((a, b) => b.value - a.value);

  const roomRevenue = [...roomGroups.entries()]
    .map(([label, group]) => ({
      label,
      value: group.revenue,
    }))
    .sort((a, b) => b.value - a.value);

  const methodCounts = [...methodGroups.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const average = bookings.length
    ? totalRevenue / bookings.length
    : 0;

  const stats = [
    {
      label: "Total booking",
      value: String(bookings.length),
      note: "Pembayaran demo selesai",
    },
    {
      label: "Pendapatan simulasi",
      value: rupiah(totalRevenue),
      note: "Akumulasi pembayaran demo",
    },
    {
      label: "Malam terpesan",
      value: String(totalNights),
      note: "Akumulasi durasi menginap",
    },
    {
      label: "Rata-rata booking",
      value: rupiah(average),
      note: "Nilai pembayaran per booking",
    },
  ];

  if (error) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-5 text-red-700">
        {error}
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#97733e]">
            RINGKASAN HOTEL
          </p>
          <h1 className="mt-3 font-serif text-4xl">Dashboard</h1>
          <p className="mt-3 text-sm leading-7 text-[#63716a]">
            Pantau ringkasan booking dan pembayaran simulasi.
          </p>
        </div>

        <Link
          href="/admin/bookings"
          className="w-fit rounded-xl bg-[#173e35] px-5 py-3 text-sm text-white"
        >
          Lihat data booking →
        </Link>
      </div>

      {skipped > 0 && (
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          {skipped} data tidak lengkap atau bukan pembayaran demo
          selesai dilewati. Data asli tidak dihapus.
        </p>
      )}

      <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-5">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="min-w-0 rounded-2xl border border-[#173e35]/10 bg-white p-4 md:p-5"
          >
            <p className="text-xs text-[#63716a]">{stat.label}</p>
            <p className="mt-4 break-words text-xl font-semibold md:text-2xl">
              {stat.value}
            </p>
            <p className="mt-3 text-xs leading-5 text-[#63716a]">
              {stat.note}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <BarChart
          title="Booking per tipe kamar"
          description="Jumlah booking berdasarkan tipe kamar."
          items={roomCounts}
        />

        <BarChart
          title="Pendapatan per tipe kamar"
          description="Total pembayaran demo berdasarkan tipe kamar."
          items={roomRevenue}
          money
        />

        <BarChart
          title="Metode pembayaran"
          description="Jumlah booking untuk setiap metode pembayaran."
          items={methodCounts}
        />

        <section className="rounded-2xl bg-[#173e35] p-6 text-white">
          <p className="text-xs tracking-widest text-[#ead5ac]">
            INFORMASI RINGKASAN
          </p>

          <h2 className="mt-4 font-serif text-3xl">
            Semua perjalanan, satu ringkasan.
          </h2>

          <p className="mt-5 text-sm leading-7 text-white/75">
            Statistik mencakup seluruh pembayaran demo yang selesai,
            termasuk booking yang kemudian dibatalkan. Pembatalan
            belum memproses refund.
          </p>

          <p className="mt-4 text-sm leading-7 text-white/75">
            Buka Data Booking untuk melihat pemesan, tanggal
            menginap, dan rincian pembayaran.
          </p>

          <Link
            href="/admin/bookings"
            className="mt-6 inline-block rounded-xl bg-[#ead5ac] px-5 py-3 text-sm font-semibold text-[#173e35]"
          >
            Buka Data Booking ↗
          </Link>
        </section>
      </div>
    </div>
  );
}