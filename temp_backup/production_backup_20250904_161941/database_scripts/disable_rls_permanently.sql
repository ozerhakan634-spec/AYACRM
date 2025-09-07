-- RLS'yi Kalıcı Olarak Devre Dışı Bırakma Script'i
-- Bu script RLS'yi kapatır ve uygulama seviyesinde güvenlik sağlar

SELECT '=== RLS KALICI OLARAK DEVRE DISI BIRAKILIYOR ===' as info;

-- 1. Clients tablosu için RLS'yi devre dışı bırak
SELECT '=== CLIENTS TABLOSU RLS KAPALI ===' as info;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- 2. Consultants tablosu için RLS'yi devre dışı bırak
SELECT '=== CONSULTANTS TABLOSU RLS KAPALI ===' as info;
ALTER TABLE consultants DISABLE ROW LEVEL SECURITY;

-- 3. Tasks tablosu için RLS'yi devre dışı bırak
SELECT '=== TASKS TABLOSU RLS KAPALI ===' as info;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- 4. Support tickets tablosu için RLS'yi devre dışı bırak
SELECT '=== SUPPORT_TICKETS TABLOSU RLS KAPALI ===' as info;
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;

-- 5. Documents tablosu için RLS'yi devre dışı bırak
SELECT '=== DOCUMENTS TABLOSU RLS KAPALI ===' as info;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- 6. Finance tablosu için RLS'yi devre dışı bırak
SELECT '=== FINANCE TABLOSU RLS KAPALI ===' as info;
ALTER TABLE finance DISABLE ROW LEVEL SECURITY;

-- 7. Tüm RLS politikalarını kaldır
SELECT '=== RLS POLITIKALARI KALDIRILIYOR ===' as info;

-- Clients politikaları
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON clients;
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

-- Consultants politikaları
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON consultants;
DROP POLICY IF EXISTS "Users can view consultants" ON consultants;
DROP POLICY IF EXISTS "Users can insert consultants" ON consultants;
DROP POLICY IF EXISTS "Users can update consultants" ON consultants;
DROP POLICY IF EXISTS "Users can delete consultants" ON consultants;

-- Tasks politikaları
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- Support tickets politikaları
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON support_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can insert their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can delete their own tickets" ON support_tickets;

-- Documents politikaları
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON documents;
DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Users can insert documents" ON documents;
DROP POLICY IF EXISTS "Users can update documents" ON documents;
DROP POLICY IF EXISTS "Users can delete documents" ON documents;

-- Finance politikaları
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON finance;
DROP POLICY IF EXISTS "Users can view finance records" ON finance;
DROP POLICY IF EXISTS "Users can insert finance records" ON finance;
DROP POLICY IF EXISTS "Users can update finance records" ON finance;
DROP POLICY IF EXISTS "Users can delete finance records" ON finance;

-- 8. Final kontrol
SELECT '=== FINAL KONTROL ===' as info;

-- Veri sayıları
SELECT 'CLIENTS VERI SAYISI:' as info;
SELECT COUNT(*) as client_count FROM clients;

SELECT 'CONSULTANTS VERI SAYISI:' as info;
SELECT COUNT(*) as consultant_count FROM consultants;

-- RLS durumu kontrol
SELECT 'RLS DURUMU (FALSE OLMALI):' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'consultants', 'tasks', 'support_tickets', 'documents', 'finance');

-- RLS politikaları kontrol (BOŞ OLMALI)
SELECT 'RLS POLITIKALARI (BOŞ OLMALI):' as info;
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'consultants', 'tasks', 'support_tickets', 'documents', 'finance');

SELECT 'RLS kalıcı olarak devre dışı bırakıldı! Güvenlik uygulama seviyesinde sağlanacak!' as result;
