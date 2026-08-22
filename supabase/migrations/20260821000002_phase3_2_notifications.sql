-- Migration: 20260821000002_phase3_2_notifications.sql
-- Tujuan: Mengaktifkan RLS, memperbaiki tipe data, dan membuat trigger notifikasi otomatis (Order, Review, Stock).

-- =============================================================================
-- 1. KEAMANAN RLS DAN PERBAIKAN TIPE DATA NOTIFICATIONS
-- =============================================================================

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists (just in case)
DROP POLICY IF EXISTS "Admin can manage notifications" ON public.notifications;

-- Create Policy untuk Admin (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admin can manage notifications" 
ON public.notifications FOR ALL TO authenticated 
USING (public.get_my_role() IN ('admin', 'superadmin'))
WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

-- Perbaiki Constraint Tipe
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('order', 'review', 'stock', 'promotion', 'payment', 'system', 'banner', 'backup', 'login'));

-- =============================================================================
-- 2. TRIGGER NOTIFIKASI PESANAN BARU
-- =============================================================================

CREATE OR REPLACE FUNCTION public.trigger_notify_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, link_url, metadata)
  VALUES (
    'order',
    'Pesanan Baru Masuk',
    'Terdapat pesanan baru dengan Order Number: ' || NEW.order_number,
    '/admin/dashboard/pesanan/' || NEW.id,
    jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'total_amount', NEW.total)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_order ON public.orders;
CREATE TRIGGER on_new_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_notify_new_order();

-- =============================================================================
-- 3. TRIGGER NOTIFIKASI REVIEW BARU
-- =============================================================================

CREATE OR REPLACE FUNCTION public.trigger_notify_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, link_url, metadata)
  VALUES (
    'review',
    'Ulasan Pelanggan Baru',
    'Pelanggan memberikan ulasan dengan rating ' || NEW.rating || ' bintang.',
    '/admin/dashboard/review',
    jsonb_build_object('review_id', NEW.id, 'product_id', NEW.product_id, 'rating', NEW.rating)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_review ON public.reviews;
CREATE TRIGGER on_new_review
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.trigger_notify_new_review();

-- =============================================================================
-- 4. UPDATE RPC ADJUST_PRODUCT_STOCK (ANTI-SPAM STOK MINIMUM)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.adjust_product_stock(
  p_product_id UUID,
  p_type VARCHAR(20),
  p_quantity INTEGER,
  p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_stock_before INTEGER;
  v_stock_after INTEGER;
  v_minimum_stock INTEGER;
  v_new_status VARCHAR(20);
  v_role TEXT;
  v_user_id UUID;
  v_current_status VARCHAR(20);
  v_product_name VARCHAR(255);
BEGIN
  -- 1. Validasi admin
  v_role := public.get_my_role();
  IF v_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat mengubah stok manual';
  END IF;

  v_user_id := auth.uid();

  -- 2. Ambil stok, minimum stok, status, dan nama saat ini dengan FOR UPDATE untuk row-level lock
  SELECT stock, status, minimum_stock, name 
  INTO v_stock_before, v_current_status, v_minimum_stock, v_product_name
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produk tidak ditemukan';
  END IF;

  -- 3. Validasi kuantitas
  IF p_quantity = 0 THEN
    RAISE EXCEPTION 'Quantity tidak boleh 0';
  END IF;

  -- 4. Hitung stok akhir
  v_stock_after := v_stock_before + p_quantity;

  IF v_stock_after < 0 THEN
    RAISE EXCEPTION 'Stok tidak mencukupi. Stok tersedia: %, Jumlah yang diminta untuk keluar: %', v_stock_before, abs(p_quantity);
  END IF;

  -- 5. Tentukan status baru (menghindari mengubah draft/archived menjadi active secara otomatis)
  IF v_stock_after = 0 THEN
    v_new_status := 'out_of_stock';
  ELSE
    -- Jika sebelumnya out_of_stock dan stok bertambah, ubah ke active
    IF v_current_status = 'out_of_stock' THEN
      v_new_status := 'active';
    ELSE
      -- Jika sebelumnya active, draft, archived, dll, biarkan sesuai aslinya
      v_new_status := v_current_status;
    END IF;
  END IF;

  -- 6. Update stok
  UPDATE public.products
  SET stock = v_stock_after,
      status = v_new_status,
      updated_at = NOW()
  WHERE id = p_product_id;

  -- 7. Insert log inventory
  INSERT INTO public.inventory_logs (
    product_id,
    user_id,
    type,
    quantity,
    stock_before,
    stock_after,
    reference_type,
    reference_id,
    notes,
    created_at
  ) VALUES (
    p_product_id,
    v_user_id,
    p_type,
    p_quantity,
    v_stock_before,
    v_stock_after,
    'manual_adjustment',
    NULL,
    p_notes,
    NOW()
  );

  -- 8. THRESHOLD CROSSING NOTIFICATION (Anti-Spam Stok Minimum)
  IF v_stock_before > v_minimum_stock AND v_stock_after <= v_minimum_stock THEN
    INSERT INTO public.notifications (type, title, message, link_url, metadata)
    VALUES (
      'stock',
      'Stok Produk Menipis',
      'Stok untuk produk "' || v_product_name || '" telah mencapai batas minimum (' || v_stock_after || ' tersisa).',
      '/admin/dashboard/inventory',
      jsonb_build_object('product_id', p_product_id, 'stock_after', v_stock_after, 'minimum_stock', v_minimum_stock)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'stock_before', v_stock_before,
    'stock_after', v_stock_after
  );
END;
$$;

-- Hak akses eksekusi RPC hanya untuk authenticated users.
REVOKE EXECUTE ON FUNCTION public.adjust_product_stock(UUID, VARCHAR, INTEGER, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.adjust_product_stock(UUID, VARCHAR, INTEGER, TEXT) TO authenticated;
