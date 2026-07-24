"use client";

import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { CartProvider } from "@/src/context/CartContext";
import { WishlistProvider } from "@/src/context/WishlistContext";
import CartDrawer from "@/src/components/cart/CartDrawer";
import CheckoutModal from "@/src/components/checkout/CheckoutModal";
import WishlistDrawer from "@/src/components/wishlist/WishlistDrawer";

export interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <CartProvider>
      <WishlistProvider>
        <div className="flex min-h-screen flex-col bg-background font-body text-text-primary">
          <Navbar />
          <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <WishlistDrawer />
          <CheckoutModal />
        </div>
      </WishlistProvider>
    </CartProvider>
  );
};

export default MainLayout;
