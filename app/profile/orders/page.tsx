import { createClient } from "@/src/lib/supabaseServer";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatRupiah } from "@/src/lib/currency";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  ChevronRight,
  Image as ImageIcon,
  Star,
  Wallet,
} from "lucide-react";
import OrderCardCancelButton from "./OrderCardCancelButton";
import OrderCardRatingSection from "./OrderCardRatingSection";
import OrderCardBuyAgainButton from "./OrderCardBuyAgainButton";

export const metadata = {
  title: "Pesanan Saya | Putra Art Shop",
  description: "Daftar pesanan Anda di Putra Art Shop",
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Jumlah item yang ditampilkan di card sebelum "+ X produk lainnya"
// ─────────────────────────────────────────────────────────────────────────────
const CARD_ITEM_LIMIT = 3;

export default async function OrdersPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const tab =
    typeof resolvedSearchParams.tab === "string"
      ? resolvedSearchParams.tab
      : "all";

  const supabase = await createClient();

  // 1. Autentikasi user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Resolve customer_id
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8 font-body">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-3xl font-bold font-heading text-gray-900 tracking-tight">
            Pesanan Saya
          </h1>
          <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm">
            <div className="h-16 w-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Belum Ada Pesanan
            </h2>
            <p className="text-gray-500 mb-6">
              Anda belum pernah melakukan pesanan.
            </p>
            <Link
              href="/produk"
              className="inline-flex justify-center py-3 px-6 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-amber-600 to-[#9D734E] hover:shadow-lg transition-all active:scale-95"
            >
              Mulai Belanja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Fetch orders via supabaseAdmin (dapat mengakses product_images melalui RLS admin)
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select(
      `
      id,
      order_number,
      created_at,
      total,
      subtotal,
      shipping_cost,
      discount_amount,
      payment_method,
      payment_status,
      payment_proof_path,
      payment_rejection_reason,
      status,
      shipping_courier,
      tracking_number,
      order_items (
        id,
        quantity,
        product_name,
        product_id,
        unit_price,
        reviews (
          id
        ),
        products (
          product_images (
            image_url,
            is_primary
          )
        )
      )
    `
    )
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] font-body text-red-500">
        Gagal memuat pesanan. Silakan coba lagi.
      </div>
    );
  }

  // 4. Filter berdasarkan tab aktif
  const filteredOrders =
    orders?.filter((order: any) => {
      switch (tab) {
        case "unpaid":
          return (
            order.payment_status === "unpaid" &&
            !order.payment_proof_path &&
            !["cancelled", "refunded", "delivered"].includes(order.status)
          );
        case "processing":
          return ["pending", "confirmed", "processing"].includes(order.status);
        case "shipped":
          return order.status === "shipped";
        case "delivered":
          return order.status === "delivered";
        case "rating":
          if (order.status !== "delivered") return false;
          return order.order_items?.some(
            (item: any) => !item.reviews || item.reviews.length === 0
          );
        case "cancelled":
          return ["cancelled", "refunded"].includes(order.status);
        case "all":
        default:
          return true;
      }
    }) || [];

  // ── Helper: Status Badge ──────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <Clock className="h-3.5 w-3.5" /> Menunggu Konfirmasi
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle className="h-3.5 w-3.5" /> Dikonfirmasi
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Package className="h-3.5 w-3.5" /> Dikemas
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Truck className="h-3.5 w-3.5" /> Dikirim
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5" /> Selesai
          </span>
        );
      case "cancelled":
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="h-3.5 w-3.5" /> Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 capitalize">
            {status}
          </span>
        );
    }
  };

  // ── Helper: Empty state config per tab ───────────────────────────────────
  type EmptyConfig = {
    icon: React.ElementType;
    title: string;
    message: string;
    cta: string;
    ctaHref: string;
  };

  const emptyStateMap: Record<string, EmptyConfig> = {
    unpaid: {
      icon: Wallet,
      title: "Tidak Ada Tagihan",
      message: "Tidak ada pesanan yang menunggu pembayaran.",
      cta: "Lihat Semua Pesanan",
      ctaHref: "/profile/orders?tab=all",
    },
    processing: {
      icon: Package,
      title: "Tidak Ada Pesanan Dikemas",
      message: "Belum ada pesanan yang sedang dikemas.",
      cta: "Mulai Belanja",
      ctaHref: "/produk",
    },
    shipped: {
      icon: Truck,
      title: "Tidak Ada Pengiriman Aktif",
      message: "Belum ada pesanan yang sedang dalam pengiriman.",
      cta: "Mulai Belanja",
      ctaHref: "/produk",
    },
    delivered: {
      icon: CheckCircle,
      title: "Belum Ada Pesanan Selesai",
      message: "Pesanan yang sudah diterima akan muncul di sini.",
      cta: "Mulai Belanja",
      ctaHref: "/produk",
    },
    rating: {
      icon: Star,
      title: "Semua Sudah Diulas!",
      message:
        "Terima kasih! Semua produk sudah mendapat ulasan dari Anda.",
      cta: "Mulai Belanja",
      ctaHref: "/produk",
    },
    cancelled: {
      icon: XCircle,
      title: "Tidak Ada Pesanan Dibatalkan",
      message: "Tidak ada riwayat pesanan yang dibatalkan.",
      cta: "Mulai Belanja",
      ctaHref: "/produk",
    },
    all: {
      icon: Package,
      title: "Belum Ada Pesanan",
      message: "Anda belum pernah melakukan pesanan.",
      cta: "Mulai Belanja",
      ctaHref: "/produk",
    },
  };

  const getEmptyConfig = (): EmptyConfig =>
    emptyStateMap[tab] ?? emptyStateMap["all"];

  // ── Tab definitions ───────────────────────────────────────────────────────
  const tabs = [
    { id: "all", label: "Semua" },
    { id: "unpaid", label: "Belum Bayar" },
    { id: "processing", label: "Dikemas" },
    { id: "shipped", label: "Dikirim" },
    { id: "delivered", label: "Selesai" },
    { id: "rating", label: "Rating" },
    { id: "cancelled", label: "Dibatalkan" },
  ];

  const validTabs = [
    "all",
    "unpaid",
    "processing",
    "shipped",
    "delivered",
    "rating",
    "cancelled",
  ];
  const currentTabId = validTabs.includes(tab) ? tab : "all";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8 font-body">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading text-gray-900 tracking-tight">
              Pesanan Saya
            </h1>
            <p className="mt-2 text-gray-500 text-sm">
              Kelola dan lacak status pesanan Anda.
            </p>
          </div>
          <Link
            href="/profile"
            className="text-sm font-semibold text-[#9D734E] hover:text-amber-800 transition-colors"
          >
            &larr; Kembali ke Profil
          </Link>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="border-b border-gray-200 overflow-x-auto pb-1 no-scrollbar">
          <nav className="flex space-x-6 min-w-max" aria-label="Tabs">
            {tabs.map((t) => (
              <Link
                key={t.id}
                href={`/profile/orders?tab=${t.id}`}
                className={`
                  whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    currentTabId === t.id
                      ? "border-[#9D734E] text-[#9D734E]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Empty State ── */}
        {filteredOrders.length === 0 ? (
          (() => {
            const {
              icon: EmptyIcon,
              title,
              message,
              cta,
              ctaHref,
            } = getEmptyConfig();
            return (
              <div className="py-16 px-6 bg-white border border-gray-100 rounded-3xl shadow-sm text-center">
                <div className="h-16 w-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <EmptyIcon className="h-8 w-8" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  {title}
                </h2>
                <p className="text-gray-500 text-sm mb-6">{message}</p>
                <Link
                  href={ctaHref}
                  className="inline-flex justify-center py-2.5 px-6 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-amber-600 to-[#9D734E] hover:shadow-lg transition-all active:scale-95"
                >
                  {cta}
                </Link>
              </div>
            );
          })()
        ) : (
          /* ── Order Cards ── */
          <div className="space-y-5">
            {filteredOrders.map((order: any) => {
              const items: any[] = order.order_items ?? [];

              // Batasan tampilan item di card
              const displayedItems =
                items.length > CARD_ITEM_LIMIT
                  ? items.slice(0, 2)
                  : items;
              const extraCount =
                items.length > CARD_ITEM_LIMIT ? items.length - 2 : 0;

              // Apakah boleh dibatalkan? (hanya pending/confirmed + belum bayar)
              const canCancel =
                (order.status === "pending" ||
                  order.status === "confirmed") &&
                order.payment_status !== "paid";

              // Item yang belum direview (hanya untuk status delivered)
              const unreviewedItems =
                order.status === "delivered"
                  ? items.filter(
                      (item: any) =>
                        !item.reviews || item.reviews.length === 0
                    )
                  : [];

              // Apakah ada info pengiriman yang perlu ditampilkan?
              const hasShippingInfo =
                order.shipping_courier || order.tracking_number;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  {/* ── HEADER: nomor pesanan + tanggal + status ── */}
                  <div className="px-5 py-3.5 bg-gray-50/60 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <p className="text-xs font-bold font-mono text-gray-800 truncate">
                        {order.order_number}
                      </p>
                      <span className="text-gray-300 hidden sm:inline">•</span>
                      <p className="text-xs text-gray-500 hidden sm:block">
                        {new Intl.DateTimeFormat("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(order.created_at))}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Mobile: tanggal di bawah header */}
                  <p className="text-xs text-gray-400 px-5 pt-2.5 sm:hidden">
                    {new Intl.DateTimeFormat("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(order.created_at))}
                  </p>

                  {/* ── ITEMS: daftar produk ── */}
                  <div className="px-5 py-4 space-y-3">
                    {displayedItems.map((item: any) => {
                      let thumbnailUrl: string | null = null;
                      if (item.products?.product_images?.length > 0) {
                        const primary = item.products.product_images.find(
                          (img: any) => img.is_primary
                        );
                        thumbnailUrl =
                          primary?.image_url ??
                          item.products.product_images[0]?.image_url ??
                          null;
                      }

                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3"
                        >
                          {/* Foto produk */}
                          <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-gray-100 overflow-hidden border border-gray-100 flex items-center justify-center">
                            {thumbnailUrl ? (
                              <img
                                src={thumbnailUrl}
                                alt={item.product_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-gray-300" />
                            )}
                          </div>

                          {/* Nama + qty × harga */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.product_name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.quantity} ×{" "}
                              {item.unit_price
                                ? formatRupiah(item.unit_price)
                                : "—"}
                            </p>
                          </div>

                          {/* Subtotal item */}
                          {item.unit_price ? (
                            <p className="text-sm font-semibold text-gray-800 flex-shrink-0">
                              {formatRupiah(item.quantity * item.unit_price)}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}

                    {/* Indikator item tersembunyi */}
                    {extraCount > 0 && (
                      <p className="text-xs text-gray-400 font-medium pt-0.5 pl-[60px]">
                        + {extraCount} produk lainnya
                      </p>
                    )}
                  </div>

                  {/* ── SUMMARY: total + metode bayar ── */}
                  <div className="px-5 py-3.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs text-gray-500">
                        Metode:{" "}
                        <span className="font-medium text-gray-700">
                          {order.payment_method === "COD"
                            ? "Bayar di Tempat (COD)"
                            : "Transfer Bank"}
                        </span>
                      </p>
                      {/* Payment status pill */}
                      {order.payment_status === "paid" ? (
                        <span className="inline-flex text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          ✓ LUNAS
                        </span>
                      ) : order.payment_rejection_reason ? (
                        <span className="inline-flex text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          ✗ DITOLAK
                        </span>
                      ) : order.payment_proof_path ? (
                        <span className="inline-flex text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          ⏳ MENUNGGU VERIFIKASI
                        </span>
                      ) : order.status !== "cancelled" &&
                        order.status !== "refunded" ? (
                        <span className="inline-flex text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          BELUM DIBAYAR
                        </span>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-0.5">
                        Total Pesanan
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatRupiah(order.total)}
                      </p>
                    </div>
                  </div>

                  {/* ── SHIPPING INFO (hanya jika kurir atau resi tersedia) ── */}
                  {hasShippingInfo && (
                    <div className="px-5 py-3 bg-emerald-50/40 border-t border-emerald-100 flex flex-wrap items-center gap-3">
                      <Truck className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      {order.shipping_courier && (
                        <span className="text-xs font-semibold text-emerald-700">
                          {order.shipping_courier}
                        </span>
                      )}
                      {order.shipping_courier && order.tracking_number && (
                        <span className="text-emerald-300 text-xs">|</span>
                      )}
                      {order.tracking_number && (
                        <span className="text-xs font-mono font-semibold text-emerald-700">
                          {order.tracking_number}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── ACTIONS ── */}
                  <div className="px-5 py-4 border-t border-gray-100">
                    <div className="flex flex-wrap items-center gap-2 justify-between">

                      {/* Kiri: tombol aksi kondisional */}
                      <div className="flex flex-wrap items-start gap-2">
                        {/* Batalkan (hanya pending/confirmed + belum bayar) */}
                        {canCancel && (
                          <OrderCardCancelButton orderId={order.id} />
                        )}

                        {/* Beri Ulasan (hanya delivered + ada item belum direview) */}
                        {unreviewedItems.length > 0 && (
                          <OrderCardRatingSection
                            items={unreviewedItems.map((item: any) => ({
                              id: item.id,
                              productId: item.product_id,
                              productName: item.product_name,
                            }))}
                          />
                        )}

                        {/* Beli Lagi (hanya delivered) */}
                        {order.status === "delivered" && (
                          <OrderCardBuyAgainButton
                            orderItems={items.map((item: any) => ({
                              product_id: item.product_id,
                              quantity: item.quantity,
                            }))}
                          />
                        )}
                      </div>

                      {/* Kanan: Lihat Detail (selalu tampil) */}
                      <Link
                        href={`/profile/orders/${order.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#9D734E] bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 rounded-lg transition-colors ml-auto"
                      >
                        Lihat Detail <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
