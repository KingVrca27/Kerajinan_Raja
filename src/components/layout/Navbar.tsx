"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Menu as MenuIcon, X, User as UserIcon, LogOut, Settings, MessageCircle } from "lucide-react";
import { createClient } from "@/src/lib/supabaseBrowser";
import type { RealtimeChannel } from "@supabase/supabase-js";
import CartButton from "@/src/components/cart/CartButton";
import WishlistButton from "@/src/components/wishlist/WishlistButton";
import { useWishlist } from "@/src/hooks/useWishlist";
import OrderBadge from "@/src/components/layout/OrderBadge";
import { siteSettingsRepository, SETTINGS_KEYS } from "@/src/lib/cmsRepository";

export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Beranda", href: "/" },
  { label: "Produk", href: "/produk" },
  { label: "Tentang Kami", href: "/#tentang-kami" },
  { label: "Kontak", href: "/#kontak" },
];

export interface NavbarProps {}

export const Navbar: React.FC<NavbarProps> = () => {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith("/admin");

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Beranda");
  const { getTotalItems: getWishlistTotalItems, openWishlist } = useWishlist();
  
  const [user, setUser] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState("/images/logo.png");
  const supabase = createClient();

  // ── Chat unread count state ───────────────────────────────────────────────
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const chatChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    const fetchLogo = async () => {
      try {
        const url = await siteSettingsRepository.getSetting(SETTINGS_KEYS.LOGO_HEADER);
        if (url) setLogoUrl(url);
      } catch (e) {
        console.error("Gagal memuat logo header:", e);
      }
    };
    fetchLogo();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  // ── Fetch total chat unread count ─────────────────────────────────────────
  const fetchChatUnread = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setChatUnreadCount(0);
      return;
    }
    // Resolve customers.id
    const { data: customerData } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", currentUser.id)
      .maybeSingle();
    if (!customerData) {
      setChatUnreadCount(0);
      return;
    }
    // Count unread messages across all customer conversations
    const { data: convData } = await supabase
      .from("conversations")
      .select("id")
      .eq("customer_id", customerData.id);
    if (!convData || convData.length === 0) {
      setChatUnreadCount(0);
      return;
    }
    const convIds = convData.map((c) => c.id);
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .eq("is_read_by_customer", false)
      .neq("sender_id", currentUser.id);
    setChatUnreadCount(count ?? 0);
  }, [supabase]);

  // ── Chat unread: initial fetch + realtime ─────────────────────────────────
  useEffect(() => {
    fetchChatUnread();
  }, [fetchChatUnread]);

  useEffect(() => {
    if (!user) {
      setChatUnreadCount(0);
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current);
        chatChannelRef.current = null;
      }
      return;
    }
    // Subscribe to message changes to update badge globally
    const channel = supabase
      .channel("navbar-chat-unread")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => { fetchChatUnread(); }
      )
      .subscribe();
    chatChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      chatChannelRef.current = null;
    };
  }, [user, supabase, fetchChatUnread]);

  const handleChatIconClick = () => {
    setIsMobileMenuOpen(false);
    if (!user) {
      router.push("/login?redirect=/chat");
    } else {
      router.push("/chat");
    }
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };



  // Track scroll position to toggle navbar shadow
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (label: string) => {
    setActiveNav(label);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-[#9D734E] backdrop-blur-md shadow-lg border-b border-black/10 py-3"
          : "bg-[#9D734E] backdrop-blur-sm border-b border-black/5 py-4"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo Putra Art Shop */}
        <Link
          href="/"
          className="group flex items-center gap-3 focus:outline-none"
          onClick={() => handleNavClick("Beranda")}
        >
          <div className="relative h-9 w-9 flex-shrink-0 transition-transform duration-300 group-hover:scale-105 md:h-10 md:w-10">
            <Image
              src={logoUrl}
              alt="Logo Putra Art Shop"
              width={40}
              height={40}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight text-white transition-colors group-hover:opacity-90 md:text-2xl">
            Putra Art Shop
          </span>
        </Link>

        {/* Render Navigasi & Action Icons HANYA jika BUKAN di Halaman Admin */}
        {!isAdmin && (
          <>
            {/* Desktop Navigation Links */}
            <nav className="hidden items-center space-x-8 md:flex font-body">
              {NAV_ITEMS.map((item) => {
                const isActive = activeNav === item.label;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => handleNavClick(item.label)}
                    className={`relative text-sm font-medium transition-colors duration-200 py-1 ${
                      isActive
                        ? "text-white font-bold"
                        : "text-amber-100/90 hover:text-white"
                    }`}
                  >
                    {item.label}
                    {/* Active Menu Indicator */}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-amber-300 transition-all duration-300" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Action Icons (Chat, Wishlist, Cart, Account) */}
            <div className="hidden items-center space-x-3 md:flex">

              {/* Chat Icon */}
              <button
                type="button"
                aria-label={`Pesan${chatUnreadCount > 0 ? ` (${chatUnreadCount} belum dibaca)` : ""}`}
                title="Pesan"
                onClick={handleChatIconClick}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10 focus:outline-none cursor-pointer"
              >
                <MessageCircle className="h-5 w-5" />
                {chatUnreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 font-body text-[10px] font-bold text-gray-900 shadow-xs">
                    {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                  </span>
                )}
              </button>

              <WishlistButton isNavbar />
              <CartButton />
              
              {/* Account Link */}
              <Link
                href={user ? "/profile" : "/login"}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10 focus:outline-none cursor-pointer"
                aria-label="Akun"
              >
                <UserIcon className="h-5 w-5" />
              </Link>
            </div>

            {/* Mobile Action & Hamburger Button */}
            <div className="flex items-center space-x-2 md:hidden">

              {/* Mobile Chat Icon */}
              <button
                type="button"
                aria-label={`Pesan${chatUnreadCount > 0 ? ` (${chatUnreadCount})` : ""}`}
                title="Pesan"
                onClick={handleChatIconClick}
                className="relative rounded-lg p-2 text-white transition-colors hover:bg-white/10 focus:outline-none cursor-pointer"
              >
                <MessageCircle className="h-5 w-5" />
                {chatUnreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-amber-400 px-0.5 font-body text-[9px] font-bold text-gray-900">
                    {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                  </span>
                )}
              </button>

              <WishlistButton isNavbar isMobile />
              <CartButton isMobile />
              <button
                type="button"
                aria-label={isMobileMenuOpen ? "Tutup Menu" : "Buka Menu"}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Drawer Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="border-b border-white/10 bg-[#896342] px-4 pb-6 pt-3 shadow-lg md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3 font-body">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.label;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => handleNavClick(item.label)}
                  className={`flex items-center rounded-md px-3 py-2.5 text-base font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-white font-bold"
                      : "text-amber-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center">
                    {item.label}
                  </div>
                </a>
              );
            })}

            {/* Wishlist in Mobile Menu */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                openWishlist();
              }}
              className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-base font-medium text-amber-100 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-amber-200" />
                <span>Wishlist Saya</span>
              </div>
              {getWishlistTotalItems() > 0 && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-gray-900">
                  {getWishlistTotalItems()}
                </span>
              )}
            </button>

            {/* Chat in Mobile Menu */}
            <button
              type="button"
              onClick={handleChatIconClick}
              className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-base font-medium text-amber-100 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-amber-200" />
                <span>Pesan Saya</span>
              </div>
              {chatUnreadCount > 0 && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-gray-900">
                  {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                </span>
              )}
            </button>

            {/* Mobile Account / Auth */}
            <div className="mt-4 border-t border-white/10 pt-4">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium text-amber-100 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <UserIcon className="h-5 w-5 text-amber-200" />
                    <span>Profil Saya</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium text-red-300 transition-colors hover:bg-white/10 hover:text-red-200"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex gap-3 px-3">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 rounded-lg bg-white py-2 text-center text-sm font-bold text-amber-900 shadow-sm"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 rounded-lg border border-white/20 py-2 text-center text-sm font-medium text-white hover:bg-white/10"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
