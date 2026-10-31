/**
 * @file app/admin/dashboard/pelanggan/page.tsx
 * Halaman Manajemen Pelanggan (Customer Management) — FASE 4.5.1
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Eye, Filter, ArrowUpDown, ChevronLeft, ChevronRight,
  ShoppingBag, CheckCircle2, AlertTriangle, Loader2, Mail, Phone, MapPin, Calendar, X, Ban, ShieldCheck
} from "lucide-react";
import { customerRepository } from "@/src/lib/customerRepository";
import type { CustomerWithStats, DbOrder } from "@/src/types/ops";

function formatRupiah(num: number): string {
  return "Rp " + Number(num || 0).toLocaleString("id-ID");
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

export default function AdminPelangganPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"created_at" | "total_spent">("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected customer for history drawer
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [customerOrders, setCustomerOrders] = useState<DbOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await customerRepository.getAll();
      setCustomers(data);
    } catch {
      showToast("error", "Gagal memuat data pelanggan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filter & Sort
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
      );
    }).sort((a, b) => {
      let valA = sortField === "created_at" ? new Date(a.created_at).getTime() : a.total_spent;
      let valB = sortField === "created_at" ? new Date(b.created_at).getTime() : b.total_spent;
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [customers, searchQuery, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage]);

  const handleOpenDetail = async (c: CustomerWithStats) => {
    setSelectedCustomer(c);
    setIsLoadingOrders(true);
    try {
      const orders = await customerRepository.getCustomerOrders(c.id);
      setCustomerOrders(orders);
    } catch {
      showToast("error", "Gagal memuat riwayat transaksi.");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleToggleBlock = async (c: CustomerWithStats) => {
    try {
      const res = await customerRepository.toggleActive(c.id, !c.is_active);
      if (!res.success) throw new Error(res.error);
      showToast("success", `Status pelanggan ${c.full_name} berhasil diperbarui.`);
      await loadData();
    } catch {
      showToast("error", "Gagal mengubah status pelanggan.");
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
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">Manajemen Pelanggan</h1>
          <p className="text-xs text-text-secondary sm:text-sm mt-1">
            Daftar pembeli terdaftar, statistik pesanan, dan akumulasi total belanja.
          </p>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Cari Nama, Email, atau No. HP..."
            className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as "created_at" | "total_spent")}
            className="rounded-xl border border-primary/20 bg-white py-2.5 px-3 text-xs font-semibold focus:border-primary focus:outline-none"
          >
            <option value="created_at">Urutkan Tanggal Daftar</option>
            <option value="total_spent">Urutkan Total Belanja</option>
          </select>
          <button
            type="button"
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1 rounded-xl border border-primary/20 bg-white py-2.5 px-3 text-xs font-semibold text-text-primary hover:bg-primary/5 cursor-pointer"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
            <span>{sortAsc ? "Asc" : "Desc"}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Memuat data pelanggan...</span>
        </div>
      ) : paginatedCustomers.length === 0 ? (
        <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center text-sm text-text-secondary">
          <Users className="mx-auto h-12 w-12 text-primary/30 mb-3" />
          <p className="font-semibold">Tidak ada pelanggan ditemukan.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-primary/10 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-secondary/30 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nama Pelanggan</th>
                  <th className="py-3.5 px-4">Kontak</th>
                  <th className="py-3.5 px-4 text-center">Jumlah Pesanan</th>
                  <th className="py-3.5 px-4 text-right">Total Belanja</th>
                  <th className="py-3.5 px-4">Terakhir Belanja</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {paginatedCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-text-primary">
                      {c.full_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="text-text-primary flex items-center gap-1">
                        <Mail className="h-3 w-3 text-primary" /> {c.email}
                      </div>
                      <div className="text-text-secondary flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3 text-text-secondary" /> {c.phone || "—"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-primary">
                      {c.total_orders} transaksi
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      {formatRupiah(c.total_spent)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-text-secondary">
                      {formatDate(c.last_order_at)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        c.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {c.is_active ? "Aktif" : "Diblokir"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(c)}
                          className="rounded-xl bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleBlock(c)}
                          title={c.is_active ? "Blokir Pelanggan" : "Aktifkan Pelanggan"}
                          className={`rounded-xl p-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                            c.is_active ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {c.is_active ? <Ban className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-primary/10 px-6 py-4 text-xs">
            <span className="text-text-secondary">
              Menampilkan {paginatedCustomers.length} dari {filteredCustomers.length} pelanggan
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

      {/* DETAIL MODAL & ORDER HISTORY */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedCustomer(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-2xl w-full rounded-3xl bg-white p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-text-primary">{selectedCustomer.full_name}</h3>
                  <p className="text-xs text-text-secondary">Terdaftar sejak: {formatDate(selectedCustomer.created_at)}</p>
                </div>
                <button type="button" onClick={() => setSelectedCustomer(null)} className="rounded-xl p-1 text-text-secondary hover:bg-primary/10">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Customer Info Card */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-secondary/20 p-4 rounded-2xl">
                <div><span className="text-text-secondary">Email:</span> <strong className="text-text-primary block">{selectedCustomer.email}</strong></div>
                <div><span className="text-text-secondary">No. Telepon:</span> <strong className="text-text-primary block">{selectedCustomer.phone || "—"}</strong></div>
                <div><span className="text-text-secondary">Total Transaksi:</span> <strong className="text-primary block">{selectedCustomer.total_orders} Pesanan</strong></div>
                <div><span className="text-text-secondary">Total Pengeluaran:</span> <strong className="text-emerald-600 block">{formatRupiah(selectedCustomer.total_spent)}</strong></div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <h4 className="font-heading text-sm font-bold text-text-primary">Riwayat Pesanan Pelanggan</h4>
                {isLoadingOrders ? (
                  <div className="flex justify-center py-6 text-xs text-text-secondary">
                    <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" /> Memuat riwayat pesanan...
                  </div>
                ) : customerOrders.length === 0 ? (
                  <p className="text-xs text-text-secondary py-4 text-center">Pelanggan belum pernah melakukan transaksi.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {customerOrders.map((ord) => (
                      <div key={ord.id} className="flex items-center justify-between border border-primary/10 p-3 rounded-xl bg-white text-xs">
                        <div>
                          <span className="font-mono font-bold text-primary">#{ord.order_number}</span>
                          <span className="text-text-secondary block">{formatDate(ord.created_at)}</span>
                        </div>
                        <span className="font-bold text-text-primary">{formatRupiah(ord.total)}</span>
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                          {ord.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
