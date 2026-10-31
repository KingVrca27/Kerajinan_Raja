/**
 * @file app/admin/dashboard/pesanan/page.tsx
 * Halaman Manajemen Pesanan (Order Management) — FASE 4.5.1
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, ShoppingBag, Eye, Printer, FileSpreadsheet, FileText,
  CheckCircle2, AlertTriangle, Loader2, ArrowUpDown, ChevronLeft, ChevronRight,
  X, Truck, Clock, PackageCheck, Ban, Calendar, User, Phone, MapPin, CreditCard, Tag, Trash2
} from "lucide-react";
import { orderRepository } from "@/src/lib/orderRepository";
import type { OrderWithDetails, OrderStatus } from "@/src/types/ops";

// ---------------------------------------------------------------------------
// CONSTANTS & HELPERS
// ---------------------------------------------------------------------------

const STATUS_BADGES: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:    { label: "Baru",       color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  confirmed:  { label: "Dikonfirmasi", color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: CheckCircle2 },
  processing: { label: "Diproses",   color: "bg-amber-50 text-amber-700 border-amber-200", icon: Loader2 },
  shipped:    { label: "Dikirim",    color: "bg-purple-50 text-purple-700 border-purple-200", icon: Truck },
  delivered:  { label: "Selesai",    color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: PackageCheck },
  cancelled:  { label: "Dibatalkan", color: "bg-red-50 text-red-700 border-red-200", icon: Ban },
  refunded:   { label: "Direfund",   color: "bg-gray-50 text-gray-700 border-gray-200", icon: Ban },
};

function formatRupiah(num: number): string {
  return "Rp " + Number(num || 0).toLocaleString("id-ID");
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

export default function AdminPesananPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"created_at" | "total">("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<OrderWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await orderRepository.getAll();
      setOrders(data);
    } catch {
      showToast("error", "Gagal memuat daftar pesanan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filter & Sort
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_email?.toLowerCase().includes(q);

      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => {
      let valA = sortField === "created_at" ? new Date(a.created_at).getTime() : a.total;
      let valB = sortField === "created_at" ? new Date(b.created_at).getTime() : b.total;
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [orders, searchQuery, statusFilter, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    try {
      const result = await orderRepository.updateStatus(selectedOrder.id, newStatus, trackingInput);
      if (!result.success) throw new Error(result.error);
      showToast("success", `Status pesanan #${selectedOrder.order_number} berhasil diperbarui.`);
      
      const updated = await orderRepository.getById(selectedOrder.id);
      if (updated) setSelectedOrder(updated);
      await loadData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal memperbarui status pesanan.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      const result = await orderRepository.deleteOrder(orderToDelete.id);
      if (!result.success) throw new Error(result.error);
      showToast("success", `Pesanan #${orderToDelete.order_number} berhasil dihapus.`);
      setOrderToDelete(null);
      await loadData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal menghapus pesanan.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewProof = async () => {
    if (!selectedOrder?.payment_proof_path) return;
    try {
      const res = await fetch("/api/admin/payment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_proof_path: selectedOrder.payment_proof_path }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.open(data.url, "_blank");
    } catch (err: any) {
      showToast("error", err.message || "Gagal memuat bukti pembayaran.");
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch("/api/admin/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: selectedOrder.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast("success", "Pembayaran berhasil diverifikasi.");
      const updated = await orderRepository.getById(selectedOrder.id);
      if (updated) setSelectedOrder(updated);
      await loadData();
    } catch (err: any) {
      showToast("error", err.message || "Gagal memverifikasi pembayaran.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedOrder) return;
    const reason = prompt("Masukkan alasan penolakan pembayaran:");
    if (!reason) return;
    
    setIsUpdatingStatus(true);
    try {
      const res = await fetch("/api/admin/reject-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: selectedOrder.id, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast("success", "Pembayaran berhasil ditolak.");
      const updated = await orderRepository.getById(selectedOrder.id);
      if (updated) setSelectedOrder(updated);
      await loadData();
    } catch (err: any) {
      showToast("error", err.message || "Gagal menolak pembayaran.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Export functions
  const handleExportCSV = () => {
    const headers = "Invoice,Pelanggan,Email,Total Belanja,Status,Tanggal\n";
    const rows = filteredOrders.map(o => 
      `"${o.order_number}","${o.customer_name}","${o.customer_email}",${o.total},"${o.status}","${o.created_at}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daftar_pesanan_${Date.now()}.csv`;
    a.click();
    showToast("success", "File CSV pesanan berhasil diunduh!");
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-body">
      <div className="print:hidden space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast-alert"
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
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">Manajemen Pesanan</h1>
          <p className="text-xs text-text-secondary sm:text-sm mt-1">
            Kelola transaksi masuk, status pengiriman, timeline, dan cetak invoice pelanggan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-white px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-secondary/40 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search, Filter, Sort */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Cari Invoice atau Nama Pelanggan..."
            className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-primary/20 bg-white py-2.5 px-3 text-xs font-semibold focus:border-primary focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Baru (Pending)</option>
            <option value="confirmed">Dikonfirmasi</option>
            <option value="processing">Diproses</option>
            <option value="shipped">Dikirim</option>
            <option value="delivered">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>

          {/* Sort Button */}
          <button
            type="button"
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-white py-2.5 px-3 text-xs font-semibold text-text-primary hover:bg-primary/5 cursor-pointer"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
            <span>{sortAsc ? "Terlama" : "Terbaru"}</span>
          </button>
        </div>
      </div>

      {/* TanStack Table UI */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Memuat data pesanan dari Supabase...</span>
        </div>
      ) : paginatedOrders.length === 0 ? (
        <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center text-sm text-text-secondary">
          <ShoppingBag className="mx-auto h-12 w-12 text-primary/30 mb-3" />
          <p className="font-semibold">Tidak ada pesanan ditemukan.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-primary/10 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-secondary/30 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  <th className="py-3.5 px-4">Invoice</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-center">Item</th>
                  <th className="py-3.5 px-4 text-right">Total Belanja</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {paginatedOrders.map((ord) => {
                  const badge = STATUS_BADGES[ord.status] || STATUS_BADGES.pending;
                  const Icon = badge.icon;
                  const totalItemsCount = (ord.items || []).reduce((acc, curr) => acc + curr.quantity, 0);

                  return (
                    <tr key={ord.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">
                        #{ord.order_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-text-primary">{ord.customer_name}</div>
                        <div className="text-xs text-text-secondary">{ord.customer_email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-text-primary">
                        {totalItemsCount} pcs
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-primary">
                        {formatRupiah(ord.total)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${badge.color}`}>
                            <Icon className="h-3 w-3" />
                            <span>{badge.label}</span>
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            ord.payment_status === 'paid' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
                          }`}>
                            {ord.payment_status === 'paid' ? 'Dibayar' : 'Belum Dibayar'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-text-secondary">
                        {formatDate(ord.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setSelectedOrder(ord); setTrackingInput(ord.tracking_number || ""); }}
                            className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Detail</span>
                          </button>
                          {ord.status === "cancelled" && (
                            <button
                              type="button"
                              onClick={() => setOrderToDelete(ord)}
                              className="inline-flex items-center gap-1 rounded-xl bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                              title="Hapus pesanan ini secara permanen"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only sm:not-sr-only">Hapus</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-primary/10 px-6 py-4 text-xs">
            <span className="text-text-secondary">
              Menampilkan {paginatedOrders.length} dari {filteredOrders.length} pesanan
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-primary/20 p-2 text-text-secondary hover:bg-primary/5 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-semibold text-text-primary">Halaman {currentPage} dari {totalPages}</span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl border border-primary/20 p-2 text-text-secondary hover:bg-primary/5 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* DETAIL MODAL + TIMELINE + INVOICE PRINT */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            key="order-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 print:p-0 print:static"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs print:hidden" onClick={() => setSelectedOrder(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative my-8 w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl print:m-0 print:shadow-none print:w-full print:rounded-none print:p-0 print:bg-white"
            >
              {/* === SCREEN ONLY DETAIL VIEW === */}
              <div className="space-y-6 print:hidden">
                {/* Header Modal */}
                <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-text-primary">
                    Detail Pesanan #{selectedOrder.order_number}
                  </h3>
                  <p className="text-xs text-text-secondary">Waktu Transaksi: {formatDate(selectedOrder.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintInvoice}
                    className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-secondary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Cetak Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="rounded-xl p-1 text-text-secondary hover:bg-primary/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Status Update & Timeline */}
              <div className="rounded-2xl bg-secondary/30 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-primary/10">
                  <div>
                    <span className="text-xs font-bold uppercase text-text-secondary block mb-1">Metode Pembayaran</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {selectedOrder.payment_method === 'COD' ? 'COD (Cash on Delivery)' : selectedOrder.payment_method === 'TRANSFER_BANK' ? 'Transfer Bank' : selectedOrder.payment_method || '-'}
                    </span>
                    {selectedOrder.payment_method === 'TRANSFER_BANK' && selectedOrder.bank_accounts && (
                      <div className="mt-1 text-xs text-text-secondary border-t border-primary/5 pt-1">
                        <span className="font-semibold text-text-primary">{selectedOrder.bank_accounts.bank_name}</span> - {selectedOrder.bank_accounts.account_number}<br/>
                        a.n. {selectedOrder.bank_accounts.account_name}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-text-secondary block mb-1">Status Pembayaran</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      selectedOrder.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                      selectedOrder.payment_status === 'unpaid' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedOrder.payment_status === 'paid' ? 'Sudah Dibayar' : selectedOrder.payment_status === 'unpaid' ? 'Belum Dibayar' : selectedOrder.payment_status}
                    </span>
                    {selectedOrder.payment_rejection_reason && (
                      <div className="mt-1 text-xs text-red-600 font-medium">
                        Ditolak: {selectedOrder.payment_rejection_reason}
                      </div>
                    )}
                    {selectedOrder.payment_proof_path && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={handleViewProof}
                          className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3"/> Lihat Bukti
                        </button>
                        {selectedOrder.payment_status === 'unpaid' && (
                          <>
                            <button
                              onClick={handleVerifyPayment}
                              disabled={isUpdatingStatus}
                              className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 disabled:opacity-50"
                            >
                              Verifikasi
                            </button>
                            <button
                              onClick={handleRejectPayment}
                              disabled={isUpdatingStatus}
                              className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 disabled:opacity-50"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <span className="text-xs font-bold uppercase text-text-secondary">Update Status Pesanan</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={isUpdatingStatus || selectedOrder.status === "processing"}
                      onClick={() => handleUpdateStatus("processing")}
                      className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-amber-600 disabled:opacity-50"
                    >
                      Set Diproses
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingStatus || selectedOrder.status === "shipped"}
                      onClick={() => handleUpdateStatus("shipped")}
                      className="rounded-lg bg-purple-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-purple-700 disabled:opacity-50"
                    >
                      Set Dikirim
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingStatus || selectedOrder.status === "delivered"}
                      onClick={() => handleUpdateStatus("delivered")}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Set Selesai
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingStatus || selectedOrder.status === "cancelled"}
                      onClick={() => handleUpdateStatus("cancelled")}
                      className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-red-700 disabled:opacity-50"
                    >
                      Batalkan
                    </button>
                  </div>
                </div>

                {/* Tracking Resi Input */}
                <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                  <span className="text-xs font-semibold text-text-secondary">Nomor Resi Pengiriman:</span>
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Masukkan No. Resi JNE/J&T/SiCepat..."
                    className="flex-1 rounded-xl border border-primary/20 py-1.5 px-3 text-xs focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.status)}
                    className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-primary/90"
                  >
                    Simpan Resi
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-heading text-sm font-bold text-text-primary">Rincian Produk</h4>
                <div className="divide-y divide-primary/10 rounded-2xl border border-primary/10 overflow-hidden">
                  {(selectedOrder.items || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 text-xs bg-white">
                      <div>
                        <div className="font-bold text-text-primary">{item.product_name}</div>
                        <div className="text-text-secondary">SKU: {item.product_sku || "—"} • {item.quantity} x {formatRupiah(item.unit_price)}</div>
                      </div>
                      <div className="font-bold text-primary">{formatRupiah(item.subtotal)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation & Customer Shipping Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-primary/10 pt-4 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-text-primary flex items-center gap-1.5 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> Alamat Pengiriman
                  </div>
                  <p className="font-semibold text-text-primary">{selectedOrder.shipping_name || selectedOrder.customer_name}</p>
                  <p className="text-text-secondary">{selectedOrder.shipping_phone || selectedOrder.customer_phone}</p>
                  <p className="text-text-secondary">{selectedOrder.shipping_address || "Alamat tidak diisi"}</p>
                  <p className="text-text-secondary">{selectedOrder.shipping_city}, {selectedOrder.shipping_province} {selectedOrder.shipping_postal_code}</p>
                </div>

                <div className="space-y-2 bg-secondary/20 p-4 rounded-2xl">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Subtotal Produk</span>
                    <span className="font-semibold text-text-primary">{formatRupiah(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon Promo</span>
                    <span>-{formatRupiah(selectedOrder.discount_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Ongkos Kirim ({selectedOrder.shipping_courier || "Kurir"})</span>
                    <span className="font-semibold text-text-primary">{formatRupiah(selectedOrder.shipping_cost)}</span>
                  </div>
                  <div className="flex justify-between border-t border-primary/10 pt-2 text-sm font-bold text-primary">
                    <span>Total Pembayaran</span>
                    <span>{formatRupiah(selectedOrder.total)}</span>
                  </div>
                </div>
                </div>
              </div>

              {/* === PRINT ONLY INVOICE VIEW === */}
              <div className="hidden print:block w-full text-black bg-white font-sans" style={{fontFamily: 'Arial, sans-serif'}}>

                {/* ── HEADER: Invoice Label ── */}
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'2px solid #000', paddingBottom:'10px', marginBottom:'10px'}}>
                  <div style={{fontSize:'16px', fontWeight:'900', textTransform:'uppercase', letterSpacing:'2px', border:'1.5px solid #000', padding:'4px 10px'}}>INVOICE PESANAN</div>
                  <div style={{fontSize:'10px', color:'#555'}}>
                    {new Date(selectedOrder.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                {/* ── MAIN BODY: 2 Kolom ── */}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0', border:'1.5px solid #000'}}>

                  {/* ── KOLOM KIRI: Penerima & Alamat ── */}
                  <div style={{padding:'14px', borderRight:'1.5px solid #000'}}>

                    {/* Penerima */}
                    <div style={{marginBottom:'14px'}}>
                      <div style={{fontSize:'9px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'1px', color:'#555', borderBottom:'1px solid #ccc', paddingBottom:'4px', marginBottom:'8px'}}>PENERIMA</div>
                      <div style={{fontSize:'15px', fontWeight:'800', lineHeight:'1.2', marginBottom:'3px'}}>
                        {selectedOrder.shipping_name || selectedOrder.customer_name || '—'}
                      </div>
                      <div style={{fontSize:'13px', fontWeight:'600', color:'#222'}}>
                        {selectedOrder.shipping_phone || selectedOrder.customer_phone || '—'}
                      </div>
                    </div>

                    {/* Alamat Pengiriman */}
                    <div>
                      <div style={{fontSize:'9px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'1px', color:'#555', borderBottom:'1px solid #ccc', paddingBottom:'4px', marginBottom:'8px'}}>ALAMAT PENGIRIMAN</div>
                      <div style={{fontSize:'12px', fontWeight:'500', lineHeight:'1.6', color:'#111'}}>
                        <div>{selectedOrder.shipping_address || 'Alamat tidak diisi'}</div>
                        {(selectedOrder.shipping_village || selectedOrder.shipping_district) && (
                          <div>
                            {[selectedOrder.shipping_village, selectedOrder.shipping_district].filter(Boolean).join(', ')}
                          </div>
                        )}
                        <div>
                          {[selectedOrder.shipping_city, selectedOrder.shipping_province].filter(Boolean).join(', ')}
                        </div>
                        {selectedOrder.shipping_postal_code && (
                          <div style={{fontWeight:'700'}}>Kode Pos: {selectedOrder.shipping_postal_code}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── KOLOM KANAN: Informasi Pesanan ── */}
                  <div style={{padding:'14px'}}>

                    {/* No. Pesanan */}
                    <div style={{marginBottom:'14px'}}>
                      <div style={{fontSize:'9px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'1px', color:'#555', borderBottom:'1px solid #ccc', paddingBottom:'4px', marginBottom:'8px'}}>INFORMASI PESANAN</div>
                      <div style={{fontSize:'10px', color:'#555', fontWeight:'600'}}>No. Pesanan</div>
                      <div style={{fontSize:'14px', fontWeight:'900', fontFamily:'monospace', letterSpacing:'0.5px'}}>#{selectedOrder.order_number}</div>
                    </div>

                    {/* Daftar Produk */}
                    <div style={{marginBottom:'14px'}}>
                      <div style={{fontSize:'9px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'1px', color:'#555', borderBottom:'1px solid #ccc', paddingBottom:'4px', marginBottom:'8px'}}>PESANAN</div>
                      <div>
                        {(selectedOrder.items || []).map((item, idx) => (
                          <div key={idx} style={{fontSize:'12px', fontWeight:'600', lineHeight:'1.6', color:'#111'}}>
                            {item.product_name} &times; {item.quantity}
                          </div>
                        ))}
                      </div>
                      <div style={{fontSize:'11px', fontWeight:'800', marginTop:'8px', paddingTop:'6px', borderTop:'1px solid #ccc'}}>
                        Total Barang: {(selectedOrder.items || []).reduce((acc, curr) => acc + curr.quantity, 0)} Produk
                      </div>
                    </div>

                    {/* Metode Bayar */}
                    <div style={{marginBottom:'10px'}}>
                      <div style={{fontSize:'9px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'1px', color:'#555', borderBottom:'1px solid #ccc', paddingBottom:'4px', marginBottom:'6px'}}>METODE BAYAR</div>
                      <div style={{fontSize:'14px', fontWeight:'900', textTransform:'uppercase'}}>
                        {selectedOrder.payment_method === 'COD'
                          ? 'COD'
                          : selectedOrder.payment_method === 'TRANSFER_BANK'
                          ? 'Transfer Bank'
                          : selectedOrder.payment_method || '—'}
                      </div>
                    </div>

                    {/* Total Bayar — hanya tampil jika COD */}
                    {selectedOrder.payment_method === 'COD' && (
                      <div style={{border:'2px solid #000', padding:'8px 10px', marginTop:'8px'}}>
                        <div style={{fontSize:'9px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'1px', color:'#555', marginBottom:'4px'}}>TOTAL BAYAR</div>
                        <div style={{fontSize:'18px', fontWeight:'900', letterSpacing:'0.5px'}}>
                          Rp {Number(selectedOrder.total || 0).toLocaleString('id-ID')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── FOOTER ── */}
                <div style={{borderTop:'1px solid #ccc', marginTop:'10px', paddingTop:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{fontSize:'10px', color:'#555'}}>
                    Terima kasih telah berbelanja di <strong>Kerajinan Raja</strong>
                  </div>
                  <div style={{fontSize:'10px', color:'#555', fontStyle:'italic'}}>
                    Dicetak: {new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {orderToDelete && (
          <motion.div
            key="delete-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setOrderToDelete(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-heading text-lg font-bold text-gray-900">
                Hapus Pesanan
              </h3>
              <p className="mb-6 text-sm text-gray-500 font-body">
                Apakah Anda yakin ingin menghapus pesanan <span className="font-bold text-gray-800">#{orderToDelete.order_number}</span>? Tindakan ini tidak dapat dibatalkan dan semua item pesanan ini akan terhapus.
              </p>
              <div className="flex items-center gap-3 w-full font-body">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setOrderToDelete(null)}
                  className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteOrder}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  <span>Hapus</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
