"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/src/lib/supabaseBrowser";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail } from "lucide-react";


function RegisterContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password || !fullName) {
      setError("Semua field wajib diisi");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // Jika session null, berarti Supabase memerlukan konfirmasi email terlebih dahulu
      if (!data.session) {
        setNeedsConfirmation(true);
        return;
      }

      // Jika session langsung ada, redirect normal
      const redirectPath = searchParams.get("redirect");
      if (redirectPath && redirectPath.startsWith("/") && !redirectPath.startsWith("//") && !redirectPath.startsWith("/admin")) {
        router.push(redirectPath);
      } else {
        router.push("/profile");
      }
      router.refresh();
    } catch (err: any) {
      if (err.message?.includes("User already registered")) {
        setError("Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.");
      } else if (err.message?.toLowerCase().includes("rate limit")) {
        setError("Terlalu banyak pendaftaran. Sistem membatasi pengiriman email, silakan coba beberapa saat lagi.");
      } else {
        setError(err.message || "Terjadi kesalahan saat mendaftar");
      }
    } finally {
      setLoading(false);
    }
  };

  // Tampilan setelah daftar berhasil tetapi perlu konfirmasi email
  if (needsConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center space-y-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Cek Email Anda!</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Akun untuk <span className="font-semibold text-primary">{email}</span> telah berhasil dibuat.
            <br /><br />
            Kami telah mengirimkan <strong>tautan konfirmasi</strong> ke email Anda. Silakan buka email dan klik tautan tersebut untuk mengaktifkan akun Anda.
          </p>
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
            Tidak menerima email? Periksa folder <strong>Spam</strong> atau <strong>Junk</strong> Anda.
          </div>
          <Link
            href="/login"
            className="block w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors text-center"
          >
            Ke Halaman Masuk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Daftar Akun Baru
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="full-name" className="sr-only">Nama Lengkap</label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Nama Lengkap"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Password (minimal 6 karakter)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 z-20"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {loading ? "Mendaftar..." : "Daftar"}
            </button>
          </div>
          <div className="text-sm text-center">
            <Link href={searchParams.get("redirect") ? `/login?redirect=${encodeURIComponent(searchParams.get("redirect") as string)}` : "/login"} className="font-medium text-primary hover:text-primary/80 transition-colors">
              Sudah punya akun? Masuk
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
