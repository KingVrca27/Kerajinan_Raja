"use client";

import React, { useState } from "react";
import { ShoppingBag, Loader2 } from "lucide-react";
import { useCart } from "@/src/hooks/useCart";
import { createClient } from "@/src/lib/supabaseBrowser";
import type { Product } from "@/src/types/product";

interface OrderItemInfo {
  product_id: string;
  quantity: number;
}

interface OrderCardBuyAgainButtonProps {
  orderItems: OrderItemInfo[];
}

export default function OrderCardBuyAgainButton({
  orderItems,
}: OrderCardBuyAgainButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { addItem, openCheckoutModal } = useCart();

  const handleBuyAgain = async () => {
    if (isLoading || !orderItems || orderItems.length === 0) return;
    setIsLoading(true);

    try {
      const supabase = createClient();
      const productIds = orderItems.map((item) => item.product_id);

      // Ambil data produk terbaru dari database untuk mendapatkan stok, harga, dan berat terbaru
      const { data: productsData, error } = await supabase
        .from("products")
        .select(`
          id,
          slug,
          name,
          price,
          short_description,
          description,
          stock,
          weight_gram,
          is_featured,
          created_at,
          status,
          is_active,
          categories (
            slug
          ),
          product_images (
            image_url,
            is_primary,
            sort_order
          )
        `)
        .in("id", productIds)
        .eq("status", "active")
        .eq("is_active", true);

      if (error) {
        throw new Error(error.message);
      }

      if (!productsData || productsData.length === 0) {
        alert("Semua produk dalam pesanan ini sudah tidak tersedia.");
        setIsLoading(false);
        return;
      }

      let addedCount = 0;
      let unavailableCount = 0;

      // Masukkan ke cart
      for (const orderItem of orderItems) {
        const dbProduct = productsData.find((p) => p.id === orderItem.product_id);
        
        if (!dbProduct || dbProduct.stock <= 0) {
          unavailableCount++;
          continue;
        }

        // Resolusi gambar
        let primaryImage = "/products/product-placeholder.jpg";
        let allImages = [primaryImage];

        if (dbProduct.product_images && dbProduct.product_images.length > 0) {
          const sortedImages = [...dbProduct.product_images].sort(
            (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
          );
          const primary = sortedImages.find((img: any) => img.is_primary);
          primaryImage = primary?.image_url || sortedImages[0]?.image_url || primaryImage;
          allImages = sortedImages.map((img: any) => img.image_url).filter(Boolean);
        }

        // Resolusi isNew (30 hari terakhir)
        let isNew = false;
        if (dbProduct.created_at) {
          const created = new Date(dbProduct.created_at);
          const now = new Date();
          const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          isNew = diffDays <= 30;
        }

        // Konstruksi objek Product
        const productForCart: Product = {
          id: dbProduct.id,
          slug: dbProduct.slug || "",
          name: dbProduct.name,
          category: (Array.isArray(dbProduct.categories) ? dbProduct.categories[0]?.slug : (dbProduct.categories as any)?.slug) || "",
          price: Number(dbProduct.price) || 0,
          description: dbProduct.description || dbProduct.short_description || "",
          image: primaryImage,
          images: allImages,
          stock: dbProduct.stock,
          rating: 0,
          reviewCount: 0,
          isFeatured: dbProduct.is_featured || false,
          isBestSeller: false,
          isNew: isNew,
          weight_gram: dbProduct.weight_gram || 0,
          weight: dbProduct.weight_gram ? `${dbProduct.weight_gram}g` : undefined,
        };

        // Batasi quantity sesuai stok maksimum yang ada
        const qtyToAdd = Math.min(orderItem.quantity, dbProduct.stock);
        
        if (qtyToAdd > 0) {
          addItem(productForCart, qtyToAdd);
          addedCount++;
        } else {
          unavailableCount++;
        }
      }

      if (addedCount > 0) {
        if (unavailableCount > 0) {
          alert("Beberapa produk dalam pesanan ini sudah tidak tersedia atau stok habis. Produk yang masih tersedia telah ditambahkan ke keranjang.");
        }
        
        // Buka checkout langsung
        openCheckoutModal();
      } else {
        alert("Semua produk dalam pesanan ini sudah tidak tersedia atau stok habis.");
      }

    } catch (err: any) {
      console.error("Beli Lagi Error:", err);
      alert("Gagal menyiapkan pesanan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuyAgain}
      disabled={isLoading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-[#9D734E] hover:from-amber-700 hover:to-[#896342] rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Memproses...
        </>
      ) : (
        <>
          <ShoppingBag className="h-3.5 w-3.5" />
          Beli Lagi
        </>
      )}
    </button>
  );
}
