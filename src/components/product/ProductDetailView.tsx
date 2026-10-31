"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Home,
  Star,
  ShoppingCart,
  Sparkles,
  Award,
  Flame,
  CheckCircle2,
  Package,
  Ruler,
  Weight,
  MessageCircle,
  Minus,
  Plus,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Product } from "@/src/types/product";
import { ReviewWithDetails } from "@/src/types/ops";
import { formatRupiah } from "@/src/lib/currency";
import { createClient } from "@/src/lib/supabaseBrowser";

import ProductGrid from "@/src/components/product/ProductGrid";
import { useCart } from "@/src/hooks/useCart";
import { useWishlist } from "@/src/hooks/useWishlist";
import WishlistButton from "@/src/components/wishlist/WishlistButton";
import ProductChatPanel from "@/src/components/chat/ProductChatPanel";

/**
 * Interface props untuk komponen ProductDetailView.
 */
export interface ProductDetailViewProps {
  /** Objek data detail produk utama */
  product: Product;
  /** Array daftar produk terkait */
  relatedProducts: Product[];
  /** Array daftar ulasan pelanggan */
  reviews?: ReviewWithDetails[];
  /** Kelas CSS tambahan untuk pengayaan tampilan */
  className?: string;
}

/**
 * Komponen Client ProductDetailView merender keseluruhan elemen visual Halaman Detail Produk,
 * termasuk galeri foto interaktif, rincian produk, tombol aksi, dan grid produk terkait.
 */
export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  relatedProducts,
  reviews = [],
  className = "",
}) => {
  const { addItem, openCheckoutModal } = useCart();
  const [quantity, setQuantity] = useState<number>(1);
  const router = useRouter();
  const supabase = createClient();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleOpenChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirect=/produk/${product.slug}`);
      return;
    }
    setIsChatOpen(true);
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    openCheckoutModal();
  };

  const decrementQty = () => setQuantity((prev) => Math.max(1, prev - 1));
  const incrementQty = () => setQuantity((prev) => Math.min(product.stock, prev + 1));

  // Ambil daftar gambar atau gunakan gambar utama sebagai fallback
  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];

  // State untuk menyimpan index gambar aktif di galeri
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  const [unreadCount, setUnreadCount] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Load conversation ID and unread count
  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("customer_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();

      if (!conv && isMounted) {
        setUnreadCount(0);
        return;
      }

      if (isMounted && conv) {
        setConversationId(conv.id);
        
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("is_read_by_customer", false);
          
        if (isMounted) {
          setUnreadCount(count || 0);
        }
      }
    };
    fetchUnread();
  }, [product.id, isChatOpen, supabase]); 

  // Realtime subscription for unread count while chat is closed
  useEffect(() => {
    if (isChatOpen || !conversationId) return;
    let isMounted = true;
    let currentUserId = "";
    supabase.auth.getUser().then(res => currentUserId = res.data.user?.id || "");

    const channel = supabase
      .channel(`unread:conv:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as { sender_id: string };
            if (newMsg.sender_id !== currentUserId) {
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === "UPDATE") {
            // Re-fetch unread count from db
            const { count } = await supabase
              .from("messages")
              .select("id", { count: "exact", head: true })
              .eq("conversation_id", conversationId)
              .eq("is_read_by_customer", false);
            
            if (isMounted) {
              setUnreadCount(count || 0);
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [isChatOpen, conversationId, supabase]);



  return (
    <div className={`min-h-screen bg-background py-8 sm:py-12 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* 1. Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 font-body text-xs sm:text-sm text-text-secondary"
        >
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Beranda</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-text-secondary/40" />
          <Link
            href="/produk"
            className="hover:text-primary transition-colors"
          >
            Produk
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-text-secondary/40" />
          <Link
            href={`/produk?category=${product.category}`}
            className="capitalize hover:text-primary transition-colors"
          >
            {product.category}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-text-secondary/40" />
          <span className="font-semibold text-text-primary truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* 2 & 3. 2-Column Responsive Layout (Galeri + Informasi Produk) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* Galeri Gambar Produk */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-4"
          >
            {/* Gambar Utama (Main Image Container) */}
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-primary/10 bg-secondary/40 shadow-lg">
              <Image
                src={images[selectedImageIndex] || product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-all duration-300 hover:scale-105"
                unoptimized
              />
            </div>

            {/* Thumbnails (Tampil jika gambar lebih dari 1) */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((imgSrc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                      selectedImageIndex === idx
                        ? "border-primary ring-2 ring-primary/20 scale-105"
                        : "border-primary/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={imgSrc}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Rincian Informasi Produk */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col space-y-6"
          >
            {/* Badges Status Produk */}
            <div className="flex flex-wrap items-center gap-2">
              {product.isNew && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 font-body text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>BARU</span>
                </span>
              )}
              {product.isBestSeller && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 font-body text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Flame className="h-3.5 w-3.5" />
                  <span>BEST SELLER</span>
                </span>
              )}
              {product.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 font-body text-xs font-semibold text-primary border border-primary/20">
                  <Award className="h-3.5 w-3.5" />
                  <span>UNGGULAN</span>
                </span>
              )}
              <span className="capitalize text-xs font-semibold text-text-secondary bg-secondary/60 px-3 py-1 rounded-full border border-primary/10">
                {product.category}
              </span>
            </div>

            {/* Nama Produk */}
            <h1 className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>

            {/* Rating & Ulasan */}
            <div className="flex items-center gap-3 font-body text-sm">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-amber-400 stroke-amber-400" />
                <span className="font-bold text-text-primary">
                  {product.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-text-secondary">|</span>
              <span className="text-text-secondary">
                {product.reviewCount} Ulasan
              </span>
              <span className="text-text-secondary">|</span>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                <span>Stok: {product.stock > 0 ? `${product.stock} unit` : "Habis"}</span>
              </div>
            </div>

            {/* Harga */}
            <div className="rounded-2xl border border-primary/10 bg-secondary/30 p-4">
              <span className="font-body text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Harga Produk
              </span>
              <div className="mt-1 font-heading text-3xl font-extrabold text-primary">
                {formatRupiah(product.price)}
              </div>
            </div>

            {/* 4. Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center gap-3">
                <span className="font-body text-sm font-semibold text-text-secondary">Jumlah:</span>
                <div className="flex items-center rounded-xl border border-primary/20 bg-secondary/40 overflow-hidden">
                  <button
                    type="button"
                    aria-label="Kurangi jumlah"
                    onClick={decrementQty}
                    disabled={quantity <= 1}
                    className="flex h-10 w-10 items-center justify-center text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center font-body text-sm font-bold text-text-primary">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Tambah jumlah"
                    onClick={incrementQty}
                    disabled={quantity >= product.stock}
                    className="flex h-10 w-10 items-center justify-center text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="font-body text-xs text-text-secondary/60">
                  Stok: {product.stock}
                </span>
              </div>
            )}

            {/* 5. Tombol Aksi: [ ♡ ] [ 💬 ] [ 🛒 ] [ Beli Sekarang ] */}
            <div className="flex items-center gap-2.5 pt-1">

              {/* Wishlist — icon only */}
              <WishlistButton
                product={product}
                className="h-11 w-11 flex-shrink-0 border border-primary/20 shadow-sm rounded-xl"
              />

              {/* Chat — icon only */}
              <button
                type="button"
                aria-label="Chat dengan Toko"
                title="Chat dengan Toko"
                onClick={handleOpenChat}
                className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/70 border border-primary/20 text-primary shadow-sm transition-all hover:bg-secondary hover:shadow-md active:scale-95 cursor-pointer"
              >
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm border-2 border-[#FDFBF7]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                <MessageCircle className="h-4.5 w-4.5" />
              </button>

              {/* Cart — icon only */}
              <button
                type="button"
                aria-label="Tambah ke Keranjang"
                title="Tambah ke Keranjang"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/70 border border-primary/20 text-primary shadow-sm transition-all hover:bg-secondary hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <ShoppingCart className="h-4.5 w-4.5" />
              </button>

              {/* Beli Sekarang — text button */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-body text-sm font-bold text-white shadow-md shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer min-h-[44px] whitespace-nowrap"
              >
                <Zap className="h-4 w-4 flex-shrink-0" />
                <span>Beli Sekarang</span>
              </button>

            </div>

            {/* Spesifikasi Produk (Bahan, Dimensi, Berat jika ada) */}
            {(product.material || product.dimensions || product.weight) && (
              <div className="rounded-2xl border border-primary/10 bg-background p-4 space-y-2 font-body text-xs sm:text-sm text-text-secondary">
                <span className="font-semibold text-text-primary block mb-2">
                  Spesifikasi Produk:
                </span>
                {product.material && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>
                      Bahan: <strong className="text-text-primary font-medium">{product.material}</strong>
                    </span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>
                      Dimensi: <strong className="text-text-primary font-medium">{product.dimensions}</strong>
                    </span>
                  </div>
                )}
                {product.weight && (
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>
                      Berat: <strong className="text-text-primary font-medium">{product.weight}</strong>
                    </span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* 5. Deskripsi Produk */}
        <div className="rounded-3xl border border-primary/10 bg-secondary/20 p-6 sm:p-8 space-y-4">
          <h2 className="font-heading text-xl font-bold text-text-primary sm:text-2xl">
            Deskripsi Produk
          </h2>
          <p className="font-body text-sm sm:text-base text-text-secondary leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>

        {/* Section Ulasan Pelanggan */}
        {reviews && reviews.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-primary/10">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                Ulasan Pelanggan
              </h2>
              <p className="mt-1 font-body text-sm text-text-secondary">
                Apa kata pelanggan yang sudah membeli produk ini.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl border border-primary/10 shadow-sm space-y-3 overflow-hidden">
                  {/* Foto review — hanya tampil jika ada */}
                  {review.image_url && (
                    <div className="w-full h-44 bg-gray-50 overflow-hidden">
                      <img
                        src={review.image_url}
                        alt="Foto ulasan"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="px-5 pb-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{review.customer_name}</span>
                      <span className="text-xs text-gray-500">
                        {new Intl.DateTimeFormat("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        }).format(new Date(review.created_at))}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-4 w-4 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} 
                        />
                      ))}
                    </div>

                    {review.title && (
                      <h4 className="font-bold text-gray-900 text-sm mt-2">{review.title}</h4>
                    )}
                    {review.content && (
                      <p className="text-gray-600 text-sm leading-relaxed">{review.content}</p>
                    )}
                    {review.admin_reply && (
                      <div className="mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100 relative">
                        <div className="absolute -top-2 left-4 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Balasan Penjual
                        </div>
                        <p className="text-gray-700 text-sm mt-1">{review.admin_reply}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Section Produk Terkait */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-primary/10">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                Produk Terkait
              </h2>
              <p className="mt-1 font-body text-sm text-text-secondary">
                Koleksi kerajinan tangan sejenis yang mungkin Anda sukai.
              </p>
            </div>

            {/* Reuse ProductGrid tanpa membuat grid baru */}
            <ProductGrid products={relatedProducts} />
          </div>
        )}

      </div>

      <ProductChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        product={product}
      />
    </div>
  );
};

export default ProductDetailView;
