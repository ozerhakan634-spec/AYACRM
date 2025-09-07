-- Production RLS Politikalarını Düzeltme Script'i
-- Bu script production ortamındaki RLS politikalarını düzeltir

SELECT '=== PRODUCTION RLS POLITIKALARINI DUZELTIYORUM ===' as info;

-- 1. Clients tablosu için RLS politikalarını düzelt
SELECT '=== CLIENTS TABLOSU RLS DUZELTILIYOR ===' as info;

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON clients;
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

-- RLS'yi etkinleştir
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Yeni basit RLS politikası oluştur
CREATE POLICY "Enable all operations for authenticated users" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

-- 2. Consultants tablosu için RLS politikalarını düzelt
SELECT '=== CONSULTANTS TABLOSU RLS DUZELTILIYOR ===' as info;

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON consultants;
DROP POLICY IF EXISTS "Users can view consultants" ON consultants;
DROP POLICY IF EXISTS "Users can insert consultants" ON consultants;
DROP POLICY IF EXISTS "Users can update consultants" ON consultants;
DROP POLICY IF EXISTS "Users can delete consultants" ON consultants;

-- RLS'yi etkinleştir
ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;

-- Yeni basit RLS politikası oluştur
CREATE POLICY "Enable all operations for authenticated users" ON consultants
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Tasks tablosu için RLS politikalarını düzelt
SELECT '=== TASKS TABLOSU RLS DUZELTILIYOR ===' as info;

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- RLS'yi etkinleştir
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Yeni basit RLS politikası oluştur
CREATE POLICY "Enable all operations for authenticated users" ON tasks
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Support tickets tablosu için RLS politikalarını düzelt
SELECT '=== SUPPORT_TICKETS TABLOSU RLS DUZELTILIYOR ===' as info;

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON support_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can insert their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can delete their own tickets" ON support_tickets;

-- RLS'yi etkinleştir
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Yeni basit RLS politikası oluştur
CREATE POLICY "Enable all operations for authenticated users" ON support_tickets
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Documents tablosu için RLS politikalarını düzelt
SELECT '=== DOCUMENTS TABLOSU RLS DUZELTILIYOR ===' as info;

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON documents;
DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Users can insert documents" ON documents;
DROP POLICY IF EXISTS "Users can update documents" ON documents;
DROP POLICY IF EXISTS "Users can delete documents" ON documents;

-- RLS'yi etkinleştir
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Yeni basit RLS politikası oluştur
CREATE POLICY "Enable all operations for authenticated users" ON documents
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Finance tablosu için RLS politikalarını düzelt
SELECT '=== FINANCE TABLOSU RLS DUZELTILIYOR ===' as info;

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON finance;
DROP POLICY IF EXISTS "Users can view finance records" ON finance;
DROP POLICY IF EXISTS "Users can insert finance records" ON finance;
DROP POLICY IF EXISTS "Users can update finance records" ON finance;
DROP POLICY IF EXISTS "Users can delete finance records" ON finance;

-- RLS'yi etkinleştir
ALTER TABLE finance ENABLE ROW LEVEL SECURITY;

-- Yeni basit RLS politikası oluştur
CREATE POLICY "Enable all operations for authenticated users" ON finance
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Final kontrol
SELECT '=== FINAL KONTROL ===' as info;

-- Tüm tabloların RLS durumunu kontrol et
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'consultants', 'tasks', 'support_tickets', 'documents', 'finance');

-- RLS politikalarını listele
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'consultants', 'tasks', 'support_tickets', 'documents', 'finance');

SELECT 'RLS politikaları basariyla duzeltildi!' as result;
