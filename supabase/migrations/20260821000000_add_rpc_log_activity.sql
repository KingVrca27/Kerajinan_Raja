-- Membuat RPC function untuk log_admin_activity dengan Security Definer
-- Hal ini memungkinkan bypass RLS untuk mencatat Login Gagal dari user yang belum login.

CREATE OR REPLACE FUNCTION public.log_admin_activity(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_action text;
BEGIN
  v_user_id := auth.uid();
  v_action := payload->>'action';
  
  -- Validasi akses:
  -- Jika aktivitas adalah Login Gagal, kita perbolehkan insert meskipun v_user_id null (unauthenticated).
  -- Jika aktivitas lain, maka panggil validasi role admin.
  IF v_action != 'Login Gagal' THEN
    -- Jika auth.uid() null (misal dari script/service), kita periksa apakah payload menyediakan user_id, 
    -- namun karena kita strict, kita harus pastikan role-nya.
    SELECT role INTO v_role FROM public.users WHERE id = v_user_id AND is_active = true;
    
    IF v_role NOT IN ('admin', 'superadmin') THEN
      RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat mencatat log aktivitas (Action: %).', v_action;
    END IF;
  END IF;

  INSERT INTO public.activity_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata,
    user_agent,
    ip_address
  ) VALUES (
    v_user_id,
    v_action,
    payload->>'entity_type',
    NULLIF(payload->>'entity_id', '')::uuid,
    payload->>'description',
    CASE WHEN payload ? 'metadata' AND jsonb_typeof(payload->'metadata') != 'null' THEN payload->'metadata' ELSE NULL END,
    payload->>'user_agent',
    NULLIF(payload->>'ip_address', '')::inet
  );
END;
$$;

-- Berikan akses eksekusi ke authenticated dan anon (karena Login Gagal terjadi saat anon)
REVOKE EXECUTE ON FUNCTION public.log_admin_activity(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_admin_activity(jsonb) TO authenticated, anon;
