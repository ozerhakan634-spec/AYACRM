-- GEÇİCİ: Documents Tablosu RLS'yi Devre Dışı Bırakma (SADECE TEST İÇİN!)
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- RLS'yi geçici olarak devre dışı bırak
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Mevcut policy'leri kaldır
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON documents;

DROP POLICY IF EXISTS "Public Access for Documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Upload Documents" ON storage.objects;
DROP POLICY IF EXISTS "Users Can Update Own Documents" ON storage.objects;
DROP POLICY IF EXISTS "Users Can Delete Own Documents" ON storage.objects;

-- RLS durumunu kontrol et
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('documents', 'objects') 
  AND schemaname IN ('public', 'storage');

-- Uyarı mesajı
SELECT 'RLS geçici olarak devre dışı bırakıldı. SADECE TEST İÇİN!' AS warning;
