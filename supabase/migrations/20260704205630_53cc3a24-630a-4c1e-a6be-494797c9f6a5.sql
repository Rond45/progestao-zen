
INSERT INTO public.user_roles (user_id, role)
VALUES ('04ebc4e9-13aa-44f8-8d86-31da22b51bde', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE auth.users
SET encrypted_password = crypt('#256987Rond', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE id = '04ebc4e9-13aa-44f8-8d86-31da22b51bde';
