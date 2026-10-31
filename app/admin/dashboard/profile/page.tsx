/**
 * @file app/admin/dashboard/profile/page.tsx
 * Halaman Profil Admin — Self-Service
 * Route: /admin/dashboard/profile
 *
 * Admin yang login dapat:
 *  - Melihat informasi akun (email, role, status)
 *  - Mengubah nama lengkap sendiri
 *  - Upload foto profil baru
 *  - Mengganti foto profil
 *  - Menghapus foto profil
 *
 * Semua operasi hanya berlaku untuk diri sendiri (auth.uid()).
 */

"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Camera, Trash2, Save, CheckCircle2, AlertTriangle,
  Loader2, X, ShieldCheck, Crown, Mail, Calendar,
} from "lucide-react";
import {
  adminRepository,
  uploadAndSaveProfilePhoto,
  deleteProfilePhoto,
} from "@/src/lib/adminRepository";
import { ROLE_LABELS, ROLE_COLORS } from "@/src/lib/adminPermissions";
import { useAdminProfile } from "@/src/hooks/useAdminProfile";

// ─── Toast ───────────────────────────────────────────────────────────────────

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

// ─── Avatar Section ───────────────────────────────────────────────────────────

interface AvatarSectionProps {
  avatarUrl: string | null;
  fullName: string | null;
  onAvatarChange: (newUrl: string) => void;
  onAvatarDelete: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

function AvatarSection({
  avatarUrl,
  fullName,
  onAvatarChange,
  onAvatarDelete,
  onError,
  onSuccess,
}: AvatarSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const isValidUrl = (url: string | null | undefined): url is string =>
    !!url &&
    url !== "NULL" &&
    url !== "null" &&
    url.trim() !== "" &&
    (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"));

  const displayName = fullName || "?";
  const initial = displayName.charAt(0).toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi sisi client (cepat)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      onError("Format tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError("Ukuran foto maksimal 5 MB.");
      return;
    }

    // Tampilkan preview dulu
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploadingPhoto(true);
    try {
      const result = await uploadAndSaveProfilePhoto(file);
      if (!result.success) {
        setPreview(null);
        onError(result.error || "Gagal mengupload foto profil.");
        return;
      }
      const newUrl = (result.data as { avatarUrl: string })?.avatarUrl;
      if (newUrl) onAvatarChange(newUrl);
      onSuccess("Foto profil berhasil diperbarui.");
    } finally {
      setIsUploadingPhoto(false);
      setPreview(null);
      // Reset input supaya file yang sama bisa dipilih lagi
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!avatarUrl) return;
    setIsDeletingPhoto(true);
    try {
      const result = await deleteProfilePhoto();
      if (!result.success) {
        onError(result.error || "Gagal menghapus foto profil.");
        return;
      }
      onAvatarDelete();
      onSuccess("Foto profil berhasil dihapus.");
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const displayUrl = preview || (isValidUrl(avatarUrl) ? avatarUrl : null);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar */}
      <div className="relative">
        <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-primary/20 bg-primary/5 shadow-lg">
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt={displayName}
              fill
              sizes="112px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-heading text-4xl font-bold">
              {initial}
            </div>
          )}

          {/* Loading overlay */}
          {isUploadingPhoto && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Tombol Camera */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingPhoto || isDeletingPhoto}
          className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          title="Ganti foto profil"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingPhoto || isDeletingPhoto}
          className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Camera className="h-3.5 w-3.5" />
          {avatarUrl ? "Ganti Foto" : "Upload Foto"}
        </button>

        {avatarUrl && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isUploadingPhoto || isDeletingPhoto}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isDeletingPhoto
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Trash2 className="h-3.5 w-3.5" />}
            Hapus Foto
          </button>
        )}
      </div>

      <p className="text-center text-[11px] text-text-secondary/60">
        JPG, PNG, WEBP, GIF · Maks. 5 MB
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { profile, isLoading } = useAdminProfile();

  const [fullName, setFullName] = useState<string>("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Inisialisasi form dari profil (hanya sekali)
  const initRef = useRef(false);
  if (profile && !initRef.current) {
    initRef.current = true;
    setFullName(profile.full_name || "");
    setCurrentAvatarUrl(profile.avatar_url);
    setInitialized(true);
  }

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      showToast("error", "Nama lengkap minimal 2 karakter.");
      return;
    }
    setIsSavingName(true);
    try {
      const res = await adminRepository.updateMyName(fullName.trim());
      if (!res.success) throw new Error(res.error);
      showToast("success", "Nama lengkap berhasil diperbarui.");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Gagal menyimpan nama.");
    } finally {
      setIsSavingName(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-text-secondary">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span>Memuat profil...</span>
      </div>
    );
  }

  const roleLabel  = ROLE_LABELS[profile.role];
  const roleColors = ROLE_COLORS[profile.role];

  return (
    <div className="space-y-6 font-body">
      <Toast toast={toast} />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="border-b border-primary/10 pb-5">
        <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
          Profil Saya
        </h1>
        <p className="mt-1 text-xs text-text-secondary sm:text-sm">
          Kelola nama lengkap dan foto profil akun Anda.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* ── Kolom Kiri: Avatar + Info Akun ───────────────────────────────── */}
        <div className="space-y-4">
          {/* Avatar Card */}
          <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs">
            <AvatarSection
              avatarUrl={initialized ? currentAvatarUrl : profile.avatar_url}
              fullName={profile.full_name}
              onAvatarChange={(url) => setCurrentAvatarUrl(url)}
              onAvatarDelete={() => setCurrentAvatarUrl(null)}
              onError={(msg) => showToast("error", msg)}
              onSuccess={(msg) => showToast("success", msg)}
            />
          </div>

          {/* Info Akun Card */}
          <div className="rounded-3xl border border-primary/10 bg-white p-5 shadow-xs space-y-3">
            <h2 className="font-heading text-sm font-bold text-text-primary">Informasi Akun</h2>

            {/* Email */}
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary/60">Email</p>
                <p className="mt-0.5 text-xs font-medium text-text-primary break-all">{profile.email}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {profile.role === "superadmin" ? <Crown className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary/60">Role</p>
                <span
                  className={`mt-0.5 inline-block rounded px-1.5 py-0.5 font-body text-[10px] font-semibold border ${roleColors.bg} ${roleColors.text} ${roleColors.border}`}
                >
                  {roleLabel}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary/60">Status</p>
                <p className="mt-0.5 text-xs font-medium text-emerald-600">Aktif</p>
              </div>
            </div>

            {/* Catatan role tidak bisa diubah */}
            <p className="mt-1 text-[10px] leading-relaxed text-text-secondary/50">
              Role ditentukan oleh Super Admin dan tidak dapat diubah sendiri.
            </p>
          </div>
        </div>

        {/* ── Kolom Kanan: Form Edit Profil ─────────────────────────────────── */}
        <div className="space-y-4">
          {/* Nama Lengkap */}
          <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs">
            <h2 className="mb-4 font-heading text-base font-bold text-text-primary">
              Nama Lengkap
            </h2>

            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label
                  htmlFor="full-name-input"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary"
                >
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/60" />
                  <input
                    id="full-name-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                    minLength={2}
                    maxLength={150}
                    className="w-full rounded-xl border border-primary/20 bg-background py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <p className="mt-1 text-[11px] text-text-secondary/60">
                  Minimal 2 karakter. Maksimal 150 karakter.
                </p>
              </div>

              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSavingName || fullName.trim().length < 2}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 focus:outline-none disabled:opacity-60 cursor-pointer"
                >
                  {isSavingName
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Save className="h-4 w-4" />}
                  {isSavingName ? "Menyimpan..." : "Simpan Nama"}
                </motion.button>
              </div>
            </form>
          </div>

          {/* Keamanan */}
          <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-xs">
            <h2 className="mb-1 font-heading text-base font-bold text-text-primary">Keamanan</h2>
            <p className="mb-4 text-xs text-text-secondary">
              Untuk mengubah kata sandi, gunakan tautan reset password yang dikirim ke email Anda.
            </p>
            <button
              type="button"
              onClick={async () => {
                const res = await adminRepository.sendPasswordReset(profile.email);
                if (res.success) {
                  showToast("success", "Email reset password telah dikirim ke " + profile.email);
                } else {
                  showToast("error", res.error || "Gagal mengirim email reset password.");
                }
              }}
              className="flex items-center gap-2 rounded-xl border border-primary/20 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
              Kirim Link Reset Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
