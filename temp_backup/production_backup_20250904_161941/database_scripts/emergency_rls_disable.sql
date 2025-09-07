-- Acil Durum RLS Devre Dışı Bırakma Script'i
-- Bu script RLS'yi geçici olarak devre dışı bırakır

SELECT '=== ACIL DURUM RLS DEVRE DISI BIRAKILIYOR ===' as info;

-- 1. Clients tablosu için RLS'yi devre dışı bırak
SELECT '=== CLIENTS TABLOSU RLS DEVRE DISI ===' as info;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- 2. Consultants tablosu için RLS'yi devre dışı bırak
SELECT '=== CONSULTANTS TABLOSU RLS DEVRE DISI ===' as info;
ALTER TABLE consultants DISABLE ROW LEVEL SECURITY;

-- 3. Tasks tablosu için RLS'yi devre dışı bırak
SELECT '=== TASKS TABLOSU RLS DEVRE DISI ===' as info;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- 4. Support tickets tablosu için RLS'yi devre dışı bırak
SELECT '=== SUPPORT_TICKETS TABLOSU RLS DEVRE DISI ===' as info;
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;

-- 5. Documents tablosu için RLS'yi devre dışı bırak
SELECT '=== DOCUMENTS TABLOSU RLS DEVRE DISI ===' as info;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- 6. Finance tablosu için RLS'yi devre dışı bırak
SELECT '=== FINANCE TABLOSU RLS DEVRE DISI ===' as info;
ALTER TABLE finance DISABLE ROW LEVEL SECURITY;

-- 7. Veri kontrolü
SELECT '=== VERI KONTROL EDILIYOR ===' as info;

-- Clients veri sayısı
SELECT 'CLIENTS VERI SAYISI:' as info;
SELECT COUNT(*) as client_count FROM clients;

-- Consultants veri sayısı
SELECT 'CONSULTANTS VERI SAYISI:' as info;
SELECT COUNT(*) as consultant_count FROM consultants;

-- İlk 3 müşteri
SELECT 'İLK 3 MÜŞTERİ:' as info;
SELECT id, name, email FROM clients ORDER BY created_at DESC LIMIT 3;

-- İlk 3 danışman
SELECT 'İLK 3 DANIŞMAN:' as info;
SELECT id, name, email FROM consultants ORDER BY created_at DESC LIMIT 3;

-- 8. RLS durumu kontrol
SELECT '=== RLS DURUMU KONTROL ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'consultants', 'tasks', 'support_tickets', 'documents', 'finance');

SELECT 'RLS geçici olarak devre dışı bırakıldı! Veriler kontrol edildi!' as result;
