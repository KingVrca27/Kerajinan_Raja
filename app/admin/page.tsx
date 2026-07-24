"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight } from "lucide-react";
import { AdminAuthProvider } from "@/src/context/AdminAuthContext";
import { useAdminAuth } from "@/src/hooks/useAdminAuth";

function LoginForm() {
  const { login, isAuthenticated } = useAdminAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/admin/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Username dan Kata Sandi wajib diisi.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const success = login(username.trim(), password.trim());
      setIsLoading(false);

      if (success) {
        router.push("/admin/dashboard");
      } else {
        setError("Username atau password salah! Gunakan dummy: admin / admin123");
      }
    }, 400);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md rounded-3xl border border-primary/10 bg-white p-6 shadow-xl sm:p-8"
      >
        {/* Header Logo & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/20">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Login Admin
          </h1>
          <p className="mt-1 font-body text-xs text-text-secondary sm:text-sm">
            Masuk ke panel manajemen Kerajinan Raja
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 font-body text-xs text-red-600"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Credentials Tip */}
        <div className="mt-4 rounded-xl bg-secondary/60 p-3 font-body text-xs text-text-secondary border border-primary/10">
          <span className="font-bold text-primary block mb-0.5">Akun Dummy Admin:</span>
          <div>Username: <strong className="text-text-primary font-medium">admin</strong></div>
          <div>Password: <strong className="text-text-primary font-medium">admin123</strong></div>
        </div>

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 font-body">
          {/* Username Field */}
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5"
            >
              Username Admin
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-secondary">
                <User className="h-4 w-4" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full rounded-xl border border-primary/20 bg-background py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-secondary">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full rounded-xl border border-primary/20 bg-background py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-body text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg focus:outline-none cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>Masuk Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <AdminAuthProvider>
      <LoginForm />
    </AdminAuthProvider>
  );
}
