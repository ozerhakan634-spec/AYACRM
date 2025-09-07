-- Documents Tablosu RLS Politikalarını Düzeltme (Storage olmadan)
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Önce mevcut politikaları temizle
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON documents;

-- 2. Documents tablosu için yeni politikalar
-- Tüm işlemler için genel politika (authenticated kullanıcılar için)
CREATE POLICY "Enable all operations for authenticated users" ON documents
FOR ALL USING (auth.role() = 'authenticated');

-- Alternatif olarak, ayrı ayrı politikalar:
-- Okuma izni
CREATE POLICY "Enable read access for authenticated users" ON documents
FOR SELECT USING (auth.role() = 'authenticated');

-- Yazma izni
CREATE POLICY "Enable insert access for authenticated users" ON documents
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Güncelleme izni
CREATE POLICY "Enable update access for authenticated users" ON documents
FOR UPDATE USING (auth.role() = 'authenticated');

-- Silme izni
CREATE POLICY "Enable delete access for authenticated users" ON documents
FOR DELETE USING (auth.role() = 'authenticated');

-- 3. RLS'nin aktif olduğundan emin ol
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 4. Mevcut politikaları kontrol et
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
WHERE tablename = 'documents' 
  AND schemaname = 'public';

-- 5. RLS durumunu kontrol et
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'documents' 
  AND schemaname = 'public';

-- 6. Başarı mesajı
SELECT 'Documents tablosu RLS politikaları başarıyla güncellendi!' AS status;
