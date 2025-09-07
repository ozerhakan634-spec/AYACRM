-- Documents Tablosu ve Storage Bucket RLS Politikalarını Tam Düzeltme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Önce mevcut politikaları temizle
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON documents;

-- Storage için de mevcut politikaları temizle
DROP POLICY IF EXISTS "Enable file operations for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable file uploads for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable file downloads for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable file updates for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable file deletions for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for Documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Upload Documents" ON storage.objects;
DROP POLICY IF EXISTS "Users Can Update Own Documents" ON storage.objects;
DROP POLICY IF EXISTS "Users Can Delete Own Documents" ON storage.objects;

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

-- 3. Storage objects için kapsamlı politikalar
-- Documents bucket için genel erişim politikası
CREATE POLICY "Public Access for Documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');

-- Authenticated kullanıcılar için dosya yükleme izni
CREATE POLICY "Authenticated Users Can Upload Documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- Authenticated kullanıcılar için dosya güncelleme izni
CREATE POLICY "Users Can Update Own Documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- Authenticated kullanıcılar için dosya silme izni
CREATE POLICY "Users Can Delete Own Documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- 4. RLS'nin aktif olduğundan emin ol
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Documents bucket'ının var olduğundan emin ol
-- Eğer bucket yoksa oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Test için basit bir politika (geliştirme aşamasında kullanılabilir)
-- Bu politikalar tüm işlemlere izin verir (sadece test için)
-- CREATE POLICY "Allow all operations" ON documents FOR ALL USING (true);
-- CREATE POLICY "Allow all storage operations" ON storage.objects FOR ALL USING (bucket_id = 'documents');

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
WHERE tablename IN ('documents', 'objects') 
  AND schemaname IN ('public', 'storage');

-- 8. RLS durumunu kontrol et
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('documents', 'objects') 
  AND schemaname IN ('public', 'storage');

-- 9. Başarı mesajı
SELECT 'RLS politikaları başarıyla güncellendi!' AS status;
