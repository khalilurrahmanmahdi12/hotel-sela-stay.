"use client";

import { useRef, useState, type SubmitEvent } from "react";
import { useRooms } from "@/lib/useRooms";
import {
  addRoomUnit,
  deleteRoomUnit,
  isRoomUnitStatus,
  saveRoomUnit,
  unitStatusLabels,
  useRoomUnits,
  type RoomUnit,
  type RoomUnitStatus,
} from "@/lib/useRoomUnits";

const inputClass =
  "w-full min-w-0 rounded-xl border border-[#173e35]/20 bg-[#f8f5ef] p-3 text-sm outline-none focus:ring-2 focus:ring-[#97733e]";

const badgeClasses: Record<RoomUnitStatus, string> = {
  active: "bg-[#e8efe6] text-[#173e35]",
  maintenance: "bg-amber-50 text-amber-800",
  inactive: "bg-slate-100 text-slate-600",
};

export default function RoomUnitsPage() {
  const { rooms, error: roomsError } = useRooms();
  const { units, error: unitsError } = useRoomUnits();

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [draft, setDraft] = useState<RoomUnit>({
    id: "",
    number: "",
    roomTypeId: "",
    status: "active",
  });

  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<RoomUnit | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLElement>(null);

  const error = roomsError || unitsError;

  function typeName(id: string) {
    return (
      rooms.find((room) => room.id === id)?.name ??
      "Tipe tidak ditemukan"
    );
  }

  function scrollToForm() {
    window.requestAnimationFrame(() => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      formRef.current?.scrollIntoView({
        behavior: reducedMotion ? "instant" : "smooth",
        block: "start",
      });
    });
  }

  function startCreate() {
    setMode("create");
    setDraft({
      id: "",
      number: "",
      roomTypeId: rooms[0]?.id ?? "",
      status: "active",
    });
    setMessage("");
    setSaveError("");
    scrollToForm();
  }

  function startEdit(unit: RoomUnit) {
    setMode("edit");
    setDraft({ ...unit });
    setMessage("");
    setSaveError("");
    scrollToForm();
  }

  function handleSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError("");
    setMessage("");

    if (!mode) return;

    if (error) {
      setSaveError("Data belum dapat dibaca. Coba kembali nanti.");
      return;
    }

    try {
      const roomTypeIds = rooms.map((room) => room.id);

      if (mode === "create") {
        addRoomUnit(
          {
            number: draft.number,
            roomTypeId: draft.roomTypeId,
            status: draft.status,
          },
          roomTypeIds,
        );
      } else {
        saveRoomUnit(draft, roomTypeIds);
      }

      setMessage(
        `Nomor kamar ${draft.number.trim().toUpperCase()} berhasil ${
          mode === "create" ? "ditambahkan" : "diperbarui"
        }.`,
      );
      setMode(null);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Nomor kamar belum tersimpan.",
      );
    }
  }

  function openDelete(unit: RoomUnit) {
    setDeleteTarget(unit);
    setDeleteError("");
    deleteDialogRef.current?.showModal();
  }

  function closeDelete() {
    deleteDialogRef.current?.close();
    setDeleteTarget(null);
    setDeleteError("");
  }

  function confirmDelete() {
    if (!deleteTarget) return;

    try {
      deleteRoomUnit(deleteTarget.id);

      if (mode === "edit" && draft.id === deleteTarget.id) {
        setMode(null);
      }

      setMessage(`Nomor kamar ${deleteTarget.number} berhasil dihapus.`);
      closeDelete();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Nomor kamar belum dapat dihapus.",
      );
    }
  }

  const filteredUnits = units
    .filter((unit) =>
      `${unit.number} ${typeName(unit.roomTypeId)} ${unitStatusLabels[unit.status]}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) =>
      a.number.localeCompare(b.number, "id", { numeric: true }),
    );

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#97733e]">
            MANAJEMEN KAMAR FISIK
          </p>
          <h1 className="mt-3 font-serif text-4xl">Nomor Kamar</h1>
          <p className="mt-3 text-sm leading-7 text-[#63716a]">
            Hubungkan nomor kamar dengan tipe dan status operasionalnya.
          </p>
        </div>

        <button
          type="button"
          disabled={Boolean(error) || rooms.length === 0}
          onClick={startCreate}
          className="min-h-11 w-fit rounded-xl bg-[#173e35] px-5 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Tambah nomor kamar
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {!error && rooms.length === 0 && (
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Buat tipe kamar terlebih dahulu sebelum menambahkan nomor kamar.
        </p>
      )}

      {message && (
        <p role="status" className="mt-6 rounded-xl bg-[#e8efe6] p-4 text-sm">
          {message}
        </p>
      )}

      <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Total kamar", units.length],
          ["Aktif", units.filter((unit) => unit.status === "active").length],
          ["Perawatan", units.filter((unit) => unit.status === "maintenance").length],
          ["Nonaktif", units.filter((unit) => unit.status === "inactive").length],
        ].map(([label, value]) => (
          <article
            key={String(label)}
            className="rounded-2xl border border-[#173e35]/10 bg-white p-5"
          >
            <p className="text-xs text-[#63716a]">{label}</p>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
          </article>
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-[#173e35]/10 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-[#173e35]/10 p-5 sm:flex-row sm:items-center">
          <h2 className="font-serif text-2xl">Daftar Nomor Kamar</h2>

          <div className="w-full sm:max-w-xs">
            <label htmlFor="unit-search" className="sr-only">
              Cari nomor, tipe, atau status kamar
            </label>
            <input
              id="unit-search"
              type="search"
              placeholder="Cari nomor, tipe, atau status..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {!error && filteredUnits.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#63716a]">
            Tidak ada nomor kamar yang cocok.
          </p>
        ) : !error ? (
          <div
            role="region"
            aria-label="Tabel nomor kamar"
            tabIndex={0}
            className="overflow-x-auto"
          >
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-[#f8f5ef] text-xs text-[#63716a]">
                <tr>
                  {["Nomor", "Tipe kamar", "Status operasional", "Aksi"].map((label) => (
                    <th key={label} scope="col" className="px-5 py-4">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#173e35]/10">
                {filteredUnits.map((unit) => (
                  <tr key={unit.id}>
                    <td className="px-5 py-5 text-lg font-semibold">
                      {unit.number}
                    </td>

                    <td className="px-5 py-5">
                      {typeName(unit.roomTypeId)}
                    </td>

                    <td className="px-5 py-5">
                      <span
                        className={`rounded-full px-3 py-2 text-xs font-semibold ${badgeClasses[unit.status]}`}
                      >
                        {unitStatusLabels[unit.status]}
                      </span>
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(unit)}
                          className="min-h-11 rounded-xl border border-[#173e35]/20 px-4 py-2 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDelete(unit)}
                          className="min-h-11 rounded-xl border border-red-200 px-4 py-2 text-xs text-red-700"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {mode && (
        <section
          ref={formRef}
          className="mt-8 scroll-mt-6 rounded-2xl border border-[#173e35]/15 bg-white p-5 md:p-7"
          aria-labelledby="unit-form-title"
        >
          <h2 id="unit-form-title" className="font-serif text-3xl">
            {mode === "create" ? "Tambah Nomor Kamar" : "Edit Nomor Kamar"}
          </h2>

          <form onSubmit={handleSave} className="mt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label htmlFor="unit-number" className="mb-2 block text-sm font-medium">
                  Nomor kamar
                </label>
                <input
                  id="unit-number"
                  required
                  maxLength={12}
                  pattern="[A-Za-z0-9-]{1,12}"
                  title="Gunakan huruf, angka, atau tanda hubung."
                  placeholder="Contoh: 101 atau A-101"
                  value={draft.number}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      number: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="unit-type" className="mb-2 block text-sm font-medium">
                  Tipe kamar
                </label>
                <select
                  id="unit-type"
                  required
                  value={draft.roomTypeId}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      roomTypeId: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">Pilih tipe kamar</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}{room.active ? "" : " — tipe nonaktif"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="unit-status" className="mb-2 block text-sm font-medium">
                  Status operasional
                </label>
                <select
                  id="unit-status"
                  value={draft.status}
                  onChange={(event) => {
                    const status = event.target.value;

                    if (isRoomUnitStatus(status)) {
                      setDraft((previous) => ({
                        ...previous,
                        status,
                      }));
                    }
                  }}
                  className={inputClass}
                >
                  {Object.entries(unitStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-xs leading-6 text-[#63716a]">
              Aktif berarti kamar dapat digunakan untuk pemesanan.
              Status ini berbeda dengan status menginap tamu.
            </p>

            {saveError && (
              <p role="alert" className="text-sm text-red-700">
                {saveError}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="min-h-11 rounded-xl bg-[#173e35] px-6 py-3 text-sm text-white"
              >
                Simpan
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode(null);
                  setSaveError("");
                }}
                className="min-h-11 rounded-xl border border-[#173e35]/20 px-6 py-3 text-sm"
              >
                Batal
              </button>
            </div>
          </form>
        </section>
      )}

      <dialog
        ref={deleteDialogRef}
        aria-labelledby="delete-unit-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDelete();
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border-0 bg-white p-0 text-[#173e35] shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <h2 id="delete-unit-title" className="font-serif text-3xl">
            Hapus nomor kamar?
          </h2>

          <p className="mt-4 text-sm leading-7 text-[#63716a]">
            Nomor <strong>{deleteTarget?.number}</strong> akan dihapus.
            Jika sudah memiliki riwayat booking bernomor kamar,
            gunakan status Nonaktif.
          </p>

          {deleteError && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {deleteError}
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={closeDelete}
              className="min-h-11 rounded-xl border border-[#173e35]/20 px-4 py-3 text-sm"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="min-h-11 rounded-xl bg-red-700 px-4 py-3 text-sm text-white"
            >
              Ya, hapus
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}