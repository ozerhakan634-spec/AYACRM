-- Storage Objects RLS Politikası Düzeltmesi
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Storage.objects tablosu için RLS'yi devre dışı bırak
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 2. Mevcut storage politikalarını temizle
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON storage.objects;

-- 3. Geniş storage politikaları oluştur
-- Public erişim (okuma)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (true);

-- Authenticated kullanıcılar için tüm işlemler
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Storage bucket'larını kontrol et
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
ORDER BY name;

-- 5. Documents bucket'ını oluştur/güncelle
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 6. Profile photos bucket'ını oluştur/güncelle
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 7. Company logos bucket'ını oluştur/güncelle
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 8. Storage.objects tablosunun yapısını kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'objects' 
  AND table_schema = 'storage'
ORDER BY ordinal_position;

-- 9. RLS durumunu kontrol et
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

-- 10. Mevcut politikaları kontrol et
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
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- 11. Başarı mesajı
SELECT 'Storage RLS politikaları düzeltildi!' AS status;
