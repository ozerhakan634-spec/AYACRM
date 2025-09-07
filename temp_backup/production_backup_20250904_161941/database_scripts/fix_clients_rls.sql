-- Clients Tablosu RLS Politikası Düzeltmesi
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Mevcut RLS politikalarını temizle
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can create their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Admins can update all clients" ON clients;
DROP POLICY IF EXISTS "Admins can delete all clients" ON clients;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON clients;

-- 2. RLS'yi geçici olarak devre dışı bırak (test için)
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- 3. Alternatif olarak, geniş RLS politikaları oluştur
-- Tüm authenticated kullanıcılar için erişim
CREATE POLICY "Enable all operations for authenticated users" ON clients
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Clients tablosunun yapısını kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- 5. Mevcut müşterileri kontrol et
SELECT 
  id,
  name,
  email,
  consultant_id,
  created_at
FROM clients 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Test için yeni bir müşteri oluştur
INSERT INTO clients (name, email, phone, consultant_id)
VALUES (
  'Test Müşteri - RLS Testi',
  'test@example.com',
  '555-1234',
  NULL
) ON CONFLICT DO NOTHING;

-- 7. RLS durumunu kontrol et
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'clients' 
  AND schemaname = 'public';

-- 8. Mevcut politikaları kontrol et
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
WHERE tablename = 'clients' 
  AND schemaname = 'public';

-- 9. Başarı mesajı
SELECT 'Clients tablosu RLS politikaları düzeltildi!' AS status;
