ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_public"
ON public.categories
FOR SELECT
USING (true);

CREATE POLICY "categories_insert_admin"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

CREATE POLICY "categories_update_admin"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.get_my_role() IN ('admin', 'superadmin'))
WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

CREATE POLICY "categories_delete_admin"
ON public.categories
FOR DELETE
TO authenticated
USING (public.get_my_role() IN ('admin', 'superadmin'));
