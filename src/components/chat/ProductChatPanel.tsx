"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Store, AlertCircle, Loader2, Check, CheckCheck } from "lucide-react";
import Image from "next/image";
import { Product } from "@/src/types/product";
import { createClient } from "@/src/lib/supabaseBrowser";
import type { DbConversation, DbMessage } from "@/src/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface ProductChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const ProductChatPanel: React.FC<ProductChatPanelProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<DbConversation | null>(null);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Ref untuk menyimpan channel realtime agar bisa di-cleanup
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    let isMounted = true;

    const initChat = async () => {
      if (!isOpen) return;

      try {
        setIsLoading(true);
        setError(null);

        // 1. Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error("Gagal mengambil data sesi pengguna. Silakan login kembali.");
        }
        
        if (isMounted) {
          setUserId(user.id);
        }

        // 2. Resolve customers.id dari auth.uid()
        //    conversations.customer_id → customers.id (bukan auth.users.id)
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (customerError) {
          throw new Error("Gagal mengambil data pelanggan. " + customerError.message);
        }

        if (!customerData) {
          throw new Error("Akun pelanggan belum terdaftar. Silakan lakukan pembelian pertama terlebih dahulu.");
        }

        const customerId = customerData.id;

        // 3. Load or Create Conversation (menggunakan customers.id, bukan auth.uid())
        const { data: convData, error: convError } = await supabase
          .from("conversations")
          .select("*")
          .eq("customer_id", customerId)
          .eq("product_id", product.id)
          .maybeSingle();

        if (convError) {
          throw new Error("Gagal memuat percakapan. " + convError.message);
        }

        let currentConv = convData;

        if (!currentConv) {
          // Create new conversation
          const { data: newConvData, error: insertError } = await supabase
            .from("conversations")
            .insert({
              customer_id: customerId,
              product_id: product.id,
              status: "open",
            })
            .select()
            .single();

          if (insertError) {
            // Check for conflict just in case it was created concurrently
            if (insertError.code === "23505") { // unique_violation
              const { data: existingConv } = await supabase
                .from("conversations")
                .select("*")
                .eq("customer_id", customerId)
                .eq("product_id", product.id)
                .single();
              currentConv = existingConv;
            } else {
              throw new Error("Gagal membuat percakapan baru. " + insertError.message);
            }
          } else {
            currentConv = newConvData;
          }
        }

        if (isMounted && currentConv) {
          setConversation(currentConv);

          // 3. Load Messages
          const { data: msgData, error: msgError } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", currentConv.id)
            .order("created_at", { ascending: true });

          if (msgError) {
            throw new Error("Gagal memuat pesan. " + msgError.message);
          }

          setMessages(msgData || []);
        }

      } catch (err: unknown) {
        console.error("Init Chat Error:", err);
        if (isMounted) setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (isOpen) {
      initChat();
    } else {
      // Reset state on close — cleanup realtime channel juga
      setMessages([]);
      setConversation(null);
      setError(null);
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    }

    return () => {
      isMounted = false;
      // Cleanup realtime saat unmount
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [isOpen, product.id, supabase]);

  // ── Realtime subscription — dibuat SETELAH conversation berhasil dimuat ──
  useEffect(() => {
    if (!conversation) return;

    // Cleanup channel lama jika ada (misalnya conversation berganti)
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    // Subscribe ke semua event pada tabel messages, filter per conversation_id
    // RLS memastikan customer hanya menerima pesan dari conversation miliknya
    const channel = supabase
      .channel(`messages:conv:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as DbMessage;
            // Deduplication: jangan tambahkan pesan yang ID-nya sudah ada
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            // Jika ada pesan baru dari admin dan panel sedang aktif (isOpen), otomatis tandai dibaca
            if (isOpen && newMsg.sender_id !== userId) {
              fetch(`/api/chat/${conversation.id}/read`, { method: "POST" }).catch(console.error);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedMsg = payload.new as DbMessage;
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
            );
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      realtimeChannelRef.current = null;
    };
  }, [conversation, supabase]);

  // ── Update read status when chat is opened ──
  useEffect(() => {
    if (isOpen && conversation) {
      // Panggil API read
      fetch(`/api/chat/${conversation.id}/read`, { method: "POST" }).catch(console.error);
    }
  }, [isOpen, conversation]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedMsg = inputMessage.trim();
    if (!trimmedMsg || !conversation || !userId) return;

    setIsSending(true);
    setError(null);

    try {
      const { data: newMsg, error: sendError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: userId,
          content: trimmedMsg,
          is_read_by_admin: false,
          is_read_by_customer: true,
        })
        .select()
        .single();

      if (sendError) {
        throw new Error("Gagal mengirim pesan. " + sendError.message);
      }

      setMessages((prev) => [...prev, newMsg]);
      setInputMessage("");
    } catch (err: unknown) {
      console.error("Send Message Error:", err);
      setError(err instanceof Error ? err.message : "Gagal mengirim pesan.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Transparan Gelap */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Dialog Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-[#FDFBF7] shadow-2xl border border-amber-900/10 flex flex-col h-[80vh] max-h-[700px]"
          >
            {/* Header Modal */}
            <div className="flex flex-col border-b border-amber-900/10 bg-gradient-to-r from-[#9D734E] via-[#896342] to-[#765335] shadow-sm">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-xs border border-white/10 shadow-xs">
                    <Store className="h-5 w-5 fill-white text-white stroke-none" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-white tracking-tight">
                      Putra Art Shop
                    </h2>
                    <p className="font-body text-xs text-amber-100/90 font-medium truncate max-w-[200px]">
                      Chat tentang: {product.name}
                    </p>
                  </div>
                </div>

                {/* Tombol Tutup (X) */}
                <button
                  type="button"
                  aria-label="Tutup Chat"
                  onClick={onClose}
                  className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Product Info Bar */}
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 flex items-center gap-3 border-t border-white/10">
                <div className="h-10 w-10 relative rounded-md overflow-hidden bg-white/20">
                   <Image 
                     src={product.image} 
                     alt={product.name} 
                     fill 
                     className="object-cover"
                     unoptimized
                   />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{product.name}</p>
                  <p className="text-white/80 text-[10px] font-medium">Rp {product.price.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            {/* Area Pesan */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 flex flex-col space-y-4">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-70">
                  <Loader2 className="h-8 w-8 animate-spin text-[#9D734E] mb-2" />
                  <p className="text-xs text-gray-500 font-medium">Memuat percakapan...</p>
                </div>
              ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80 px-4">
                  <AlertCircle className="h-10 w-10 text-red-500 mb-3 opacity-80" />
                  <p className="text-sm font-semibold text-gray-900 mb-1">Gagal Memuat</p>
                  <p className="text-xs text-gray-500 max-w-xs">{error}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 px-4">
                  <Store className="h-12 w-12 text-[#9D734E] mb-3 opacity-50" />
                  <p className="text-sm font-semibold text-gray-900 mb-1">Belum Ada Percakapan</p>
                  <p className="text-xs text-gray-500 max-w-[250px] leading-relaxed">
                    Silakan kirim pesan kepada Putra Art Shop untuk bertanya seputar produk ini.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCustomer = msg.sender_id === userId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex w-full ${isCustomer ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                          isCustomer
                            ? "bg-[#9D734E] text-white rounded-tr-sm"
                            : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                        }`}
                      >
                        {!isCustomer && (
                          <div className="font-bold text-xs text-gray-900 mb-1">Toko</div>
                        )}
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                        <div
                          className={`text-[10px] mt-1.5 text-right font-medium flex items-center justify-end gap-1 ${
                            isCustomer ? "text-white/70" : "text-gray-400"
                          }`}
                        >
                          {new Intl.DateTimeFormat("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(msg.created_at))}
                          {isCustomer && (
                            msg.is_read_by_admin ? (
                              <CheckCheck className="h-3 w-3 text-blue-200 ml-0.5" />
                            ) : (
                              <Check className="h-3 w-3 text-white/50 ml-0.5" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Pesan */}
            <div className="p-3 bg-white border-t border-amber-900/10 flex-shrink-0">
              {error && isSending && (
                <p className="text-xs text-red-500 mb-2 px-2">{error}</p>
              )}
              <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ketik pesan..."
                  disabled={isLoading || isSending}
                  rows={1}
                  className="flex-1 max-h-32 min-h-[44px] resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-[#9D734E] focus:ring-1 focus:ring-[#9D734E] focus:outline-none disabled:opacity-50 scrollbar-hide"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading || isSending}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#9D734E] to-[#896342] text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:shadow-none hover:opacity-90 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 ml-0.5" />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProductChatPanel;
