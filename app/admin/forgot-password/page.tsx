"use client";

import { useState } from "react";
import { createClient } from "@/src/lib/supabaseBrowser";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminForgotPasswordPage() {
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
        redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/admin/reset-password`,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

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
              Lupa Sandi Admin
            </h1>
            <p className="mt-1 font-body text-xs text-text-secondary sm:text-sm">
              Kirim tautan untuk mereset kata sandi admin
            </p>
          </div>

          {success ? (
            <div className="mt-6 rounded-xl bg-green-50 p-4 border border-green-200">
              <h3 className="text-sm font-semibold text-green-800">Tautan Berhasil Dikirim</h3>
              <p className="mt-2 text-xs text-green-700 leading-relaxed">
                Jika email yang Anda masukkan memiliki akses admin, Anda akan segera menerima tautan pemulihan.
              </p>
              <Link href="/admin" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-green-800 hover:text-green-900">
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Login
              </Link>
            </div>
          ) : (
            <form className="mt-6 space-y-4 font-body" onSubmit={handleReset}>
              <div>
                <label htmlFor="email-address" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-primary">
                  Email Admin
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-secondary">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-primary/20 bg-background py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:bg-white focus:outline-none disabled:opacity-60"
                    placeholder="admin@putraartshop.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {error && <div className="text-red-500 text-xs font-semibold">{error}</div>}

              <motion.button
                whileHover={loading ? {} : { scale: 1.01 }}
                whileTap={loading ? {} : { scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-body text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Kirim Tautan</span>
                )}
              </motion.button>

              <div className="pt-4 text-center">
                <Link href="/admin" className="inline-flex items-center gap-1 font-body text-xs font-semibold text-text-secondary hover:text-primary transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
