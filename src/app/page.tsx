import RoomSearch from "@/components/RoomSearch";


export default function Home() {
  return (
    <main>
      <header className="border-b border-[#173e35]/10">
        <nav
          aria-label="Navigasi utama"
          className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6 lg:px-10"
        >
          <a
            href="#"
            aria-label="SÉLA Stay — Beranda"
            className="shrink-0 text-2xl font-semibold tracking-[0.16em]"
          >
            SÉLA
            <span className="ml-2 text-xs font-normal tracking-widest">
              STAY
            </span>
          </a>

          <div className="hidden items-center gap-8 text-sm md:flex">
            <a
              href="#tentang"
              className="transition hover:text-[#97733e]"
            >
              Tentang
            </a>

            <a
              href="#kamar"
              className="transition hover:text-[#97733e]"
            >
              Pilihan Kamar
            </a>

         
          </div>

          <a
            href="#kamar"
            className="shrink-0 rounded-full bg-[#173e35] px-4 py-3 text-xs text-white transition hover:bg-[#25594c] sm:px-5 sm:text-sm"
          >
            Jelajahi Kamar ↗
          </a>
        </nav>

        {/* Navigasi untuk layar HP */}
        <nav
          aria-label="Navigasi seluler"
          className="flex justify-center gap-6 border-t border-[#173e35]/10 px-4 py-3 text-xs md:hidden"
        >
          <a
            href="#tentang"
            className="transition hover:text-[#97733e]"
          >
            Tentang
          </a>

          <a
            href="#kamar"
            className="transition hover:text-[#97733e]"
          >
            Pilihan Kamar
          </a>

          <a
            href="#pesanan"
            className="transition hover:text-[#97733e]"
          >
            Pesanan Saya
          </a>
        </nav>
      </header>

      <section
        id="tentang"
        className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-2 lg:items-center lg:px-10"
      >
        <div>
          <p className="mb-6 text-xs font-semibold tracking-[0.25em] text-[#97733e]">
            UBUD, BALI · BOUTIQUE HOTEL
          </p>

          <h1 className="font-serif text-6xl leading-[1.08] tracking-tight md:text-7xl">
            Beri waktu
            <br />
            untuk <span className="italic text-[#97733e]">jeda.</span>
          </h1>

          <p className="mt-7 max-w-md text-base leading-8 text-[#63716a]">
            Tinggalkan sejenak kesibukan. Temukan kenyamanan, suasana
            hijau, dan pagi yang lebih pelan di SÉLA Stay.
          </p>

          <a
            href="#kamar"
            className="mt-9 inline-flex items-center gap-6 rounded-full bg-[#173e35] px-7 py-4 text-sm text-white transition hover:bg-[#25594c]"
          >
            Temukan kamar kamu
            <span aria-hidden="true">↗</span>
          </a>

          <div className="mt-12 flex flex-wrap gap-8 border-t border-[#173e35]/15 pt-7">
            <div>
              <p className="font-serif text-3xl">24</p>
              <p className="mt-1 text-xs text-[#63716a]">
                Kamar eksklusif
              </p>
            </div>

            <div>
              <p className="font-serif text-3xl">3</p>
              <p className="mt-1 text-xs text-[#63716a]">
                Tipe pengalaman
              </p>
            </div>

            <div>
              <p className="font-serif text-3xl">Ubud</p>
              <p className="mt-1 text-xs text-[#63716a]">
                Di tengah ketenangan
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-96 items-center justify-center overflow-hidden rounded-t-full bg-[#dce3d7] p-8 md:min-h-[540px] md:p-10">
          <div
            aria-hidden="true"
            className="absolute top-12 h-56 w-56 rounded-full bg-[#ead5ac]"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-[#78917b]"
          />

          <div
            aria-hidden="true"
            className="absolute -right-20 -bottom-12 h-72 w-72 rounded-full bg-[#365c49]"
          />

          <div className="relative text-center">
            <p className="text-xs tracking-[0.3em]">
              THE ART OF SLOW LIVING
            </p>

            <p className="mt-5 font-serif text-4xl italic sm:text-5xl md:text-6xl">
              Stay in harmony.
            </p>

            <p className="mt-5 text-sm">
              Alam. Nyaman. SÉLA.
            </p>
          </div>
        </div>
      </section>

      <RoomSearch />



    <footer className="bg-[#173e35] text-[#f8f5ef]">
  <div className="mx-auto max-w-7xl px-6 pt-12 pb-6 lg:px-10">
    <div className="grid gap-10 md:grid-cols-3">
      <div>
        <a
          href="#"
          className="text-2xl font-semibold tracking-[0.16em]"
        >
          SÉLA
          <span className="ml-2 text-xs font-normal tracking-widest">
            STAY
          </span>
        </a>

        <p className="mt-4 max-w-xs text-sm leading-7 text-white/70">
          Ruang untuk berhenti sejenak. Nikmati kenyamanan
          dan suasana tenang di tengah hijaunya Ubud.
        </p>

        <p className="mt-5 font-serif text-2xl italic text-[#ead5ac]">
          Beri waktu untuk jeda.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold">
          Jelajahi SÉLA
        </h2>

        <ul className="mt-4 space-y-4 text-sm text-white/70">
          <li>
            <a
              href="#tentang"
              className="transition hover:text-[#ead5ac]"
            >
              Tentang hotel
            </a>
          </li>

          <li>
            <a
              href="#kamar"
              className="transition hover:text-[#ead5ac]"
            >
              Pilihan kamar
            </a>
          </li>

          <li>
            <a
              href="#kamar"
              className="transition hover:text-[#ead5ac]"
            >
              Booking demo
            </a>
          </li>
        </ul>
      </div>

      <div>
        <h2 className="text-sm font-semibold">
          Tentang website ini
        </h2>

        <p className="mt-4 text-sm leading-7 text-white/70">
          SÉLA Stay adalah hotel fiktif untuk proyek
          portofolio. Seluruh pemesanan dan pembayaran
          merupakan simulasi.
        </p>

        <span className="mt-5 inline-block rounded-full border border-[#ead5ac]/40 px-4 py-2 text-xs text-[#ead5ac]">
          Demo booking hotel
        </span>
      </div>
    </div>

    <div className="mt-10 flex flex-col justify-between gap-4 border-t border-white/15 pt-6 text-xs text-white/60 sm:flex-row sm:items-center">
      <p>© 2026 SÉLA Stay. Proyek portofolio.</p>

      <a
        href="#"
        className="transition hover:text-[#ead5ac]"
      >
        Kembali ke atas ↑
      </a>
    </div>
  </div>
</footer>
    </main>
  );
}