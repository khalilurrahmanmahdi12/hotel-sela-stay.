"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import AdminBookingActions from "@/components/AdminBookingActions";
import {
  dateLabel,
  deleteBooking,
  rupiah,
  useAdminBookings,
  type Booking,
} from "@/lib/useAdminBookings";
import {
  statusLabels,
  useBookingStatuses,
  type StayStatus,
} from "@/lib/useBookingStatuses";

const inputClass =
  "min-h-11 w-full min-w-0 rounded-xl border border-[#173e35]/20 bg-[#f8f5ef] px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#97733e]";

const badgeClasses: Record<StayStatus, string> = {
  confirmed: "bg-blue-50 text-blue-800",
  "checked-in": "bg-[#e8efe6] text-[#173e35]",
  "checked-out": "bg-slate-100 text-slate-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function AdminBookingsPage() {
  const [query, setQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [deleteTarget, setDeleteTarget] =
    useState<Booking | null>(null);

  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");

  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const {
    bookings,
    error,
    skipped,
    refresh: refreshBookings,
  } = useAdminBookings();

  const {
    statuses,
    error: statusError,
    refresh: refreshStatuses,
  } = useBookingStatuses();

  const roomNames = [
    ...new Set(bookings.map((booking) => booking.roomName)),
  ].sort();

  const invalidDates = Boolean(
    dateFrom && dateTo && dateTo < dateFrom,
  );

  const pageError = error || statusError;

  const filteredBookings = bookings.filter((booking) => {
    if (invalidDates) return false;

    const searchable = [
      booking.id,
      booking.guestName,
      booking.guestEmail,
      booking.guestPhone,
      booking.roomName,
      booking.roomNumber ?? "",
      booking.methodName,
    ]
      .join(" ")
      .toLowerCase();

    const status = statuses[booking.id] ?? "confirmed";

    return (
      searchable.includes(query.trim().toLowerCase()) &&
      (!roomFilter || booking.roomName === roomFilter) &&
      (!statusFilter || status === statusFilter) &&
      (!dateFrom || booking.checkIn >= dateFrom) &&
      (!dateTo || booking.checkIn <= dateTo)
    );
  });

  const hasFilters = Boolean(
    query || roomFilter || statusFilter || dateFrom || dateTo,
  );

  function resetFilters() {
    setQuery("");
    setRoomFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  }

  function refreshData() {
    refreshBookings();
    refreshStatuses();
  }

  function openDelete(booking: Booking) {
    setDeleteTarget(booking);
    setDeleteError("");
    setMessage("");
    deleteDialogRef.current?.showModal();
  }

  function closeDelete() {
    if (isDeleting) return;

    deleteDialogRef.current?.close();
    setDeleteTarget(null);
    setDeleteError("");
  }

  async function confirmDelete() {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteBooking(deleteTarget.id);

      setMessage(
        `Booking atas nama ${deleteTarget.guestName} berhasil dihapus.`,
      );

      deleteDialogRef.current?.close();
      setDeleteTarget(null);
      refreshData();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Booking belum berhasil dihapus.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.2em] text-[#97733e]">
        MANAJEMEN RESERVASI
      </p>

      <h1 className="mt-3 font-serif text-4xl">
        Data Booking
      </h1>

      <p className="mt-3 text-sm leading-7 text-[#63716a]">
        Cari pemesan, lihat nomor kamar, dan kelola status
        menginap.
      </p>

      {message && (
        <p
          role="status"
          className="mt-6 rounded-xl bg-[#e8efe6] p-4 text-sm"
        >
          {message}
        </p>
      )}

      {skipped > 0 && (
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-7 text-amber-900">
          {skipped} data tidak lengkap atau bukan pembayaran
          demo selesai dilewati. Data asli tidak dihapus.
        </p>
      )}

      {/* Filter */}
      <section
        aria-labelledby="filter-title"
        className="mt-7 rounded-2xl border border-[#173e35]/10 bg-white p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="filter-title"
            className="font-serif text-2xl"
          >
            Filter Booking
          </h2>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasFilters}
            className="min-h-11 rounded-xl border border-[#173e35]/20 px-4 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset filter
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="sm:col-span-2 xl:col-span-1">
            <label
              htmlFor="booking-search"
              className="mb-2 block text-xs font-medium"
            >
              Cari pemesan, kode, atau nomor kamar
            </label>

            <input
              id="booking-search"
              type="search"
              placeholder="Nama, kode, nomor kamar..."
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="room-filter"
              className="mb-2 block text-xs font-medium"
            >
              Tipe kamar
            </label>

            <select
              id="room-filter"
              value={roomFilter}
              onChange={(event) =>
                setRoomFilter(event.target.value)
              }
              className={inputClass}
            >
              <option value="">Semua tipe kamar</option>

              {roomNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="status-filter"
              className="mb-2 block text-xs font-medium"
            >
              Status menginap
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className={inputClass}
            >
              <option value="">Semua status</option>

              {Object.entries(statusLabels).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="date-from"
              className="mb-2 block text-xs font-medium"
            >
              Check-in mulai tanggal
            </label>

            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(event) =>
                setDateFrom(event.target.value)
              }
              className={inputClass}
            />
          </div>

          <div className="min-w-0">
            <label
              htmlFor="date-to"
              className="mb-2 block text-xs font-medium"
            >
              Check-in sampai tanggal
            </label>

            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(event) =>
                setDateTo(event.target.value)
              }
              className={inputClass}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={refreshData}
              className="min-h-11 w-full rounded-xl bg-[#173e35] px-5 py-3 text-sm text-white transition hover:bg-[#25594c]"
            >
              Muat ulang data
            </button>
          </div>
        </div>

        {invalidDates && (
          <p
            role="alert"
            className="mt-4 text-sm text-red-700"
          >
            Tanggal akhir filter tidak boleh sebelum tanggal
            awal.
          </p>
        )}

        <p className="mt-4 text-xs leading-6 text-[#63716a]">
          Filter tanggal berdasarkan tanggal check-in,
          termasuk tanggal awal dan akhir yang dipilih.
        </p>
      </section>

      {/* Tabel */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-[#173e35]/10 bg-white">
        <div className="border-b border-[#173e35]/10 p-5">
          <h2 className="font-serif text-2xl">
            Daftar Booking
          </h2>

          <p
            aria-live="polite"
            className="mt-2 text-xs text-[#63716a]"
          >
            {pageError
              ? "Data belum dapat ditampilkan."
              : `${filteredBookings.length} dari ${bookings.length} booking`}
          </p>
        </div>

        {pageError ? (
          <p
            role="alert"
            className="p-6 text-sm text-red-700"
          >
            {pageError}
          </p>
        ) : invalidDates ? (
          <p className="p-6 text-sm text-[#63716a]">
            Perbaiki rentang tanggal untuk melihat hasil.
          </p>
        ) : filteredBookings.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <h3 className="font-serif text-2xl">
              {bookings.length === 0
                ? "Belum ada booking."
                : "Tidak ada booking yang cocok."}
            </h3>

            <p className="mt-3 text-sm leading-7 text-[#63716a]">
              {bookings.length === 0
                ? "Selesaikan pembayaran demo di browser dan alamat situs yang sama."
                : "Ubah pencarian atau reset filter untuk melihat semua booking."}
            </p>

            {bookings.length === 0 ? (
              <Link
                href="/#kamar"
                className="mt-5 inline-block rounded-xl bg-[#173e35] px-6 py-3 text-sm text-white"
              >
                Coba booking demo
              </Link>
            ) : (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 min-h-11 rounded-xl bg-[#173e35] px-6 py-3 text-sm text-white"
              >
                Reset filter
              </button>
            )}
          </div>
        ) : (
          <div
            role="region"
            aria-label="Tabel booking, geser ke samping pada layar kecil"
            tabIndex={0}
            className="overflow-x-auto"
          >
            <table className="w-full min-w-[1400px] text-left text-sm">
              <caption className="sr-only">
                Daftar booking, nomor kamar, pembayaran,
                status menginap, dan tindakan admin
              </caption>

              <thead className="bg-[#f8f5ef] text-xs text-[#63716a]">
                <tr>
                  {[
                    "Pemesan",
                    "Tipe kamar",
                    "Nomor kamar",
                    "Menginap",
                    "Metode",
                    "Total",
                    "Pembayaran",
                    "Status menginap",
                    "Aksi",
                  ].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="px-5 py-4"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#173e35]/10">
                {filteredBookings.map((booking) => {
                  const status =
                    statuses[booking.id] ?? "confirmed";

                  const canDelete =
                    status === "cancelled" ||
                    status === "checked-out";

                  return (
                    <tr
                      key={booking.id}
                      className="transition hover:bg-[#f8f5ef]/70"
                    >
                      <td className="px-5 py-5">
                        <p className="font-semibold">
                          {booking.guestName}
                        </p>

                        <p className="mt-1 text-xs text-[#63716a]">
                          {booking.guestEmail}
                        </p>

                        <p className="mt-1 text-xs text-[#63716a]">
                          {booking.guestPhone}
                        </p>

                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-[#97733e]">
                            Kode booking
                          </summary>

                          <p className="mt-2 max-w-52 break-all text-xs">
                            {booking.id}
                          </p>
                        </details>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-medium">
                          {booking.roomName}
                        </p>

                        <p className="mt-1 text-xs text-[#63716a]">
                          {booking.guests} tamu
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        {booking.roomNumber ? (
                          <span className="inline-block rounded-xl bg-[#f8f5ef] px-4 py-2 font-mono text-lg font-semibold">
                            {booking.roomNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-[#63716a]">
                            Belum ditentukan
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-5">
                        <p>{dateLabel(booking.checkIn)}</p>

                        <p className="mt-1 text-xs text-[#63716a]">
                          hingga{" "}
                          {dateLabel(booking.checkOut)}
                        </p>

                        <p className="mt-1 text-xs text-[#63716a]">
                          {booking.nights} malam
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        {booking.methodName}
                      </td>

                      <td className="whitespace-nowrap px-5 py-5 font-semibold">
                        {rupiah(booking.total)}
                      </td>

                      <td className="px-5 py-5">
                        <span className="whitespace-nowrap rounded-full bg-[#e8efe6] px-3 py-2 text-xs font-semibold">
                          Lunas · Demo
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${badgeClasses[status]}`}
                        >
                          {statusLabels[status]}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex flex-col items-start gap-2">
                          <AdminBookingActions
                            booking={booking}
                          />

                          <button
                            type="button"
                            disabled={!canDelete}
                            onClick={() => openDelete(booking)}
                            title={
                              canDelete
                                ? "Hapus booking demo"
                                : "Batalkan atau selesaikan check-out terlebih dahulu"
                            }
                            className="min-h-11 rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Hapus
                          </button>

                          {!canDelete && (
                            <p className="max-w-40 text-[11px] leading-5 text-[#63716a]">
                              Hapus tersedia setelah
                              pembatalan atau check-out.
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-5 text-xs leading-6 text-[#63716a]">
        Booking lama yang belum memiliki nomor ditampilkan
        sebagai “Belum ditentukan”. Penghapusan booking akan
        mengubah jumlah booking dan pendapatan pada dashboard.
      </p>

      {/* Konfirmasi hapus */}
      <dialog
        ref={deleteDialogRef}
        aria-labelledby="delete-booking-title"
        aria-busy={isDeleting}
        onCancel={(event) => {
          if (isDeleting) {
            event.preventDefault();
          } else {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeDelete();
          }
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border-0 bg-white p-0 text-[#173e35] shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <h2
            id="delete-booking-title"
            className="font-serif text-3xl"
          >
            Hapus booking?
          </h2>

          <p className="mt-4 text-sm leading-7 text-[#63716a]">
            Booking atas nama{" "}
            <strong>{deleteTarget?.guestName}</strong> akan
            dihapus permanen dari data demo.
          </p>

          <div className="mt-4 rounded-xl bg-[#f8f5ef] p-4 text-xs leading-7">
            <p className="break-all">
              Kode: {deleteTarget?.id}
            </p>

            <p>Tipe: {deleteTarget?.roomName}</p>

            <p>
              Nomor kamar:{" "}
              {deleteTarget?.roomNumber ?? "Belum ditentukan"}
            </p>
          </div>

          <p className="mt-4 text-xs leading-6 text-[#63716a]">
            Tindakan ini tidak dapat dibatalkan dan tidak
            memproses refund. Statistik dashboard ikut
            dihitung ulang.
          </p>

          {deleteError && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700"
            >
              {deleteError}
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isDeleting}
              onClick={closeDelete}
              className="min-h-11 rounded-xl border border-[#173e35]/20 px-4 py-3 text-sm disabled:opacity-40"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={isDeleting}
              onClick={confirmDelete}
              className="min-h-11 rounded-xl bg-red-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-800 disabled:opacity-40"
            >
              {isDeleting ? "Menghapus..." : "Ya, hapus"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}