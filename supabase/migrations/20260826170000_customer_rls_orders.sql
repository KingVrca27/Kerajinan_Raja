-- =============================================================================
-- SQL MIGRATION - CUSTOMER READ OWN ORDERS RLS (DEFENSE-IN-DEPTH)
-- =============================================================================

-- Hapus policy lama jika ada untuk mencegah konflik (idempotent)
DROP POLICY IF EXISTS "orders_read_own_customer" ON public.orders;
DROP POLICY IF EXISTS "order_items_read_own_customer" ON public.order_items;

-- 1. Kebijakan RLS untuk tabel orders
-- Mengizinkan pelanggan membaca pesanan mereka sendiri berdasarkan customer_id
CREATE POLICY "orders_read_own_customer"
ON public.orders 
FOR SELECT 
TO authenticated
USING (
  customer_id IN (
    SELECT id 
    FROM public.customers 
    WHERE user_id = auth.uid()
  )
);

-- 2. Kebijakan RLS untuk tabel order_items
-- Mengizinkan pelanggan membaca item pesanan yang terkait dengan pesanan mereka
CREATE POLICY "order_items_read_own_customer"
ON public.order_items 
FOR SELECT 
TO authenticated
USING (
  order_id IN (
    SELECT o.id 
    FROM public.orders o
    JOIN public.customers c ON o.customer_id = c.id
    WHERE c.user_id = auth.uid()
  )
);
