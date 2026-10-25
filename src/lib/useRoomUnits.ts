"use client";

import { useMemo, useSyncExternalStore } from "react";

export type RoomUnitStatus = "active" | "maintenance" | "inactive";

export type RoomUnit = {
  id: string;
  number: string;
  roomTypeId: string;
  status: RoomUnitStatus;
};

export const unitStatusLabels: Record<RoomUnitStatus, string> = {
  active: "Aktif",
  maintenance: "Perawatan",
  inactive: "Nonaktif",
};

const DEFAULT_UNITS: RoomUnit[] = [
  {
    id: "unit-101",
    number: "101",
    roomTypeId: "garden-deluxe",
    status: "active",
  },
  {
    id: "unit-102",
    number: "102",
    roomTypeId: "garden-deluxe",
    status: "active",
  },
  {
    id: "unit-103",
    number: "103",
    roomTypeId: "garden-deluxe",
    status: "active",
  },
  {
    id: "unit-201",
    number: "201",
    roomTypeId: "poolside-suite",
    status: "active",
  },
  {
    id: "unit-202",
    number: "202",
    roomTypeId: "poolside-suite",
    status: "active",
  },
  {
    id: "unit-301",
    number: "301",
    roomTypeId: "family-retreat",
    status: "active",
  },
  {
    id: "unit-302",
    number: "302",
    roomTypeId: "family-retreat",
    status: "active",
  },
];

const STORAGE_KEY = "sela-stay-room-units";
const UPDATE_EVENT = "sela-room-units-updated";
const DEFAULT_SNAPSHOT = JSON.stringify(DEFAULT_UNITS);
const READ_ERROR = "__READ_ERROR__";

export function isRoomUnitStatus(
  value: unknown,
): value is RoomUnitStatus {
  return (
    value === "active" ||
    value === "maintenance" ||
    value === "inactive"
  );
}

function isRoomUnit(value: unknown): value is RoomUnit {
  if (typeof value !== "object" || value === null) return false;

  const unit = value as Record<string, unknown>;

  return (
    typeof unit.id === "string" &&
    unit.id.trim().length > 0 &&
    typeof unit.number === "string" &&
    /^[A-Za-z0-9-]{1,12}$/.test(unit.number) &&
    typeof unit.roomTypeId === "string" &&
    unit.roomTypeId.trim().length > 0 &&
    isRoomUnitStatus(unit.status)
  );
}

function parseUnits(raw: string): RoomUnit[] {
  const data: unknown = JSON.parse(raw);

  if (!Array.isArray(data) || !data.every(isRoomUnit)) {
    throw new Error("Format nomor kamar tidak valid.");
  }

  const ids = new Set(data.map((unit) => unit.id));
  const numbers = new Set(
    data.map((unit) => unit.number.toUpperCase()),
  );

  if (ids.size !== data.length || numbers.size !== data.length) {
    throw new Error("Ada ID atau nomor kamar duplikat.");
  }

  return data;
}

export function readRoomUnits(): RoomUnit[] {
  return parseUnits(
    localStorage.getItem(STORAGE_KEY) ?? DEFAULT_SNAPSHOT,
  );
}

function writeUnits(units: RoomUnit[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// Booking lama belum memiliki nomor kamar.
// Pemeriksaan ini melindungi booking yang sudah memiliki roomUnitId.
function hasBookingHistory(unitId: string): boolean {
  for (const key of [
    "sela-stay-bookings",
    "sela-stay-paid-demo-bookings",
  ]) {
    const raw = localStorage.getItem(key);
    const bookings: unknown = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(bookings)) {
      throw new Error(
        "Riwayat booking belum dapat diperiksa. Perubahan dibatalkan.",
      );
    }

    for (const item of bookings) {
      if (typeof item !== "object" || item === null) {
        throw new Error("Ada data booking yang tidak valid.");
      }

      if (
        "roomUnitId" in item &&
        item.roomUnitId === unitId
      ) {
        return true;
      }
    }
  }

  return false;
}

function validateUnit(
  candidate: RoomUnit,
  units: RoomUnit[],
  roomTypeIds: string[],
) {
  if (!isRoomUnit(candidate)) {
    throw new Error(
      "Nomor kamar wajib berisi 1–12 karakter: huruf, angka, atau tanda hubung.",
    );
  }

  if (!roomTypeIds.includes(candidate.roomTypeId)) {
    throw new Error("Tipe kamar tidak ditemukan.");
  }

  const duplicate = units.some(
    (unit) =>
      unit.id !== candidate.id &&
      unit.number.toUpperCase() === candidate.number.toUpperCase(),
  );

  if (duplicate) {
    throw new Error("Nomor kamar sudah digunakan.");
  }
}

export function addRoomUnit(
  data: Omit<RoomUnit, "id">,
  roomTypeIds: string[],
) {
  const units = readRoomUnits();

  const candidate: RoomUnit = {
    ...data,
    id: `unit-${crypto.randomUUID()}`,
    number: data.number.trim().toUpperCase(),
  };

  validateUnit(candidate, units, roomTypeIds);
  writeUnits([...units, candidate]);
}

export function saveRoomUnit(
  data: RoomUnit,
  roomTypeIds: string[],
) {
  const units = readRoomUnits();
  const previous = units.find((unit) => unit.id === data.id);

  if (!previous) {
    throw new Error("Nomor kamar tidak ditemukan.");
  }

  const candidate = {
    ...data,
    number: data.number.trim().toUpperCase(),
  };

  validateUnit(candidate, units, roomTypeIds);

  const identityChanged =
    previous.number !== candidate.number ||
    previous.roomTypeId !== candidate.roomTypeId;

  if (identityChanged && hasBookingHistory(data.id)) {
    throw new Error(
      "Kamar sudah memiliki riwayat booking. Nomor dan tipe tidak dapat diganti; statusnya tetap bisa diubah.",
    );
  }

  writeUnits(
    units.map((unit) =>
      unit.id === candidate.id ? candidate : unit,
    ),
  );
}

export function deleteRoomUnit(id: string) {
  const units = readRoomUnits();

  if (!units.some((unit) => unit.id === id)) {
    throw new Error("Nomor kamar tidak ditemukan.");
  }

  if (hasBookingHistory(id)) {
    throw new Error(
      "Kamar sudah memiliki riwayat booking. Gunakan status Nonaktif.",
    );
  }

  writeUnits(units.filter((unit) => unit.id !== id));
}

function subscribe(callback: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) {
      callback();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener("focus", callback);
  window.addEventListener(UPDATE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("focus", callback);
    window.removeEventListener(UPDATE_EVENT, callback);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_SNAPSHOT;
  } catch {
    return READ_ERROR;
  }
}

function getServerSnapshot() {
  return DEFAULT_SNAPSHOT;
}

export function useRoomUnits() {
  const raw = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return useMemo(() => {
    try {
      if (raw === READ_ERROR) {
        throw new Error("Penyimpanan tidak dapat diakses.");
      }

      return {
        units: parseUnits(raw),
        error: "",
      };
    } catch {
      return {
        units: [] as RoomUnit[],
        error:
          "Data nomor kamar belum dapat dibaca. Data asli tidak dihapus.",
      };
    }
  }, [raw]);
}