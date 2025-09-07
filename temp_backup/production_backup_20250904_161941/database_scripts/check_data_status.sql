-- Veri Durumu Kontrol Script'i
-- Bu script verilerin durumunu kontrol eder

SELECT '=== VERI DURUMU KONTROL EDILIYOR ===' as info;

-- 1. Clients tablosu veri sayısı
SELECT '=== CLIENTS TABLOSU ===' as info;
SELECT COUNT(*) as client_count FROM clients;
SELECT 'İlk 5 müşteri:' as info;
SELECT id, name, email, created_at FROM clients ORDER BY created_at DESC LIMIT 5;

-- 2. Consultants tablosu veri sayısı
SELECT '=== CONSULTANTS TABLOSU ===' as info;
SELECT COUNT(*) as consultant_count FROM consultants;
SELECT 'İlk 5 danışman:' as info;
SELECT id, name, email, specialty FROM consultants ORDER BY created_at DESC LIMIT 5;

-- 3. Tasks tablosu veri sayısı
SELECT '=== TASKS TABLOSU ===' as info;
SELECT COUNT(*) as task_count FROM tasks;
SELECT 'İlk 5 görev:' as info;
SELECT id, title, status, created_at FROM tasks ORDER BY created_at DESC LIMIT 5;

-- 4. Support tickets tablosu veri sayısı
SELECT '=== SUPPORT_TICKETS TABLOSU ===' as info;
SELECT COUNT(*) as ticket_count FROM support_tickets;
SELECT 'İlk 5 destek talebi:' as info;
SELECT id, subject, status, created_at FROM support_tickets ORDER BY created_at DESC LIMIT 5;

-- 5. Documents tablosu veri sayısı
SELECT '=== DOCUMENTS TABLOSU ===' as info;
SELECT COUNT(*) as document_count FROM documents;
SELECT 'İlk 5 belge:' as info;
SELECT id, filename, created_at FROM documents ORDER BY created_at DESC LIMIT 5;

-- 6. Finance tablosu veri sayısı
SELECT '=== FINANCE TABLOSU ===' as info;
SELECT COUNT(*) as finance_count FROM finance;
SELECT 'İlk 5 finans kaydı:' as info;
SELECT id, amount, description, created_at FROM finance ORDER BY created_at DESC LIMIT 5;

-- 7. RLS durumu kontrol
SELECT '=== RLS DURUMU ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'consultants', 'tasks', 'support_tickets', 'documents', 'finance');

-- 8. RLS politikaları kontrol
SELECT '=== RLS POLITIKALARI ===' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'consultants', 'tasks', 'support_tickets', 'documents', 'finance');

SELECT 'Veri durumu kontrol tamamlandı!' as result;
