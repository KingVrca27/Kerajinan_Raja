"use client";

import { useState } from "react";
import { createClient } from "@/src/lib/supabaseBrowser";
import Link from "next/link";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email) {
      setError("Email wajib diisi");
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/reset-password`,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err: any) {
      // Sesuai aturan: jangan membocorkan apakah email terdaftar.
      // Tetap tampilkan halaman sukses meskipun ada error non-kritis.
      console.error(err);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center space-y-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Cek Email Anda!</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Jika email <span className="font-semibold text-primary">{email}</span> terdaftar,
            kami telah mengirimkan tautan pemulihan kata sandi.
            <br /><br />
            Silakan buka email Anda dan klik tautan tersebut untuk mengatur ulang kata sandi.
          </p>
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
            Tidak menerima email? Periksa folder <strong>Spam</strong> atau <strong>Junk</strong> Anda.
          </div>
          <Link
            href="/login"
            className="block w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors text-center"
          >
            Kembali ke Halaman Masuk
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
            Lupa Kata Sandi
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Masukkan email Anda untuk menerima tautan pemulihan.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleReset}>
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {loading ? "Memproses..." : "Kirim Tautan Pemulihan"}
            </button>
          </div>

          <div className="text-sm text-center">
            <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
              Kembali ke halaman masuk
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
