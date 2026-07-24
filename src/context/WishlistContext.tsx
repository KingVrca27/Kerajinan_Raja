"use client";

import React, { createContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Product } from "@/src/types/product";

/** Kunci penyimpanan data favorit pada localStorage browser */
const WISHLIST_STORAGE_KEY = "kerajinan-raja-wishlist";

/**
 * Interface definisi tipe data nilai yang disediakan oleh WishlistContext.
 */
export interface WishlistContextType {
  /** Array daftar produk favorit yang tersimpan */
  items: Product[];
  /** Status keterbukaan panel WishlistDrawer */
  isWishlistOpen: boolean;
  /**
   * Menambahkan produk ke daftar favorit.
   * @param product Objek produk yang ditambahkan
   */
  addItem: (product: Product) => void;
  /**
   * Menghapus produk dari daftar favorit berdasarkan ID.
   * @param productId ID unik produk yang dihapus
   */
  removeItem: (productId: string) => void;
  /**
   * Menambah jika belum ada, atau menghapus jika sudah ada di daftar favorit.
   * @param product Objek produk yang di-toggle
   */
  toggleItem: (product: Product) => void;
  /**
   * Memeriksa apakah suatu produk sudah tersimpan di daftar favorit.
   * @param productId ID produk yang ingin diperiksa
   * @returns `true` jika produk sudah favorit, `false` jika belum
   */
  isInWishlist: (productId: string) => boolean;
  /** Mengosongkan seluruh isi daftar favorit */
  clearWishlist: () => void;
  /**
   * Mengembalikan total jumlah item produk favorit.
   * @returns Jumlah total item favorit
   */
  getTotalItems: () => number;
  /** Membuka panel WishlistDrawer */
  openWishlist: () => void;
  /** Menutup panel WishlistDrawer */
  closeWishlist: () => void;
  /** Mengubah (toggle) status keterbukaan panel WishlistDrawer */
  toggleWishlist: () => void;
}

/** Context untuk mengelola State Produk Favorit (Wishlist) global */
export const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export interface WishlistProviderProps {
  /** Elemen anak yang dibungkus oleh provider */
  children: ReactNode;
}

/**
 * WishlistProvider adalah komponen pembungkus (wrapper) yang menyediakan state produk favorit
 * serta fungsi-fungsi manipulasi wishlist ke seluruh komponen aplikasi.
 *
 * Menggunakan `localStorage` (`kerajinan-raja-wishlist`) secara SSR-hydration safe.
 */
export const WishlistProvider: React.FC<WishlistProviderProps> = ({
  children,
}) => {
  const [items, setItems] = useState<Product[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // 1. Baca data favorit dari localStorage saat pertama kali dirender di Client
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (savedWishlist) {
        const parsedItems = JSON.parse(savedWishlist);
        if (Array.isArray(parsedItems)) {
          setItems(parsedItems);
        }
      }
    } catch (error) {
      console.error("Gagal membaca data wishlist dari localStorage:", error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Simpan perubahan items ke localStorage secara otomatis
  useEffect(() => {
    if (!isInitialized) return;

    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Gagal menyimpan data wishlist ke localStorage:", error);
    }
  }, [items, isInitialized]);

  // Memeriksa apakah produk sudah ada di wishlist
  const isInWishlist = useCallback(
    (productId: string) => {
      return items.some((item) => item.id === productId);
    },
    [items]
  );

  // Menambah produk ke wishlist
  const addItem = useCallback((product: Product) => {
    setItems((prevItems) => {
      if (prevItems.some((item) => item.id === product.id)) {
        return prevItems;
      }
      return [...prevItems, product];
    });
  }, []);

  // Menghapus produk dari wishlist
  const removeItem = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  }, []);

  // Toggle status wishlist produk
  const toggleItem = useCallback((product: Product) => {
    setItems((prevItems) => {
      const exists = prevItems.some((item) => item.id === product.id);
      if (exists) {
        return prevItems.filter((item) => item.id !== product.id);
      } else {
        return [...prevItems, product];
      }
    });
  }, []);

  // Mengosongkan wishlist
  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  // Mendapatkan jumlah total item favorit
  const getTotalItems = useCallback(() => {
    return items.length;
  }, [items]);

  const openWishlist = useCallback(() => setIsWishlistOpen(true), []);
  const closeWishlist = useCallback(() => setIsWishlistOpen(false), []);
  const toggleWishlist = useCallback(
    () => setIsWishlistOpen((prev) => !prev),
    []
  );

  return (
    <WishlistContext.Provider
      value={{
        items,
        isWishlistOpen,
        addItem,
        removeItem,
        toggleItem,
        isInWishlist,
        clearWishlist,
        getTotalItems,
        openWishlist,
        closeWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistContext;
