/**
 * @file app/admin/dashboard/pembayaran/page.tsx
 * Halaman Manajemen Rekening Bank — Admin Dashboard
 * Route: /admin/dashboard/pembayaran
 *
 * Admin dapat:
 *  - Melihat daftar seluruh rekening bank (aktif + nonaktif)
 *  - Menambahkan rekening bank baru
 *  - Mengedit rekening bank existing
 *  - Mengaktifkan / menonaktifkan rekening
 *  - Menghapus rekening bank
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  Building2,
  Hash,
  User,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type { BankAccount } from "@/src/lib/bankAccountRepository";

// ─── Type ─────────────────────────────────────────────────────────────────────

interface BankFormData {
  bank_name: string;
  account_name: string;
  account_number: string;
  is_active: boolean;
  display_order: number;
}

const EMPTY_FORM: BankFormData = {
  bank_name: "",
  account_name: "",
  account_number: "",
  is_active: true,
  display_order: 0,
};

// ─── Toast Helper ─────────────────────────────────────────────────────────────

type ToastType = "success" | "error";

interface Toast {
  type: ToastType;
  msg: string;
}

// ─── Komponen Utama ───────────────────────────────────────────────────────────

export default function AdminPembayaranPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  // Modal state
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<BankAccount | null>(null);
  const [form, setForm] = useState<BankFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<BankFormData>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Toast helper ────────────────────────────────────────────────────────
  const showToast = (type: ToastType, msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Load accounts ───────────────────────────────────────────────────────
  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/bank-accounts");
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      setAccounts(data.accounts ?? []);
    } catch {
      showToast("error", "Gagal memuat daftar rekening bank.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // ─── Form Validation ─────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Partial<BankFormData> = {};
    if (!form.bank_name.trim()) errors.bank_name = "Nama bank wajib diisi";
    if (!form.account_name.trim()) errors.account_name = "Nama pemilik rekening wajib diisi";
    if (!form.account_number.trim()) errors.account_number = "Nomor rekening wajib diisi";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── Open Modal Create ───────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditTarget(null);
    setModalMode("create");
  };

  // ─── Open Modal Edit ─────────────────────────────────────────────────────
  const openEdit = (account: BankAccount) => {
    setForm({
      bank_name: account.bank_name,
      account_name: account.account_name,
      account_number: account.account_number,
      is_active: account.is_active,
      display_order: account.display_order,
    });
    setFormErrors({});
    setEditTarget(account);
    setModalMode("edit");
  };

  // ─── Close Modal ─────────────────────────────────────────────────────────
  const closeModal = () => {
    setModalMode(null);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  // ─── Save (Create / Edit) ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      if (modalMode === "create") {
        const res = await fetch("/api/admin/bank-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bank_name: form.bank_name.trim(),
            account_name: form.account_name.trim(),
            account_number: form.account_number.trim(),
            is_active: form.is_active,
            display_order: form.display_order,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");
        showToast("success", "Rekening bank berhasil ditambahkan.");
      } else if (modalMode === "edit" && editTarget) {
        const res = await fetch(`/api/admin/bank-accounts/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bank_name: form.bank_name.trim(),
            account_name: form.account_name.trim(),
            account_number: form.account_number.trim(),
            is_active: form.is_active,
            display_order: form.display_order,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Gagal mengupdate");
        showToast("success", "Rekening bank berhasil diperbarui.");
      }
      closeModal();
      loadAccounts();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Toggle Active ───────────────────────────────────────────────────────
  const handleToggleActive = async (account: BankAccount) => {
    try {
      const res = await fetch(`/api/admin/bank-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !account.is_active }),
      });
      if (!res.ok) throw new Error();
      showToast(
        "success",
        account.is_active
          ? `Rekening ${account.bank_name} dinonaktifkan.`
          : `Rekening ${account.bank_name} diaktifkan.`
      );
      loadAccounts();
    } catch {
      showToast("error", "Gagal mengubah status rekening.");
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/bank-accounts/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      showToast("success", `Rekening ${deleteTarget.bank_name} berhasil dihapus.`);
      setDeleteTarget(null);
      loadAccounts();
    } catch {
      showToast("error", "Gagal menghapus rekening bank.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Input change ────────────────────────────────────────────────────────
  const handleFormChange = (field: keyof BankFormData, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const inputCls = (field: keyof typeof formErrors) =>
    `w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
      formErrors[field]
        ? "border-rose-400 bg-rose-50/30 focus:ring-1 focus:ring-rose-400"
        : "border-primary/20 bg-white focus:border-primary focus:ring-1 focus:ring-primary"
    }`;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 font-body">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`fixed right-5 top-5 z-[200] flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg ${
              toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-primary/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Rekening Bank
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Kelola rekening bank tujuan transfer untuk pembayaran TRANSFER_BANK.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadAccounts}
            className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-white px-3 py-2 text-xs font-semibold hover:bg-secondary/40 cursor-pointer transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Tambah Rekening
          </button>
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed">
          Rekening <strong>aktif</strong> akan ditampilkan kepada customer saat memilih Transfer Bank.
          Rekening <strong>nonaktif</strong> disembunyikan dari customer namun tetap tersimpan di database.
        </p>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center gap-3 text-sm text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Memuat daftar rekening bank...</span>
        </div>
      ) : accounts.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-white py-16 px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CreditCard className="h-7 w-7" />
          </div>
          <h3 className="font-heading text-base font-bold text-text-primary">
            Belum Ada Rekening Bank
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Tambahkan rekening bank agar customer dapat melakukan Transfer Bank.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-5 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Tambah Rekening
          </button>
        </div>
      ) : (
        /* Table */
        <div className="overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-xs">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-secondary/30 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                  <th className="px-5 py-3.5">Bank</th>
                  <th className="px-5 py-3.5">Pemilik Rekening</th>
                  <th className="px-5 py-3.5">Nomor Rekening</th>
                  <th className="px-5 py-3.5">Urutan</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-5 py-4 font-bold text-text-primary">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                          {acc.bank_name.slice(0, 3).toUpperCase()}
                        </div>
                        {acc.bank_name}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">{acc.account_name}</td>
                    <td className="px-5 py-4 font-mono font-semibold text-text-primary tracking-wider">
                      {acc.account_number}
                    </td>
                    <td className="px-5 py-4 text-text-secondary text-center">{acc.display_order}</td>
                    <td className="px-5 py-4">
                      {acc.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 border border-gray-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title={acc.is_active ? "Nonaktifkan" : "Aktifkan"}
                          onClick={() => handleToggleActive(acc)}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                            acc.is_active
                              ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {acc.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {acc.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openEdit(acc)}
                          className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-secondary/40 transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          title="Hapus"
                          onClick={() => setDeleteTarget(acc)}
                          className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-primary/5">
            {accounts.map((acc) => (
              <div key={acc.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-black">
                      {acc.bank_name.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-text-primary">{acc.bank_name}</p>
                      <p className="text-xs text-text-secondary">{acc.account_name}</p>
                    </div>
                  </div>
                  {acc.is_active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500 border border-gray-200">
                      Nonaktif
                    </span>
                  )}
                </div>
                <p className="font-mono text-sm font-semibold text-text-primary tracking-wider">
                  {acc.account_number}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(acc)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      acc.is_active
                        ? "border border-amber-200 bg-amber-50 text-amber-700"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {acc.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {acc.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(acc)}
                    className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-white px-3 py-2 text-xs font-semibold text-text-primary cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(acc)}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal Create / Edit ──────────────────────────────────────────── */}
      <AnimatePresence>
        {modalMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-md rounded-3xl bg-[#FDFBF7] shadow-2xl border border-primary/10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-primary/10 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <h2 className="font-heading text-lg font-bold text-text-primary">
                    {modalMode === "create" ? "Tambah Rekening Bank" : "Edit Rekening Bank"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl p-2 text-text-secondary hover:bg-secondary/40 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Nama Bank */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text-primary">
                    Nama Bank <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={form.bank_name}
                      onChange={(e) => handleFormChange("bank_name", e.target.value)}
                      placeholder="Contoh: BCA, Mandiri, BRI, BNI"
                      maxLength={100}
                      className={inputCls("bank_name")}
                    />
                  </div>
                  {formErrors.bank_name && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.bank_name}</p>
                  )}
                </div>

                {/* Nama Pemilik */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text-primary">
                    Nama Pemilik Rekening <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={form.account_name}
                      onChange={(e) => handleFormChange("account_name", e.target.value)}
                      placeholder="Nama sesuai buku tabungan"
                      maxLength={200}
                      className={inputCls("account_name")}
                    />
                  </div>
                  {formErrors.account_name && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.account_name}</p>
                  )}
                </div>

                {/* Nomor Rekening */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text-primary">
                    Nomor Rekening <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-primary">
                      <Hash className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={form.account_number}
                      onChange={(e) => handleFormChange("account_number", e.target.value)}
                      placeholder="Contoh: 1234567890"
                      className={`${inputCls("account_number")} font-mono tracking-wider`}
                    />
                  </div>
                  {formErrors.account_number && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.account_number}</p>
                  )}
                  <p className="mt-1 text-[11px] text-text-secondary">
                    Nomor rekening disimpan sebagai teks. Leading zero tidak akan hilang.
                  </p>
                </div>

                {/* Urutan Tampil */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-text-primary">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.display_order}
                    onChange={(e) => handleFormChange("display_order", parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-text-secondary">
                    Angka lebih kecil = tampil lebih awal. Default: 0.
                  </p>
                </div>

                {/* Status Aktif */}
                <div className={`flex items-center justify-between rounded-2xl border p-4 transition-colors ${
                  form.is_active ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50"
                }`}>
                  <div>
                    <p className="text-sm font-bold text-text-primary">Status Rekening</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {form.is_active ? "Aktif — ditampilkan kepada customer" : "Nonaktif — disembunyikan dari customer"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFormChange("is_active", !form.is_active)}
                    className={`relative flex h-7 w-14 items-center rounded-full transition-all cursor-pointer ${
                      form.is_active ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                  >
                    <motion.span
                      animate={{ x: form.is_active ? 28 : 2 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="h-5 w-5 rounded-full bg-white shadow-md"
                    />
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-primary/10 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-primary/20 bg-white px-4 py-2 text-sm font-semibold text-text-primary hover:bg-secondary/40 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Konfirmasi Hapus ───────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteTarget(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-rose-100"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-text-primary mb-1">
                Hapus Rekening Bank?
              </h3>
              <p className="text-sm text-text-secondary mb-2">
                Rekening berikut akan dihapus secara permanen:
              </p>
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 mb-5">
                <p className="font-bold text-sm text-text-primary">{deleteTarget.bank_name}</p>
                <p className="text-xs text-text-secondary">{deleteTarget.account_name}</p>
                <p className="font-mono text-xs font-semibold text-text-primary mt-0.5 tracking-wider">
                  {deleteTarget.account_number}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-text-primary hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-600 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {isDeleting ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
