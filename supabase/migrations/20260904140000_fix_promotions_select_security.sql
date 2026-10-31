-- =============================================================================
-- STEP 6G-7D: Fix RLS policies for public.promotions
--
-- Root Cause:
--   Tabel `promotions` sebelumnya memiliki policy `promotions_select_public`
--   dengan `USING (true)`, yang menyebabkan anonymous user atau customer bisa
--   membaca seluruh data promotions, termasuk field sensitif.
--
-- Fix:
--   - Drop policy `promotions_select_public`
--   - Buat policy `promotions_select_admin` khusus admin/superadmin
-- =============================================================================

-- Hapus policy public yang terlalu permisif
DROP POLICY IF EXISTS "promotions_select_public" ON public.promotions;

-- Hapus policy select_admin lama jika kebetulan sudah pernah dibuat (untuk idempotency)
DROP POLICY IF EXISTS "promotions_select_admin" ON public.promotions;

-- SELECT: hanya admin/superadmin
CREATE POLICY "promotions_select_admin"
ON public.promotions
FOR SELECT
TO authenticated
USING (
  public.get_my_role() IN ('admin', 'superadmin')
);
