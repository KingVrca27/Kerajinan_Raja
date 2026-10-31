"use client";

import React, { createContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Product } from "@/src/types/product";
import { CartItem } from "@/src/types/cart";
import { createClient } from "@/src/lib/supabaseBrowser";
import { User } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";

/** Kunci penyimpanan data keranjang pada localStorage browser */
const CART_STORAGE_KEY = "kerajinan_raja_cart_v1";

/**
 * Interface definisi tipe data nilai yang disediakan oleh CartContext.
 */
export interface CartContextType {
  /** Array daftar item produk di dalam keranjang belanja */
  items: CartItem[];
  /** Status keterbukaan panel CartDrawer */
  isCartOpen: boolean;
  /** Status keterbukaan CheckoutModal */
  isCheckoutModalOpen: boolean;
  /**
   * Menambahkan produk ke keranjang belanja.
   * Jika produk sudah ada, kuantitas akan ditambahkan.
   * @param product Objek produk yang ditambahkan
   * @param quantity Jumlah unit yang ingin ditambahkan (default: 1)
   * @param selectedVariant Varian produk opsional
   */
  addItem: (product: Product, quantity?: number, selectedVariant?: string) => void;
  /**
   * Menghapus item tertentu dari keranjang belanja.
   * @param productId ID unik produk yang ingin dihapus
   * @param selectedVariant Varian produk opsional
   */
  removeItem: (productId: string, selectedVariant?: string) => void;
  /**
   * Memperbarui kuantitas produk tertentu dalam keranjang belanja.
   * Minimal kuantitas adalah 1 dan maksimal sesuai stok produk.
   * @param productId ID unik produk yang ingin diperbarui
   * @param quantity Kuantitas baru
   * @param selectedVariant Varian produk opsional
   */
  updateQuantity: (productId: string, quantity: number, selectedVariant?: string) => void;
  /** Mengosongkan seluruh item dari keranjang belanja */
  clearCart: () => void;
  /**
   * Mengembalikan total akumulasi jumlah seluruh item dalam keranjang.
   * @returns Jumlah total unit item
   */
  getTotalItems: () => number;
  /**
   * Mengembalikan total akumulasi harga (subtotal) seluruh item dalam keranjang.
   * @returns Total harga dalam Rupiah
   */
  getSubtotal: () => number;
  /** Membuka panel CartDrawer */
  openCart: () => void;
  /** Menutup panel CartDrawer */
  closeCart: () => void;
  /** Mengubah (toggle) status keterbukaan panel CartDrawer */
  toggleCart: () => void;
  /** Membuka CheckoutModal */
  openCheckoutModal: () => void;
  /** Menutup CheckoutModal */
  closeCheckoutModal: () => void;
}

/** Context untuk mengelola State Keranjang Belanja global */
export const CartContext = createContext<CartContextType | undefined>(undefined);

export interface CartProviderProps {
  /** Elemen anak yang dibungkus oleh provider */
  children: ReactNode;
}

/**
 * CartProvider adalah komponen pembungkus (wrapper) yang menyediakan state keranjang belanja,
 * sinkronisasi localStorage, serta kontrol modal checkout ke seluruh komponen aplikasi.
 */
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  // 0. Listener Auth State
  useEffect(() => {
    const supabase = createClient();
    
    // Initial fetch
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 1. Baca data keranjang dari localStorage saat pertama kali dirender di Client (SSR safe)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedItems = JSON.parse(savedCart);
        if (Array.isArray(parsedItems)) {
          setItems(parsedItems);
        }
      }
    } catch (error) {
      console.error("Gagal membaca data keranjang dari localStorage:", error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Simpan perubahan items ke localStorage secara otomatis setelah diinisialisasi
  useEffect(() => {
    if (!isInitialized) return;

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Gagal menyimpan data keranjang ke localStorage:", error);
    }
  }, [items, isInitialized]);

  // Fungsi menambah produk ke keranjang
  const addItem = useCallback(
    (product: Product, quantity = 1, selectedVariant?: string) => {
      if (!user) {
        const currentQuery = typeof window !== "undefined" ? window.location.search : "";
        const redirectUrl = currentQuery ? `${pathname}${currentQuery}` : pathname;
        router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
        return;
      }

      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.selectedVariant === selectedVariant
        );

        if (existingIndex > -1) {
          const updatedItems = [...prevItems];
          const currentItem = updatedItems[existingIndex];
          const newQuantity = Math.min(
            currentItem.quantity + quantity,
            product.stock
          );

          updatedItems[existingIndex] = {
            ...currentItem,
            quantity: newQuantity,
          };

          return updatedItems;
        } else {
          const initialQuantity = Math.min(quantity, product.stock);
          return [
            ...prevItems,
            {
              product,
              quantity: initialQuantity > 0 ? initialQuantity : 1,
              selectedVariant,
            },
          ];
        }
      });

      setIsCartOpen(true);
    },
    [user, router, pathname]
  );

  // Fungsi menghapus produk dari keranjang
  const removeItem = useCallback((productId: string, selectedVariant?: string) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedVariant === selectedVariant
          )
      )
    );
  }, []);

  // Fungsi update kuantitas produk
  const updateQuantity = useCallback(
    (productId: string, quantity: number, selectedVariant?: string) => {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (
            item.product.id === productId &&
            item.selectedVariant === selectedVariant
          ) {
            const validQuantity = Math.max(
              1,
              Math.min(quantity, item.product.stock)
            );
            return {
              ...item,
              quantity: validQuantity,
            };
          }
          return item;
        })
      );
    },
    []
  );

  // Fungsi mengosongkan keranjang
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Menghitung total unit produk di keranjang
  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  // Menghitung subtotal nominal harga keranjang
  const getSubtotal = useCallback(() => {
    return items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }, [items]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const openCheckoutModal = useCallback(() => {
    if (!user) {
      const currentQuery = typeof window !== "undefined" ? window.location.search : "";
      const redirectUrl = currentQuery ? `${pathname}${currentQuery}` : pathname;
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }
    setIsCartOpen(false); // Tutup drawer keranjang saat modal checkout terbuka
    setIsCheckoutModalOpen(true);
  }, [user, router, pathname]);

  const closeCheckoutModal = useCallback(() => {
    setIsCheckoutModalOpen(false);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        isCheckoutModalOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getSubtotal,
        openCart,
        closeCart,
        toggleCart,
        openCheckoutModal,
        closeCheckoutModal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
