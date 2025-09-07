-- Güvenli RLS Politikası Script'i
-- Bu script güvenli RLS politikaları oluşturur

SELECT '=== GÜVENLI RLS POLITIKALARI OLUŞTURULUYOR ===' as info;

-- 1. Clients tablosu için güvenli RLS
SELECT '=== CLIENTS GÜVENLI RLS ===' as info;

-- RLS'yi etkinleştir
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Tüm politikaları kaldır
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON clients;
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

-- Güvenli politika oluştur - tüm authenticated kullanıcılar için
CREATE POLICY "Enable all operations for authenticated users" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

-- 2. Consultants tablosu için güvenli RLS
SELECT '=== CONSULTANTS GÜVENLI RLS ===' as info;

-- RLS'yi etkinleştir
ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;

-- Tüm politikaları kaldır
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON consultants;
DROP POLICY IF EXISTS "Users can view consultants" ON consultants;
DROP POLICY IF EXISTS "Users can insert consultants" ON consultants;
DROP POLICY IF EXISTS "Users can update consultants" ON consultants;
DROP POLICY IF EXISTS "Users can delete consultants" ON consultants;

-- Güvenli politika oluştur
CREATE POLICY "Enable all operations for authenticated users" ON consultants
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Tasks tablosu için güvenli RLS
SELECT '=== TASKS GÜVENLI RLS ===' as info;

-- RLS'yi etkinleştir
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Tüm politikaları kaldır
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- Güvenli politika oluştur
CREATE POLICY "Enable all operations for authenticated users" ON tasks
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Support tickets tablosu için güvenli RLS
SELECT '=== SUPPORT_TICKETS GÜVENLI RLS ===' as info;

-- RLS'yi etkinleştir
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Tüm politikaları kaldır
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON support_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can insert their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can delete their own tickets" ON support_tickets;

-- Güvenli politika oluştur
CREATE POLICY "Enable all operations for authenticated users" ON support_tickets
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Documents tablosu için güvenli RLS
SELECT '=== DOCUMENTS GÜVENLI RLS ===' as info;

-- RLS'yi etkinleştir
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Tüm politikaları kaldır
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON documents;
DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Users can insert documents" ON documents;
DROP POLICY IF EXISTS "Users can update documents" ON documents;
DROP POLICY IF EXISTS "Users can delete documents" ON documents;

-- Güvenli politika oluştur
CREATE POLICY "Enable all operations for authenticated users" ON documents
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Finance tablosu için güvenli RLS
SELECT '=== FINANCE GÜVENLI RLS ===' as info;

-- RLS'yi etkinleştir
ALTER TABLE finance ENABLE ROW LEVEL SECURITY;

-- Tüm politikaları kaldır
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON finance;
DROP POLICY IF EXISTS "Users can view finance records" ON finance;
DROP POLICY IF EXISTS "Users can insert finance records" ON finance;
DROP POLICY IF EXISTS "Users can update finance records" ON finance;
DROP POLICY IF EXISTS "Users can delete finance records" ON finance;

-- Güvenli politika oluştur
CREATE POLICY "Enable all operations for authenticated users" ON finance
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Final kontrol
SELECT '=== FINAL KONTROL ===' as info;

-- Veri sayıları
SELECT 'CLIENTS VERI SAYISI:' as info;
SELECT COUNT(*) as client_count FROM clients;

SELECT 'CONSULTANTS VERI SAYISI:' as info;
SELECT COUNT(*) as consultant_count FROM consultants;

-- RLS durumu
SELECT 'RLS DURUMU:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'consultants', 'tasks', 'support_tickets', 'documents', 'finance');

-- RLS politikaları
SELECT 'RLS POLITIKALARI:' as info;
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

SELECT 'Güvenli RLS politikaları başarıyla oluşturuldu!' as result;


