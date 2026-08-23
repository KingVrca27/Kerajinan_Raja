-- =============================================================================
--  MIGRATION: Create get_best_sellers RPC
--  File     : 20260824000000_create_get_best_sellers.sql
--  Fase     : 4.2 — Batch 2B
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_best_sellers(
    p_limit integer DEFAULT 8
)
RETURNS TABLE (
    product_id uuid,
    total_sold bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT 
        oi.product_id,
        SUM(oi.quantity) as total_sold
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.status IN ('processing', 'shipped', 'delivered')
      AND p.status = 'active'
      AND p.is_active = true
    GROUP BY oi.product_id
    ORDER BY total_sold DESC, oi.product_id ASC
    LIMIT LEAST(CASE WHEN p_limit IS NULL OR p_limit <= 0 THEN 8 ELSE p_limit END, 100);
$$;

-- Berikan izin eksekusi kepada role public (anon, authenticated)
GRANT EXECUTE ON FUNCTION public.get_best_sellers(integer) TO anon, authenticated;
