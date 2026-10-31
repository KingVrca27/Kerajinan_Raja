-- =============================================================================
-- STEP 6G-7B: Fix RLS policies for public.promotions
--
-- Root Cause:
--   Tabel `promotions` memiliki RLS aktif, namun tidak ada policy INSERT/UPDATE/DELETE
--   yang mengizinkan admin atau superadmin melakukan mutasi.
--   Hasilnya: admin mendapat error "new row violates row-level security policy"
--   saat mencoba membuat/mengedit/menghapus promosi.
--
-- Fix:
--   - Tambahkan ENABLE ROW LEVEL SECURITY (idempotent — aman jika sudah aktif)
--   - SELECT: public (anon dan authenticated boleh baca)
--   - INSERT:  hanya admin/superadmin (via get_my_role())
--   - UPDATE:  hanya admin/superadmin (via get_my_role())
--   - DELETE:  hanya admin/superadmin (via get_my_role())
--
-- Konsisten dengan pola yang digunakan di:
--   - 20260812125154_enable_rls_categories.sql
--   - 20260814210106_enable_rls_product_images.sql
-- =============================================================================

-- Aktifkan RLS (idempotent — aman jika sudah aktif)
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada (idempotent)
DROP POLICY IF EXISTS "promotions_select_public"   ON public.promotions;
DROP POLICY IF EXISTS "promotions_insert_admin"    ON public.promotions;
DROP POLICY IF EXISTS "promotions_update_admin"    ON public.promotions;
DROP POLICY IF EXISTS "promotions_delete_admin"    ON public.promotions;

-- SELECT: publik — pelanggan perlu membaca promo saat checkout
CREATE POLICY "promotions_select_public"
ON public.promotions
FOR SELECT
USING (true);

-- INSERT: hanya admin/superadmin
CREATE POLICY "promotions_insert_admin"
ON public.promotions
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_my_role() IN ('admin', 'superadmin')
);

-- UPDATE: hanya admin/superadmin
CREATE POLICY "promotions_update_admin"
ON public.promotions
FOR UPDATE
TO authenticated
USING (
  public.get_my_role() IN ('admin', 'superadmin')
)
WITH CHECK (
  public.get_my_role() IN ('admin', 'superadmin')
);

-- DELETE: hanya admin/superadmin
CREATE POLICY "promotions_delete_admin"
ON public.promotions
FOR DELETE
TO authenticated
USING (
  public.get_my_role() IN ('admin', 'superadmin')
);
