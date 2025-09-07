-- Production ortamında clients tablosunu test et
-- Bu scripti Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. Mevcut clients sayısını kontrol et
SELECT COUNT(*) as total_clients FROM clients;

-- 2. İlk 5 client'ı listele
SELECT id, name, email, consultant_id FROM clients LIMIT 5;

-- 3. RLS durumunu kontrol et
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'clients';

-- 4. Mevcut RLS politikalarını listele
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'clients';

-- 5. Consultants tablosunu da kontrol et
SELECT COUNT(*) as total_consultants FROM consultants;
SELECT id, name, email FROM consultants LIMIT 5;
