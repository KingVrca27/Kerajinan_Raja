/**
 * @file app/admin/dashboard/admin/page.tsx
 * Halaman Manajemen Admin — FASE 4.5.2C
 * Route: /admin/dashboard/admin
 *
 * Fitur:
 *  - Daftar admin (tabel)
 *  - Tambah admin (modal)
 *  - Edit profil admin (nama + role)
 *  - Aktif / nonaktif admin
 *  - Reset password (kirim email)
 *  - Ubah role (Super Admin / Admin)
 *  - Hapus akun admin yang dinonaktifkan (dengan konfirmasi modal)
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Edit2, X, CheckCircle2, AlertTriangle, Loader2,
  ShieldCheck, ShieldOff, KeyRound, ToggleLeft, ToggleRight,
  UserCog, Crown, UserPlus, Mail, User, Lock, ChevronDown, Trash2
} from "lucide-react";
import { adminRepository } from "@/src/lib/adminRepository";
import { ROLE_LABELS, ROLE_COLORS } from "@/src/lib/adminPermissions";
import type { AdminRole } from "@/src/types/admin";
import type { AdminUserExtended } from "@/src/lib/adminRepository";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getInitial(name: string | null | undefined): string {
  return (name || "?").charAt(0).toUpperCase();
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

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: AdminRole }) {
  const colors = ROLE_COLORS[role];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {role === "superadmin" && <Crown className="h-3 w-3" />}
      {ROLE_LABELS[role]}
    </span>
  );
}

// ─── Add Admin Modal ──────────────────────────────────────────────────────────

interface AddAdminModalProps {
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

function AddAdminModal({ onClose, onSuccess, onError }: AddAdminModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      onError("Email wajib diisi.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await adminRepository.createAdmin({
        email: email.trim(),
        role,
      });
      if (!res.success) throw new Error(res.error);
      onSuccess(`Undangan berhasil dikirim ke ${email}. Admin dapat mengatur profilnya setelah login.`);
      onClose();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Gagal menambahkan admin.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-primary/10 pb-3">
          <h3 className="flex items-center gap-2 font-heading text-base font-bold text-text-primary">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            Undang Admin Baru
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-text-secondary hover:bg-primary/10 cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Catatan proses */}
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] leading-relaxed text-blue-700">
          ℹ️ Admin yang diundang akan menerima email. Setelah login, mereka dapat mengatur nama dan foto profil sendiri.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              Alamat Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/60" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@domain.com"
                required
                className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <p className="mt-1 text-[11px] text-text-secondary">
              Email undangan akan dikirim ke alamat ini.
            </p>
          </div>

          {/* Role */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              Role Admin
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/60" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AdminRole)}
                className="w-full appearance-none rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              >
                <option value="superadmin">Super Admin — akses penuh</option>
                <option value="admin">Admin — akses umum</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/60" />
            </div>
          </div>

          {/* Role Info */}
          <div className={`rounded-xl p-3 text-[11px] leading-relaxed ${
            role === "superadmin"
              ? "bg-purple-50 text-purple-700 border border-purple-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}>
            {role === "superadmin"
              ? "⚡ Super Admin memiliki akses penuh termasuk kelola admin lain, backup, dan pengaturan sistem."
              : "🔑 Admin memiliki akses ke semua fitur operasional (produk, pesanan, pelanggan, konten) kecuali manajemen admin."}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-primary/20 py-2.5 text-sm font-semibold text-text-secondary hover:bg-secondary/40 cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 cursor-pointer transition-colors"
            >
              {isSaving
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Mail className="h-4 w-4" />}
              {isSaving ? "Mengirim..." : "Kirim Undangan"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Edit Admin Modal ─────────────────────────────────────────────────────────

interface EditAdminModalProps {
  admin: AdminUserExtended;
  onClose: () => void;
  onSuccess: (updated: Partial<AdminUserExtended>) => void;
  onError: (msg: string) => void;
}

function EditAdminModal({ admin, onClose, onSuccess, onError }: EditAdminModalProps) {
  const [role, setRole]   = useState<AdminRole>(admin.role);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const roleRes = await adminRepository.updateRole(admin.id, role);
      if (!roleRes.success) throw new Error(roleRes.error);
      onSuccess({ role });
    } catch (e) {
      onError(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-primary/10 pb-3">
          <h3 className="flex items-center gap-2 font-heading text-base font-bold text-text-primary">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <UserCog className="h-4 w-4 text-primary" />
            </div>
            Ubah Role Admin
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-text-secondary hover:bg-primary/10 cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Admin info (read-only) */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-secondary/30 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-heading text-base font-bold text-primary">
            {getInitial(admin.full_name)}
          </div>
          <div>
            <div className="text-sm font-bold text-text-primary">{admin.full_name || <span className="italic text-text-secondary/60">Belum diatur</span>}</div>
            <div className="text-xs text-text-secondary">{admin.email}</div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              Email (tidak dapat diubah)
            </label>
            <input
              type="text"
              disabled
              value={admin.email}
              className="w-full rounded-xl border border-primary/20 bg-gray-50 px-4 py-2.5 text-sm text-text-secondary"
            />
          </div>

          {/* Nama (read-only — dikelola admin itu sendiri) */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              Nama Lengkap <span className="text-[10px] text-text-secondary/60 font-normal">(dikelola oleh admin sendiri)</span>
            </label>
            <input
              type="text"
              disabled
              value={admin.full_name || ""}
              placeholder="Belum diatur"
              className="w-full rounded-xl border border-primary/20 bg-gray-50 px-4 py-2.5 text-sm text-text-secondary"
            />
          </div>

          {/* Role */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              Role
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AdminRole)}
                className="w-full appearance-none rounded-xl border border-primary/20 bg-white px-4 py-2.5 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              >
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/60" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-primary/20 py-2.5 text-sm font-semibold text-text-secondary hover:bg-secondary/40 cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 cursor-pointer transition-colors"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isSaving ? "Menyimpan..." : "Simpan Role"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

interface DeleteConfirmModalProps {
  admin: AdminUserExtended;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function DeleteConfirmModal({ admin, isDeleting, onConfirm, onClose }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!isDeleting ? onClose : undefined} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
      >
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-7 w-7 text-red-500" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h3 className="font-heading text-lg font-bold text-text-primary">Hapus Akun Permanen?</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Anda akan menghapus akun{" "}
            <span className="font-bold text-text-primary">{admin.full_name}</span>
            {" "}secara permanen.
          </p>
          <p className="mt-1 text-xs text-red-600 font-semibold">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        {/* Warning box */}
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <ul className="space-y-1">
            <li>• Akun akan dihapus dari sistem autentikasi.</li>
            <li>• Seluruh data profil admin akan terhapus permanen.</li>
            <li>• Akun ini tidak dapat dipulihkan kembali.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 rounded-xl border border-primary/20 py-2.5 text-sm font-semibold text-text-secondary hover:bg-secondary/40 cursor-pointer transition-colors disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60 cursor-pointer transition-colors"
          >
            {isDeleting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Trash2 className="h-4 w-4" />}
            {isDeleting ? "Menghapus..." : "Ya, Hapus Permanen"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminManagementPage() {
  const [admins, setAdmins]       = useState<AdminUserExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [showAddModal, setShowAddModal]   = useState(false);
  const [editTarget, setEditTarget]       = useState<AdminUserExtended | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<AdminUserExtended | null>(null);
  const [isDeleting, setIsDeleting]       = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);

  // ── Utilities ────────────────────────────────────────────────────────────

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await adminRepository.getAllAdmins();
      setAdmins(list);
    } catch {
      showToast("error", "Gagal memuat daftar admin.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filtered List ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return admins;
    return admins.filter(
      (a) =>
        (a.full_name ?? "").toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q)
    );
  }, [admins, searchQuery]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleToggleActive = async (admin: AdminUserExtended) => {
    const newState = !admin.is_active;
    const res = await adminRepository.toggleActive(admin.id, newState);
    if (!res.success) {
      showToast("error", res.error || "Gagal mengubah status.");
      return;
    }
    setAdmins((prev) =>
      prev.map((a) => (a.id === admin.id ? { ...a, is_active: newState } : a))
    );
    showToast("success", `Admin "${admin.full_name || admin.email}" ${newState ? "diaktifkan" : "dinonaktifkan"}.`);
  };

  const handleResetPassword = async (admin: AdminUserExtended) => {
    const res = await adminRepository.sendPasswordReset(admin.email);
    if (!res.success) {
      showToast("error", res.error || "Gagal mengirim email reset.");
      return;
    }
    showToast("success", `Email reset password dikirim ke ${admin.email}`);
  };

  const handleDeleteAdmin = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await adminRepository.deleteAdmin(deleteTarget.id);
      if (!res.success) {
        showToast("error", res.error || "Gagal menghapus admin.");
        return;
      }
      setAdmins((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      showToast("success", `Akun admin "${deleteTarget.full_name || deleteTarget.email}" berhasil dihapus permanen.`);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Stat Cards ────────────────────────────────────────────────────────────

  const totalActive    = admins.filter((a) => a.is_active).length;
  const totalSuperAdmin = admins.filter((a) => a.role === "superadmin").length;
  const totalAdmin     = admins.filter((a) => a.role === "admin").length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 font-body">
      <Toast toast={toast} />

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AddAdminModal
            onClose={() => setShowAddModal(false)}
            onSuccess={(msg) => { showToast("success", msg); loadData(); }}
            onError={(msg) => showToast("error", msg)}
          />
        )}
        {editTarget && (
          <EditAdminModal
            admin={editTarget}
            onClose={() => setEditTarget(null)}
            onSuccess={(updated) => {
              setAdmins((prev) =>
                prev.map((a) =>
                  a.id === editTarget.id ? { ...a, ...updated } : a
                )
              );
              showToast("success", "Profil admin berhasil diupdate.");
              setEditTarget(null);
            }}
            onError={(msg) => showToast("error", msg)}
          />
        )}
        {deleteTarget && (
          <DeleteConfirmModal
            admin={deleteTarget}
            isDeleting={isDeleting}
            onConfirm={handleDeleteAdmin}
            onClose={() => !isDeleting && setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-primary/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Manajemen Admin
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Kelola akun admin, ubah role, aktifkan / nonaktifkan, dan reset password.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold">Hanya Super Admin</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 cursor-pointer transition-colors shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Tambah Admin
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Admin", value: admins.length, color: "bg-primary/10 text-primary", Icon: Users },
          { label: "Aktif",       value: totalActive,    color: "bg-emerald-100 text-emerald-700", Icon: ShieldCheck },
          { label: "Super Admin", value: totalSuperAdmin, color: "bg-purple-100 text-purple-700", Icon: Crown },
          { label: "Admin",       value: totalAdmin,     color: "bg-blue-100 text-blue-700", Icon: User },
        ].map(({ label, value, color, Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-white p-4 shadow-xs"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-text-primary leading-none">{value}</div>
              <div className="mt-0.5 text-[11px] text-text-secondary">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama, email, atau role..."
          className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
        />
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Memuat daftar admin...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-primary/10 bg-white p-16 text-center shadow-xs">
          <Users className="mx-auto mb-3 h-12 w-12 text-primary/20" />
          <p className="font-semibold text-text-secondary">
            {searchQuery ? "Tidak ada admin yang cocok." : "Belum ada admin terdaftar."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-secondary/30 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  <th className="px-5 py-3.5">Admin</th>
                  <th className="px-5 py-3.5 text-center">Role</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5">Bergabung</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {filtered.map((admin) => (
                  <tr
                    key={admin.id}
                    className="transition-colors hover:bg-secondary/20"
                  >
                    {/* Admin Info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
                          {getInitial(admin.full_name)}
                        </div>
                        <div>
                          <div className="font-bold text-text-primary leading-tight">
                            {admin.full_name}
                          </div>
                          <div className="text-xs text-text-secondary">{admin.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4 text-center">
                      <RoleBadge role={admin.role} />
                    </td>

                    {/* Status Toggle */}
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(admin)}
                        className="mx-auto flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-80"
                        title={admin.is_active ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan"}
                      >
                        {admin.is_active ? (
                          <>
                            <ToggleRight className="h-5 w-5 text-emerald-600" />
                            <span className="text-[11px] font-bold text-emerald-600">Aktif</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                            <span className="text-[11px] font-bold text-gray-400">Nonaktif</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Tanggal */}
                    <td className="px-5 py-4 text-xs text-text-secondary">
                      {formatDate(admin.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => setEditTarget(admin)}
                          title="Edit profil & role"
                          className="rounded-xl bg-primary/10 p-2 text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Reset Password */}
                        <button
                          type="button"
                          onClick={() => handleResetPassword(admin)}
                          title="Kirim email reset password"
                          className="rounded-xl bg-amber-100 p-2 text-amber-600 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>

                        {/* Toggle Active (icon) */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(admin)}
                          title={admin.is_active ? "Nonaktifkan akun" : "Aktifkan akun"}
                          className={`rounded-xl p-2 transition-colors cursor-pointer ${
                            admin.is_active
                              ? "bg-red-100 text-red-600 hover:bg-red-500 hover:text-white"
                              : "bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                          }`}
                        >
                          {admin.is_active
                            ? <ShieldOff className="h-3.5 w-3.5" />
                            : <ShieldCheck className="h-3.5 w-3.5" />}
                        </button>

                        {/* Delete — hanya tampil jika akun nonaktif */}
                        {!admin.is_active && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(admin)}
                            title="Hapus akun permanen"
                            className="rounded-xl bg-red-100 p-2 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-primary/10 px-5 py-3 text-xs text-text-secondary">
            Menampilkan {filtered.length} dari {admins.length} admin
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-700">
        <div className="mb-1 flex items-center gap-2 font-bold">
          <ShieldCheck className="h-3.5 w-3.5" />
          Informasi Keamanan
        </div>
        <ul className="space-y-1 text-blue-600">
          <li>• Reset password mengirim email ke admin terkait via Supabase Auth.</li>
          <li>• Nonaktifkan akun akan memblokir akses admin meski session masih aktif.</li>
          <li>• Hanya Super Admin yang dapat mengelola admin lain dan mengubah role.</li>
          <li>• Tombol hapus (🗑) hanya muncul pada akun yang sudah dinonaktifkan.</li>
        </ul>
      </div>
    </div>
  );
}
