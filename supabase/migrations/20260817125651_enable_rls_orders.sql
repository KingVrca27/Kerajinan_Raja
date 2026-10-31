ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_all_admin"
ON public.orders
FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('admin', 'superadmin')
)
WITH CHECK (
  public.get_my_role() IN ('admin', 'superadmin')
);
