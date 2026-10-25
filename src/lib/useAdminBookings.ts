"use client";

import { useMemo, useSyncExternalStore } from "react";

export type Booking = {
  id: string;
  roomId?: string;
  roomUnitId?: string;
  roomNumber?: string;
  roomName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  methodName: string;
  total: number;
  paidAt: string;
  status: "paid-demo";
};

const STORAGE_KEY = "sela-stay-paid-demo-bookings";
const STATUS_KEY = "sela-stay-booking-statuses";
const UPDATE_EVENT = "sela-bookings-updated";
const READ_ERROR = "__READ_ERROR__";

function subscribe(callback: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) {
      callback();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener("focus", callback);
  window.addEventListener("pageshow", callback);
  window.addEventListener(UPDATE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("focus", callback);
    window.removeEventListener("pageshow", callback);
    window.removeEventListener(UPDATE_EVENT, callback);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return READ_ERROR;
  }
}

function getServerSnapshot() {
  return "[]";
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numeric(value: unknown) {
  if (typeof value === "number") return value;

  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }

  return NaN;
}

function normalizeBooking(value: unknown): Booking | null {
  if (typeof value !== "object" || value === null) return null;

  const item = value as Record<string, unknown>;

  const id = text(item.id);
  const roomName = text(item.roomName);
  const guestName = text(item.guestName);
  const checkIn = text(item.checkIn);
  const checkOut = text(item.checkOut);

  const guests = numeric(item.guests);
  const nights = numeric(item.nights);
  const total = numeric(item.total);

  if (
    item.status !== "paid-demo" ||
    !id ||
    !roomName ||
    !guestName ||
    !/^\d{4}-\d{2}-\d{2}$/.test(checkIn) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(checkOut) ||
    !Number.isInteger(guests) ||
    guests <= 0 ||
    !Number.isInteger(nights) ||
    nights <= 0 ||
    !Number.isFinite(total) ||
    total < 0
  ) {
    return null;
  }

  const methodLabels: Record<string, string> = {
    qris: "QRIS",
    va: "Virtual Account",
    cash: "Tunai",
    card: "Kartu",
  };

  const storedMethod =
    text(item.methodName) ||
    text(item.paymentMethod) ||
    text(item.method);

  return {
    id,
    roomId: text(item.roomId) || undefined,
    roomUnitId: text(item.roomUnitId) || undefined,
    roomNumber: text(item.roomNumber) || undefined,
    roomName,
    guestName,
    guestEmail: text(item.guestEmail) || "Belum diisi",
    guestPhone: text(item.guestPhone) || "Belum diisi",
    checkIn,
    checkOut,
    guests,
    nights,
    total,
    methodName:
      methodLabels[storedMethod] ||
      storedMethod ||
      "Belum tercatat",
    paidAt: text(item.paidAt),
    status: "paid-demo",
  };
}

export function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function dateLabel(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function useAdminBookings() {
  const raw = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const result = useMemo(() => {
    try {
      if (raw === READ_ERROR) {
        throw new Error("Penyimpanan tidak dapat diakses.");
      }

      const parsed: unknown = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        throw new Error("Format data booking tidak valid.");
      }

      const bookings: Booking[] = [];
      let skipped = 0;

      for (const item of parsed) {
        const booking = normalizeBooking(item);

        if (booking) {
          bookings.push(booking);
        } else {
          skipped += 1;
        }
      }

      return {
        bookings: bookings.reverse(),
        skipped,
        error: "",
      };
    } catch {
      return {
        bookings: [] as Booking[],
        skipped: 0,
        error:
          "Data booking belum dapat dibaca. Data asli tidak dihapus.",
      };
    }
  }, [raw]);

  function refresh() {
    window.dispatchEvent(new Event(UPDATE_EVENT));
  }

  return { ...result, refresh };
}

export async function deleteBooking(id: string) {
  if (!navigator.locks) {
    throw new Error(
      "Gunakan Chrome atau Edge melalui localhost atau HTTPS untuk menghapus booking demo.",
    );
  }

  // Gunakan penguncian yang sama dengan penyimpanan booking baru.
  await navigator.locks.request(
    "sela-stay-booking-write",
    () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];

      if (!Array.isArray(parsed)) {
        throw new Error("Data booking belum dapat dibaca.");
      }

      const target = parsed.find(
        (item: unknown) =>
          typeof item === "object" &&
          item !== null &&
          "id" in item &&
          item.id === id,
      );

      if (!target) {
        throw new Error(
          "Booking sudah tidak ditemukan. Muat ulang daftar booking.",
        );
      }

      const rawStatuses = localStorage.getItem(STATUS_KEY);
      const statuses: unknown = rawStatuses
        ? JSON.parse(rawStatuses)
        : {};

      if (
        typeof statuses !== "object" ||
        statuses === null ||
        Array.isArray(statuses)
      ) {
        throw new Error("Status menginap belum dapat dibaca.");
      }

      const status =
        (statuses as Record<string, unknown>)[id] ?? "confirmed";

      if (status !== "cancelled" && status !== "checked-out") {
        throw new Error(
          "Booking aktif tidak dapat dihapus. Batalkan atau selesaikan check-out terlebih dahulu.",
        );
      }

      // Pertahankan seluruh record lainnya, termasuk data versi lama.
      const remaining = parsed.filter(
        (item: unknown) =>
          !(
            typeof item === "object" &&
            item !== null &&
            "id" in item &&
            item.id === id
          ),
      );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(remaining),
      );

      window.dispatchEvent(new Event(UPDATE_EVENT));
    },
  );
}