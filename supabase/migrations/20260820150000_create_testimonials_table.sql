-- =============================================================================
-- Migration: Create testimonials table and RLS policies
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.testimonials IS 'Tabel testimoni atau ulasan pelanggan untuk ditampilkan di halaman utama.';

-- Mengaktifkan Row Level Security (RLS)
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Siapapun dapat membaca (public)
CREATE POLICY "testimonials_select_public"
ON public.testimonials
FOR SELECT
USING (true);

-- 2. INSERT: Hanya pengguna dengan role admin/superadmin yang bisa menambah data
CREATE POLICY "testimonials_insert_admin"
ON public.testimonials
FOR INSERT
TO authenticated
WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

-- 3. UPDATE: Hanya pengguna dengan role admin/superadmin yang bisa mengubah data
CREATE POLICY "testimonials_update_admin"
ON public.testimonials
FOR UPDATE
TO authenticated
USING (public.get_my_role() IN ('admin', 'superadmin'))
WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

-- 4. DELETE: Hanya pengguna dengan role admin/superadmin yang bisa menghapus data
CREATE POLICY "testimonials_delete_admin"
ON public.testimonials
FOR DELETE
TO authenticated
USING (public.get_my_role() IN ('admin', 'superadmin'));
