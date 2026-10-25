"use client";

import { useRef, useState, type SubmitEvent } from "react";
import { rupiah } from "@/lib/useAdminBookings";
import {
  addRoom,
  deleteRoom,
  saveRoom,
  useRooms,
  type Room,
} from "@/lib/useRooms";

type Draft = {
  id: string;
  name: string;
  price: string;
  capacity: string;
  size: string;
  bed: string;
  view: string;
  description: string;
  facilities: string;
  active: boolean;
};

const inputClass =
  "w-full min-w-0 rounded-xl border border-[#173e35]/20 bg-[#f8f5ef] p-3 text-sm outline-none focus:ring-2 focus:ring-[#97733e]";

function makeDraft(room?: Room): Draft {
  return {
    id: room?.id ?? "",
    name: room?.name ?? "",
    price: room ? String(room.price) : "",
    capacity: room ? String(room.capacity) : "2",
    size: room ? String(room.size) : "",
    bed: room?.bed ?? "",
    view: room?.view ?? "",
    description: room?.description ?? "",
    facilities: room?.facilities.join("\n") ?? "",
    active: room?.active ?? true,
  };
}

export default function AdminRoomsPage() {
  const { rooms, error } = useRooms();

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [draft, setDraft] = useState<Draft>(makeDraft());

  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLElement>(null);

  function showForm() {
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
    setDraft(makeDraft());
    setSaveError("");
    setMessage("");
    showForm();
  }

  function startEdit(room: Room) {
    setMode("edit");
    setDraft(makeDraft(room));
    setSaveError("");
    setMessage("");
    showForm();
  }

  function updateDraft<K extends keyof Draft>(
    key: K,
    value: Draft[K],
  ) {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSaveError("");
  }

  function cancelForm() {
    setMode(null);
    setDraft(makeDraft());
    setSaveError("");
  }

  function handleSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError("");
    setMessage("");

    if (!mode) return;

    const price = Number(draft.price);
    const capacity = Number(draft.capacity);
    const size = Number(draft.size);

    if (
      !draft.price.trim() ||
      !Number.isSafeInteger(price) ||
      price < 1 ||
      price > 1000000000
    ) {
      setSaveError("Harga harus Rp 1–Rp 1.000.000.000 dalam angka bulat.");
      return;
    }

    if (
      !draft.capacity.trim() ||
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      capacity > 10
    ) {
      setSaveError("Kapasitas harus 1–10 tamu.");
      return;
    }

    if (!draft.size.trim() || !Number.isFinite(size) || size <= 0) {
      setSaveError("Luas kamar harus lebih dari 0.");
      return;
    }

    const facilities = [
      ...new Set(
        draft.facilities
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ];

    const data: Omit<Room, "id"> = {
      name: draft.name.trim(),
      price,
      capacity,
      size,
      bed: draft.bed.trim(),
      view: draft.view.trim(),
      description: draft.description.trim(),
      facilities,
      active: draft.active,
    };

    try {
      if (mode === "create") {
        addRoom(data);
        setMessage(`Tipe kamar ${data.name} berhasil ditambahkan.`);
      } else {
        saveRoom({ ...data, id: draft.id });
        setMessage(`Perubahan ${data.name} berhasil disimpan.`);
      }

      setMode(null);
      setDraft(makeDraft());
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Data belum berhasil disimpan.",
      );
    }
  }

  function openDelete(room: Room) {
    setDeleteTarget(room);
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
      deleteRoom(deleteTarget.id);

      if (mode === "edit" && draft.id === deleteTarget.id) {
        cancelForm();
      }

      setMessage(`Tipe kamar ${deleteTarget.name} berhasil dihapus.`);
      closeDelete();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Tipe kamar belum dapat dihapus.",
      );
    }
  }

  const filteredRooms = rooms.filter((room) =>
    `${room.name} ${room.bed} ${room.view}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  const activeCount = rooms.filter((room) => room.active).length;

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#97733e]">
            MANAJEMEN AKOMODASI
          </p>

          <h1 className="mt-3 font-serif text-4xl">
            Tipe Kamar
          </h1>

          <p className="mt-3 text-sm leading-7 text-[#63716a]">
            Kelola kategori, harga, kapasitas, dan fasilitas kamar.
          </p>
        </div>

        <button
          type="button"
          onClick={startCreate}
          disabled={Boolean(error)}
          className="min-h-11 w-fit rounded-xl bg-[#173e35] px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
        >
          + Tambah tipe kamar
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mt-6 rounded-xl bg-[#e8efe6] p-4 text-sm">
          {message}
        </p>
      )}

      <div className="mt-7 flex flex-col justify-between gap-4 rounded-2xl border border-[#173e35]/10 bg-white p-5 md:flex-row md:items-center">
        <p aria-live="polite" className="text-sm text-[#63716a]">
          {rooms.length} tipe · {activeCount} aktif ·{" "}
          {rooms.length - activeCount} nonaktif
        </p>

        <div className="w-full md:max-w-xs">
          <label htmlFor="room-search" className="sr-only">
            Cari tipe kamar
          </label>

          <input
            id="room-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari tipe kamar..."
            className={inputClass}
          />
        </div>
      </div>

      {!error && filteredRooms.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-[#173e35]/20 p-8 text-center">
          <p className="font-serif text-2xl">
            {rooms.length === 0
              ? "Belum ada tipe kamar."
              : "Tipe kamar tidak ditemukan."}
          </p>

          <p className="mt-3 text-sm text-[#63716a]">
            {rooms.length === 0
              ? "Tambahkan tipe kamar pertama untuk memulai."
              : "Coba kata pencarian lain."}
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredRooms.map((room) => (
          <article
            key={room.id}
            className={`flex min-w-0 flex-col rounded-2xl border bg-white p-5 ${
              mode === "edit" && draft.id === room.id
                ? "border-[#173e35]"
                : "border-[#173e35]/10"
            }`}
          >
            <span
              className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
                room.active
                  ? "bg-[#e8efe6] text-[#173e35]"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {room.active ? "Aktif" : "Nonaktif"}
            </span>

            <h2 className="mt-4 font-serif text-2xl">
              {room.name}
            </h2>

            <p className="mt-3 text-sm text-[#63716a]">
              {room.capacity} tamu · {room.size} m²
            </p>

            <p className="mt-2 text-xs text-[#63716a]">
              {room.bed}
            </p>

            <p className="mt-4 flex-1 text-sm leading-7 text-[#63716a]">
              {room.description}
            </p>

            <p className="mt-5 text-xl font-semibold">
              {rupiah(room.price)}
              <span className="ml-1 text-xs font-normal text-[#63716a]">
                / malam
              </span>
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => startEdit(room)}
                className="min-h-11 rounded-xl border border-[#173e35]/20 px-3 py-3 text-sm font-semibold hover:bg-[#e8efe6]"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => openDelete(room)}
                className="min-h-11 rounded-xl border border-red-200 px-3 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                Hapus
              </button>
            </div>
          </article>
        ))}
      </div>

      {mode && (
        <section
          ref={formRef}
          aria-labelledby="room-form-title"
          className="mt-8 scroll-mt-6 rounded-2xl border border-[#173e35]/15 bg-white p-5 md:p-7"
        >
          <h2 id="room-form-title" className="font-serif text-3xl">
            {mode === "create" ? "Tambah Tipe Kamar" : "Edit Tipe Kamar"}
          </h2>

          <p className="mt-3 text-xs leading-6 text-[#63716a]">
            Harga dan nama pada booking yang sudah dibayar tidak ikut
            berubah.
          </p>

          <form onSubmit={handleSave} className="mt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="room-name" className="mb-2 block text-sm font-medium">
                  Nama tipe kamar
                </label>
                <input
                  id="room-name"
                  required
                  maxLength={80}
                  value={draft.name}
                  onChange={(event) => updateDraft("name", event.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="room-price" className="mb-2 block text-sm font-medium">
                  Harga per malam (Rp)
                </label>
                <input
                  id="room-price"
                  type="number"
                  required
                  min={1}
                  max={1000000000}
                  step={1}
                  value={draft.price}
                  onChange={(event) => updateDraft("price", event.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="room-capacity" className="mb-2 block text-sm font-medium">
                  Kapasitas tamu
                </label>
                <input
                  id="room-capacity"
                  type="number"
                  required
                  min={1}
                  max={10}
                  step={1}
                  value={draft.capacity}
                  onChange={(event) => updateDraft("capacity", event.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="room-size" className="mb-2 block text-sm font-medium">
                  Luas kamar (m²)
                </label>
                <input
                  id="room-size"
                  type="number"
                  required
                  min={0.1}
                  step="any"
                  value={draft.size}
                  onChange={(event) => updateDraft("size", event.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="room-bed" className="mb-2 block text-sm font-medium">
                  Tempat tidur
                </label>
                <input
                  id="room-bed"
                  required
                  maxLength={80}
                  placeholder="Contoh: 1 King Bed"
                  value={draft.bed}
                  onChange={(event) => updateDraft("bed", event.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="room-view" className="mb-2 block text-sm font-medium">
                  Pemandangan
                </label>
                <input
                  id="room-view"
                  required
                  maxLength={100}
                  value={draft.view}
                  onChange={(event) => updateDraft("view", event.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="room-description" className="mb-2 block text-sm font-medium">
                Deskripsi
              </label>
              <textarea
                id="room-description"
                required
                maxLength={1000}
                rows={3}
                value={draft.description}
                onChange={(event) => updateDraft("description", event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="room-facilities" className="mb-2 block text-sm font-medium">
                Fasilitas — satu fasilitas per baris
              </label>
              <textarea
                id="room-facilities"
                required
                maxLength={2000}
                rows={6}
                placeholder={"AC\nWi-Fi\nSmart TV"}
                value={draft.facilities}
                onChange={(event) => updateDraft("facilities", event.target.value)}
                className={inputClass}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-[#f8f5ef] p-4 text-sm">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => updateDraft("active", event.target.checked)}
                className="h-4 w-4 accent-[#173e35]"
              />
              Tampilkan tipe kamar di website
            </label>

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
                {mode === "create" ? "Tambah tipe kamar" : "Simpan perubahan"}
              </button>

              <button
                type="button"
                onClick={cancelForm}
                className="min-h-11 rounded-xl border border-[#173e35]/20 px-6 py-3 text-sm"
              >
                Batal
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Konfirmasi hapus */}
      <dialog
        ref={deleteDialogRef}
        aria-labelledby="delete-room-title"
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError("");
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDelete();
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border-0 bg-white p-0 text-[#173e35] shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <h2 id="delete-room-title" className="font-serif text-3xl">
            Hapus tipe kamar?
          </h2>

          <p className="mt-4 text-sm leading-7 text-[#63716a]">
            Tipe <strong>{deleteTarget?.name}</strong> akan dihapus.
            Tindakan ini tidak dapat dibatalkan.
          </p>

          <p className="mt-3 text-xs leading-6 text-[#63716a]">
            Jika sudah memiliki riwayat booking, tipe tidak bisa
            dihapus. Gunakan Edit untuk menonaktifkannya.
          </p>

          {deleteError && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700">
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
              className="min-h-11 rounded-xl bg-red-700 px-4 py-3 text-sm font-medium text-white hover:bg-red-800"
            >
              Ya, hapus
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}