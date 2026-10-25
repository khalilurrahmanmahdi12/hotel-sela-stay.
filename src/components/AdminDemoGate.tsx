"use client";

import Link from "next/link";
import {
  useState,
  useSyncExternalStore,
  type ReactNode,
  type SubmitEvent,
} from "react";

const SESSION_KEY = "sela-admin-demo-session";
const SESSION_EVENT = "sela-admin-session-updated";

type SessionState = "loading" | "signed-in" | "signed-out";

function subscribe(callback: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === SESSION_KEY || event.key === null) {
      callback();
    }
  }

  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener("storage", handleStorage);
  window.addEventListener("focus", callback);
  window.addEventListener("pageshow", callback);

  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("focus", callback);
    window.removeEventListener("pageshow", callback);
  };
}

function getSnapshot(): SessionState {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "active"
      ? "signed-in"
      : "signed-out";
  } catch {
    return "signed-out";
  }
}

function getServerSnapshot(): SessionState {
  return "loading";
}

export function AdminDemoLogout() {
  const [error, setError] = useState("");

  function logout() {
    setError("");

    try {
      sessionStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new Event(SESSION_EVENT));
    } catch {
      setError("Belum bisa keluar. Coba kembali.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={logout}
        className="min-h-11 w-full rounded-xl border border-white/20 px-4 py-3 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        Keluar
      </button>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}

export default function AdminDemoGate({
  children,
}: {
  children: ReactNode;
}) {
  const session = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function login(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      email.trim().toLowerCase() !== "admin@sela.test" ||
      password !== "sela123"
    ) {
      setError("Email atau password demo tidak sesuai.");
      return;
    }

    try {
      sessionStorage.setItem(SESSION_KEY, "active");
      setPassword("");
      window.dispatchEvent(new Event(SESSION_EVENT));
    } catch {
      setError(
        "Sesi belum bisa disimpan. Pastikan penyimpanan browser diizinkan.",
      );
    }
  }

  if (session === "loading") {
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center bg-[#f8f5ef] p-6 text-sm text-[#173e35]"
      >
        Menyiapkan halaman admin...
      </div>
    );
  }

  if (session === "signed-in") {
    return children;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5ef] px-5 py-12 text-[#173e35]">
      <div className="w-full max-w-md">
        <Link
          href="/"
          aria-label="Kembali ke beranda SÉLA Stay"
          className="block text-center text-3xl font-semibold tracking-[0.16em]"
        >
          SÉLA
          <span className="ml-2 text-xs font-normal">
            STAY
          </span>
        </Link>

        <div className="mt-8 rounded-3xl border border-[#173e35]/10 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold tracking-widest text-[#97733e]">
            ADMIN WORKSPACE
          </p>

          <h1 className="mt-3 font-serif text-3xl">
            Selamat datang kembali.
          </h1>

          <p className="mt-3 text-sm leading-7 text-[#63716a]">
            Masuk untuk mencoba pengelolaan hotel SÉLA Stay.
          </p>

          <form onSubmit={login} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-medium"
              >
                Email
              </label>

              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="admin@sela.test"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                className="w-full rounded-xl border border-[#173e35]/20 bg-[#f8f5ef] p-3 text-sm outline-none focus:ring-2 focus:ring-[#97733e]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>

              <div className="flex overflow-hidden rounded-xl border border-[#173e35]/20 bg-[#f8f5ef] focus-within:ring-2 focus-within:ring-[#97733e]">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Masukkan password demo"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  className="min-w-0 flex-1 bg-transparent p-3 text-sm outline-none"
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                  className="min-h-11 px-4 text-xs font-semibold"
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="min-h-11 w-full rounded-xl bg-[#173e35] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#25594c]"
            >
              Masuk admin
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-[#e8efe6] p-4 text-xs leading-7">
            <p className="font-semibold">Akun demo</p>
            <p>Email: admin@sela.test</p>
            <p>Password: sela123</p>

            <button
              type="button"
              onClick={() => {
                setEmail("admin@sela.test");
                setPassword("sela123");
                setError("");
              }}
              className="mt-3 min-h-11 rounded-lg border border-[#173e35]/20 bg-white px-4 py-2 font-semibold"
            >
              Isi akun demo
            </button>
          </div>

          <p className="mt-5 text-xs leading-6 text-[#63716a]">
            Login ini merupakan simulasi di browser.
            Gunakan akun contoh yang tersedia.
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-[#63716a] transition hover:text-[#173e35]"
        >
          ← Kembali ke website
        </Link>
      </div>
    </main>
  );
}