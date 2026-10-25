"use client";

import { useMemo, useSyncExternalStore } from "react";
import { readRoomUnits } from "@/lib/useRoomUnits";

export type Room = {
  id: string;
  name: string;
  capacity: number;
  price: number;
  description: string;
  size: number;
  bed: string;
  view: string;
  facilities: string[];
  active: boolean;
};

export const DEFAULT_ROOMS: Room[] = [
  {
    id: "garden-deluxe",
    name: "Garden Deluxe",
    capacity: 2,
    price: 850000,
    description:
      "Kamar bernuansa hangat dengan area duduk dan pemandangan taman.",
    size: 32,
    bed: "1 King Bed",
    view: "Pemandangan taman",
    facilities: [
      "AC",
      "Wi-Fi",
      "Smart TV",
      "Kamar mandi pribadi",
      "Shower air hangat",
      "Meja kerja",
      "Ketel listrik",
      "Air mineral",
    ],
    active: true,
  },
  {
    id: "poolside-suite",
    name: "Poolside Suite",
    capacity: 2,
    price: 1250000,
    description:
      "Suite lapang dengan area bersantai dan teras pribadi dekat kolam.",
    size: 48,
    bed: "1 King Bed",
    view: "Pemandangan kolam",
    facilities: [
      "AC",
      "Wi-Fi",
      "Smart TV",
      "Kamar mandi pribadi",
      "Bathtub",
      "Area duduk",
      "Teras pribadi",
      "Mini refrigerator",
      "Ketel listrik",
      "Air mineral",
    ],
    active: true,
  },
  {
    id: "family-retreat",
    name: "Family Retreat",
    capacity: 4,
    price: 1750000,
    description:
      "Kamar keluarga dengan dua tempat tidur besar dan area berkumpul.",
    size: 64,
    bed: "2 Queen Beds",
    view: "Pemandangan taman",
    facilities: [
      "AC",
      "Wi-Fi",
      "Smart TV",
      "Kamar mandi pribadi",
      "Shower air hangat",
      "Area duduk keluarga",
      "Meja makan kecil",
      "Mini refrigerator",
      "Ketel listrik",
      "Air mineral",
    ],
    active: true,
  },
];

const STORAGE_KEY = "sela-stay-rooms";
const UPDATE_EVENT = "sela-rooms-updated";
const DEFAULT_SNAPSHOT = JSON.stringify(DEFAULT_ROOMS);
const READ_ERROR = "__READ_ERROR__";

// Menyimpan nama sebelumnya untuk mengenali booking versi lama
// yang belum memiliki roomId.
const HISTORY_KEY = "sela-stay-room-name-history";

function isRoom(value: unknown): value is Room {
  if (typeof value !== "object" || value === null) return false;

  const room = value as Record<string, unknown>;

  return (
    ["id", "name", "description", "bed", "view"].every(
      (field) =>
        typeof room[field] === "string" &&
        room[field].trim().length > 0,
    ) &&
    typeof room.capacity === "number" &&
    Number.isInteger(room.capacity) &&
    room.capacity >= 1 &&
    room.capacity <= 10 &&
    typeof room.price === "number" &&
    Number.isSafeInteger(room.price) &&
    room.price >= 1 &&
    room.price <= 1000000000 &&
    typeof room.size === "number" &&
    Number.isFinite(room.size) &&
    room.size > 0 &&
    typeof room.active === "boolean" &&
    Array.isArray(room.facilities) &&
    room.facilities.length > 0 &&
    room.facilities.every(
      (facility: unknown) =>
        typeof facility === "string" &&
        facility.trim().length > 0,
    )
  );
}

function parseRooms(raw: string): Room[] {
  const data: unknown = JSON.parse(raw);

  if (!Array.isArray(data) || !data.every(isRoom)) {
    throw new Error("Format data tipe kamar tidak valid.");
  }

  if (new Set(data.map((room) => room.id)).size !== data.length) {
    throw new Error("ID tipe kamar duplikat.");
  }

  return data;
}

function readRooms() {
  return parseRooms(
    localStorage.getItem(STORAGE_KEY) ?? DEFAULT_SNAPSHOT,
  );
}

function writeRooms(rooms: Room[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function readNameHistory(): Record<string, string[]> {
  const raw = localStorage.getItem(HISTORY_KEY);
  const data: unknown = raw ? JSON.parse(raw) : {};

  if (
    typeof data !== "object" ||
    data === null ||
    Array.isArray(data)
  ) {
    throw new Error("Riwayat nama tipe kamar tidak dapat dibaca.");
  }

  const result: Record<string, string[]> = {};

  for (const [id, names] of Object.entries(data)) {
    if (
      !Array.isArray(names) ||
      !names.every((name: unknown) => typeof name === "string")
    ) {
      throw new Error("Riwayat nama tipe kamar tidak valid.");
    }

    result[id] = names;
  }

  return result;
}

function validateName(rooms: Room[], candidate: Room) {
  const duplicate = rooms.some(
    (room) =>
      room.id !== candidate.id &&
      room.name.trim().toLowerCase() ===
        candidate.name.trim().toLowerCase(),
  );

  if (duplicate) {
    throw new Error("Nama tipe kamar sudah digunakan.");
  }
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

export function useRooms() {
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
        rooms: parseRooms(raw),
        error: "",
      };
    } catch {
      return {
        rooms: [] as Room[],
        error:
          "Data tipe kamar belum dapat dibaca. Data asli tidak dihapus.",
      };
    }
  }, [raw]);
}

export function addRoom(data: Omit<Room, "id">): Room {
  const rooms = readRooms();

  const newRoom: Room = {
    ...data,
    id: `room-${crypto.randomUUID()}`,
  };

  if (!isRoom(newRoom)) {
    throw new Error("Lengkapi data tipe kamar dengan benar.");
  }

  validateName(rooms, newRoom);
  writeRooms([...rooms, newRoom]);

  return newRoom;
}

export function saveRoom(updatedRoom: Room) {
  if (!isRoom(updatedRoom)) {
    throw new Error("Lengkapi data tipe kamar dengan benar.");
  }

  const rooms = readRooms();
  const previous = rooms.find((room) => room.id === updatedRoom.id);

  if (!previous) {
    throw new Error("Tipe kamar tidak ditemukan.");
  }

  validateName(rooms, updatedRoom);

  if (previous.name !== updatedRoom.name) {
    const history = readNameHistory();

    history[previous.id] = [
      ...new Set([
        ...(history[previous.id] ?? []),
        previous.name,
        updatedRoom.name,
      ]),
    ];

    // Simpan riwayat sebelum mengganti nama.
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  writeRooms(
    rooms.map((room) =>
      room.id === updatedRoom.id ? updatedRoom : room,
    ),
  );
}

export function deleteRoom(id: string) {
  const rooms = readRooms();
  const room = rooms.find((item) => item.id === id);

  if (!room) {
    throw new Error("Tipe kamar tidak ditemukan.");
  }
  const units = readRoomUnits();

if (units.some((unit) => unit.roomTypeId === id)) {
  throw new Error(
    "Tipe ini masih memiliki nomor kamar. Hapus atau pindahkan nomor kamar terlebih dahulu.",
  );
}

  const history = readNameHistory();
  const original = DEFAULT_ROOMS.find((item) => item.id === id);

  const knownNames = new Set(
    [
      room.name,
      original?.name ?? "",
      ...(history[id] ?? []),
    ]
      .filter(Boolean)
      .map((name) => name.trim().toLowerCase()),
  );

  // Periksa booking lama dan pembayaran demo terbaru.
  const bookingKeys = [
    "sela-stay-bookings",
    "sela-stay-paid-demo-bookings",
  ];

  for (const key of bookingKeys) {
    const raw = localStorage.getItem(key);
    const bookings: unknown = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(bookings)) {
      throw new Error(
        "Riwayat booking belum dapat diperiksa. Tipe kamar tidak dihapus.",
      );
    }

    for (const value of bookings) {
      if (typeof value !== "object" || value === null) {
        throw new Error(
          "Ada data booking tidak valid. Tipe kamar tidak dihapus.",
        );
      }

      const booking = value as Record<string, unknown>;

      const hasRoomId =
        typeof booking.roomId === "string" &&
        booking.roomId.length > 0;

      const hasRoomName =
        typeof booking.roomName === "string" &&
        booking.roomName.trim().length > 0;

      if (!hasRoomId && !hasRoomName) {
        throw new Error(
          "Ada booking yang tipe kamarnya tidak dapat dikenali. Gunakan nonaktifkan.",
        );
      }

      const matches = hasRoomId
        ? booking.roomId === id
        : typeof booking.roomName === "string" &&
          knownNames.has(booking.roomName.trim().toLowerCase());

      if (matches) {
        throw new Error(
          "Tipe kamar sudah memiliki riwayat booking. Nonaktifkan tipe kamar melalui menu Edit.",
        );
      }
    }
  }

  writeRooms(rooms.filter((item) => item.id !== id));
}