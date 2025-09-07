-- Production Ortamı Environment Kontrolü
-- Bu script production'da environment değişkenlerini ve Supabase konfigürasyonunu kontrol eder

-- 1. Supabase bağlantı bilgilerini kontrol et
SELECT '=== SUPABASE BAĞLANTI KONTROLÜ ===' as info;

-- Mevcut veritabanı adını kontrol et
SELECT current_database() as current_database;

-- Mevcut kullanıcıyı kontrol et
SELECT current_user as current_user;

-- Supabase proje bilgilerini kontrol et
SELECT 
    setting_name,
    setting_value
FROM pg_settings 
WHERE setting_name LIKE '%supabase%' OR setting_name LIKE '%auth%';

-- 2. Tablo yapılarını kontrol et
SELECT '=== TABLO YAPILARI KONTROLÜ ===' as info;

-- Clients tablosu yapısı
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- Consultants tablosu yapısı
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'consultants' 
ORDER BY ordinal_position;

-- Notifications tablosu yapısı
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- 3. RLS durumunu kontrol et
SELECT '=== RLS DURUMU KONTROLÜ ===' as info;

-- RLS etkin tablolar
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename IN ('clients', 'consultants', 'notifications', 'task_assignments', 'support_tickets')
ORDER BY tablename;

-- RLS politikaları
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('clients', 'consultants', 'notifications', 'task_assignments', 'support_tickets')
ORDER BY tablename, policyname;

-- 4. Trigger'ları kontrol et
SELECT '=== TRIGGER KONTROLÜ ===' as info;

-- Mevcut trigger'lar
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE trigger_name LIKE '%notification%' 
   OR trigger_name LIKE '%client%' 
   OR trigger_name LIKE '%consultant%'
ORDER BY trigger_name;

-- 5. Veri sayılarını kontrol et
SELECT '=== VERİ SAYILARI KONTROLÜ ===' as info;

-- Tablo kayıt sayıları
SELECT 
    'clients' as table_name,
    COUNT(*) as record_count
FROM clients
UNION ALL
SELECT 
    'consultants' as table_name,
    COUNT(*) as record_count
FROM consultants
UNION ALL
SELECT 
    'notifications' as table_name,
    COUNT(*) as record_count
FROM notifications
UNION ALL
SELECT 
    'task_assignments' as table_name,
    COUNT(*) as record_count
FROM task_assignments
UNION ALL
SELECT 
    'support_tickets' as table_name,
    COUNT(*) as record_count
FROM support_tickets;

-- 6. Danışman atama örneklerini kontrol et
SELECT '=== DANIŞMAN ATAMA ÖRNEKLERİ ===' as info;

-- Mevcut danışman atamaları
SELECT 
    c.id as client_id,
    c.name as client_name,
    c.email as client_email,
    c.consultant_id,
    cons.name as consultant_name,
    cons.email as consultant_email,
    c.created_at as client_created,
    cons.created_at as consultant_created
FROM clients c
LEFT JOIN consultants cons ON c.consultant_id = cons.id
WHERE c.consultant_id IS NOT NULL
ORDER BY c.created_at DESC
LIMIT 10;

-- 7. Son işlemleri kontrol et
SELECT '=== SON İŞLEMLER KONTROLÜ ===' as info;

-- Son 10 client güncellemesi
SELECT 
    'clients' as table_name,
    id,
    name,
    consultant_id,
    updated_at
FROM clients
WHERE updated_at IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- 8. Environment değişkenlerini kontrol et (mümkün olduğunca)
SELECT '=== ENVIRONMENT DEĞİŞKENLERİ ===' as info;

-- Supabase ile ilgili ayarlar
SELECT 
    name,
    setting,
    context,
    category
FROM pg_settings 
WHERE name LIKE '%supabase%' 
   OR name LIKE '%auth%' 
   OR name LIKE '%rls%'
ORDER BY name;

SELECT '✅ Production environment kontrolü tamamlandı!' as result;
