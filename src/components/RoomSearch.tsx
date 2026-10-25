"use client";

import { useState, type SubmitEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import RoomDetails from "@/components/RoomDetails";
import BookingSteps from "@/components/BookingSteps";
import BookingStepFocus from "@/components/BookingStepFocus";
import { downloadReceiptPdf } from "@/lib/downloadReceipt";
import { useRooms, type Room } from "@/lib/useRooms";
import {
  getAvailableRoomUnits,
  savePaidBooking,
} from "@/lib/bookingAvailability";

const methods = [
  { id: "qris", name: "QRIS" },
  { id: "va", name: "Virtual Account" },
  { id: "cash", name: "Tunai" },
] as const;

type Method = (typeof methods)[number]["id"];

type Search = {
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
};

type Payment = Search & {
  id: string;
  roomId: string;
  roomName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  method: Method;
  methodName: string;
  pricePerNight: number;
  total: number;
};

type Receipt = Payment & {
  roomUnitId: string;
  roomNumber: string;
  status: "paid-demo";
  paidAt: string;
};

const inputClass =
  "min-w-0 w-full rounded-xl border border-[#173e35]/20 bg-[#f8f5ef] p-3 outline-none focus:ring-2 focus:ring-[#97733e]";

const buttonClass =
  "min-h-11 rounded-xl bg-[#173e35] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#25594c] disabled:cursor-not-allowed disabled:opacity-50";

const outlineClass =
  "min-h-11 rounded-xl border border-[#173e35]/20 px-6 py-3 text-sm transition hover:bg-[#f8f5ef] disabled:cursor-not-allowed disabled:opacity-50";

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function dateLabel(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export default function RoomSearch() {
  const { rooms, error: roomsError } = useRooms();

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  const [search, setSearch] = useState<Search | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const [availableCounts, setAvailableCounts] = useState<
    Record<string, number>
  >({});

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [method, setMethod] = useState<Method>("qris");

  const [payment, setPayment] = useState<Payment | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [showEmail, setShowEmail] = useState(false);

  const [error, setError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [pdfError, setPdfError] = useState("");

  const [isPaying, setIsPaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  function resetSearch() {
    setSearch(null);
    setSelectedRoom(null);
    setAvailableCounts({});
    setPayment(null);
    setReceipt(null);
    setShowEmail(false);
    setError("");
    setBookingError("");
    setPaymentError("");
    setPdfError("");
  }

  function changeGuests(change: number) {
    setGuests((previous) =>
      Math.min(10, Math.max(1, previous + change)),
    );
    resetSearch();
  }

  function handleSearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    resetSearch();

    if (roomsError) {
      setError("Informasi kamar belum tersedia. Coba kembali nanti.");
      return;
    }

    const now = new Date();

    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    if (!checkIn || !checkOut) {
      setError("Isi tanggal check-in dan check-out.");
      return;
    }

    if (checkIn < today) {
      setError("Check-in tidak boleh sebelum hari ini.");
      return;
    }

    if (checkOut <= checkIn) {
      setError("Check-out harus setelah tanggal check-in.");
      return;
    }

    const nights =
      (Date.parse(`${checkOut}T00:00:00Z`) -
        Date.parse(`${checkIn}T00:00:00Z`)) /
      86400000;

    if (!Number.isFinite(nights) || nights <= 0) {
      setError("Tanggal menginap tidak valid.");
      return;
    }

    try {
      const counts: Record<string, number> = {};

      for (const room of rooms) {
        if (!room.active || room.capacity < guests) continue;

        counts[room.id] = getAvailableRoomUnits(
          room.id,
          checkIn,
          checkOut,
        ).length;
      }

      setAvailableCounts(counts);
      setSearch({ checkIn, checkOut, guests, nights });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ketersediaan kamar belum dapat diperiksa.",
      );
    }
  }

  function openPayment(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingError("");

    if (!selectedRoom || !search) return;

    if (roomsError) {
      setBookingError(
        "Informasi kamar belum dapat dibaca. Coba kembali nanti.",
      );
      return;
    }

    const latestRoom = rooms.find(
      (room) => room.id === selectedRoom.id,
    );

    if (
      !latestRoom ||
      !latestRoom.active ||
      latestRoom.capacity < search.guests
    ) {
      setSelectedRoom(null);
      setError(
        "Informasi kamar berubah. Silakan cari dan pilih kamar kembali.",
      );
      return;
    }

    if (
      latestRoom.price !== selectedRoom.price ||
      latestRoom.name !== selectedRoom.name
    ) {
      setSelectedRoom(latestRoom);
      setBookingError(
        "Informasi kamar diperbarui. Periksa ringkasan terbaru, lalu tekan Bayar kembali.",
      );
      return;
    }

    if (guestName.trim().length < 2) {
      setBookingError("Nama pemesan minimal 2 karakter.");
      return;
    }

    const phone = guestPhone.trim();
    const digits = phone.replace(/\D/g, "");

    if (
      !/^\+?[\d\s()-]+$/.test(phone) ||
      digits.length < 8 ||
      digits.length > 15
    ) {
      setBookingError(
        "Masukkan nomor HP yang valid dengan 8–15 angka.",
      );
      return;
    }

    const selectedMethod = methods.find(
      (item) => item.id === method,
    );

    if (!selectedMethod) {
      setBookingError("Pilih metode pembayaran.");
      return;
    }

    try {
      const available = getAvailableRoomUnits(
        latestRoom.id,
        search.checkIn,
        search.checkOut,
      );

      setAvailableCounts((previous) => ({
        ...previous,
        [latestRoom.id]: available.length,
      }));

      if (available.length === 0) {
        setBookingError(
          "Kamar sudah habis pada tanggal ini. Cari ulang atau pilih tanggal lain.",
        );
        return;
      }

      setPayment({
        ...search,
        id: `SELA-${crypto.randomUUID().toUpperCase()}`,
        roomId: latestRoom.id,
        roomName: latestRoom.name,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: phone,
        method,
        methodName: selectedMethod.name,
        pricePerNight: latestRoom.price,
        total: latestRoom.price * search.nights,
      });

      setPaymentError("");
    } catch (error) {
      setBookingError(
        error instanceof Error
          ? error.message
          : "Ketersediaan belum dapat diperiksa.",
      );
    }
  }

  async function completePayment() {
    if (!payment || isPaying || receipt) return;

    setIsPaying(true);
    setPaymentError("");

    try {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 1200);
      });

      // Pemeriksaan terakhir dan pemilihan nomor kamar
      // dilakukan di dalam savePaidBooking.
      const newReceipt = await savePaidBooking(payment);

      setReceipt(newReceipt);
      setPayment(null);
      setSelectedRoom(null);
      setShowEmail(false);
      setPdfError("");
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Booking demo belum berhasil disimpan.",
      );
    } finally {
      setIsPaying(false);
    }
  }

  async function downloadReceipt() {
    if (!receipt || isDownloading) return;

    setPdfError("");
    setIsDownloading(true);

    try {
      await downloadReceiptPdf(receipt);
    } catch {
      setPdfError("PDF belum berhasil dibuat. Coba unduh kembali.");
    } finally {
      setIsDownloading(false);
    }
  }

  function startNewBooking() {
    resetSearch();
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setMethod("qris");
  }

  const activeRooms = rooms.filter((room) => room.active);

  const matchingRooms = search
    ? activeRooms.filter(
        (room) =>
          room.capacity >= search.guests &&
          (availableCounts[room.id] ?? 0) > 0,
      )
    : activeRooms;

  const currentStep: 1 | 2 | 3 | 4 = receipt
    ? 4
    : payment
      ? 3
      : selectedRoom
        ? 2
        : 1;

  return (
    <section
      id="kamar"
      className="border-t border-[#173e35]/10 bg-white/40"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
        <p className="mb-3 text-xs font-semibold tracking-[0.25em] text-[#97733e]">
          RENCANAKAN JEDAMU
        </p>

        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">
          Temukan kamar yang pas.
        </h2>

        <p className="mt-4 text-sm leading-7 text-[#63716a]">
          Pilih tanggal menginap untuk melihat kamar yang tersedia.
          Seluruh pembayaran merupakan simulasi.
        </p>

        <BookingSteps currentStep={currentStep} />
        <BookingStepFocus currentStep={currentStep} />

        {roomsError && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {roomsError}
          </p>
        )}

        {/* Tahap 1: pencarian */}
        <form
          data-booking-step="1"
          tabIndex={-1}
          onSubmit={handleSearch}
          className="mt-8 scroll-mt-6 rounded-2xl border border-[#173e35]/10 bg-white p-4 focus:outline-none sm:p-6"
        >
          <fieldset
            disabled={isPaying || isDownloading}
            className="grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:items-end"
          >
            <div className="min-w-0">
              <label
                htmlFor="check-in"
                className="mb-2 block text-sm font-medium"
              >
                Check-in
              </label>

              <input
                id="check-in"
                type="date"
                required
                value={checkIn}
                onChange={(event) => {
                  setCheckIn(event.target.value);
                  resetSearch();
                }}
                className={inputClass}
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="check-out"
                className="mb-2 block text-sm font-medium"
              >
                Check-out
              </label>

              <input
                id="check-out"
                type="date"
                required
                value={checkOut}
                onChange={(event) => {
                  setCheckOut(event.target.value);
                  resetSearch();
                }}
                className={inputClass}
              />
            </div>

            <div>
              <p
                id="guests-label"
                className="mb-2 text-sm font-medium"
              >
                Jumlah tamu
              </p>

              <div
                role="group"
                aria-labelledby="guests-label"
                className="flex items-center justify-between rounded-xl border border-[#173e35]/20 bg-[#f8f5ef] p-1"
              >
                <button
                  type="button"
                  aria-label="Kurangi jumlah tamu"
                  disabled={guests <= 1}
                  onClick={() => changeGuests(-1)}
                  className="h-11 w-11 rounded-lg bg-white text-xl disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>

                <span
                  aria-live="polite"
                  className="text-sm font-semibold"
                >
                  {guests} tamu
                </span>

                <button
                  type="button"
                  aria-label="Tambah jumlah tamu"
                  disabled={guests >= 10}
                  onClick={() => changeGuests(1)}
                  className="h-11 w-11 rounded-lg bg-white text-xl disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <button type="submit" className={buttonClass}>
              Cari kamar →
            </button>
          </fieldset>

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {error}
            </p>
          )}
        </form>

        {/* Daftar tipe kamar */}
        {!payment && !receipt && !roomsError && (
          <div className="mt-8">
            <p
              aria-live="polite"
              className="mb-5 text-sm text-[#63716a]"
            >
              {search
                ? `${matchingRooms.length} tipe tersedia untuk ${search.guests} tamu · ${search.nights} malam`
                : "Pilih tanggal dan jumlah tamu untuk mulai booking."}
            </p>

            {matchingRooms.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#173e35]/25 p-6 text-center">
                <h3 className="font-serif text-2xl">
                  Belum ada kamar yang cocok.
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#63716a]">
                  {search
                    ? "Kamar mungkin sudah terpesan atau kapasitasnya tidak sesuai. Coba tanggal atau jumlah tamu lain."
                    : "Belum ada tipe kamar aktif yang dapat ditampilkan."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-6">
                {matchingRooms.map((room) => (
                  <article
                    key={room.id}
                    className={`flex min-w-0 flex-col rounded-2xl border p-3 sm:p-5 lg:p-7 ${
                      selectedRoom?.id === room.id
                        ? "border-[#173e35] bg-[#e8efe6]"
                        : "border-[#173e35]/10 bg-[#f8f5ef]"
                    }`}
                  >
                    <p className="text-[10px] tracking-wide text-[#97733e] sm:text-xs">
                      MAKSIMAL {room.capacity} TAMU
                    </p>

                    <h3 className="mt-3 font-serif text-lg leading-tight sm:text-2xl">
                      {room.name}
                    </h3>

                    <p className="mt-3 flex-1 text-xs leading-5 text-[#63716a] sm:text-sm sm:leading-7">
                      {room.description}
                    </p>

                    <RoomDetails roomId={room.id} />

                    {search && (
                      <p className="mt-3 text-[11px] font-medium text-[#173e35] sm:text-xs">
                        {availableCounts[room.id] ?? 0} kamar tersedia
                        saat pencarian
                      </p>
                    )}

                    <div className="mt-4 border-t border-[#173e35]/10 pt-3">
                      <p className="text-xs font-semibold sm:text-lg">
                        {rupiah(room.price)}
                      </p>

                      <p className="mt-1 text-[10px] text-[#63716a] sm:text-xs">
                        per malam
                      </p>
                    </div>

                    {search && (
                      <>
                        <div className="mt-3 text-xs text-[#63716a] sm:text-sm">
                          <p>Total {search.nights} malam</p>

                          <p className="mt-1 font-semibold text-[#173e35]">
                            {rupiah(room.price * search.nights)}
                          </p>
                        </div>

                        <button
                          type="button"
                          aria-pressed={selectedRoom?.id === room.id}
                          onClick={() => {
                            setSelectedRoom(room);
                            setBookingError("");
                            setError("");
                          }}
                          className="mt-4 min-h-11 w-full rounded-xl bg-[#173e35] px-2 py-3 text-xs font-medium text-white transition hover:bg-[#25594c] sm:text-sm"
                        >
                          {selectedRoom?.id === room.id
                            ? "Dipilih ✓"
                            : "Pilih kamar"}
                        </button>
                      </>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tahap 2: data pemesan */}
        {selectedRoom && search && !payment && !receipt && (
          <div
            data-booking-step="2"
            tabIndex={-1}
            role="region"
            aria-label="Data pemesan dan ringkasan booking"
            className="mt-10 grid scroll-mt-6 gap-8 rounded-2xl border border-[#173e35]/15 bg-white p-5 focus:outline-none md:p-8 lg:grid-cols-2"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-widest text-[#97733e]">
                RINGKASAN BOOKING
              </p>

              <h3 className="mt-3 font-serif text-3xl">
                {selectedRoom.name}
              </h3>

              <dl className="mt-6 space-y-4 text-sm">
                {[
                  ["Check-in", dateLabel(search.checkIn)],
                  ["Check-out", dateLabel(search.checkOut)],
                  ["Tamu", `${search.guests} orang`],
                  ["Durasi", `${search.nights} malam`],
                  ["Harga per malam", rupiah(selectedRoom.price)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}

                <div className="flex flex-wrap justify-between gap-3 border-t border-[#173e35]/10 pt-4 text-xl font-semibold">
                  <dt>Total</dt>
                  <dd>
                    {rupiah(selectedRoom.price * search.nights)}
                  </dd>
                </div>
              </dl>

              <p className="mt-5 text-xs leading-6 text-[#63716a]">
                Nomor kamar ditentukan otomatis setelah pembayaran
                demo berhasil. Kamar belum ditahan pada tahap ini.
              </p>

              <p className="mt-5 rounded-xl bg-[#f8f5ef] p-4 text-xs leading-6 text-[#63716a]">
                Total hanya mencakup harga kamar. Gunakan data
                contoh. Tidak ada transaksi atau reservasi sungguhan.
              </p>
            </div>

            <form
              onSubmit={openPayment}
              className="min-w-0 space-y-5"
            >
              <h3 className="font-serif text-2xl">
                Data pemesan
              </h3>

              <div>
                <label
                  htmlFor="guest-name"
                  className="mb-2 block text-sm font-medium"
                >
                  Nama lengkap
                </label>

                <input
                  id="guest-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Budi Santoso"
                  value={guestName}
                  onChange={(event) =>
                    setGuestName(event.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="guest-email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email
                </label>

                <input
                  id="guest-email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  placeholder="budi@example.com"
                  value={guestEmail}
                  onChange={(event) =>
                    setGuestEmail(event.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="guest-phone"
                  className="mb-2 block text-sm font-medium"
                >
                  Nomor HP
                </label>

                <input
                  id="guest-phone"
                  type="tel"
                  required
                  maxLength={25}
                  autoComplete="tel"
                  placeholder="081234567890"
                  value={guestPhone}
                  onChange={(event) =>
                    setGuestPhone(event.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <fieldset className="space-y-3">
                <legend className="mb-3 text-sm font-medium">
                  Metode pembayaran
                </legend>

                {methods.map((item) => (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                      method === item.id
                        ? "border-[#173e35] bg-[#e8efe6]"
                        : "border-[#173e35]/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={item.id}
                      checked={method === item.id}
                      onChange={() => setMethod(item.id)}
                      className="accent-[#173e35]"
                    />

                    <span className="text-sm font-medium">
                      {item.name}
                    </span>
                  </label>
                ))}
              </fieldset>

              {bookingError && (
                <p role="alert" className="text-sm text-red-700">
                  {bookingError}
                </p>
              )}

              <button
                type="submit"
                className={`${buttonClass} w-full`}
              >
                Bayar
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRoom(null);
                  setBookingError("");
                }}
                className={`${outlineClass} w-full`}
              >
                Kembali pilih kamar
              </button>
            </form>
          </div>
        )}

        {/* Tahap 3: pembayaran */}
        {payment && !receipt && (
          <div
            data-booking-step="3"
            tabIndex={-1}
            role="region"
            aria-label="Instruksi pembayaran demo"
            aria-busy={isPaying}
            className="mx-auto mt-10 max-w-xl scroll-mt-6 rounded-2xl border border-[#173e35]/15 bg-white p-5 focus:outline-none md:p-8"
          >
            <p className="text-center text-xs font-semibold tracking-widest text-[#97733e]">
              PEMBAYARAN DEMO
            </p>

            <h3 className="mt-3 text-center font-serif text-3xl">
              {payment.methodName}
            </h3>

            <p className="mt-3 text-center text-sm text-[#63716a]">
              {payment.roomName} · {payment.nights} malam
            </p>

            <p className="mt-5 text-center text-2xl font-semibold sm:text-3xl">
              {rupiah(payment.total)}
            </p>

            {payment.method === "qris" && (
              <div className="mt-6 text-center">
                <div className="mx-auto w-fit max-w-full rounded-2xl border border-[#173e35]/10 bg-white p-5">
                  <QRCodeSVG
                    value={`SELA STAY | DEMO ONLY | ${payment.id} | IDR ${payment.total} | BUKAN PEMBAYARAN`}
                    size={200}
                    level="M"
                    title="QR demo SÉLA Stay, bukan QRIS pembayaran"
                    className="h-auto max-w-full"
                  />
                </div>

                <p className="mt-4 text-xs leading-6 text-[#63716a]">
                  QR ini berisi teks demo, bukan QRIS pembayaran.
                  Tidak perlu melakukan pembayaran sungguhan.
                </p>
              </div>
            )}

            {payment.method === "va" && (
              <div className="mt-6 rounded-xl bg-[#f8f5ef] p-5 text-center">
                <p className="text-sm text-[#63716a]">
                  Nomor Virtual Account Demo
                </p>

                <p className="mt-4 font-mono text-3xl font-semibold tracking-widest">
                  12345678
                </p>

                <p className="mt-4 text-xs leading-6 text-[#63716a]">
                  Nomor contoh. Tidak perlu melakukan transfer.
                </p>
              </div>
            )}

            {payment.method === "cash" && (
              <div className="mt-6 rounded-xl bg-[#f8f5ef] p-5 text-center">
                <p className="font-semibold">
                  Bayar di resepsionis
                </p>

                <p className="mt-3 text-sm leading-7 text-[#63716a]">
                  Tombol di bawah menyimulasikan resepsionis
                  menerima pembayaran tunai.
                </p>
              </div>
            )}

            <p className="mt-5 text-center text-xs leading-6 text-[#63716a]">
              Ketersediaan diperiksa kembali saat menyelesaikan
              simulasi pembayaran.
            </p>

            {paymentError && (
              <p
                role="alert"
                className="mt-5 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700"
              >
                {paymentError}
              </p>
            )}

            <button
              type="button"
              disabled={isPaying}
              onClick={completePayment}
              className={`${buttonClass} mt-6 w-full`}
            >
              {isPaying
                ? "Memproses..."
                : payment.method === "cash"
                  ? "Simulasikan tunai diterima"
                  : "Simulasikan pembayaran berhasil"}
            </button>

            <button
              type="button"
              disabled={isPaying}
              onClick={() => {
                setPayment(null);
                setPaymentError("");
              }}
              className={`${outlineClass} mt-3 w-full`}
            >
              Kembali
            </button>

            <p
              role="status"
              className="mt-4 text-center text-xs leading-6 text-[#63716a]"
            >
              {isPaying
                ? "Sedang memeriksa kamar dan menyimpan booking demo."
                : "Tidak ada uang yang dipotong atau diterima."}
            </p>
          </div>
        )}

        {/* Tahap 4: selesai */}
        {receipt && (
          <div
            data-booking-step="4"
            tabIndex={-1}
            role="region"
            aria-label="Booking selesai dan bukti pembayaran"
            className="mt-10 scroll-mt-6 focus:outline-none"
          >
            <div
              role="status"
              className="mb-6 rounded-2xl bg-[#e8efe6] p-5 sm:p-6"
            >
              <h3 className="font-serif text-2xl sm:text-3xl">
                Pembayaran demo berhasil ✓
              </h3>

              <p className="mt-3 text-sm leading-7">
                Terima kasih, {receipt.guestName}. Kamu mendapatkan
                kamar nomor <strong>{receipt.roomNumber}</strong>.
                Unduh struk PDF sebelum meninggalkan halaman ini.
              </p>
            </div>

            <article className="mx-auto max-w-2xl rounded-2xl border border-[#173e35]/15 bg-white p-5 md:p-10">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold tracking-widest">
                    SÉLA STAY
                  </p>
                  <p className="mt-2 text-sm text-[#63716a]">
                    Bukti pembayaran demo
                  </p>
                </div>

                <span className="h-fit rounded-full bg-[#e8efe6] px-3 py-2 text-xs font-semibold">
                  LUNAS · DEMO
                </span>
              </div>

              <p className="mt-6 break-all border-y border-dashed border-[#173e35]/20 py-4 text-xs">
                Kode booking: {receipt.id}
              </p>

              <dl className="mt-6 space-y-4 text-sm">
                {[
                  ["Pemesan", receipt.guestName],
                  ["Email", receipt.guestEmail],
                  ["Nomor HP", receipt.guestPhone],
                  ["Tipe kamar", receipt.roomName],
                  ["Nomor kamar", receipt.roomNumber],
                  [
                    "Menginap",
                    `${dateLabel(receipt.checkIn)} – ${dateLabel(receipt.checkOut)}`,
                  ],
                  [
                    "Tamu / durasi",
                    `${receipt.guests} tamu / ${receipt.nights} malam`,
                  ],
                  ["Harga per malam", rupiah(receipt.pricePerNight)],
                  ["Metode simulasi", receipt.methodName],
                  [
                    "Waktu pembayaran demo",
                    new Date(receipt.paidAt).toLocaleString("id-ID"),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <dt className="text-[#63716a]">{label}</dt>

                    <dd className="min-w-0 break-words [overflow-wrap:anywhere]">
                      {value}
                    </dd>
                  </div>
                ))}

                <div className="flex flex-wrap justify-between gap-2 border-t border-dashed border-[#173e35]/20 pt-5 text-xl font-semibold">
                  <dt>Total</dt>
                  <dd>{rupiah(receipt.total)}</dd>
                </div>
              </dl>

              <p className="mt-6 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-900">
                DEMO PORTOFOLIO — bukan bukti transaksi atau
                reservasi sungguhan. Email tidak dikirim.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={downloadReceipt}
                  className={buttonClass}
                >
                  {isDownloading
                    ? "Membuat PDF..."
                    : "Unduh struk PDF"}
                </button>

                <button
                  type="button"
                  aria-expanded={showEmail}
                  aria-controls="email-preview"
                  onClick={() => setShowEmail(!showEmail)}
                  className={outlineClass}
                >
                  {showEmail
                    ? "Tutup preview email"
                    : "Lihat preview email"}
                </button>
              </div>

              {pdfError && (
                <p
                  role="alert"
                  className="mt-4 text-sm text-red-700"
                >
                  {pdfError}
                </p>
              )}
            </article>

            {/* Preview email */}
            {showEmail && (
              <article
                id="email-preview"
                className="mx-auto mt-6 max-w-2xl overflow-hidden rounded-2xl border border-[#173e35]/15 bg-white"
              >
                <div className="border-b border-[#173e35]/10 bg-[#f8f5ef] p-5 text-sm sm:p-6">
                  <p className="font-semibold">
                    Preview email demo — tidak dikirim
                  </p>

                  <p className="mt-3 break-all">
                    Kepada: {receipt.guestEmail}
                  </p>

                  <p className="mt-2">
                    Subjek: Bukti pembayaran demo SÉLA Stay
                  </p>
                </div>

                <div className="p-5 md:p-8">
                  <p className="text-xs tracking-widest text-[#97733e]">
                    SÉLA STAY
                  </p>

                  <h3 className="mt-4 font-serif text-3xl">
                    Waktunya menikmati jeda.
                  </h3>

                  <p className="mt-5 text-sm leading-7">
                    Halo {receipt.guestName}, pembayaran simulasi
                    melalui {receipt.methodName} untuk{" "}
                    {receipt.roomName} telah berhasil.
                  </p>

                  <div className="mt-5 rounded-xl bg-[#f8f5ef] p-4 text-sm leading-8 sm:p-5">
                    <p className="break-all">Kode: {receipt.id}</p>
                    <p>Nomor HP: {receipt.guestPhone}</p>
                    <p>Tipe kamar: {receipt.roomName}</p>
                    <p>Nomor kamar: {receipt.roomNumber}</p>
                    <p>Check-in: {dateLabel(receipt.checkIn)}</p>
                    <p>Check-out: {dateLabel(receipt.checkOut)}</p>
                    <p>Total demo: {rupiah(receipt.total)}</p>
                  </div>

                  <p className="mt-5 text-xs leading-6 text-[#63716a]">
                    Contoh email untuk proyek portofolio. Tidak ada
                    pemesanan hotel atau pembayaran sungguhan.
                  </p>
                </div>
              </article>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                disabled={isDownloading}
                onClick={startNewBooking}
                className={buttonClass}
              >
                Buat booking demo lagi
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}