/**
 * @file app/admin/dashboard/security/page.tsx
 * Halaman Keamanan & Session Management — FASE 4.5.2B
 * Route: /admin/dashboard/security
 *
 * Fitur:
 *  - Daftar login terakhir (activity_logs)
 *  - Session aktif saat ini
 *  - Logout semua device
 *  - Force logout user (nonaktifkan akun via tabel users)
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, LogOut, Smartphone, Globe, Clock, User,
  CheckCircle2, AlertTriangle, Loader2, RefreshCw, ShieldAlert,
  MonitorOff, KeyRound, UserX, Search, ToggleLeft, ToggleRight,
  Info,
} from "lucide-react";
import { securityRepository } from "@/src/lib/securityRepository";
import { adminRepository } from "@/src/lib/adminRepository";
import type { LoginRecord, ActiveSession } from "@/src/lib/securityRepository";
import type { AdminUserExtended } from "@/src/lib/adminRepository";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function parseBrowser(ua: string | null): string {
  if (!ua) return "—";
  if (ua.includes("Edg"))     return "Edge";
  if (ua.includes("Chrome"))  return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari"))  return "Safari";
  if (ua.includes("Opera"))   return "Opera";
  return ua.slice(0, 28) + "…";
}

// ─── Toast Component ──────────────────────────────────────────────────────────

interface ToastState {
  type: "success" | "error";
  msg: string;
}

function Toast({ toast }: { toast: ToastState | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className={`fixed right-5 top-5 z-[300] flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-xl ${
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.type === "success"
            ? <CheckCircle2 className="h-4 w-4" />
            : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSecurityPage() {
  const [loginHistory,    setLoginHistory]    = useState<LoginRecord[]>([]);
  const [currentSession,  setCurrentSession]  = useState<ActiveSession | null>(null);
  const [adminList,       setAdminList]       = useState<AdminUserExtended[]>([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [searchUser,      setSearchUser]      = useState("");

  const [toast, setToast] = useState<ToastState | null>(null);

  // ── Utilities ──────────────────────────────────────────────────────────────

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [history, session, admins] = await Promise.all([
        securityRepository.getLoginHistory(),
        securityRepository.getCurrentSession(),
        adminRepository.getAllAdmins(),
      ]);
      setLoginHistory(history);
      setCurrentSession(session);
      setAdminList(admins);
    } catch {
      showToast("error", "Gagal memuat data keamanan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleLogoutAll = async () => {
    if (!confirm("Yakin ingin logout dari semua perangkat? Anda akan diarahkan ke halaman login.")) return;
    const res = await securityRepository.logoutAllDevices();
    if (!res.success) {
      showToast("error", res.error || "Gagal logout semua device.");
      return;
    }
    showToast("success", "Berhasil logout dari semua perangkat.");
    setTimeout(() => { window.location.href = "/admin"; }, 2000);
  };

  const handleLogoutCurrent = async () => {
    const res = await securityRepository.logoutCurrentSession();
    if (!res.success) {
      showToast("error", res.error || "Gagal logout.");
      return;
    }
    window.location.href = "/admin";
  };

  const handleForceLogout = async (admin: AdminUserExtended) => {
    if (
      !confirm(
        `Force logout "${admin.full_name}"?\nAkun akan dinonaktifkan sehingga admin tidak dapat login lagi sampai diaktifkan kembali.`
      )
    ) return;

    const res = await securityRepository.forceLogoutUser(admin.id);
    if (!res.success) {
      showToast("error", res.error || "Gagal force logout.");
      return;
    }
    setAdminList((prev) =>
      prev.map((a) => (a.id === admin.id ? { ...a, is_active: false } : a))
    );
    showToast("success", `Admin "${admin.full_name}" berhasil di-force logout dan dinonaktifkan.`);
  };

  const handleReactivate = async (admin: AdminUserExtended) => {
    const res = await adminRepository.toggleActive(admin.id, true);
    if (!res.success) {
      showToast("error", res.error || "Gagal mengaktifkan akun.");
      return;
    }
    setAdminList((prev) =>
      prev.map((a) => (a.id === admin.id ? { ...a, is_active: true } : a))
    );
    showToast("success", `Admin "${admin.full_name}" berhasil diaktifkan kembali.`);
  };

  // ── Filtered admin list ────────────────────────────────────────────────────

  const filteredAdmins = adminList.filter((a) => {
    const q = searchUser.toLowerCase().trim();
    if (!q) return true;
    return (
      (a.full_name ?? "").toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl space-y-6 font-body">
      <Toast toast={toast} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-primary/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Keamanan & Session
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Pantau riwayat login, session aktif, dan kelola keamanan akses admin.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-primary/20 bg-white px-4 py-2 text-xs font-semibold hover:bg-secondary/40 cursor-pointer transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Memuat data keamanan...</span>
        </div>
      ) : (
        <>
          {/* ── Session Aktif ────────────────────────────────────────────────── */}
          <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center gap-2 border-b border-primary/10 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
                <Smartphone className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-heading text-sm font-bold text-text-primary">
                Session Aktif Saat Ini
              </h2>
              {currentSession && (
                <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              )}
            </div>

            {currentSession ? (
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                {/* Session Info */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5 text-text-secondary">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span>
                      Email: <strong className="text-text-primary">{currentSession.email}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-text-secondary">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span>
                      Aktif sejak:{" "}
                      <strong className="text-text-primary">
                        {formatDate(currentSession.lastActivity)}
                      </strong>
                    </span>
                  </div>
                  {currentSession.userAgent && (
                    <div className="flex items-center gap-2.5 text-text-secondary">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                        <Globe className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span>
                        Browser:{" "}
                        <strong className="text-text-primary">
                          {parseBrowser(currentSession.userAgent)}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleLogoutAll}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 cursor-pointer transition-colors"
                  >
                    <MonitorOff className="h-4 w-4" />
                    Logout Semua Perangkat
                  </button>
                  <button
                    type="button"
                    onClick={handleLogoutCurrent}
                    className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 cursor-pointer transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout Perangkat Ini
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-secondary">
                Tidak ada session aktif ditemukan.
              </p>
            )}
          </div>

          {/* ── Force Logout User ─────────────────────────────────────────────── */}
          <div className="rounded-3xl border border-primary/10 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center gap-2 border-b border-primary/10 px-6 py-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-100">
                <UserX className="h-4 w-4 text-red-600" />
              </div>
              <h2 className="font-heading text-sm font-bold text-text-primary">
                Force Logout User
              </h2>
              <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                {adminList.length} admin
              </span>
            </div>

            {/* Search */}
            <div className="border-b border-primary/10 px-4 py-3">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Cari admin..."
                  className="w-full rounded-xl border border-primary/20 bg-white py-2 pl-9 pr-3 text-xs focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Admin List */}
            <div className="divide-y divide-primary/5">
              {filteredAdmins.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-secondary">
                  Tidak ada admin ditemukan.
                </div>
              ) : (
                filteredAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-secondary/20"
                  >
                    {/* Info */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
                        {(admin.full_name || "A").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-primary leading-tight">
                          {admin.full_name}
                        </div>
                        <div className="text-[11px] text-text-secondary">{admin.email}</div>
                      </div>
                    </div>

                    {/* Status + Action */}
                    <div className="flex items-center gap-3">
                      {/* Status badge */}
                      {admin.is_active ? (
                        <span className="hidden items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:flex">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Aktif
                        </span>
                      ) : (
                        <span className="hidden items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 sm:flex">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          Nonaktif
                        </span>
                      )}

                      {/* Action buttons */}
                      {admin.is_active ? (
                        <button
                          type="button"
                          onClick={() => handleForceLogout(admin)}
                          className="flex items-center gap-1.5 rounded-xl bg-red-100 px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-500 hover:text-white cursor-pointer transition-colors"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Force Logout
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReactivate(admin)}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-500 hover:text-white cursor-pointer transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Aktifkan
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer info */}
            <div className="border-t border-primary/10 bg-secondary/20 px-5 py-2.5 text-[11px] text-text-secondary flex items-center gap-1.5">
              <Info className="h-3 w-3 shrink-0" />
              Force logout akan menonaktifkan akun admin sehingga session berikutnya ditolak.
            </div>
          </div>

          {/* ── Riwayat Login ─────────────────────────────────────────────────── */}
          <div className="rounded-3xl border border-primary/10 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center gap-2 border-b border-primary/10 px-6 py-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
                <KeyRound className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-heading text-sm font-bold text-text-primary">
                Riwayat Login Terakhir
              </h2>
              <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                {loginHistory.length} event
              </span>
            </div>

            {loginHistory.length === 0 ? (
              <div className="p-12 text-center text-sm text-text-secondary">
                <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-primary/20" />
                <p className="font-semibold">Belum ada riwayat login tercatat.</p>
                <p className="mt-1 text-xs">
                  Aktivitas login akan muncul di sini setelah admin login/logout.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-primary/5 bg-secondary/20 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                      <th className="px-5 py-3">Waktu</th>
                      <th className="px-5 py-3">Admin</th>
                      <th className="px-5 py-3">IP Address</th>
                      <th className="px-5 py-3">Browser</th>
                      <th className="px-5 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {loginHistory.map((log) => (
                      <tr
                        key={log.id}
                        className="transition-colors hover:bg-secondary/20"
                      >
                        <td className="px-5 py-3 font-mono text-text-secondary">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-bold text-text-primary">{log.user_name}</div>
                          {log.email && (
                            <div className="text-[10px] text-text-secondary">{log.email}</div>
                          )}
                        </td>
                        <td className="px-5 py-3 font-mono text-text-secondary">
                          {log.ip_address || "—"}
                        </td>
                        <td className="px-5 py-3 text-text-secondary">
                          {parseBrowser(log.user_agent)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {log.success ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Berhasil
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              <AlertTriangle className="h-3 w-3" />
                              Gagal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Security Tips ─────────────────────────────────────────────────── */}
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <div className="mb-3 flex items-center gap-2 font-heading text-sm font-bold text-amber-800">
              <ShieldAlert className="h-4 w-4" />
              Tips Keamanan
            </div>
            <ul className="space-y-1.5 text-xs text-amber-700">
              <li>• Ganti password secara berkala (minimal 3 bulan sekali).</li>
              <li>• Selalu logout dari perangkat publik atau bersama.</li>
              <li>• Jangan berbagi kredensial admin dengan pihak lain.</li>
              <li>• Aktifkan notifikasi jika ada login dari perangkat baru.</li>
              <li>• Gunakan password unik minimal 12 karakter dengan kombinasi huruf, angka, dan simbol.</li>
              <li>• Gunakan Force Logout jika mencurigai akun admin diakses pihak tidak berwenang.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
