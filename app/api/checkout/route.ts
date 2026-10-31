import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { createRouteHandlerClient } from "@/src/lib/supabaseServerRoute";
import { CartItem } from "@/src/types/cart";
import { CheckoutCustomerData } from "@/src/lib/whatsapp";
import { normalizePhone } from "@/src/lib/phone";

interface CheckoutPayload {
  customerData: CheckoutCustomerData;
  items: CartItem[];
  bank_account_id?: string;
  payment_proof_path?: string;
  voucherCode?: string;
}

// =============================================================================
// HELPER: Kalkulasi ongkir via RajaOngkir (server-side, API key tidak ke client)
// Mengembalikan { cost, courier } jika berhasil, atau null jika gagal/fallback.
// Pola ini identik dengan /api/shipping/calculate/route.ts — langsung ke RajaOngkir,
// tidak melalui HTTP localhost agar aman dan efisien di server.
// =============================================================================
interface RajaOngkirResult {
  cost: number;
  courier: string; // "JNE {service} ({etd})"
  service: string;
  etd: string;
}

async function calculateRajaOngkirShipping(
  destinationId: string,
  weightGram: number
): Promise<RajaOngkirResult | null> {
  try {
    const apiKey = process.env.RAJAONGKIR_API_KEY;
    if (!apiKey) {
      console.warn("[Checkout] RAJAONGKIR_API_KEY tidak dikonfigurasi. Fallback ke flat-rate.");
      return null;
    }

    // Origin diambil dari env, default 441 (sesuai konfigurasi toko)
    const originId = process.env.RAJAONGKIR_ORIGIN_ID ?? "441";

    const formData = new URLSearchParams();
    formData.append("origin", originId);
    formData.append("destination", destinationId);
    formData.append("weight", String(weightGram));
    formData.append("courier", "jne");
    formData.append("price", "lowest");

    const response = await fetch(
      "https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost",
      {
        method: "POST",
        headers: {
          key: apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    const result = await response.json();

    if (!response.ok || result?.meta?.code !== 200) {
      console.warn(
        `[Checkout] RajaOngkir API error: ${result?.meta?.message ?? response.status}. Fallback ke flat-rate.`
      );
      return null;
    }

    // Parse hasil — ambil layanan JNE termurah
    // Struktur API Komerce: result.data = array of { code, name, service, description, cost, etd }
    const services: Array<{ code: string; service: string; cost: number; etd: string }> = [];

    if (Array.isArray(result.data)) {
      for (const item of result.data) {
        if (item && item.code === "jne" && item.service && typeof item.cost === "number" && item.cost > 0) {
          services.push({
            code: item.code,
            service: item.service,
            cost: item.cost,
            etd: item.etd || "",
          });
        }
      }
    }

    if (services.length === 0) {
      console.warn("[Checkout] RajaOngkir: tidak ada layanan JNE tersedia untuk rute ini. Fallback ke flat-rate.");
      return null;
    }

    // Pilih layanan dengan biaya terendah
    let cheapestService = services[0];
    for (const svc of services) {
      if (svc.cost < cheapestService.cost) {
        cheapestService = svc;
      }
    }

    const selectedCost = cheapestService.cost;
    const selectedEtd = cheapestService.etd;
    const selectedService = cheapestService.service;
    const courierLabel = `JNE ${selectedService}${selectedEtd ? ` (${selectedEtd})` : ""}`;

    console.log(
      `[Checkout] RajaOngkir shipping: origin=${originId} destination=${destinationId} weight=${weightGram} courier=jne cost=${selectedCost} service=${selectedService}`
    );

    return { cost: selectedCost, courier: courierLabel, service: selectedService, etd: selectedEtd };
  } catch (err) {
    console.error("[Checkout] RajaOngkir shipping calculation error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as CheckoutPayload;
    const { customerData, items } = payload;

    if (!customerData || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Payload tidak valid atau keranjang kosong" },
        { status: 400 }
      );
    }

    // =========================================================================
    // VALIDASI INPUT SHIPPING DESTINATION (server-side)
    // =========================================================================
    if (!customerData.nama?.trim()) {
      return NextResponse.json({ error: "Nama penerima wajib diisi" }, { status: 400 });
    }
    if (!customerData.phone?.trim()) {
      return NextResponse.json({ error: "Nomor HP wajib diisi" }, { status: 400 });
    }
    if (customerData.phone.trim().length < 9) {
      return NextResponse.json({ error: "Nomor HP minimal 9 digit" }, { status: 400 });
    }
    if (!customerData.alamat?.trim()) {
      return NextResponse.json({ error: "Alamat pengiriman wajib diisi" }, { status: 400 });
    }
    if (!customerData.provinsi?.trim()) {
      return NextResponse.json({ error: "Provinsi wajib diisi" }, { status: 400 });
    }
    if (!customerData.kota?.trim()) {
      return NextResponse.json({ error: "Kota/Kabupaten wajib diisi" }, { status: 400 });
    }
    if (!customerData.kodePos?.trim()) {
      return NextResponse.json({ error: "Kode Pos wajib diisi" }, { status: 400 });
    }
    if (!customerData.paymentMethod || !["COD", "TRANSFER_BANK"].includes(customerData.paymentMethod)) {
      return NextResponse.json({ error: "Metode pembayaran tidak valid" }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(customerData.phone);

    // =========================================================================
    // FLAT-RATE FALLBACK — Dibaca lebih dulu dari site_settings.
    // Digunakan jika destinationId tidak ada atau RajaOngkir gagal.
    // SHIPPING COST SELALU DIHITUNG DI SERVER — TIDAK DARI CLIENT.
    // =========================================================================
    let flatRateCost = 0;
    try {
      const { data: shippingSetting } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "default_shipping_cost")
        .maybeSingle();

      if (shippingSetting && shippingSetting.value !== undefined && shippingSetting.value !== null) {
        let valStr = "";
        if (typeof shippingSetting.value === 'object') {
           valStr = String(shippingSetting.value.value ?? shippingSetting.value.cost ?? shippingSetting.value);
        } else {
           valStr = String(shippingSetting.value);
        }
        
        const numericVal = parseFloat(valStr.replace(/[^0-9]/g, ""));
        if (!isNaN(numericVal)) {
          flatRateCost = numericVal;
        }
      }
    } catch (e) {
      console.error("[Checkout] Gagal membaca default_shipping_cost:", e);
      // Lanjutkan dengan flatRateCost = 0 jika DB error (graceful degradation)
    }

    // shippingCost dan shippingCourier akan ditentukan setelah totalWeightGram dihitung
    let shippingCost = flatRateCost;
    let shippingCourier = "Flat Rate";

    // =========================================================================
    // 1. CUSTOMER IDENTITY RESOLUTION
    //    Authenticated Customer → session → customers.user_id
    //    Unauthenticated request → 401 (Guest Checkout tidak diizinkan)
    // =========================================================================
    let customerId: string;

    // Cek apakah ada authenticated session dari cookies
    const { supabase: supabaseAuth } = createRouteHandlerClient(req);
    const { data: { user: authUser } } = await supabaseAuth.auth.getUser();

    if (authUser) {
      // ---------------------------------------------------------------------------
      // PATH A — AUTHENTICATED CUSTOMER
      // Identity bersumber dari session yang terverifikasi, bukan dari request body.
      // ---------------------------------------------------------------------------

      // Cari customer record yang terhubung dengan auth.uid()
      // supabaseAuth menggunakan RLS, policy: customers.user_id = auth.uid()
      const { data: existingCustomer, error: findError } = await supabaseAuth
        .from("customers")
        .select("id")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (findError) {
        console.error("[Checkout Auth] Error mencari customer via user_id:", findError);
        return NextResponse.json({ error: "Gagal memproses data pelanggan" }, { status: 500 });
      }

      if (existingCustomer) {
        // Customer profile sudah ada → gunakan id yang ada
        customerId = existingCustomer.id;

        // Update informasi pengiriman (nama, alamat) menggunakan supabaseAdmin
        // AMAN: customerId sudah diverifikasi dari session, bukan dari client input
        await supabaseAdmin
          .from("customers")
          .update({
            full_name: customerData.nama,
            phone: normalizedPhone || undefined,
            address: customerData.alamat,
            village: customerData.village,
            district: customerData.district,
            city: customerData.kota,
            province: customerData.provinsi,
            postal_code: customerData.kodePos,
            destination_id: customerData.destinationId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", customerId)
          .eq("user_id", authUser.id); // Double-lock: pastikan update hanya untuk record milik user ini

      } else {
        // Customer belum punya record di tabel customers (baru register, belum pernah checkout)
        // Buat customer record baru dan kaitkan dengan auth.uid()
        const emailDummy = authUser.email || `${normalizedPhone}@no-email.com`;

        const { data: newCustomer, error: createError } = await supabaseAdmin
          .from("customers")
          .insert({
            full_name: customerData.nama,
            phone: normalizedPhone,
            email: emailDummy,
            address: customerData.alamat,
            village: customerData.village,
            district: customerData.district,
            city: customerData.kota,
            province: customerData.provinsi,
            postal_code: customerData.kodePos,
            destination_id: customerData.destinationId,
            user_id: authUser.id, // Ikat ke auth user
          })
          .select("id")
          .single();

        if (createError || !newCustomer) {
          console.error("[Checkout Auth] Error membuat customer:", createError);
          return NextResponse.json({ error: "Gagal membuat data pelanggan" }, { status: 500 });
        }
        customerId = newCustomer.id;
      }
    } else {
      // ---------------------------------------------------------------------------
      // BLOCK GUEST CHECKOUT
      // Fase 4.3U menetapkan bahwa checkout Wajib Login.
      // Guest ditolak pada level API.
      // ---------------------------------------------------------------------------
      return NextResponse.json({ error: "Unauthorized. Anda harus login untuk melakukan checkout." }, { status: 401 });
    }

    // =========================================================================
    // 2. VALIDASI PRODUK
    //    Selalu menggunakan supabaseAdmin untuk fetch produk (trusted server op,
    //    tidak ada customer ownership terlibat).
    // =========================================================================
    const productIds = items.map((item) => item.product.id);
    const { data: dbProducts, error: dbProductsError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, is_active, allowed_payment_methods, weight_gram")
      .in("id", productIds);

    if (dbProductsError || !dbProducts) {
      console.error("[Checkout] Error memuat produk dari DB:", dbProductsError);
      return NextResponse.json({ error: "Gagal memverifikasi produk" }, { status: 500 });
    }

    // =========================================================================
    // 2b. SERVER-SIDE PAYMENT METHOD VALIDATION
    //     Server menghitung intersection dari allowed_payment_methods semua produk.
    //     Client TIDAK BOLEH menentukan metode ini secara bebas.
    // =========================================================================
    const ALL_VALID_METHODS = ["COD", "TRANSFER_BANK"];
    const serverIntersection = ALL_VALID_METHODS.filter((method) =>
      dbProducts.every((dbProduct) => {
        const productMethods: string[] = Array.isArray(dbProduct.allowed_payment_methods)
          ? dbProduct.allowed_payment_methods
          : ["COD", "TRANSFER_BANK"]; // fallback: jika kolom belum ada (legacy), izinkan semua
        return productMethods.includes(method);
      })
    );

    if (serverIntersection.length === 0) {
      return NextResponse.json(
        { error: "Produk dalam keranjang memiliki metode pembayaran yang tidak kompatibel. Pisahkan pesanan atau sesuaikan produk." },
        { status: 400 }
      );
    }

    if (!serverIntersection.includes(customerData.paymentMethod as string)) {
      return NextResponse.json(
        { error: `Metode pembayaran '${customerData.paymentMethod}' tidak diizinkan untuk kombinasi produk ini.` },
        { status: 400 }
      );
    }

    // =========================================================================
    // 2c. SERVER-SIDE BANK ACCOUNT VALIDATION (TRANSFER_BANK)
    // =========================================================================
    let validatedBankAccountId: string | null = null;
    if (customerData.paymentMethod === "TRANSFER_BANK") {
      if (!payload.bank_account_id) {
        return NextResponse.json({ error: "Rekening bank wajib dipilih untuk metode Transfer Bank." }, { status: 400 });
      }

      const { data: bankAccount, error: bankErr } = await supabaseAdmin
        .from("bank_accounts")
        .select("id, is_active")
        .eq("id", payload.bank_account_id)
        .maybeSingle();

      if (bankErr || !bankAccount) {
        return NextResponse.json({ error: "Rekening bank yang dipilih tidak valid atau tidak ditemukan." }, { status: 400 });
      }

      if (!bankAccount.is_active) {
        return NextResponse.json({ error: "Rekening bank yang dipilih sedang tidak aktif." }, { status: 400 });
      }

      // Validasi Payment Proof
      if (!payload.payment_proof_path) {
        return NextResponse.json({ error: "Bukti pembayaran wajib diunggah untuk metode Transfer Bank." }, { status: 400 });
      }

      // Pastikan ownership berdasarkan authUser.id
      if (!payload.payment_proof_path.startsWith(`${authUser.id}/`)) {
        return NextResponse.json({ error: "Akses ke bukti pembayaran ditolak. Ownership tidak valid." }, { status: 403 });
      }

      // Verifikasi apakah file benar-benar ada di storage
      const fileName = payload.payment_proof_path.split("/")[1];
      const { data: storageFiles, error: storageErr } = await supabaseAdmin.storage
        .from("payment_proofs")
        .list(authUser.id, { search: fileName });

      if (storageErr || !storageFiles || storageFiles.length === 0 || storageFiles[0].name !== fileName) {
        return NextResponse.json({ error: "File bukti pembayaran tidak ditemukan di server." }, { status: 400 });
      }

      validatedBankAccountId = bankAccount.id;
    } else if (customerData.paymentMethod === "COD") {
      // Pastikan order COD selalu null untuk bank_account_id, mengabaikan data dari client
      validatedBankAccountId = null;
    }

    // Hitung subtotal, validasi quantity, dan akumulasi total berat
    let subtotal = 0;
    let totalWeightGram = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json({ error: "Kuantitas produk tidak valid" }, { status: 400 });
      }

      const dbProduct = dbProducts.find((p) => p.id === item.product.id);

      if (!dbProduct) {
        return NextResponse.json({ error: "Salah satu produk tidak ditemukan di database" }, { status: 400 });
      }

      if (!dbProduct.is_active) {
        return NextResponse.json({ error: `Produk ${dbProduct.name} sedang tidak tersedia` }, { status: 400 });
      }

      // =========================================================================
      // VALIDASI BERAT PRODUK (server-side, TIDAK dari client)
      // Jika weight_gram null, 0, atau tidak valid → tolak checkout.
      // Tidak ada default weight — berat harus valid di database.
      // =========================================================================
      const weightGram = dbProduct.weight_gram;
      if (!weightGram || typeof weightGram !== "number" || weightGram <= 0) {
        console.error(`[Checkout] Produk '${dbProduct.name}' tidak memiliki data berat yang valid (weight_gram=${weightGram})`);
        return NextResponse.json(
          { error: "Sebagian produk belum memiliki data berat. Silakan hubungi admin." },
          { status: 400 }
        );
      }

      totalWeightGram += weightGram * item.quantity;

      const itemSubtotal = dbProduct.price * item.quantity;
      subtotal += itemSubtotal;

      validatedItems.push({
        product_id: dbProduct.id,
        product_name: dbProduct.name,
        quantity: item.quantity,
        unit_price: dbProduct.price,
        subtotal: itemSubtotal,
      });
    }

    console.log(`[Checkout] Total berat pesanan: ${totalWeightGram}g untuk ${items.length} jenis produk.`);

    // =========================================================================
    // VOUCHER VALIDATION & DISCOUNT CALCULATION
    // =========================================================================
    let discountAmount = 0;
    let appliedPromotion = null;

    if (payload.voucherCode) {
      const code = payload.voucherCode.trim().toUpperCase();

      const { data: promotion, error: promoError } = await supabaseAdmin
        .from("promotions")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (promoError || !promotion) {
        return NextResponse.json({ error: "Voucher tidak ditemukan" }, { status: 400 });
      }

      if (!promotion.is_active) {
        return NextResponse.json({ error: "Voucher sudah tidak aktif" }, { status: 400 });
      }

      const now = new Date();
      if (promotion.starts_at && new Date(promotion.starts_at) > now) {
        return NextResponse.json({ error: "Voucher belum berlaku" }, { status: 400 });
      }

      if (promotion.expires_at && new Date(promotion.expires_at) < now) {
        return NextResponse.json({ error: "Voucher sudah kedaluwarsa" }, { status: 400 });
      }

      if (promotion.usage_limit !== null && promotion.usage_count >= promotion.usage_limit) {
        return NextResponse.json({ error: "Batas penggunaan voucher telah habis" }, { status: 400 });
      }

      if (subtotal < promotion.min_purchase) {
        return NextResponse.json(
          { error: `Minimum pembelian untuk voucher ini adalah Rp${promotion.min_purchase.toLocaleString("id-ID")}` },
          { status: 400 }
        );
      }

      let rawDiscount = 0;
      if (promotion.type === "percentage") {
        rawDiscount = subtotal * (promotion.value / 100);
        if (promotion.max_discount !== null) {
          rawDiscount = Math.min(rawDiscount, promotion.max_discount);
        }
      } else if (promotion.type === "fixed") {
        rawDiscount = promotion.value;
      } else {
        return NextResponse.json({ error: "Tipe voucher tidak valid" }, { status: 400 });
      }

      discountAmount = Math.min(rawDiscount, subtotal);
      discountAmount = Math.max(discountAmount, 0);
      appliedPromotion = promotion;
    }

    // =========================================================================
    // DYNAMIC SHIPPING COST via RajaOngkir
    // Jika destinationId tersedia → hitung via RajaOngkir (server-side, aman).
    // Jika tidak ada / API gagal → tetap gunakan flat-rate dari site_settings.
    // Client TIDAK bisa mempengaruhi nilai ini.
    // =========================================================================
    if (customerData.destinationId) {
      const rajaOngkirResult = await calculateRajaOngkirShipping(
        customerData.destinationId,
        totalWeightGram
      );
      if (rajaOngkirResult !== null) {
        shippingCost = rajaOngkirResult.cost;
        shippingCourier = rajaOngkirResult.courier;
      } else {
        // Fallback ke flat-rate (sudah di-set sebelumnya)
        console.warn(
          `[Checkout] Fallback ke flat-rate (${flatRateCost}) karena RajaOngkir tidak menghasilkan data.`
        );
      }
    } else {
      console.log("[Checkout] destinationId tidak tersedia. Menggunakan flat-rate.");
    }

    // =========================================================================
    // FORMULA TOTAL:
    //   SUBTOTAL - DISCOUNT + SHIPPING COST = GRAND TOTAL
    // =========================================================================
    const grandTotal = subtotal - discountAmount + shippingCost;

    const orderNumber = `ORD-${Date.now()}`;

    // =========================================================================
    // 2.5 ATOMIC VOUCHER CLAIM (Optimistic Concurrency Control)
    // =========================================================================
    if (appliedPromotion) {
      const { data: updatedPromo, error: updateError } = await supabaseAdmin
        .from("promotions")
        .update({ usage_count: appliedPromotion.usage_count + 1 })
        .eq("id", appliedPromotion.id)
        .eq("usage_count", appliedPromotion.usage_count)
        .select("id")
        .maybeSingle();

      if (updateError || !updatedPromo) {
        console.warn(`[Checkout] Voucher OCC failed for promotion ${appliedPromotion.id}`);
        return NextResponse.json(
          { error: "Gagal menerapkan voucher. Voucher mungkin sudah digunakan oleh pelanggan lain. Silakan coba lagi." },
          { status: 409 }
        );
      }
    }

    // =========================================================================
    // 3. BUAT ORDER
    //    supabaseAdmin digunakan karena:
    //    - Authenticated user sudah diverifikasi di step 1, customerId sudah safe
    //    - notifications table memerlukan service role
    //
    //    KEAMANAN: shipping_cost TIDAK diambil dari request body client.
    //    Seluruh nilai ongkir bersumber dari site_settings server-side.
    // =========================================================================
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        status: "pending",
        payment_status: "unpaid",
        payment_method: customerData.paymentMethod,
        bank_account_id: validatedBankAccountId,
        payment_proof_path: customerData.paymentMethod === "TRANSFER_BANK" ? payload.payment_proof_path : null,
        subtotal: subtotal,
        discount_amount: discountAmount,
        shipping_cost: shippingCost,   // ← dari server (RajaOngkir atau flat-rate), BUKAN dari client
        total: grandTotal,
        // Shipping destination fields
        shipping_name: customerData.nama,
        shipping_phone: normalizedPhone,
        shipping_address: customerData.alamat,
        shipping_village: customerData.village,
        shipping_district: customerData.district,
        shipping_city: customerData.kota,
        shipping_province: customerData.provinsi,
        shipping_postal_code: customerData.kodePos,
        shipping_destination_id: customerData.destinationId,
        shipping_courier: shippingCourier, // ← dinamis: "JNE {service} ({etd})" atau "Flat Rate"
        notes: customerData.catatan || null,
        promotion_id: appliedPromotion?.id || null, // VOUCHER FK
      })
      .select("id")
      .single();

    if (orderError || !newOrder) {
      console.error("[Checkout] Error membuat order:", orderError);

      // ROLLBACK VOUCHER CLAIM (Best Effort)
      if (appliedPromotion) {
        try {
          console.warn(`[Checkout] Mencoba rollback voucher claim untuk promo ${appliedPromotion.id}`);
          const { data: currentPromo } = await supabaseAdmin
            .from("promotions")
            .select("usage_count")
            .eq("id", appliedPromotion.id)
            .single();

          if (currentPromo && currentPromo.usage_count > 0) {
            await supabaseAdmin
              .from("promotions")
              .update({ usage_count: currentPromo.usage_count - 1 })
              .eq("id", appliedPromotion.id)
              .eq("usage_count", currentPromo.usage_count);
          }
        } catch (rollbackErr) {
          console.error("[Checkout] Gagal rollback voucher:", rollbackErr);
        }
      }

      return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
    }

    const orderId = newOrder.id;

    // 4. Buat Order Items
    const orderItemsToInsert = validatedItems.map((vItem) => ({
      order_id: orderId,
      product_id: vItem.product_id,
      product_name: vItem.product_name,
      product_sku: null,
      quantity: vItem.quantity,
      unit_price: vItem.unit_price,
      subtotal: vItem.subtotal,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error("[Checkout] Error membuat order items:", itemsError);
      return NextResponse.json({ error: "Gagal menyimpan item pesanan" }, { status: 500 });
    }

    // 5. Buat Notification untuk Admin (service role diperlukan untuk akses table notifications)
    await supabaseAdmin.from("notifications").insert({
      type: "order",
      title: "Pesanan Baru Masuk",
      message: `Pesanan baru ${orderNumber} senilai ${grandTotal.toLocaleString("id-ID")} (termasuk ongkir Rp ${shippingCost.toLocaleString("id-ID")} via ${shippingCourier}) dari ${customerData.nama}. Metode Pembayaran: ${customerData.paymentMethod === "COD" ? "COD" : "Transfer Bank"}.`,
      link_url: `/admin/dashboard/pesanan`,
      metadata: {
        order_id: orderId,
        order_number: orderNumber,
        customer_name: customerData.nama,
        shipping_cost: shippingCost,
        grand_total: grandTotal,
      },
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      shippingCost,    // kembalikan ke client untuk tampilan WhatsApp message
      grandTotal,
    });
  } catch (error) {
    console.error("[Checkout] Unexpected error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server internal" }, { status: 500 });
  }
}
