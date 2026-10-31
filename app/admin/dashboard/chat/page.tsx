/**
 * @file app/admin/dashboard/chat/page.tsx
 * Halaman Admin Chat Dashboard — Phase 4.4O
 * Admin dapat melihat seluruh percakapan customer dan memberikan balasan.
 *
 * Security:
 * - Seluruh data diambil melalui API routes /api/admin/chat/* yang memverifikasi session dan role.
 * - sender_id diambil dari session server, bukan dari client.
 * - Tidak ada service_role di client.
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  User,
  Package,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Store,
  Check,
  CheckCheck,
} from "lucide-react";
import { createClient } from "@/src/lib/supabaseBrowser";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConversationListItem {
  id: string;
  customer_id: string;
  product_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  customers: { id: string; user_id: string; full_name: string; email: string } | null;
  products: { id: string; name: string; slug: string } | null;
  last_message: { content: string; created_at: string; sender_id: string } | null;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read_by_admin: boolean;
  is_read_by_customer: boolean;
  created_at: string;
}

interface ConversationDetail {
  id: string;
  customer_id: string;
  product_id: string;
  status: string;
  customers: { id: string; user_id: string; full_name: string; email: string } | null;
  products: { id: string; name: string; slug: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / 1000 / 60 / 60;

  if (diffHours < 24) {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatTime(iso: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({
  msg,
  type,
}: {
  msg: string;
  type: "success" | "error";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className={`fixed top-5 right-5 z-[200] flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg ${
        type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      {msg}
    </motion.div>
  );
}

// ── Komponen Utama ────────────────────────────────────────────────────────────

export default function AdminChatPage() {
  // List conversations
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Selected conversation
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Reply input
  const [replyInput, setReplyInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConvIdRef = useRef<string | null>(null);

  // Ref untuk menyimpan channel realtime admin
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  // Supabase browser client khusus untuk realtime subscription (anon key — RLS aktif)
  const supabase = createClient();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load conversation list ──────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const res = await fetch("/api/admin/chat");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal memuat percakapan.");
      }
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Load messages when a conversation is selected ─────────────────────────

  const loadMessages = useCallback(async (convId: string) => {
    setIsLoadingMessages(true);
    setMessagesError(null);
    try {
      const res = await fetch(`/api/admin/chat/${convId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal memuat pesan.");
      }
      const data = await res.json();
      setSelectedConv(data.conversation ?? null);
      setMessages(data.messages ?? []);
    } catch (err: unknown) {
      setMessagesError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      setReplyInput("");
      setSendError(null);
      loadMessages(selectedConvId);
      
      // Mark messages as read by admin in DB
      fetch(`/api/admin/chat/${selectedConvId}/read`, { method: "POST" }).catch(console.error);

      // Force unread_count to 0 locally
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId ? { ...c, unread_count: 0 } : c
        )
      );

      selectedConvIdRef.current = selectedConvId;
    } else {
      setSelectedConv(null);
      setMessages([]);
      selectedConvIdRef.current = null;
    }
  }, [selectedConvId, loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ── Global Realtime subscription untuk admin list dan active chat ────
  useEffect(() => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    const channel = supabase
      .channel(`admin:messages:global`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as Message;
            
            setConversations((prev) => {
              const exists = prev.find((c) => c.id === newMsg.conversation_id);
              if (!exists) return prev;
              return prev.map((c) =>
                c.id === newMsg.conversation_id
                  ? {
                      ...c,
                      last_message: {
                        content: newMsg.content,
                        created_at: newMsg.created_at,
                        sender_id: newMsg.sender_id,
                      },
                      updated_at: newMsg.created_at,
                      // Jika pesan baru dari customer (belum dibaca admin) dan bukan active chat, tambah unread
                      unread_count:
                        newMsg.conversation_id !== selectedConvIdRef.current &&
                        !newMsg.is_read_by_admin
                          ? (c.unread_count || 0) + 1
                          : c.unread_count,
                    }
                  : c
              );
            });

            if (newMsg.conversation_id === selectedConvIdRef.current) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              
              // Jika ini pesan dari customer, panggil API read untuk otomatis menandai dibaca (karena panel sedang aktif)
              if (newMsg.sender_id === selectedConvData?.customers?.user_id) {
                 fetch(`/api/admin/chat/${newMsg.conversation_id}/read`, { method: "POST" }).catch(console.error);
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedMsg = payload.new as Message;
            // Update messages in active chat
            if (updatedMsg.conversation_id === selectedConvIdRef.current) {
              setMessages((prev) =>
                prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
              );
            }
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      realtimeChannelRef.current = null;
    };
  }, [supabase]);

  // ── Send reply ──────────────────────────────────────────────────────────────

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConvId) return;

    const trimmed = replyInput.trim();
    if (!trimmed) {
      setSendError("Pesan tidak boleh kosong.");
      return;
    }
    if (trimmed.length > 2000) {
      setSendError("Pesan terlalu panjang. Maksimum 2000 karakter.");
      return;
    }

    setIsSending(true);
    setSendError(null);

    try {
      const res = await fetch(`/api/admin/chat/${selectedConvId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal mengirim pesan.");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setReplyInput("");
      // Update last message di list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? {
                ...c,
                last_message: {
                  content: data.message.content,
                  created_at: data.message.created_at,
                  sender_id: data.message.sender_id,
                },
                updated_at: data.message.created_at,
              }
            : c
        )
      );
      // Hapus localStorage
      
      showToast("success", "Pesan berhasil dikirim.");
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Gagal mengirim pesan.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // ── UI Helper ──────────────────────────────────────────────────────────────

  const selectedConvData = conversations.find((c) => c.id === selectedConvId);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 font-body">
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Chat Pelanggan
          </h1>
          <p className="text-xs text-text-secondary sm:text-sm mt-1">
            Lihat dan balas percakapan pelanggan terkait produk.
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-4 rounded-3xl border border-primary/10 bg-white overflow-hidden shadow-sm min-h-[600px]">

        {/* ── LEFT: Conversation List ── */}
        <div
          className={`lg:col-span-4 border-r border-primary/10 flex flex-col ${
            selectedConvId ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* List Header */}
          <div className="p-4 border-b border-primary/10 bg-secondary/10">
            <h2 className="font-heading text-sm font-bold text-text-primary">
              Daftar Percakapan
            </h2>
          </div>

          {/* List Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-primary/5">
            {isLoadingList ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-text-secondary">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs">Memuat percakapan...</p>
              </div>
            ) : listError ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 px-4 text-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="text-xs font-semibold text-red-600">{listError}</p>
                <button
                  type="button"
                  onClick={loadConversations}
                  className="text-xs underline text-primary hover:text-primary/80 cursor-pointer"
                >
                  Coba lagi
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-text-secondary px-4 text-center">
                <MessageSquare className="h-10 w-10 text-primary/20" />
                <p className="text-xs font-semibold text-text-primary">
                  Belum ada percakapan
                </p>
                <p className="text-xs">
                  Percakapan dari customer akan muncul di sini.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isUnread = (conv.unread_count || 0) > 0;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-4 hover:bg-secondary/20 transition-colors cursor-pointer ${
                      selectedConvId === conv.id
                        ? "bg-primary/5 border-l-2 border-primary"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary relative">
                        {isUnread && (
                          <div className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm border-2 border-white">
                            {conv.unread_count && conv.unread_count > 9 ? "9+" : conv.unread_count}
                          </div>
                        )}
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs truncate ${isUnread ? "font-black text-primary" : "font-bold text-text-primary"}`}>
                            {conv.customers?.full_name ?? "Pelanggan"}
                          </span>
                          <span className={`text-[10px] flex-shrink-0 ${isUnread ? "text-red-500 font-bold" : "text-text-secondary"}`}>
                            {conv.last_message
                              ? formatDate(conv.last_message.created_at)
                              : formatDate(conv.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Package className="h-3 w-3 text-primary flex-shrink-0" />
                          <span className="text-[10px] text-primary font-medium truncate">
                            {conv.products?.name ?? "Produk"}
                          </span>
                        </div>
                        {conv.last_message && (
                          <p className={`text-[10px] mt-1 truncate ${isUnread ? "text-text-primary font-semibold" : "text-text-secondary"}`}>
                            {conv.last_message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT: Chat View ── */}
        <div
          className={`lg:col-span-8 flex flex-col ${
            selectedConvId ? "flex" : "hidden lg:flex"
          }`}
        >
          {!selectedConvId ? (
            // Empty state — no conversation selected
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-secondary p-8 text-center">
              <Store className="h-16 w-16 text-primary/20" />
              <p className="font-heading text-base font-bold text-text-primary">
                Pilih Percakapan
              </p>
              <p className="text-xs max-w-xs">
                Klik salah satu percakapan di sebelah kiri untuk melihat pesan
                dan memberikan balasan.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-primary/10 bg-gradient-to-r from-[#9D734E] via-[#896342] to-[#765335]">
                {/* Back button (mobile only) */}
                <button
                  type="button"
                  onClick={() => setSelectedConvId(null)}
                  className="lg:hidden flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 border border-white/10">
                  <User className="h-5 w-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {isLoadingMessages
                      ? selectedConvData?.customers?.full_name ?? "Pelanggan"
                      : selectedConv?.customers?.full_name ?? "Pelanggan"}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Package className="h-3 w-3 text-amber-200" />
                    <p className="text-[10px] text-amber-100 truncate">
                      {isLoadingMessages
                        ? selectedConvData?.products?.name ?? "Produk"
                        : selectedConv?.products?.name ?? "Produk"}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <span className="text-[10px] bg-white/10 text-amber-100 border border-white/10 px-2 py-0.5 rounded-full font-medium">
                    Putra Art Shop
                  </span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 flex flex-col space-y-3 min-h-0">
                {isLoadingMessages ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 text-text-secondary">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-xs">Memuat pesan...</p>
                  </div>
                ) : messagesError ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-4">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                    <p className="text-xs font-semibold text-red-600">{messagesError}</p>
                    <button
                      type="button"
                      onClick={() => loadMessages(selectedConvId)}
                      className="text-xs underline text-primary cursor-pointer"
                    >
                      Coba lagi
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 text-text-secondary text-center">
                    <MessageSquare className="h-10 w-10 text-primary/20" />
                    <p className="text-xs font-semibold text-text-primary">
                      Belum ada pesan
                    </p>
                    <p className="text-xs">Kirim balasan untuk memulai percakapan.</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isCustomerMessage = msg.sender_id === selectedConv?.customers?.user_id;
                      const isAdmin = !isCustomerMessage;
                      return (
                        <div
                          key={msg.id}
                          className={`flex w-full ${isAdmin ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                              isAdmin
                                ? "bg-[#9D734E] text-white rounded-tr-sm"
                                : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                            }`}
                          >
                            {!isAdmin && (
                              <div className="font-bold text-[10px] text-primary mb-1">
                                Pelanggan
                              </div>
                            )}
                            {isAdmin && (
                              <div className="font-bold text-[10px] text-amber-200 mb-1">
                                Admin
                              </div>
                            )}
                            <div className="whitespace-pre-wrap leading-relaxed text-[13px]">
                              {msg.content}
                            </div>
                            <div
                              className={`text-[10px] mt-1 text-right font-medium flex items-center justify-end gap-1 ${
                                isAdmin ? "text-white/60" : "text-gray-400"
                              }`}
                            >
                              <Clock className="h-2.5 w-2.5" />
                              {formatTime(msg.created_at)}
                              {isAdmin && (
                                msg.is_read_by_customer ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-blue-200 ml-0.5" />
                                ) : (
                                  <Check className="h-3.5 w-3.5 text-white/50 ml-0.5" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Reply Input */}
              <div className="p-3 border-t border-primary/10 bg-white flex-shrink-0">
                {sendError && (
                  <p className="text-xs text-red-500 mb-2 px-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {sendError}
                  </p>
                )}
                <form
                  onSubmit={handleSendReply}
                  className="flex items-end gap-2"
                >
                  <textarea
                    value={replyInput}
                    onChange={(e) => {
                      setReplyInput(e.target.value);
                      if (sendError) setSendError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ketik balasan... (Enter untuk kirim, Shift+Enter untuk baris baru)"
                    disabled={isLoadingMessages || isSending}
                    rows={2}
                    className="flex-1 max-h-32 min-h-[52px] resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-[#9D734E] focus:ring-1 focus:ring-[#9D734E] focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!replyInput.trim() || isLoadingMessages || isSending}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
