"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  MessageSquare,
  HelpCircle,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  User,
  ImageIcon,
  Info,
  Share2,
  Sparkles,
  Search,
  SlidersHorizontal,
  Images,
  Store,
  ShoppingBag,
  Users,
  Star,
  Boxes,
  Tag,
  History,
  BellRing,
  UserCog,
  Download,
  SlidersVertical,
  ShieldAlert,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import { ROLE_LABELS, ROLE_COLORS } from "@/src/lib/adminPermissions";
import type { AdminProfile } from "@/src/types/admin";
import AdminOrderBadge from "@/src/components/admin/AdminOrderBadge";
import AdminReviewBadge from "@/src/components/admin/AdminReviewBadge";
import AdminNotificationBadge from "@/src/components/admin/AdminNotificationBadge";
import AdminChatBadge from "@/src/components/admin/AdminChatBadge";
import GlobalSearchModal from "@/src/components/ui/GlobalSearchModal";
import { siteSettingsRepository, SETTINGS_KEYS } from "@/src/lib/cmsRepository";

export interface NavMenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  section?: string;
}

export const ADMIN_NAV_ITEMS: NavMenuItem[] = [
  // Utama
  { label: "Dashboard",          href: "/admin/dashboard",            icon: LayoutDashboard, section: "Utama" },

  // Operasional Toko
  { label: "Pesanan",            href: "/admin/dashboard/pesanan",    icon: ShoppingBag,     section: "Operasional Toko" },
  { label: "Pelanggan",          href: "/admin/dashboard/pelanggan",  icon: Users,           section: "Operasional Toko" },
  { label: "Chat Pelanggan",     href: "/admin/dashboard/chat",       icon: MessageCircle,   section: "Operasional Toko" },
  { label: "Review & Rating",    href: "/admin/dashboard/review",     icon: Star,            section: "Operasional Toko" },
  { label: "Manajemen Inventori",href: "/admin/dashboard/inventory",  icon: Boxes,           section: "Operasional Toko" },
  { label: "Rekening Bank",      href: "/admin/dashboard/pembayaran", icon: CreditCard,      section: "Operasional Toko" },
  { label: "Promosi & Voucher",  href: "/admin/dashboard/promosi",    icon: Tag,             section: "Operasional Toko" },

  // Katalog & Content
  { label: "Produk",             href: "/admin/dashboard/produk",     icon: Package,         section: "Katalog" },
  { label: "Kategori",           href: "/admin/dashboard/kategori",   icon: FolderTree,      section: "Katalog" },
  { label: "Testimoni",          href: "/admin/dashboard/testimoni",  icon: MessageSquare,   section: "Ulasan" },

  // CMS Website
  { label: "Hero Banner",        href: "/admin/dashboard/cms/banner",   icon: ImageIcon,          section: "CMS Website" },
  { label: "Tentang Kami",       href: "/admin/dashboard/cms/tentang",  icon: Info,               section: "CMS Website" },
  { label: "FAQ",                href: "/admin/dashboard/faq",          icon: HelpCircle,         section: "CMS Website" },
  { label: "Informasi Toko",     href: "/admin/dashboard/info",         icon: Store,              section: "CMS Website" },
  { label: "Sosial Media",       href: "/admin/dashboard/cms/sosial",   icon: Share2,             section: "CMS Website" },
  { label: "Branding",           href: "/admin/dashboard/cms/branding", icon: Sparkles,           section: "CMS Website" },
  { label: "SEO Website",        href: "/admin/dashboard/cms/seo",      icon: Search,             section: "CMS Website" },
  { label: "Pengaturan Homepage",href: "/admin/dashboard/cms/homepage", icon: SlidersHorizontal,  section: "CMS Website" },
  { label: "Media Library",      href: "/admin/dashboard/cms/media",    icon: Images,             section: "CMS Website" },

  // Monitoring
  { label: "Aktivitas",          href: "/admin/dashboard/log",          icon: History,            section: "Monitoring" },
  { label: "Notifikasi",         href: "/admin/dashboard/notifikasi",   icon: BellRing,           section: "Monitoring" },

  // Administrasi
  { label: "Admin",              href: "/admin/dashboard/admin",        icon: UserCog,            section: "Administrasi" },
  { label: "Backup",             href: "/admin/dashboard/backup",       icon: Download,           section: "Administrasi" },
  { label: "Pengaturan Sistem",  href: "/admin/dashboard/system",       icon: SlidersVertical,    section: "Administrasi" },
  { label: "Keamanan",           href: "/admin/dashboard/security",     icon: ShieldAlert,        section: "Administrasi" },
];

export interface AdminLayoutProps {
  /** Profil lengkap admin dari tabel users (role, nama, avatar) */
  profile: AdminProfile;
  /** Fungsi logout yang memanggil supabase.auth.signOut() via AdminSessionGuard */
  onLogout: () => Promise<void>;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  profile,
  onLogout,
  children,
}) => {
  const pathname = usePathname();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const roleLabel = ROLE_LABELS[profile.role] || "Unknown Role";
  const roleColors = ROLE_COLORS[profile.role] || ROLE_COLORS.admin;

  const [logoUrl, setLogoUrl] = useState("/images/logo.png");

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const url = await siteSettingsRepository.getSetting(SETTINGS_KEYS.LOGO_ADMIN);
        if (url) setLogoUrl(url);
      } catch (e) {
        console.error("Gagal memuat logo admin:", e);
      }
    };
    fetchLogo();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Nav active helper ─────────────────────────────────────────────────────
  const isActive = (href: string) =>
    href === "/admin/dashboard"
      ? pathname === "/admin/dashboard"
      : pathname.startsWith(href);

  // ── Reusable sub-components ───────────────────────────────────────────────

  const NavItems = ({ onItemClick }: { onItemClick?: () => void }) => {
    let currentSection = "";

    return (
      <>
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon   = item.icon;
          const active = isActive(item.href);
          const showSectionHeader = item.section && item.section !== currentSection;
          if (item.section) currentSection = item.section;

          return (
            <React.Fragment key={item.href}>
              {showSectionHeader && (
                <div className="mt-4 mb-1 px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-wider text-text-secondary/60">
                  {item.section}
                </div>
              )}
              <Link
                href={item.href}
                onClick={onItemClick}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-body text-xs font-semibold transition-all ${
                  active
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-text-secondary hover:bg-primary/5 hover:text-primary"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {item.label === "Pesanan" && <AdminOrderBadge />}
                {item.label === "Chat Pelanggan" && <AdminChatBadge />}
                {item.label === "Review & Rating" && <AdminReviewBadge />}
                {item.label === "Notifikasi" && <AdminNotificationBadge />}
              </Link>
            </React.Fragment>
          );
        })}
      </>
    );
  };

  const LogoutButton = () => (
    <button
      type="button"
      onClick={onLogout}
      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 font-body text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none cursor-pointer"
    >
      <LogOut className="h-5 w-5 shrink-0" />
      <span>Keluar (Logout)</span>
    </button>
  );

  // ── Avatar URL helper (defense-in-depth) ─────────────────────────────────
  // Guard (AdminSessionGuard) sudah men-sanitasi nilai, tapi komponen ini
  // juga memvalidasi secara mandiri agar tidak crash jika ada nilai kotor
  // yang lolos dari upstream.
  const isValidAvatarUrl = (url: string | null | undefined): url is string =>
    !!url &&
    url !== "NULL" &&
    url !== "null" &&
    url.trim() !== "" &&
    (url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("/"));

  // ── Admin Profile Chip (header kanan) ─────────────────────────────────────
  const ProfileChip = () => (
    <div className="flex items-center gap-2.5">
      {/* Avatar atau fallback icon */}
      <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-primary/20">
        {isValidAvatarUrl(profile.avatar_url) ? (
          <Image
            src={profile.avatar_url}
            alt={profile.full_name || "Foto profil admin"}
            fill
            sizes="32px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Nama & Role */}
      <div className="hidden flex-col sm:flex">
        <span className="font-body text-xs font-bold leading-tight text-text-primary">
          {profile.full_name || "Admin"}
        </span>
        <span
          className={`mt-0.5 inline-block rounded px-1.5 py-0.5 font-body text-[10px] font-semibold border ${roleColors.bg} ${roleColors.text} ${roleColors.border}`}
        >
          {roleLabel}
        </span>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-secondary/30 font-body text-text-primary print:bg-white">

      {/* 1. Sidebar Desktop */}
      <aside className="hidden w-64 flex-col border-r border-primary/10 bg-white shadow-xs lg:flex print:hidden">
        {/* Brand */}
        <div className="flex h-16 items-center border-b border-primary/10 px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="relative h-9 w-9 flex-shrink-0">
              <Image
                src={logoUrl}
                alt="Logo Putra Art Shop"
                width={36}
                height={36}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <span className="font-heading text-base font-bold text-text-primary block leading-none">
                Admin Panel
              </span>
              <span className="font-body text-[11px] text-text-secondary">
                Putra Art Shop
              </span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
          <NavItems />
        </nav>

        {/* Logout */}
        <div className="border-t border-primary/10 p-4">
          <LogoutButton />
        </div>
      </aside>

      {/* 2. Mobile Drawer */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="relative flex h-full w-72 flex-col bg-white shadow-2xl"
            >
              <div className="flex h-16 items-center justify-between border-b border-primary/10 px-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="font-heading text-base font-bold text-text-primary">
                    Admin Panel
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="rounded-lg p-2 text-text-secondary hover:bg-primary/10 hover:text-primary focus:outline-none cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
                <NavItems onItemClick={() => setIsMobileDrawerOpen(false)} />
              </nav>
              <div className="border-t border-primary/10 p-4">
                <LogoutButton />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-primary/10 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8 print:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="rounded-xl p-2 text-text-primary hover:bg-primary/10 focus:outline-none cursor-pointer lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden font-heading text-lg font-bold text-text-primary sm:inline-block">
              Dashboard Manajemen
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-primary/20 bg-secondary/50 px-3 py-1.5 font-body text-xs font-semibold text-text-secondary hover:text-primary transition-colors cursor-pointer hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Cari menu"
            >
              <Search className="h-3.5 w-3.5 text-primary" />
              <span className="hidden md:inline">Cari modul...</span>
              <kbd className="hidden md:inline-block rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-text-secondary border border-primary/10">
                Ctrl+K
              </kbd>
            </button>

            {/* Lihat Website */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-secondary/50 px-3 py-1.5 font-body text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <span>Lihat Website</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            {/* Profile Chip */}
            <Link
              href="/admin/dashboard/profile"
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 transition-transform hover:scale-105"
            >
              <ProfileChip />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;
