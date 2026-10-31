ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_images_select_public"
ON public.product_images
FOR SELECT
USING (true);

CREATE POLICY "product_images_insert_admin"
ON public.product_images
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_my_role() IN ('admin', 'superadmin')
);

CREATE POLICY "product_images_update_admin"
ON public.product_images
FOR UPDATE
TO authenticated
USING (
  public.get_my_role() IN ('admin', 'superadmin')
)
WITH CHECK (
  public.get_my_role() IN ('admin', 'superadmin')
);

CREATE POLICY "product_images_delete_admin"
ON public.product_images
FOR DELETE
TO authenticated
USING (
  public.get_my_role() IN ('admin', 'superadmin')
);
