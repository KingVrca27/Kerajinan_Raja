"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { CartProvider } from "@/src/context/CartContext";
import { WishlistProvider } from "@/src/context/WishlistContext";
import CartDrawer from "@/src/components/cart/CartDrawer";
import CheckoutModal from "@/src/components/checkout/CheckoutModal";
import WishlistDrawer from "@/src/components/wishlist/WishlistDrawer";

import { ToastProvider } from "@/src/context/ToastContext";
import ToastContainer from "@/src/components/ui/ToastContainer";

export interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <ToastProvider>
      <CartProvider>
        <WishlistProvider>
          <div className="flex min-h-screen flex-col bg-background font-body text-text-primary">
            <Navbar />
            {isAdmin ? (
              <main className="flex-1 w-full font-body">{children}</main>
            ) : (
              <main className="flex-1 w-full font-body">
                {children}
              </main>
            )}
            {!isAdmin && <Footer />}
            {!isAdmin && <CartDrawer />}
            {!isAdmin && <WishlistDrawer />}
            {!isAdmin && <CheckoutModal />}
            <ToastContainer />
          </div>
        </WishlistProvider>
      </CartProvider>
    </ToastProvider>
  );
};

export default MainLayout;
