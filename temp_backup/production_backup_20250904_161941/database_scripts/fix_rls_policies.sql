-- RLS Politikalarını Düzeltme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Önce mevcut politikaları temizle
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

-- Documents tablosu için yeni politikalar
-- Tüm işlemler için genel politika
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

-- Storage objects için politikalar
-- Dosya yükleme izni
CREATE POLICY "Enable file uploads for authenticated users" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Dosya okuma izni
CREATE POLICY "Enable file downloads for authenticated users" ON storage.objects
FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Dosya güncelleme izni
CREATE POLICY "Enable file updates for authenticated users" ON storage.objects
FOR UPDATE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Dosya silme izni
CREATE POLICY "Enable file deletions for authenticated users" ON storage.objects
FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- RLS'nin aktif olduğundan emin ol
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Test için basit bir politika (geliştirme aşamasında)
-- Bu politika tüm işlemlere izin verir (sadece test için)
-- CREATE POLICY "Allow all operations" ON documents FOR ALL USING (true);
-- CREATE POLICY "Allow all storage operations" ON storage.objects FOR ALL USING (bucket_id = 'documents');
