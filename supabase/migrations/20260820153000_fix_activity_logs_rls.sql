-- supabase/migrations/20260820153000_fix_activity_logs_rls.sql

-- 1. Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 2. SELECT policy untuk admin & superadmin
CREATE POLICY "activity_logs_select_admin"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (public.get_my_role() IN ('admin', 'superadmin'));

-- 3. INSERT policy untuk admin & superadmin
-- Memastikan admin hanya bisa menginsert dengan user_id mereka sendiri (atau NULL).
CREATE POLICY "activity_logs_insert_admin"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_my_role() IN ('admin', 'superadmin') 
  AND (user_id = auth.uid() OR user_id IS NULL)
);

-- Note: UPDATE dan DELETE tidak diizinkan untuk audit trail.
