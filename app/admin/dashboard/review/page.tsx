/**
 * @file app/admin/dashboard/review/page.tsx
 * Halaman Manajemen Ulasan & Rating (Review Management) — FASE 4.5.1
 * ATURAN MUTLAK: Admin TIDAK BOLEH mengubah rating dari pelanggan.
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, MessageSquare, Search, Eye, EyeOff, Trash2, Reply,
  CheckCircle2, AlertTriangle, Loader2, X, Filter, User, Package
} from "lucide-react";
import { reviewRepository } from "@/src/lib/reviewRepository";
import type { ReviewWithDetails } from "@/src/types/ops";
import { useToast } from "@/src/context/ToastContext";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import BulkActionBar from "@/src/components/ui/BulkActionBar";
import { TableSkeleton } from "@/src/components/ui/Skeleton";
import EmptyState from "@/src/components/ui/EmptyState";

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

export default function AdminReviewPage() {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [stats, setStats] = useState({ total: 0, averageRating: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  // Modals state
  const [replyReviewItem, setReplyReviewItem] = useState<ReviewWithDetails | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [list, st] = await Promise.all([
        reviewRepository.getAll(),
        reviewRepository.getStats(),
      ]);
      setReviews(list);
      setStats(st);
    } catch {
      showToast("error", "Gagal memuat data ulasan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filter
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        r.product_name?.toLowerCase().includes(q) ||
        r.customer_name?.toLowerCase().includes(q) ||
        r.content?.toLowerCase().includes(q);

      const matchRating = ratingFilter === "all" || String(r.rating) === ratingFilter;
      return matchSearch && matchRating;
    });
  }, [reviews, searchQuery, ratingFilter]);

  // Actions
  const handleToggleApproval = async (r: ReviewWithDetails) => {
    try {
      const res = await reviewRepository.toggleApproval(r.id, !r.is_approved);
      if (!res.success) throw new Error(res.error);
      showToast("success", `Ulasan ${r.is_approved ? "disembunyikan" : "ditampilkan"} di website.`);
      await loadData();
    } catch {
      showToast("error", "Gagal mengubah status visibilitas ulasan.");
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyReviewItem || !replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      const res = await reviewRepository.replyReview(replyReviewItem.id, replyText);
      if (!res.success) throw new Error(res.error);
      showToast("success", "Balasan ulasan berhasil disimpan!");
      setReplyReviewItem(null);
      setReplyText("");
      await loadData();
    } catch {
      showToast("error", "Gagal menyimpan balasan ulasan.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await reviewRepository.deleteReview(id);
      if (!res.success) throw new Error(res.error);
      showToast("success", "Ulasan berhasil dihapus.");
      setDeleteReviewId(null);
      await loadData();
    } catch {
      showToast("error", "Gagal menghapus ulasan.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-body">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className={`fixed top-5 right-5 z-[200] flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg ${
              toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">Manajemen Review</h1>
          <p className="text-xs text-text-secondary sm:text-sm mt-1">
            Kelola tanggapan admin, sembunyikan/tampilkan ulasan pelanggan di website. (Rating pelanggan tidak dapat diubah).
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-primary/10 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <Star className="h-6 w-6 fill-amber-400 text-amber-500" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-secondary uppercase">Rating Rata-rata</span>
            <div className="font-heading text-2xl font-black text-text-primary">{stats.averageRating} / 5.0</div>
          </div>
        </div>

        <div className="rounded-3xl border border-primary/10 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-secondary uppercase">Total Review Terdaftar</span>
            <div className="font-heading text-2xl font-black text-text-primary">{stats.total} Ulasan</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Produk, Pelanggan, atau Isi Review..."
            className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="rounded-xl border border-primary/20 bg-white py-2.5 px-3 text-xs font-semibold focus:border-primary focus:outline-none"
        >
          <option value="all">Semua Rating Bintang</option>
          <option value="5">5 Bintang (Sangat Puas)</option>
          <option value="4">4 Bintang (Puas)</option>
          <option value="3">3 Bintang (Cukup)</option>
          <option value="2">2 Bintang (Kurang)</option>
          <option value="1">1 Bintang (Kecewa)</option>
        </select>
      </div>

      {/* Review Cards List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Memuat daftar review...</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center text-sm text-text-secondary">
          <MessageSquare className="mx-auto h-12 w-12 text-primary/30 mb-3" />
          <p className="font-semibold">Tidak ada review yang cocok.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl border bg-white p-5 shadow-xs transition-all space-y-3 ${
                r.is_approved ? "border-primary/10" : "border-amber-200 bg-amber-50/20"
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary text-sm flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-primary" /> {r.customer_name}
                    </span>
                    <span className="text-xs text-text-secondary">• {formatDate(r.created_at)}</span>
                  </div>
                  <div className="text-xs font-semibold text-primary flex items-center gap-1 mt-0.5">
                    <Package className="h-3.5 w-3.5" /> Produk: {r.product_name}
                  </div>
                </div>

                {/* Rating Stars (Readonly - Admin cannot modify) */}
                <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                    />
                  ))}
                  <span className="text-xs font-bold text-amber-700 ml-1">{r.rating}.0</span>
                </div>
              </div>

              {/* Review Content */}
              <p className="text-xs sm:text-sm text-text-primary leading-relaxed bg-secondary/10 p-3.5 rounded-2xl">
                {r.content || "Pelanggan memberikan rating tanpa ulasan teks."}
              </p>

              {/* Admin Reply Section if exists */}
              {r.admin_reply && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs space-y-1">
                  <span className="font-bold text-primary flex items-center gap-1">
                    <Reply className="h-3.5 w-3.5" /> Balasan Resmi Admin Toko:
                  </span>
                  <p className="text-text-primary">{r.admin_reply}</p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-primary/10 pt-3 text-xs">
                <span className={`font-semibold ${r.is_approved ? "text-emerald-600" : "text-amber-600"}`}>
                  Status: {r.is_approved ? "Tampil di Website" : "Disembunyikan"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setReplyReviewItem(r); setReplyText(r.admin_reply || ""); }}
                    className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 font-semibold text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                  >
                    <Reply className="h-3.5 w-3.5" />
                    <span>{r.admin_reply ? "Edit Balasan" : "Balas Review"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleApproval(r)}
                    className={`flex items-center gap-1 rounded-xl px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                      r.is_approved ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                  >
                    {r.is_approved ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    <span>{r.is_approved ? "Sembunyikan" : "Tampilkan"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteReviewId(r.id)}
                    className="rounded-xl p-1.5 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* REPLY MODAL */}
      <AnimatePresence>
        {replyReviewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setReplyReviewItem(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-lg w-full rounded-3xl bg-white p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                <h3 className="font-heading text-base font-bold text-text-primary">Balas Ulasan Pelanggan</h3>
                <button type="button" onClick={() => setReplyReviewItem(null)} className="rounded-xl p-1 text-text-secondary hover:bg-primary/10">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="text-xs bg-secondary/20 p-3 rounded-2xl text-text-secondary">
                <strong className="text-text-primary">{replyReviewItem.customer_name}:</strong> &quot;{replyReviewItem.content}&quot;
              </div>

              <form onSubmit={handleSendReply} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Pesan Balasan Admin</label>
                  <textarea
                    rows={4}
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Tuliskan apresiasi atau tanggapan resmi dari toko..."
                    className="w-full rounded-xl border border-primary/20 p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-primary/10 pt-3">
                  <button type="button" onClick={() => setReplyReviewItem(null)} className="rounded-xl border border-primary/20 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-secondary/40">Batal</button>
                  <button type="submit" disabled={isSubmittingReply} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60">
                    {isSubmittingReply && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan Balasan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteReviewId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => !isDeleting && setDeleteReviewId(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-text-primary">Hapus Ulasan Ini?</h3>
              <p className="mt-1 font-body text-xs text-text-secondary">Ulasan pelanggan akan dihapus secara permanen.</p>
              <div className="mt-6 flex justify-center gap-3">
                <button type="button" onClick={() => setDeleteReviewId(null)} disabled={isDeleting} className="rounded-xl border border-primary/20 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-secondary/40 disabled:opacity-50">Batal</button>
                <button type="button" onClick={() => handleDelete(deleteReviewId)} disabled={isDeleting} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-700 disabled:opacity-60">
                  {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
