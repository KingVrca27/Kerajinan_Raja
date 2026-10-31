"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { createClient } from "@/src/lib/supabaseBrowser";
import { activityLogRepository } from "@/src/lib/activityLogRepository";
import Image from "next/image";
import { siteSettingsRepository, SETTINGS_KEYS } from "@/src/lib/cmsRepository";

// =============================================================================
// AdminLoginPage — Halaman Login Admin dengan Supabase Authentication
// Menggunakan supabase.auth.signInWithPassword() sesuai Supabase JS v2.
// =============================================================================

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [logoUrl, setLogoUrl] = useState<string>("/images/logo.png");

  const supabase = createClient();

  // Gunakan ref untuk cek session mount agar tidak menyebabkan infinite re-render.
  const sessionChecked = useRef(false);

  // Periksa sesi aktif satu kali saat mount.
  // PENTING: Jangan redirect jika ini adalah recovery session.
  // Recovery session terjadi setelah admin mengklik link reset password.
  // Pada kondisi tersebut, user harus diarahkan ke /admin/reset-password, bukan dashboard.
  useEffect(() => {
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    // Jika URL mengandung ?reset=success, ini adalah redirect balik dari reset-password
    // (setelah signOut berhasil) — tidak perlu cek session, biarkan halaman tampil normal.
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "success") return;

    // Dengarkan event auth untuk mendeteksi recovery session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Ini adalah recovery session — jangan redirect ke dashboard,
        // arahkan ke halaman reset password agar admin dapat mengubah sandi.
        subscription.unsubscribe();
        router.replace("/admin/reset-password");
        return;
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Sesi aktif yang bukan recovery — redirect ke dashboard (login normal)
        subscription.unsubscribe();
        router.replace("/admin/dashboard");
      } else {
        subscription.unsubscribe();
      }
    });
  }, [router, supabase.auth]);

  // Load logo dari CMS
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        let url = await siteSettingsRepository.getSetting(SETTINGS_KEYS.LOGO_ADMIN);
        if (!url) {
          url = await siteSettingsRepository.getSetting(SETTINGS_KEYS.LOGO_HEADER);
        }
        if (url) setLogoUrl(url);
      } catch (e) {
        console.error("Gagal memuat logo admin:", e);
      }
    };
    fetchLogo();
  }, []);

  // ── Handler Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validasi input dasar sebelum memanggil API
    if (!email.trim()) {
      setError("Email wajib diisi.");
      return;
    }
    if (!password) {
      setError("Kata Sandi wajib diisi.");
      return;
    }

    setIsLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setIsLoading(false);

    if (authError) {
      // Tampilkan pesan error yang diterima dari Supabase
      setError(authError.message);

      await activityLogRepository.logActivity({
        action: "Login Gagal",
        entity_type: "auth",
        description: `Percobaan login gagal untuk email: ${email.trim()}`,
        metadata: { email: email.trim(), error: authError.message }
      });
    } else {
      // Login berhasil — catat log dan arahkan ke dashboard admin
      await activityLogRepository.logActivity({
        action: "Login Admin",
        entity_type: "auth",
        description: `Login admin berhasil untuk email: ${email.trim()}`,
        metadata: { email: email.trim() }
      });

      router.push("/admin/dashboard");
      router.refresh(); // Memperbarui cache Server Component setelah sesi baru
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xl sm:p-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md shadow-primary/10 border border-primary/10">
              <Image
                src={logoUrl}
                alt="Logo Admin"
                fill
                className="object-contain p-2"
                sizes="80px"
                priority
              />
            </div>
            <h1 className="mt-4 font-heading text-2xl font-bold text-text-primary sm:text-3xl">
              Login Admin
            </h1>
            <p className="mt-1 font-body text-xs text-text-secondary sm:text-sm">
              Masuk ke panel manajemen Putra Art Shop
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              key={error}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 font-body text-xs text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form
            id="admin-login-form"
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 font-body"
            noValidate
          >
            {/* Email */}
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-primary"
              >
                Email Admin
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-secondary">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@putraartshop.com"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-primary/20 bg-background py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:bg-white focus:outline-none disabled:opacity-60"
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-primary"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-secondary">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-primary/20 bg-background py-3 pl-10 pr-11 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:bg-white focus:outline-none disabled:opacity-60"
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-secondary hover:text-primary transition-colors disabled:opacity-60"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link href="/admin/forgot-password" className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors">
                Lupa kata sandi?
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={isLoading ? {} : { scale: 1.01 }}
              whileTap={isLoading ? {} : { scale: 0.98 }}
              type="submit"
              form="admin-login-form"
              disabled={isLoading}
              aria-busy={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-body text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              suppressHydrationWarning
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses…</span>
                </>
              ) : (
                <>
                  <span>Masuk Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-center font-body text-xs text-text-secondary">
          Akses terbatas hanya untuk administrator Putra Art Shop.
        </p>
      </motion.div>
    </div>
  );
}
