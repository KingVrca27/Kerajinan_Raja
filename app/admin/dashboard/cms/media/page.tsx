/**
 * @file app/admin/dashboard/cms/media/page.tsx
 *
 * Halaman Media Library — Kelola semua aset media di Supabase Storage bucket `cms-assets`.
 * Repository: mediaLibraryRepository (cmsRepository.ts)
 *
 * Fitur:
 *   - Daftar semua file media di Supabase Storage
 *   - Preview thumbnail gambar
 *   - Search gambar berdasarkan nama file
 *   - Filter berdasarkan folder (banners, about, branding, media)
 *   - Upload file baru ke folder mana saja
 *   - Hapus file dari Storage dengan konfirmasi
 *   - Salin URL (Gunakan ulang gambar)
 *   - Tampilkan ukuran file & tanggal upload
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Trash2, Copy, Check, Upload, Folder,
  ImageIcon, Loader2, AlertTriangle, CheckCircle2, ExternalLink,
  RefreshCw, X, Eye, HardDrive,
} from "lucide-react";
import Image from "next/image";
import {
  mediaLibraryRepository,
  uploadCmsImage,
  type CmsFolder,
  type DbMediaFile,
} from "@/src/lib/cmsRepository";

interface ExtendedMediaItem {
  name: string;
  folder: CmsFolder;
  path: string;
  publicUrl: string;
  size: number;
  createdAt: string;
}

const FOLDERS: { key: CmsFolder | "all"; label: string }[] = [
  { key: "all", label: "Semua Folder" },
  { key: "banners", label: "Banners" },
  { key: "about", label: "About" },
  { key: "branding", label: "Branding" },
  { key: "media", label: "General Media" },
];

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMediaLibraryPage() {
  const [items, setItems] = useState<ExtendedMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<CmsFolder | "all">("all");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const [deleteItem, setDeleteItem] = useState<ExtendedMediaItem | null>(null);
  const [previewItem, setPreviewItem] = useState<ExtendedMediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTargetFolder, setUploadTargetFolder] = useState<CmsFolder>("media");

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const folderList: CmsFolder[] = ["banners", "about", "branding", "media"];
      const allFiles: ExtendedMediaItem[] = [];

      for (const folder of folderList) {
        const files: DbMediaFile[] = await mediaLibraryRepository.listAll(folder);
        for (const f of files) {
          const path = `${folder}/${f.name}`;
          const publicUrl = mediaLibraryRepository.getPublicUrl(path);
          allFiles.push({
            name: f.name,
            folder,
            path,
            publicUrl,
            size: f.metadata?.size ?? 0,
            createdAt: f.created_at ?? new Date().toISOString(),
          });
        }
      }

      // Sort by newest
      allFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(allFiles);
    } catch {
      showToast("error", "Gagal memuat file media dari Storage.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyUrl = (url: string, path: string) => {
    navigator.clipboard.writeText(url);
    setCopiedPath(path);
    showToast("success", "URL gambar berhasil disalin ke clipboard!");
    setTimeout(() => setCopiedPath(null), 2500);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const result = await mediaLibraryRepository.deleteByPath(deleteItem.path);
      if (!result.success) throw new Error(result.error);
      showToast("success", `File "${deleteItem.name}" berhasil dihapus.`);
      setDeleteItem(null);
      await loadData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal menghapus file.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadNew = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await uploadCmsImage(file, uploadTargetFolder);
      if (!result) throw new Error("Gagal mengunggah gambar ke Storage.");
      showToast("success", `Gambar berhasil diunggah ke folder ${uploadTargetFolder}!`);
      await loadData();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Upload gagal.");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.path.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFolder = selectedFolder === "all" || item.folder === selectedFolder;
    return matchSearch && matchFolder;
  });

  const totalSize = items.reduce((acc, curr) => acc + curr.size, 0);

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
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">Media Library</h1>
          <p className="text-xs text-text-secondary sm:text-sm mt-1">
            Kelola seluruh berkas media di Supabase Storage (`cms-assets`).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUploadNew(f);
            }}
          />

          <select
            value={uploadTargetFolder}
            onChange={(e) => setUploadTargetFolder(e.target.value as CmsFolder)}
            className="rounded-xl border border-primary/20 bg-white py-2 px-3 text-xs font-semibold focus:border-primary focus:outline-none"
          >
            <option value="media">Folder: General Media</option>
            <option value="banners">Folder: Banners</option>
            <option value="about">Folder: About</option>
            <option value="branding">Folder: Branding</option>
          </select>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span>{isUploading ? "Mengunggah..." : "Upload Gambar"}</span>
          </motion.button>
        </div>
      </div>

      {/* Storage Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/10 bg-white p-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HardDrive className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-text-primary block">Supabase Storage Bucket: `cms-assets`</span>
            <span className="text-text-secondary">
              Total {items.length} file media ({formatBytes(totalSize)})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl border border-primary/20 px-3 py-1.5 font-semibold text-primary hover:bg-primary/5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Toolbar Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama file gambar..."
            className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary focus:border-primary focus:outline-none"
          />
        </div>

        {/* Folder Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {FOLDERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setSelectedFolder(f.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                selectedFolder === f.key
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white border border-primary/10 text-text-secondary hover:bg-primary/5 hover:text-primary"
              }`}
            >
              <Folder className="h-3.5 w-3.5" />
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Display */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center gap-3 text-sm text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Membaca berkas dari Supabase Storage...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center text-sm text-text-secondary">
          <ImageIcon className="mx-auto h-12 w-12 text-primary/30 mb-3" />
          <p className="font-semibold">Tidak ada file media yang sesuai.</p>
          <p className="text-xs text-text-secondary/70 mt-1">
            Coba ubah kata kunci pencarian atau unggah berkas baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.02 }}
              className="group relative flex flex-col justify-between rounded-2xl border border-primary/10 bg-white p-2.5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-secondary/30 mb-2">
                <Image
                  src={item.publicUrl}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />

                {/* Badge Folder */}
                <span className="absolute top-2 left-2 rounded-md bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[9px] font-bold text-white uppercase">
                  {item.folder}
                </span>

                {/* Overlay Action Buttons */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    title="Pratinjau Gambar"
                    className="rounded-lg bg-white/90 p-2 text-text-primary hover:bg-white hover:text-primary transition-colors cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(item.publicUrl, item.path)}
                    title="Salin URL Gambar"
                    className="rounded-lg bg-white/90 p-2 text-text-primary hover:bg-white hover:text-primary transition-colors cursor-pointer"
                  >
                    {copiedPath === item.path ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteItem(item)}
                    title="Hapus File"
                    className="rounded-lg bg-white/90 p-2 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Meta Info */}
              <div className="space-y-0.5 px-1">
                <p className="text-xs font-semibold text-text-primary truncate" title={item.name}>
                  {item.name}
                </p>
                <div className="flex items-center justify-between text-[10px] text-text-secondary">
                  <span>{formatBytes(item.size)}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL PREVIEW */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setPreviewItem(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-2xl w-full rounded-3xl bg-white p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                <div>
                  <h3 className="font-heading text-base font-bold text-text-primary truncate max-w-md">{previewItem.name}</h3>
                  <p className="text-xs text-text-secondary">Folder: {previewItem.folder} • {formatBytes(previewItem.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="rounded-xl p-1 text-text-secondary hover:bg-primary/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-secondary/30 flex items-center justify-center">
                <Image src={previewItem.publicUrl} alt={previewItem.name} fill className="object-contain" sizes="800px" />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <input
                  type="text"
                  readOnly
                  value={previewItem.publicUrl}
                  className="flex-1 rounded-xl border border-primary/20 bg-secondary/20 py-2 px-3 text-xs font-mono text-text-secondary"
                />
                <button
                  type="button"
                  onClick={() => handleCopyUrl(previewItem.publicUrl, previewItem.path)}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow hover:bg-primary/90"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin URL</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DELETE CONFIRM */}
      <AnimatePresence>
        {deleteItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => !isDeleting && setDeleteItem(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-text-primary">Hapus Berkas Media?</h3>
              <p className="mt-1 font-body text-xs text-text-secondary">
                File <strong className="text-text-primary">{deleteItem.name}</strong> akan dihapus secara permanen dari Supabase Storage.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteItem(null)}
                  disabled={isDeleting}
                  className="rounded-xl border border-primary/20 px-4 py-2 font-body text-xs font-semibold text-text-secondary hover:bg-secondary/40 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-body text-xs font-semibold text-white shadow-md hover:bg-red-700 disabled:opacity-60"
                >
                  {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Hapus File
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
