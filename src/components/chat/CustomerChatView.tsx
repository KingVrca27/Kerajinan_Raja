"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Store,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/src/lib/supabaseBrowser";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { DbConversationWithProductPreview } from "@/src/types/database";
import ProductChatPanel from "@/src/components/chat/ProductChatPanel";
import type { Product } from "@/src/types/product";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Memformat timestamp pesan untuk tampilan di daftar conversation.
 * Hari ini → jam:menit, Kemarin → "Kemarin", lebih lama → tanggal.
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  if (date >= todayStart) {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } else if (date >= yesterdayStart) {
    return "Kemarin";
  } else {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
    }).format(date);
  }
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-primary/10" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3.5 w-2/3 rounded-full bg-primary/10" />
        <div className="h-3 w-full rounded-full bg-primary/10" />
      </div>
      <div className="h-3 w-10 rounded-full bg-primary/10" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * `CustomerChatView` — halaman daftar riwayat chat customer (/chat).
 *
 * Menampilkan semua conversation customer dengan toko, diurutkan dari
 * pesan terbaru. Menggunakan Supabase Realtime untuk update otomatis.
 * Memilih conversation membuka ProductChatPanel existing.
 *
 * Phase 4.5C
 */
export const CustomerChatView: React.FC = () => {
  const supabase = createClient();

  const [conversations, setConversations] = useState<
    DbConversationWithProductPreview[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk conversation yang sedang dibuka di ProductChatPanel
  const [activeChatProduct, setActiveChatProduct] = useState<Product | null>(null);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);

  // userId = auth.users.id, customerId = customers.id
  const [userId, setUserId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Ref untuk Realtime channel
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  // ── Fetch conversation list ──────────────────────────────────────────────
  const fetchConversations = useCallback(
    async (cid: string, uid: string) => {
      try {
        // 1. Fetch conversations milik customer ini, join products + primary image
        const { data: convData, error: convError } = await supabase
          .from("conversations")
          .select(
            `id, customer_id, product_id, status, created_at, updated_at,
             products ( id, name, slug, product_images ( image_url, is_primary, sort_order ) )`
          )
          .eq("customer_id", cid)
          .order("updated_at", { ascending: false });

        if (convError) {
          throw new Error("Gagal memuat daftar percakapan: " + convError.message);
        }

        if (!convData || convData.length === 0) {
          setConversations([]);
          return;
        }

        const convIds = convData.map((c) => c.id);

        // 2. Fetch messages untuk last message + unread count
        const { data: msgData, error: msgError } = await supabase
          .from("messages")
          .select(
            "id, conversation_id, content, created_at, sender_id, is_read_by_customer"
          )
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false });

        if (msgError) {
          throw new Error("Gagal memuat pesan: " + msgError.message);
        }

        // 3. Build map: conversation_id → { lastMessage, unreadCount }
        type MsgMeta = {
          lastMessage: { content: string; created_at: string; sender_id: string } | null;
          unreadCount: number;
        };
        const convMap: Record<string, MsgMeta> = {};
        for (const conv of convData) {
          convMap[conv.id] = { lastMessage: null, unreadCount: 0 };
        }

        const seenConv = new Set<string>();
        for (const msg of msgData || []) {
          const entry = convMap[msg.conversation_id];
          if (!entry) continue;
          if (!seenConv.has(msg.conversation_id)) {
            seenConv.add(msg.conversation_id);
            entry.lastMessage = {
              content: msg.content,
              created_at: msg.created_at,
              sender_id: msg.sender_id,
            };
          }
          if (!msg.is_read_by_customer && msg.sender_id !== uid) {
            entry.unreadCount += 1;
          }
        }

        // 4. Merge
        const merged: DbConversationWithProductPreview[] = convData.map((c) => {
          const meta = convMap[c.id];
          const productRaw = c.products;
          const product = Array.isArray(productRaw)
            ? (productRaw[0] ?? null)
            : (productRaw ?? null);

          // Resolve primary image from product_images join
          let resolvedImageUrl: string | null = null;
          if (product) {
            const imgs = (product as { product_images?: { image_url: string; is_primary: boolean; sort_order: number }[] }).product_images ?? [];
            const primary = imgs.find((img) => img.is_primary);
            resolvedImageUrl = primary?.image_url ?? imgs[0]?.image_url ?? null;
          }

          return {
            id: c.id,
            customer_id: c.customer_id,
            product_id: c.product_id,
            status: c.status as "open" | "closed",
            created_at: c.created_at,
            updated_at: c.updated_at,
            products: product
              ? {
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  image_url: resolvedImageUrl,
                }
              : null,
            lastMessage: meta?.lastMessage ?? null,
            unreadCount: meta?.unreadCount ?? 0,
          };
        });

        // Sort by lastMessage.created_at DESC
        merged.sort((a, b) => {
          const aTime = a.lastMessage?.created_at ?? a.updated_at;
          const bTime = b.lastMessage?.created_at ?? b.updated_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

        setConversations(merged);
      } catch (err: unknown) {
        console.error("[CustomerChatView] fetchConversations error:", err);
        setError(
          err instanceof Error ? err.message : "Gagal memuat riwayat percakapan."
        );
      }
    },
    [supabase]
  );

  // ── Init: resolve auth → customer ────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (isMounted) setError("Sesi tidak valid. Silakan login kembali.");
          return;
        }

        if (isMounted) setUserId(user.id);

        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (customerError) {
          throw new Error("Gagal mengambil profil pelanggan: " + customerError.message);
        }

        if (!customerData) {
          if (isMounted) {
            setConversations([]);
            setIsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setCustomerId(customerData.id);
          await fetchConversations(customerData.id, user.id);
        }
      } catch (err: unknown) {
        console.error("[CustomerChatView] init error:", err);
        if (isMounted)
          setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [supabase, fetchConversations]);

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!customerId || !userId) return;

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    const channel = supabase
      .channel(`customer-chat-list:${customerId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchConversations(customerId, userId);
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      realtimeChannelRef.current = null;
    };
  }, [customerId, userId, supabase, fetchConversations]);

  // ── Open conversation ─────────────────────────────────────────────────────
  const handleOpenConversation = (conv: DbConversationWithProductPreview) => {
    if (!conv.products) return;

    const product: Product = {
      id: conv.product_id,
      name: conv.products.name,
      slug: conv.products.slug,
      image: conv.products.image_url ?? "/products/product-placeholder.svg",
      price: 0,
      stock: 1,
      category: "",
      description: "",
      rating: 0,
      reviewCount: 0,
      isNew: false,
      isBestSeller: false,
      isFeatured: false,
      images: conv.products.image_url ? [conv.products.image_url] : [],
      weight_gram: 0,
    };

    setActiveChatProduct(product);
    setIsChatPanelOpen(true);

    fetch(`/api/chat/${conv.id}/read`, { method: "POST" })
      .then(() => {
        setConversations((prev) =>
          prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
        );
      })
      .catch(console.error);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Pesan
            </h1>
            <p className="font-body text-sm text-text-secondary">
              Riwayat percakapan Anda dengan toko
            </p>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="rounded-2xl border border-primary/10 bg-background overflow-hidden divide-y divide-primary/10">
            {[1, 2, 3].map((i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="font-body text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => {
                if (customerId && userId) {
                  setError(null);
                  setIsLoading(true);
                  fetchConversations(customerId, userId).finally(() =>
                    setIsLoading(false)
                  );
                }
              }}
              className="rounded-lg bg-red-100 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-200 transition-colors cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && conversations.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-primary/10 bg-secondary/20 p-10 flex flex-col items-center gap-4 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Store className="h-8 w-8 text-primary/60" />
            </div>
            <div>
              <p className="font-heading text-base font-bold text-text-primary">
                Belum ada percakapan
              </p>
              <p className="mt-1 font-body text-sm text-text-secondary max-w-xs">
                Mulai chat dengan toko dari halaman detail produk yang ingin Anda tanyakan.
              </p>
            </div>
            <Link
              href="/produk"
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-body text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg active:scale-95"
            >
              Lihat Produk
              <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}

        {/* Conversation List */}
        {!isLoading && !error && conversations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-primary/10 bg-background overflow-hidden divide-y divide-primary/10 shadow-sm"
          >
            <AnimatePresence initial={false}>
              {conversations.map((conv, index) => {
                const productName = conv.products?.name ?? "Produk tidak diketahui";
                const productImage =
                  conv.products?.image_url ?? "/products/product-placeholder.svg";
                const lastMsg = conv.lastMessage;
                const hasUnread = conv.unreadCount > 0;

                return (
                  <motion.button
                    key={conv.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    type="button"
                    onClick={() => handleOpenConversation(conv)}
                    className="w-full flex items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-secondary/40 active:bg-secondary/60 cursor-pointer group"
                    aria-label={`Buka percakapan tentang ${productName}`}
                  >
                    {/* Product Image */}
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-primary/10 bg-secondary/40">
                      <Image
                        src={productImage}
                        alt={productName}
                        fill
                        sizes="56px"
                        className="object-cover"
                        unoptimized
                      />
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-background" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`font-body text-sm truncate ${
                            hasUnread
                              ? "font-bold text-text-primary"
                              : "font-semibold text-text-primary"
                          }`}
                        >
                          {productName}
                        </p>
                        {lastMsg && (
                          <span className="font-body text-xs text-text-secondary flex-shrink-0">
                            {formatRelativeTime(lastMsg.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p
                          className={`font-body text-xs truncate ${
                            hasUnread
                              ? "font-semibold text-text-primary"
                              : "text-text-secondary"
                          }`}
                        >
                          {lastMsg ? lastMsg.content : "Belum ada pesan"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 font-body text-[10px] font-bold text-white">
                            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-text-secondary/40 group-hover:text-primary transition-colors" />
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ProductChatPanel — reuse existing */}
      {activeChatProduct && (
        <ProductChatPanel
          isOpen={isChatPanelOpen}
          onClose={() => {
            setIsChatPanelOpen(false);
            if (customerId && userId) {
              fetchConversations(customerId, userId);
            }
          }}
          product={activeChatProduct}
        />
      )}
    </div>
  );
};

export default CustomerChatView;
