"use client";

import { useRef, useState } from "react";
import {
  type Booking,
  dateLabel,
  rupiah,
} from "@/lib/useAdminBookings";

type StayStatus =
  | "confirmed"
  | "checked-in"
  | "checked-out"
  | "cancelled";

type Props = {
  booking: Booking;
};

const STORAGE_KEY = "sela-stay-booking-statuses";

const statusLabels: Record<StayStatus, string> = {
  confirmed: "Dikonfirmasi",
  "checked-in": "Check-in",
  "checked-out": "Check-out",
  cancelled: "Dibatalkan",
};

function isStayStatus(value: unknown): value is StayStatus {
  return (
    value === "confirmed" ||
    value === "checked-in" ||
    value === "checked-out" ||
    value === "cancelled"
  );
}

function readStatuses(): Record<string, StayStatus> {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) return {};

  const parsed: unknown = JSON.parse(stored);

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error("Format penyimpanan status tidak valid.");
  }

  const statuses: Record<string, StayStatus> = {};

  for (const [id, value] of Object.entries(parsed)) {
    if (!isStayStatus(value)) {
      throw new Error("Status menginap tidak valid.");
    }

    statuses[id] = value;
  }

  return statuses;
}

export default function AdminBookingActions({ booking }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [status, setStatus] = useState<StayStatus>("confirmed");
  const [selectedStatus, setSelectedStatus] =
    useState<StayStatus>("confirmed");

  const [canSave, setCanSave] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function openDetails() {
    setError("");
    setMessage("");
    setCanSave(false);

    try {
      const statuses = readStatuses();
      const current = statuses[booking.id] ?? "confirmed";

      setStatus(current);
      setSelectedStatus(current);
      setCanSave(true);
    } catch {
      setError(
        "Status menginap belum bisa dibaca. Data lama tidak dihapus. Tutup popup dan coba lagi.",
      );
    }

    dialogRef.current?.showModal();
  }

  function closeDetails() {
    dialogRef.current?.close();
  }

  function saveStatus() {
    if (!canSave || selectedStatus === status) return;

    setError("");
    setMessage("");

    try {
      const statuses = readStatuses();
      const latest = statuses[booking.id] ?? "confirmed";

      // Cegah menimpa status yang telah berubah di tab lain.
      if (latest !== status) {
        setStatus(latest);
        setSelectedStatus(latest);
        setError(
          "Status berubah di tab lain. Periksa status terbaru sebelum menyimpan kembali.",
        );
        return;
      }

      const allowed =
        (latest === "confirmed" &&
          (selectedStatus === "checked-in" ||
            selectedStatus === "cancelled")) ||
        (latest === "checked-in" &&
          selectedStatus === "checked-out");

      if (!allowed) {
        setError("Perubahan status ini tidak diperbolehkan.");
        return;
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...statuses,
          [booking.id]: selectedStatus,
        }),
      );

     setStatus(selectedStatus);
setMessage("Status menginap berhasil disimpan.");

window.dispatchEvent(new Event("sela-statuses-updated"));
    } catch {
      setError(
        "Status belum tersimpan. Pastikan penyimpanan browser diizinkan.",
      );
    }
  }

  const availableStatuses: StayStatus[] =
    status === "confirmed"
      ? ["confirmed", "checked-in", "cancelled"]
      : status === "checked-in"
        ? ["checked-in", "checked-out"]
        : [status];

  const isFinal =
    status === "checked-out" || status === "cancelled";

  return (
    <>
      <button
        type="button"
        onClick={openDetails}
        aria-haspopup="dialog"
        className="min-h-11 whitespace-nowrap rounded-xl border border-[#173e35]/20 px-4 py-2 text-xs font-semibold transition hover:bg-[#e8efe6]"
      >
        Detail booking ↗
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`booking-title-${booking.id}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeDetails();
          }
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border-0 bg-[#f8f5ef] p-0 text-left text-[#173e35] shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div>
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#173e35]/10 bg-[#f8f5ef] p-5 sm:p-6">
            <div className="min-w-0">
              <p className="text-xs tracking-widest text-[#97733e]">
                ADMIN · DETAIL BOOKING
              </p>

              <h2
                id={`booking-title-${booking.id}`}
                className="mt-3 font-serif text-2xl sm:text-3xl"
              >
                {booking.roomName}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeDetails}
              aria-label="Tutup detail booking"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#173e35]/15 bg-white text-xl transition hover:bg-[#e8efe6]"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            <p className="break-all text-xs text-[#63716a]">
              Kode booking: {booking.id}
            </p>

            <section className="rounded-2xl border border-[#173e35]/10 bg-white p-5">
              <h3 className="font-serif text-xl">Data pemesan</h3>

              <dl className="mt-4 space-y-4 text-sm">
                {[
                  ["Nama", booking.guestName],
                  ["Email", booking.guestEmail],
                  ["Nomor HP", booking.guestPhone],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <dt className="text-[#63716a]">{label}</dt>
                    <dd className="min-w-0 break-all font-medium">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-2xl border border-[#173e35]/10 bg-white p-5">
              <h3 className="font-serif text-xl">Detail menginap</h3>

              <dl className="mt-4 space-y-4 text-sm">
                {[
                  ["Check-in", dateLabel(booking.checkIn)],
                  ["Check-out", dateLabel(booking.checkOut)],
                  ["Jumlah tamu", `${booking.guests} orang`],
                  ["Durasi", `${booking.nights} malam`],
                  ["Metode pembayaran", booking.methodName],
                  ["Pembayaran", "Lunas · Demo"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <dt className="text-[#63716a]">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}

                <div className="flex flex-wrap justify-between gap-2 border-t border-[#173e35]/10 pt-4 text-lg font-semibold">
                  <dt>Total</dt>
                  <dd>{rupiah(booking.total)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-[#173e35]/10 bg-white p-5">
              <h3 className="font-serif text-xl">
                Kelola status menginap
              </h3>

              {canSave && (
                <p className="mt-3 text-sm text-[#63716a]">
                  Status saat ini:{" "}
                  <span className="font-semibold text-[#173e35]">
                    {statusLabels[status]}
                  </span>
                </p>
              )}

              <label
                htmlFor={`stay-status-${booking.id}`}
                className="mt-5 block text-sm font-medium"
              >
                Pilih status
              </label>

              <select
                id={`stay-status-${booking.id}`}
                value={selectedStatus}
                disabled={!canSave || isFinal}
                onChange={(event) => {
                  const value = event.target.value;

                  if (isStayStatus(value)) {
                    setSelectedStatus(value);
                    setMessage("");
                    setError("");
                  }
                }}
                className="mt-2 w-full rounded-xl border border-[#173e35]/20 bg-[#f8f5ef] p-3 text-sm outline-none focus:ring-2 focus:ring-[#97733e] disabled:opacity-60"
              >
                {availableStatuses.map((value) => (
                  <option key={value} value={value}>
                    {statusLabels[value]}
                  </option>
                ))}
              </select>

              {canSave && !isFinal && (
                <p className="mt-3 text-xs leading-6 text-[#63716a]">
                  {status === "confirmed"
                    ? "Booking dapat dilanjutkan ke check-in atau dibatalkan."
                    : "Tamu sudah check-in. Lanjutkan ke check-out setelah selesai menginap."}
                </p>
              )}

              {selectedStatus === "cancelled" &&
                status !== "cancelled" && (
                  <p className="mt-4 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-900">
                    Klik Simpan status untuk membatalkan booking demo.
                    Pembatalan bersifat final dan tidak memproses
                    refund.
                  </p>
                )}

              {canSave && isFinal && (
                <p className="mt-4 rounded-xl bg-[#e8efe6] p-4 text-xs leading-6">
                  Status ini sudah final dan tidak dapat diubah lagi.
                </p>
              )}

              {error && (
                <p role="alert" className="mt-4 text-sm text-red-700">
                  {error}
                </p>
              )}

              {message && (
                <p
                  role="status"
                  className="mt-4 text-sm text-green-800"
                >
                  {message}
                </p>
              )}

              <button
                type="button"
                disabled={
                  !canSave || isFinal || selectedStatus === status
                }
                onClick={saveStatus}
                className="mt-5 min-h-11 w-full rounded-xl bg-[#173e35] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#25594c] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Simpan status
              </button>
            </section>

            <p className="text-xs leading-6 text-[#63716a]">
              Perubahan status menginap tidak mengubah status
              pembayaran demo atau mengirim email.
            </p>

            <button
              type="button"
              onClick={closeDetails}
              className="min-h-11 w-full rounded-xl border border-[#173e35]/20 px-6 py-3 text-sm transition hover:bg-white"
            >
              Tutup detail
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}