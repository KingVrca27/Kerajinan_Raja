-- 1. Drop existing type constraint and add new one with 'damaged'
ALTER TABLE public.inventory_logs DROP CONSTRAINT IF EXISTS inventory_logs_type_check;

ALTER TABLE public.inventory_logs ADD CONSTRAINT inventory_logs_type_check 
  CHECK (type IN ('in', 'out', 'adjustment', 'return', 'damaged'));

-- 2. Enable RLS
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- SELECT: admin & superadmin
CREATE POLICY "Admin dapat melihat inventory logs"
ON public.inventory_logs
FOR SELECT
TO authenticated
USING (public.get_my_role() IN ('admin', 'superadmin'));

-- INSERT: admin & superadmin
CREATE POLICY "Admin dapat membuat inventory log"
ON public.inventory_logs
FOR INSERT
TO authenticated
WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

-- Note: UPDATE and DELETE are not allowed for audit trails.

-- 4. Create RPC to atomically adjust stock and log
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
  v_new_status VARCHAR(20);
  v_role TEXT;
  v_user_id UUID;
  v_current_status VARCHAR(20);
BEGIN
  -- 1. Validasi admin
  v_role := public.get_my_role();
  IF v_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat mengubah stok manual';
  END IF;

  v_user_id := auth.uid();

  -- 2. Ambil stok dan status saat ini dengan FOR UPDATE untuk row-level lock
  SELECT stock, status INTO v_stock_before, v_current_status
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

  -- 7. Insert log
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
