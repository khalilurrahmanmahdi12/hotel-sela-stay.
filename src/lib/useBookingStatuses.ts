"use client";

import { useMemo, useSyncExternalStore } from "react";

export type StayStatus =
  | "confirmed"
  | "checked-in"
  | "checked-out"
  | "cancelled";

export const statusLabels: Record<StayStatus, string> = {
  confirmed: "Dikonfirmasi",
  "checked-in": "Check-in",
  "checked-out": "Check-out",
  cancelled: "Dibatalkan",
};

const STORAGE_KEY = "sela-stay-booking-statuses";
const UPDATE_EVENT = "sela-statuses-updated";
const READ_ERROR = "__READ_ERROR__";

function isStayStatus(value: unknown): value is StayStatus {
  return (
    value === "confirmed" ||
    value === "checked-in" ||
    value === "checked-out" ||
    value === "cancelled"
  );
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
    return localStorage.getItem(STORAGE_KEY) ?? "{}";
  } catch {
    return READ_ERROR;
  }
}

function getServerSnapshot() {
  return "{}";
}

export function useBookingStatuses() {
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

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error("Format status tidak valid.");
      }

      const statuses: Record<string, StayStatus> = {};

      for (const [id, value] of Object.entries(parsed)) {
        if (!isStayStatus(value)) {
          throw new Error("Status tidak valid.");
        }

        statuses[id] = value;
      }

      return { statuses, error: "" };
    } catch {
      return {
        statuses: {} as Record<string, StayStatus>,
        error:
          "Status menginap belum dapat dibaca. Data asli tidak dihapus.",
      };
    }
  }, [raw]);

  function refresh() {
    window.dispatchEvent(new Event(UPDATE_EVENT));
  }

  return { ...result, refresh };
}