-- =============================================================================
-- Migration: 20260828000000_customer_addresses.sql
-- Phase     : 4.5A — Customer Address & Google Maps Location
-- Tujuan    : Membuat tabel customer_addresses dengan RLS lengkap.
--
-- Bergantung pada:
--   public.customers           (customers.id, customers.user_id)
--   auth.users                 (auth.uid())
--   public.get_my_role()       (dari 20260812123000_create_get_my_role_function.sql)
-- =============================================================================

-- =============================================================================
-- 1. CUSTOMER_ADDRESSES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id    UUID NOT NULL,
    is_primary     BOOLEAN NOT NULL DEFAULT false,
    receiver_name  VARCHAR(100) NOT NULL,
    phone          VARCHAR(20) NOT NULL,
    province       VARCHAR(100) NOT NULL,
    city           VARCHAR(100) NOT NULL,
    district       VARCHAR(100) NOT NULL,
    village        VARCHAR(100) NOT NULL,
    detail_address TEXT NOT NULL,
    latitude       NUMERIC(10, 8),
    longitude      NUMERIC(11, 8),
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT customer_addresses_customer_fk
        FOREIGN KEY (customer_id)
        REFERENCES public.customers (id)
        ON DELETE CASCADE
);

COMMENT ON TABLE  public.customer_addresses                 IS 'Alamat pengiriman milik customer';
COMMENT ON COLUMN public.customer_addresses.customer_id     IS 'Relasi ke pelanggan pemilik alamat. Cascade delete jika customer dihapus.';
COMMENT ON COLUMN public.customer_addresses.is_primary      IS 'Menandakan apakah ini adalah alamat utama customer.';
COMMENT ON COLUMN public.customer_addresses.latitude        IS 'Latitude lokasi dari Google Maps.';
COMMENT ON COLUMN public.customer_addresses.longitude       IS 'Longitude lokasi dari Google Maps.';

-- Index untuk performa query umum
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON public.customer_addresses (customer_id);

-- =============================================================================
-- 2. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada (idempotent — aman dijalankan ulang)
DROP POLICY IF EXISTS "address_select_own_customer" ON public.customer_addresses;
DROP POLICY IF EXISTS "address_insert_own_customer" ON public.customer_addresses;
DROP POLICY IF EXISTS "address_update_own_customer" ON public.customer_addresses;
DROP POLICY IF EXISTS "address_delete_own_customer" ON public.customer_addresses;
DROP POLICY IF EXISTS "address_all_admin"           ON public.customer_addresses;

-- -----------------------------------------------------------------------------
-- Policy: CUSTOMER SELECT
-- Customer hanya dapat melihat alamat miliknya sendiri.
-- -----------------------------------------------------------------------------
CREATE POLICY "address_select_own_customer"
ON public.customer_addresses
FOR SELECT
TO authenticated
USING (
    customer_id IN (
        SELECT id
        FROM public.customers
        WHERE user_id = auth.uid()
    )
);

-- -----------------------------------------------------------------------------
-- Policy: CUSTOMER INSERT
-- Customer hanya boleh menambah alamat miliknya sendiri.
-- -----------------------------------------------------------------------------
CREATE POLICY "address_insert_own_customer"
ON public.customer_addresses
FOR INSERT
TO authenticated
WITH CHECK (
    customer_id IN (
        SELECT id
        FROM public.customers
        WHERE user_id = auth.uid()
    )
);

-- -----------------------------------------------------------------------------
-- Policy: CUSTOMER UPDATE
-- Customer hanya boleh mengubah alamat miliknya sendiri.
-- -----------------------------------------------------------------------------
CREATE POLICY "address_update_own_customer"
ON public.customer_addresses
FOR UPDATE
TO authenticated
USING (
    customer_id IN (
        SELECT id
        FROM public.customers
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    customer_id IN (
        SELECT id
        FROM public.customers
        WHERE user_id = auth.uid()
    )
);

-- -----------------------------------------------------------------------------
-- Policy: CUSTOMER DELETE
-- Customer hanya boleh menghapus alamat miliknya sendiri.
-- -----------------------------------------------------------------------------
CREATE POLICY "address_delete_own_customer"
ON public.customer_addresses
FOR DELETE
TO authenticated
USING (
    customer_id IN (
        SELECT id
        FROM public.customers
        WHERE user_id = auth.uid()
    )
);

-- -----------------------------------------------------------------------------
-- Policy: ADMIN ALL
-- Admin dan Superadmin dapat melakukan semua operasi pada addresses.
-- -----------------------------------------------------------------------------
CREATE POLICY "address_all_admin"
ON public.customer_addresses
FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('admin', 'superadmin')
)
WITH CHECK (
    public.get_my_role() IN ('admin', 'superadmin')
);
