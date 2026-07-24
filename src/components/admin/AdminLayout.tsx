"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { useAdminAuth } from "@/src/hooks/useAdminAuth";

export interface NavMenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export const ADMIN_NAV_ITEMS: NavMenuItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Produk", href: "/admin/dashboard/produk", icon: Package },
  { label: "Kategori", href: "/admin/dashboard/kategori", icon: FolderTree },
  { label: "Testimoni", href: "/admin/dashboard/testimoni", icon: MessageSquare },
  { label: "FAQ", href: "/admin/dashboard/faq", icon: HelpCircle },
  { label: "Informasi Website", href: "/admin/dashboard/info", icon: Settings },
];

export interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Komponen `AdminLayout` merender struktur utama Admin Dashboard
 * yang mencakup Sidebar navigasi desktop, Drawer mobile responsif,
 * Header atas, serta proteksi sesi autentikasi.
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Proteksi Rute Dashboard
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 font-body text-sm text-text-secondary">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Memeriksa Sesi Admin...</span>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/admin");
  };

  return (
    <div className="flex min-h-screen bg-secondary/30 font-body text-text-primary">
      {/* 1. Sidebar Navigation (Desktop) */}
      <aside className="hidden w-64 flex-col border-r border-primary/10 bg-white shadow-xs lg:flex">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-primary/10 px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="relative h-9 w-9 flex-shrink-0">
              <Image
                src="/images/logo.png"
                alt="Logo Kerajinan Raja"
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
                Kerajinan Raja
              </span>
            </div>
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin/dashboard"
                ? pathname === "/admin/dashboard"
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 font-body text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-text-secondary hover:bg-primary/5 hover:text-primary"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout & Footer */}
        <div className="border-t border-primary/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 font-body text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none cursor-pointer"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* 2. Mobile Drawer Navigation (Mobile & Tablet) */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />

            {/* Slide Drawer */}
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

              <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
                {ADMIN_NAV_ITEMS.map((item) => {
                  const isActive =
                    item.href === "/admin/dashboard"
                      ? pathname === "/admin/dashboard"
                      : pathname.startsWith(item.href);

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-3 font-body text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "text-text-secondary hover:bg-primary/5 hover:text-primary"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-primary/10 p-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 font-body text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none cursor-pointer"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Main Content Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-primary/10 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Hamburger Toggle (Mobile) */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="rounded-xl p-2 text-text-primary hover:bg-primary/10 focus:outline-none cursor-pointer lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-heading text-lg font-bold text-text-primary hidden sm:inline-block">
              Dashboard Manajemen
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Lihat Website Utama Shortcut */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-secondary/50 px-3 py-1.5 font-body text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <span>Lihat Website</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            {/* Admin Profile Chip */}
            <div className="flex items-center gap-2 rounded-full border border-primary/10 bg-secondary/40 py-1 px-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                <User className="h-3.5 w-3.5" />
              </div>
              <span className="font-body text-xs font-bold text-text-primary">
                {user?.username || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Children Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
