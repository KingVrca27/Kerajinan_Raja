import { createClient } from "@/src/lib/supabaseServer";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatRupiah } from "@/src/lib/currency";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { Package, Clock, Truck, CheckCircle, XCircle, ChevronLeft, Image as ImageIcon } from "lucide-react";
import OrderActions from "./OrderActions";
import OrderItemActions from "./OrderItemActions";
import OrderViewTracker from "./OrderViewTracker";

export const metadata = {
  title: "Detail Pesanan | Putra Art Shop",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Dapatkan auth user
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
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center font-body text-red-500">
        Profil pelanggan tidak ditemukan.
      </div>
    );
  }

  // 3. Fetch order berdasarkan ID dan PASTIKAN customer_id cocok (Anti-IDOR)
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        quantity,
        product_name,
        product_id,
        unit_price,
        subtotal,
        reviews (
          id
        ),
        products (
          product_images (
            image_url,
            is_primary
          )
        )
      ),
      bank_accounts (
        bank_name,
        account_number,
        account_name
      )
    `)
    .eq("id", id)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8 font-body">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-sm text-center">
          <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-gray-900 mb-2">Pesanan tidak ditemukan.</h2>
          <p className="text-gray-500 mb-6">Pesanan yang Anda cari tidak ada atau Anda tidak memiliki akses.</p>
          <Link
            href="/profile/orders"
            className="inline-flex justify-center py-3 px-6 border border-gray-200 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Kembali ke Pesanan Saya
          </Link>
        </div>
      </div>
    );
  }

  const getTimelineSteps = (currentStatus: string) => {
    const isCancelled = currentStatus === "cancelled" || currentStatus === "refunded";

    let activeStep = 0;
    if (currentStatus === "processing") activeStep = 1;
    if (currentStatus === "shipped") activeStep = 2;
    if (currentStatus === "delivered") activeStep = 3;

    return { isCancelled, activeStep };
  };

  const { isCancelled, activeStep } = getTimelineSteps(order.status);
  const isCOD = order.payment_method === 'COD';

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8 font-body">
      <OrderViewTracker orderId={order.id} status={order.status} />
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigasi & Header */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/profile/orders"
            className="flex items-center text-sm font-semibold text-gray-500 hover:text-amber-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Kembali
          </Link>
          <p className="text-sm text-gray-500 font-mono">{order.order_number}</p>
        </div>

        <h1 className="text-3xl font-bold font-heading text-gray-900 tracking-tight">Detail Pesanan</h1>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Header Card */}
          <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tanggal Transaksi</p>
              <p className="font-medium text-gray-900">
                {new Intl.DateTimeFormat("id-ID", {
                  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                }).format(new Date(order.created_at))}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-gray-500 mb-1">Status Pembayaran</p>
              <p className="font-bold text-gray-900">
                {order.payment_status === 'paid' ? (
                  <span className="text-emerald-600">SUDAH DIBAYAR</span>
                ) : order.payment_rejection_reason ? (
                  <span className="text-rose-600">DITOLAK</span>
                ) : order.payment_status === 'unpaid' && order.payment_proof_path ? (
                  <span className="text-amber-600">MENUNGGU VERIFIKASI</span>
                ) : isCOD ? (
                  <span className="text-amber-600">BAYAR SAAT PESANAN TIBA</span>
                ) : (
                  <span className="text-rose-600 uppercase">BELUM DIBAYAR</span>
                )}
              </p>
              {order.payment_rejection_reason && (
                <p className="text-xs text-rose-500 mt-1 max-w-[250px] sm:ml-auto">
                  <strong>Ditolak:</strong> {order.payment_rejection_reason}
                </p>
              )}
            </div>
          </div>

          {/* Timeline Status Dihapus (STEP 6G) - Hanya menampilkan banner jika dibatalkan */}
          {isCancelled && (
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                <XCircle className="h-6 w-6" />
                <div>
                  <p className="font-bold">Pesanan Dibatalkan</p>
                  <p className="text-sm text-red-500 mt-1">Pesanan ini telah dibatalkan atau dikembalikan.</p>
                </div>
              </div>
            </div>
          )}

          {/* Kolom 2: Produk & Detail */}
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Rincian Produk */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Detail Produk</h3>
              <div className="space-y-4">
                {order.order_items?.map((item: any) => {
                  let thumbnailUrl = null;
                  if (item.products?.product_images) {
                    const primaryImage = item.products.product_images.find((img: any) => img.is_primary);
                    thumbnailUrl = primaryImage ? primaryImage.image_url : item.products.product_images[0]?.image_url;
                  }
                  
                  const isReviewed = item.reviews && item.reviews.length > 0;

                  return (
                    <div key={item.id} className="flex gap-4 items-start text-sm border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-gray-100 overflow-hidden border border-gray-100 flex items-center justify-center">
                        {thumbnailUrl ? (
                          <img src={thumbnailUrl} alt={item.product_name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-gray-500 mt-0.5">{item.quantity} x {formatRupiah(item.unit_price)}</p>
                        
                        <OrderItemActions 
                          productId={item.product_id}
                          orderItemId={item.id}
                          productName={item.product_name}
                          isReviewed={isReviewed}
                          orderStatus={order.status}
                        />
                      </div>
                      <p className="font-semibold text-gray-900 text-right">
                        {formatRupiah(item.subtotal)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Rincian Biaya */}
              <div className="pt-4 mt-4 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatRupiah(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Diskon</span>
                    <span>-{formatRupiah(order.discount_amount)}</span>
                  </div>
                )}
                {order.shipping_cost > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Ongkos Kirim ({order.shipping_courier || "Flat Rate"})</span>
                    <span>{formatRupiah(order.shipping_cost)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total Pembayaran</span>
                  <span className="text-[#9D734E]">{formatRupiah(order.total)}</span>
                </div>
              </div>
              
              {/* Order Cancel Action */}
              {(order.status === "pending" || order.status === "confirmed") && order.payment_status !== "paid" && (
                <OrderActions orderId={order.id} />
              )}
            </div>

            {/* Info Pengiriman & Pembayaran */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Pengiriman & Pembayaran</h3>
              <div className="bg-gray-50 rounded-2xl p-5 text-sm space-y-4 border border-gray-100">
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Metode Pembayaran</p>
                  <p className="font-bold text-gray-900">
                    {isCOD ? 'BAYAR DI TEMPAT (COD)' : order.payment_method === 'TRANSFER_BANK' ? 'Transfer Bank' : order.payment_method || '-'}
                  </p>
                  {order.payment_method === 'TRANSFER_BANK' && order.bank_accounts && (
                    <div className="mt-2 text-sm text-gray-700 bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                      <span className="font-semibold text-gray-900">{order.bank_accounts.bank_name}</span> - <span className="font-mono">{order.bank_accounts.account_number}</span><br/>
                      <span className="text-xs text-gray-500">a.n. {order.bank_accounts.account_name}</span>
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Nama Penerima</p>
                  <p className="font-medium text-gray-900">{order.shipping_name || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Alamat Lengkap</p>
                  <p className="text-gray-900 leading-relaxed">
                    {order.shipping_address}<br />
                    {order.shipping_city}, {order.shipping_province} {order.shipping_postal_code}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Nomor HP</p>
                  <p className="text-gray-900 leading-relaxed">{order.shipping_phone || "-"}</p>
                </div>
                {order.tracking_number && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Nomor Resi</p>
                    <div className="inline-flex items-center bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 font-mono font-bold mt-1">
                      {order.tracking_number}
                    </div>
                  </div>
                )}
                {order.notes && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Catatan Pesanan</p>
                    <p className="text-gray-900 italic">&ldquo;{order.notes}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
