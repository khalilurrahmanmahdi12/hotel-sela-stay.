import { DEFAULT_ROOMS } from "@/lib/useRooms";
import { readRoomUnits } from "@/lib/useRoomUnits";

const BOOKING_KEY = "sela-stay-paid-demo-bookings";
const STATUS_KEY = "sela-stay-booking-statuses";
const ROOMS_KEY = "sela-stay-rooms";
const HISTORY_KEY = "sela-stay-room-name-history";

type StoredBooking = {
  id: string;
  roomId?: string;
  roomName: string;
  roomUnitId?: string;
  checkIn: string;
  checkOut: string;
  status: "paid-demo";
};

type PaymentInput = {
  id: string;
  roomId: string;
  roomName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  method: "qris" | "va" | "cash";
  methodName: string;
  pricePerNight: number;
  total: number;
};

function readArray(key: string): unknown[] {
  const raw = localStorage.getItem(key);
  const data: unknown = raw ? JSON.parse(raw) : [];

  if (!Array.isArray(data)) {
    throw new Error("Data penyimpanan belum dapat dibaca.");
  }

  return data;
}

function readObject(key: string): Record<string, unknown> {
  const raw = localStorage.getItem(key);
  const data: unknown = raw ? JSON.parse(raw) : {};

  if (
    typeof data !== "object" ||
    data === null ||
    Array.isArray(data)
  ) {
    throw new Error("Data penyimpanan belum dapat dibaca.");
  }

  return data as Record<string, unknown>;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const timestamp = Date.parse(`${value}T00:00:00Z`);

  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
  );
}

function validateDates(checkIn: string, checkOut: string) {
  if (
    !validDate(checkIn) ||
    !validDate(checkOut) ||
    checkOut <= checkIn
  ) {
    throw new Error("Tanggal menginap tidak valid.");
  }
}

function normalizeBooking(value: unknown): StoredBooking {
  if (typeof value !== "object" || value === null) {
    throw new Error("Ada data booking yang belum bisa diperiksa.");
  }

  const item = value as Record<string, unknown>;

  if (
    typeof item.id !== "string" ||
    typeof item.roomName !== "string" ||
    typeof item.checkIn !== "string" ||
    typeof item.checkOut !== "string" ||
    item.status !== "paid-demo"
  ) {
    throw new Error(
      "Format riwayat pembayaran tidak sesuai. Ketersediaan belum bisa diperiksa.",
    );
  }

  validateDates(item.checkIn, item.checkOut);

  return {
    id: item.id,
    roomName: item.roomName,
    roomId:
      typeof item.roomId === "string" ? item.roomId : undefined,
    roomUnitId:
      typeof item.roomUnitId === "string"
        ? item.roomUnitId
        : undefined,
    checkIn: item.checkIn,
    checkOut: item.checkOut,
    status: "paid-demo",
  };
}

function overlaps(
  checkIn: string,
  checkOut: string,
  existing: StoredBooking,
) {
  return (
    checkIn < existing.checkOut &&
    checkOut > existing.checkIn
  );
}

function currentRoom(roomId: string) {
  const raw = localStorage.getItem(ROOMS_KEY);
  const parsed: unknown = raw ? JSON.parse(raw) : DEFAULT_ROOMS;

  if (!Array.isArray(parsed)) {
    throw new Error("Data tipe kamar tidak dapat dibaca.");
  }

  const found: unknown = parsed.find(
    (item: unknown) =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      item.id === roomId,
  );

  if (typeof found !== "object" || found === null) {
    throw new Error("Tipe kamar tidak ditemukan.");
  }

  const room = found as Record<string, unknown>;

  if (
    typeof room.name !== "string" ||
    typeof room.price !== "number" ||
    !Number.isSafeInteger(room.price) ||
    room.price <= 0 ||
    typeof room.capacity !== "number" ||
    !Number.isInteger(room.capacity) ||
    typeof room.active !== "boolean"
  ) {
    throw new Error("Informasi tipe kamar tidak valid.");
  }

  return {
    id: roomId,
    name: room.name,
    price: room.price,
    capacity: room.capacity,
    active: room.active,
  };
}

export function getAvailableRoomUnits(
  roomId: string,
  checkIn: string,
  checkOut: string,
) {
  validateDates(checkIn, checkOut);

  const room = currentRoom(roomId);

  if (!room.active) return [];

  const units = readRoomUnits().filter(
    (unit) =>
      unit.roomTypeId === roomId &&
      unit.status === "active",
  );

  const bookings = readArray(BOOKING_KEY).map(normalizeBooking);
  const statuses = readObject(STATUS_KEY);
  const history = readObject(HISTORY_KEY);

  const oldNames = history[roomId];

  if (
    oldNames !== undefined &&
    (!Array.isArray(oldNames) ||
      !oldNames.every((name: unknown) => typeof name === "string"))
  ) {
    throw new Error("Riwayat nama kamar tidak valid.");
  }

  const original = DEFAULT_ROOMS.find(
    (item) => item.id === roomId,
  );

  const names = new Set(
    [
      room.name,
      original?.name ?? "",
      ...((oldNames as string[] | undefined) ?? []),
    ]
      .filter(Boolean)
      .map((name) => name.trim().toLowerCase()),
  );

  const blockedUnitIds = new Set<string>();
  let legacyBookings = 0;

  for (const booking of bookings) {
    const stayStatus = statuses[booking.id];

    if (
      stayStatus !== undefined &&
      !["confirmed", "checked-in", "checked-out", "cancelled"].includes(
        String(stayStatus),
      )
    ) {
      throw new Error("Status booking belum dapat diperiksa.");
    }

    if (stayStatus === "cancelled") continue;
    if (!overlaps(checkIn, checkOut, booking)) continue;

    if (booking.roomUnitId) {
      blockedUnitIds.add(booking.roomUnitId);
      continue;
    }

    const sameType = booking.roomId
      ? booking.roomId === roomId
      : names.has(booking.roomName.trim().toLowerCase());

    if (sameType) legacyBookings += 1;
  }

  const available = units
    .filter((unit) => !blockedUnitIds.has(unit.id))
    .sort((a, b) =>
      a.number.localeCompare(b.number, "id", { numeric: true }),
    );

  // Booking lama belum memiliki nomor. Sisihkan kapasitas secara
  // konservatif agar tidak menjual kamar yang mungkin sudah terpakai.
  return available.slice(legacyBookings);
}

export async function savePaidBooking(payment: PaymentInput) {
  if (!navigator.locks) {
    throw new Error(
      "Browser ini belum mendukung penguncian booking demo. Coba Chrome atau Edge melalui localhost atau HTTPS.",
    );
  }

  return navigator.locks.request(
    "sela-stay-booking-write",
    () => {
      validateDates(payment.checkIn, payment.checkOut);

      const now = new Date();
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");

      if (payment.checkIn < today) {
        throw new Error("Tanggal check-in sudah lewat. Cari ulang tanggal.");
      }

      const previous = readArray(BOOKING_KEY);

      if (
        previous.some(
          (item: unknown) =>
            typeof item === "object" &&
            item !== null &&
            "id" in item &&
            item.id === payment.id,
        )
      ) {
        throw new Error("Booking ini sudah tersimpan.");
      }

      const room = currentRoom(payment.roomId);

      if (!room.active || room.capacity < payment.guests) {
        throw new Error(
          "Kamar tidak lagi sesuai. Kembali dan pilih kamar lain.",
        );
      }

      if (
        room.price !== payment.pricePerNight ||
        room.name !== payment.roomName
      ) {
        throw new Error(
          "Informasi kamar berubah. Kembali untuk memeriksa ringkasan terbaru.",
        );
      }

      const nights =
        (Date.parse(`${payment.checkOut}T00:00:00Z`) -
          Date.parse(`${payment.checkIn}T00:00:00Z`)) /
        86400000;

      if (
        nights !== payment.nights ||
        payment.total !== room.price * nights
      ) {
        throw new Error("Rincian biaya berubah. Ulangi pemesanan.");
      }

      const unit = getAvailableRoomUnits(
        payment.roomId,
        payment.checkIn,
        payment.checkOut,
      )[0];

      if (!unit) {
        throw new Error(
          "Kamar pada tanggal tersebut sudah habis. Tidak ada pembayaran sungguhan. Kembali dan cari tanggal lain.",
        );
      }

      const receipt = {
        ...payment,
        roomUnitId: unit.id,
        roomNumber: unit.number,
        status: "paid-demo" as const,
        paidAt: new Date().toISOString(),
      };

      localStorage.setItem(
        BOOKING_KEY,
        JSON.stringify([...previous, receipt]),
      );

      window.dispatchEvent(new Event("sela-bookings-updated"));

      return receipt;
    },
  );
}