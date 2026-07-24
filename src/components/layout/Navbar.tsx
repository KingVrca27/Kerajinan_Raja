"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, Menu as MenuIcon, X } from "lucide-react";
import CartButton from "@/src/components/cart/CartButton";
import WishlistButton from "@/src/components/wishlist/WishlistButton";
import { useWishlist } from "@/src/hooks/useWishlist";

export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Beranda", href: "#" },
  { label: "Produk", href: "#produk" },
  { label: "Tentang Kami", href: "#tentang-kami" },
  { label: "Kontak", href: "#kontak" },
];

export interface NavbarProps {}

export const Navbar: React.FC<NavbarProps> = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Beranda");
  const { getTotalItems: getWishlistTotalItems, openWishlist } = useWishlist();

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
        {/* Logo Kerajinan Raja */}
        <a
          href="#"
          className="group flex items-center gap-3 focus:outline-none"
          onClick={() => handleNavClick("Beranda")}
        >
          <div className="relative h-9 w-9 flex-shrink-0 transition-transform duration-300 group-hover:scale-105 md:h-10 md:w-10">
            <Image
              src="/images/logo.png"
              alt="Logo Kerajinan Raja"
              width={40}
              height={40}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight text-white transition-colors group-hover:opacity-90 md:text-2xl">
            Kerajinan Raja
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center space-x-8 md:flex font-body">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.label;
            return (
              <a
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
              </a>
            );
          })}
        </nav>

        {/* Desktop Action Icons (Wishlist & Cart) */}
        <div className="hidden items-center space-x-3 md:flex">
          {/* Wishlist Icon */}
          <WishlistButton isNavbar />

          {/* Cart Icon */}
          <CartButton />
        </div>

        {/* Mobile Action & Hamburger Button */}
        <div className="flex items-center space-x-2 md:hidden">
          {/* Wishlist Icon Mobile Shortcut */}
          <WishlistButton isNavbar isMobile />

          {/* Cart Icon Mobile Shortcut */}
          <CartButton isMobile />

          {/* Hamburger Toggle */}
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
                  {item.label}
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
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
