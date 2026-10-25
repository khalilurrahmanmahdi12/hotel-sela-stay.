"use client";

import { useRef } from "react";
import { useRooms } from "@/lib/useRooms";

type RoomDetailsProps = {
  roomId: string;
};

export default function RoomDetails({ roomId }: RoomDetailsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { rooms } = useRooms();

  const room = rooms.find((item) => item.id === roomId);

  if (!room) return null;

  function openPopup() {
    dialogRef.current?.showModal();
  }

  function closePopup() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={openPopup}
        aria-haspopup="dialog"
        className="mt-4 min-h-11 w-full rounded-xl border border-[#173e35]/20 px-2 py-2 text-xs font-semibold transition hover:bg-white sm:text-sm"
      >
        Detail kamar ↗
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`room-title-${roomId}`}
        aria-describedby={`room-description-${roomId}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) closePopup();
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border-0 bg-[#f8f5ef] p-0 text-left text-[#173e35] shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div>
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#173e35]/10 bg-[#f8f5ef] p-5 sm:p-6">
            <div className="min-w-0">
              <p className="text-xs tracking-widest text-[#97733e]">
                SÉLA STAY · DETAIL KAMAR
              </p>

              <h2
                id={`room-title-${roomId}`}
                className="mt-3 font-serif text-2xl sm:text-3xl"
              >
                {room.name}
              </h2>
            </div>

            <button
              type="button"
              onClick={closePopup}
              aria-label="Tutup detail kamar"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#173e35]/15 bg-white text-xl"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <div className="space-y-7 p-5 sm:p-6 md:p-8">
            <p
              id={`room-description-${roomId}`}
              className="text-sm leading-7 text-[#63716a]"
            >
              {room.description}
            </p>

            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Luas kamar", `${room.size} m²`],
                ["Tempat tidur", room.bed],
                ["Kapasitas", `${room.capacity} tamu`],
                ["Pemandangan", room.view],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 rounded-2xl border border-[#173e35]/10 bg-white p-4"
                >
                  <dt className="text-xs text-[#63716a]">{label}</dt>
                  <dd className="mt-2 text-sm font-semibold">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <section>
              <h3 className="font-serif text-2xl">
                Fasilitas kamar
              </h3>

              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {room.facilities.map((facility) => (
                  <li
                    key={facility}
                    className="flex items-start gap-3 text-sm text-[#63716a]"
                  >
                    <span aria-hidden="true" className="text-[#173e35]">
                      ✓
                    </span>
                    {facility}
                  </li>
                ))}
              </ul>
            </section>

            <section className="border-t border-[#173e35]/10 pt-6">
              <h3 className="font-serif text-2xl">
                Aturan menginap
              </h3>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#63716a]">
                <li>Check-in mulai pukul 14.00 WITA.</li>
                <li>Check-out maksimal pukul 12.00 WITA.</li>
                <li>Dilarang merokok di dalam kamar.</li>
                <li>Hewan peliharaan belum diperbolehkan.</li>
                <li>Sarapan tidak termasuk harga kamar.</li>
              </ul>
            </section>

            <p className="rounded-xl bg-[#e8efe6] p-4 text-xs leading-6 text-[#63716a]">
              Informasi merupakan contoh untuk hotel fiktif SÉLA Stay.
            </p>

            <button
              type="button"
              onClick={closePopup}
              className="min-h-11 w-full rounded-xl bg-[#173e35] px-4 py-3 text-sm font-medium text-white"
            >
              Kembali ke pilihan kamar
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}