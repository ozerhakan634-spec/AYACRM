-- Consultants Tablosu RLS Politikası Düzeltmesi
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Mevcut RLS politikalarını temizle
DROP POLICY IF EXISTS "Users can view their own consultant profile" ON consultants;
DROP POLICY IF EXISTS "Users can update their own consultant profile" ON consultants;
DROP POLICY IF EXISTS "Admins can view all consultants" ON consultants;
DROP POLICY IF EXISTS "Admins can update all consultants" ON consultants;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON consultants;

-- 2. RLS'yi geçici olarak devre dışı bırak (test için)
ALTER TABLE consultants DISABLE ROW LEVEL SECURITY;

-- 3. Alternatif olarak, geniş RLS politikaları oluştur
-- Tüm authenticated kullanıcılar için erişim
CREATE POLICY "Enable all operations for authenticated users" ON consultants
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Consultants tablosunun yapısını kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'consultants' 
ORDER BY ordinal_position;

-- 5. Mevcut danışmanları kontrol et
SELECT 
  id,
  name,
  email,
  created_at
FROM consultants 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. RLS durumunu kontrol et
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'consultants' 
  AND schemaname = 'public';

-- 7. Mevcut politikaları kontrol et
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
WHERE tablename = 'consultants' 
  AND schemaname = 'public';

-- 8. Başarı mesajı
SELECT 'Consultants tablosu RLS politikaları düzeltildi!' AS status;
