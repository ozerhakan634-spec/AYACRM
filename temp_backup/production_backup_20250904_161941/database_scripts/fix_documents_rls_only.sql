-- Documents Tablosu RLS Politikalarını Düzeltme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Önce mevcut politikaları temizle
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON documents;

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

-- RLS'nin aktif olduğundan emin ol
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Test için basit bir politika (geliştirme aşamasında)
-- Bu politika tüm işlemlere izin verir (sadece test için)
-- CREATE POLICY "Allow all operations" ON documents FOR ALL USING (true);
