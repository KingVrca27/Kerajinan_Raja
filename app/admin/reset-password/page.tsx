"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabaseBrowser";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// Status validasi sesi recovery
type SessionStatus = "checking" | "valid" | "invalid";

export default function AdminResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // "checking": sedang menunggu event, "valid": sesi recovery OK, "invalid": tidak ada recovery session
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("checking");

  const router = useRouter();
  const supabase = createClient();

  // Validasi recovery session menggunakan onAuthStateChange.
  // Supabase browser client akan menerima event PASSWORD_RECOVERY saat pengguna
  // membuka halaman ini setelah melewati /auth/callback dengan token recovery yang valid.
  useEffect(() => {
    // Cek apakah sudah ada sesi aktif saat mount (callback sudah diproses)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Sesi sudah ada (callback telah berhasil exchange code)
        // Kita izinkan form tampil — session yang ada adalah recovery session
        setSessionStatus("valid");
      } else {
        // Tidak ada sesi — pengguna mungkin mengakses halaman ini langsung
        setSessionStatus("invalid");
      }
    });

    // Dengarkan event PASSWORD_RECOVERY dari Supabase auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionStatus("valid");
      } else if (event === "SIGNED_OUT") {
        // Hanya set invalid jika bukan setelah kita sendiri memanggil signOut (success flow)
        setSessionStatus("invalid");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!password || !confirmPassword) {
      setError("Semua field wajib diisi");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Kata sandi tidak cocok");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);

      // Admin harus melalui login normal untuk mendapatkan guard
      await supabase.auth.signOut();

      setTimeout(() => {
        router.push("/admin?reset=success");
      }, 3000);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengubah kata sandi. Tautan mungkin kedaluwarsa.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Tampilkan loading saat mengecek sesi ────────────────────────────────────
  if (sessionStatus === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-body text-sm">Memverifikasi sesi pemulihan...</p>
        </div>
      </div>
    );
  }

  // ── Tampilkan error jika tidak ada recovery session ─────────────────────────
  if (sessionStatus === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">
            Tautan Tidak Valid
          </h2>
          <p className="font-body text-sm text-gray-600 mb-6">
            Sesi pemulihan tidak ditemukan. Tautan mungkin sudah kedaluwarsa
            atau telah digunakan sebelumnya.
          </p>
          <Link
            href="/admin/forgot-password"
            className="font-body text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Minta Tautan Reset Baru
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Tampilan sukses ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl border border-primary/10 bg-white p-8 text-center shadow-xl"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600 mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">
            Sandi Berhasil Diubah
          </h2>
          <p className="font-body text-sm text-gray-600 mb-6">
            Anda akan diarahkan ke halaman login dalam beberapa detik.
          </p>
          <Link
            href="/admin"
            className="font-body text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Ke Halaman Login Sekarang
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Form reset password ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xl sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/20">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="mt-4 font-heading text-2xl font-bold text-text-primary sm:text-3xl">
              Atur Ulang Sandi
            </h1>
            <p className="mt-1 font-body text-xs text-text-secondary sm:text-sm">
              Buat kata sandi baru untuk akses admin
            </p>
          </div>

          <form className="mt-6 space-y-4 font-body" onSubmit={handleUpdatePassword}>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-primary"
              >
                Sandi Baru
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-secondary">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl border border-primary/20 bg-background py-3 pl-10 pr-10 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:bg-white focus:outline-none"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-primary"
              >
                Konfirmasi Sandi Baru
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-secondary">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl border border-primary/20 bg-background py-3 pl-10 pr-10 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:bg-white focus:outline-none"
                  placeholder="Ketik ulang kata sandi"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-xs font-semibold bg-red-50 p-2 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <motion.button
              whileHover={loading ? {} : { scale: 1.01 }}
              whileTap={loading ? {} : { scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-body text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Kata Sandi</span>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
