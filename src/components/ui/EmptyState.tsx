"use client";

import React from "react";
import {
  Package,
  ShoppingBag,
  ImageIcon,
  Star,
  HelpCircle,
  Tag,
  BellRing,
  History,
  Users,
  FolderTree,
  FileQuestion,
  Plus,
  LucideIcon,
} from "lucide-react";

export type EmptyStateType =
  | "produk"
  | "pesanan"
  | "banner"
  | "review"
  | "faq"
  | "promo"
  | "notifikasi"
  | "aktivitas"
  | "pelanggan"
  | "media"
  | "kategori"
  | "custom";

interface PresetConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
}

const PRESETS: Record<Exclude<EmptyStateType, "custom">, PresetConfig> = {
  produk: {
    icon: Package,
    title: "Belum Ada Produk",
    description: "Belum ada produk yang ditambahkan ke katalog toko Anda.",
    actionText: "Tambah Produk Baru",
  },
  pesanan: {
    icon: ShoppingBag,
    title: "Belum Ada Pesanan",
    description: "Belum ada riwayat pesanan dari pelanggan saat ini.",
  },
  banner: {
    icon: ImageIcon,
    title: "Belum Ada Banner",
    description: "Belum ada hero banner yang dikonfigurasi untuk homepage.",
    actionText: "Tambah Banner Baru",
  },
  review: {
    icon: Star,
    title: "Belum Ada Review",
    description: "Belum ada ulasan atau rating dari pembeli.",
  },
  faq: {
    icon: HelpCircle,
    title: "Belum Ada FAQ",
    description: "Belum ada pertanyaan umum yang dikumpulkan.",
    actionText: "Tambah FAQ",
  },
  promo: {
    icon: Tag,
    title: "Belum Ada Promo",
    description: "Belum ada kode diskon atau voucer aktif.",
    actionText: "Buat Promo Baru",
  },
  notifikasi: {
    icon: BellRing,
    title: "Belum Ada Notifikasi",
    description: "Semua pesan dan notifikasi sistem sudah diperbarui.",
  },
  aktivitas: {
    icon: History,
    title: "Belum Ada Aktivitas",
    description: "Belum ada log aktivitas admin yang tercatat.",
  },
  pelanggan: {
    icon: Users,
    title: "Belum Ada Pelanggan",
    description: "Daftar pelanggan terdaftar masih kosong.",
  },
  media: {
    icon: ImageIcon,
    title: "Belum Ada Media",
    description: "Media library masih kosong. Unggah gambar produk atau banner Anda.",
    actionText: "Unggah Gambar",
  },
  kategori: {
    icon: FolderTree,
    title: "Belum Ada Kategori",
    description: "Kategori produk belum ditambahkan.",
    actionText: "Tambah Kategori",
  },
};

export interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = "custom",
  title,
  description,
  icon,
  actionText,
  onAction,
  className = "",
}) => {
  const preset = type !== "custom" ? PRESETS[type] : null;

  const IconComponent = icon || preset?.icon || FileQuestion;
  const displayTitle = title || preset?.title || "Tidak Ada Data";
  const displayDescription =
    description || preset?.description || "Belum ada data yang tersedia untuk ditampilkan saat ini.";
  const displayActionText = actionText || preset?.actionText;

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-primary/20 bg-white/60 backdrop-blur-xs my-4 ${className}`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-inner">
        <IconComponent className="h-8 w-8" />
      </div>
      <h3 className="font-heading text-base sm:text-lg font-bold text-text-primary mb-1">
        {displayTitle}
      </h3>
      <p className="font-body text-xs sm:text-sm text-text-secondary max-w-md leading-relaxed mb-6">
        {displayDescription}
      </p>
      {onAction && displayActionText && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-body text-xs font-semibold text-white shadow-md hover:bg-primary-hover transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>{displayActionText}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
