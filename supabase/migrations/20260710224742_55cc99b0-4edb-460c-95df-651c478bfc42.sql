UPDATE auth.users
SET encrypted_password = crypt('#256987Rond', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = 'rondineliprof@gmail.com';