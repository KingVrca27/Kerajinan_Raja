-- =============================================================================
-- Migration: Enable RLS on public.reviews
-- Tanggal   : 2026-08-14
-- Tujuan    : Mengamankan tabel reviews dengan Row Level Security.
--
-- Policy:
--   SELECT  — Public hanya melihat is_approved = true.
--             Admin/Superadmin melihat semua review.
--   INSERT  — Public/Anon diizinkan.
--             Validasi kepemilikan order dilakukan oleh app/api/reviews/route.ts.
--   UPDATE  — Hanya admin/superadmin (authenticated).
--   DELETE  — Hanya admin/superadmin (authenticated).
--
-- Bergantung pada:
--   public.get_my_role() — sudah dibuat di 20260812123000_create_get_my_role_function.sql
-- =============================================================================

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Policy 1: SELECT
-- Public/Anon hanya dapat melihat review yang sudah disetujui (is_approved = true).
-- Admin/Superadmin dapat melihat semua review termasuk yang belum disetujui.
-- -----------------------------------------------------------------------------
CREATE POLICY "reviews_select_approved_or_admin"
ON public.reviews
FOR SELECT
USING (
  is_approved = true
  OR public.get_my_role() IN ('admin', 'superadmin')
);

-- -----------------------------------------------------------------------------
-- Policy 2: INSERT
-- Public/Anon diperbolehkan melakukan INSERT.
-- Validasi bisnis (kepemilikan order, product_id, status delivered)
-- sudah dilakukan di server-side oleh app/api/reviews/route.ts.
-- UNIQUE (order_item_id) di database mencegah review duplikat per item.
-- -----------------------------------------------------------------------------
CREATE POLICY "reviews_insert_public"
ON public.reviews
FOR INSERT
WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Policy 3: UPDATE
-- Hanya pengguna terautentikasi dengan role admin atau superadmin yang
-- dapat mengubah review (is_approved, admin_reply, updated_at).
-- Admin TIDAK BOLEH mengubah nilai rating — dipatuhi di source code.
-- -----------------------------------------------------------------------------
CREATE POLICY "reviews_update_admin"
ON public.reviews
FOR UPDATE
TO authenticated
USING (
  public.get_my_role() IN ('admin', 'superadmin')
)
WITH CHECK (
  public.get_my_role() IN ('admin', 'superadmin')
);

-- -----------------------------------------------------------------------------
-- Policy 4: DELETE
-- Hanya pengguna terautentikasi dengan role admin atau superadmin yang
-- dapat menghapus review.
-- -----------------------------------------------------------------------------
CREATE POLICY "reviews_delete_admin"
ON public.reviews
FOR DELETE
TO authenticated
USING (
  public.get_my_role() IN ('admin', 'superadmin')
);
