-- Development vs Production ortam kontrolü
-- Bu scripti hem development hem production Supabase Dashboard'da çalıştırın

-- 1. Mevcut kullanıcıları kontrol et
SELECT COUNT(*) as total_users FROM auth.users;

-- 2. Mevcut clients sayısını kontrol et
SELECT COUNT(*) as total_clients FROM clients;

-- 3. Mevcut consultants sayısını kontrol et
SELECT COUNT(*) as total_consultants FROM consultants;

-- 4. RLS durumunu kontrol et
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('clients', 'consultants', 'notifications')
ORDER BY tablename;

-- 5. RLS politikalarını kontrol et
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('clients', 'consultants', 'notifications')
ORDER BY tablename, policyname;

-- 6. Trigger'ları kontrol et
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('clients', 'tasks', 'support_tickets');

-- 7. Örnek bir client'ı kontrol et
SELECT id, name, email, consultant_id FROM clients LIMIT 1;

-- 8. Örnek bir consultant'ı kontrol et
SELECT id, name, email FROM consultants LIMIT 1;
