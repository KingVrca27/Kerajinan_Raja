-- =============================================================================
-- Migration: Add bank_account_id to orders
-- Phase 4.4C — Bank Account Server Authority & Order Payment Binding
--
-- Menambahkan relasi antara orders dan bank_accounts sehingga customer yang 
-- memilih metode pembayaran TRANSFER_BANK akan terikat dengan rekening yang 
-- telah divalidasi server-side.
-- =============================================================================

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS bank_account_id UUID NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_orders_bank_account'
    ) THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT fk_orders_bank_account
        FOREIGN KEY (bank_account_id)
        REFERENCES public.bank_accounts(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Membuat index opsional untuk optimasi query jika kita mencari orders berdasarkan bank account.
CREATE INDEX IF NOT EXISTS idx_orders_bank_account_id ON public.orders (bank_account_id);

COMMENT ON COLUMN public.orders.bank_account_id IS 'ID dari bank_accounts jika metode pembayaran adalah TRANSFER_BANK. Jika COD, nilai ini NULL.';
