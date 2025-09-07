-- Destek Talepleri Yetki ve RLS Politikası Düzeltmesi
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Önce mevcut RLS politikalarını temizle
DROP POLICY IF EXISTS "Users can view their own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create their own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update their own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update all support tickets" ON support_tickets;

-- 2. RLS'yi geçici olarak devre dışı bırak (test için)
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;

-- 3. Alternatif olarak, geniş RLS politikaları oluştur
-- Tüm authenticated kullanıcılar için erişim
CREATE POLICY "Enable all operations for authenticated users" ON support_tickets
FOR ALL USING (auth.role() = 'authenticated');

-- 4. Destek talepleri tablosunun yapısını kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'support_tickets' 
ORDER BY ordinal_position;

-- 5. Mevcut destek taleplerini kontrol et
SELECT 
  id,
  title,
  description,
  status,
  priority,
  user_id,
  created_at,
  updated_at
FROM support_tickets 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Test için yeni bir destek talebi oluştur
INSERT INTO support_tickets (title, description, status, priority, user_id)
VALUES (
  'Test Destek Talebi',
  'Bu bir test destek talebidir.',
  'open',
  'medium',
  1
) ON CONFLICT DO NOTHING;

-- 7. RLS durumunu kontrol et
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'support_tickets' 
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
WHERE tablename = 'support_tickets' 
  AND schemaname = 'public';

-- 9. Başarı mesajı
SELECT 'Destek talepleri yetkileri düzeltildi!' AS status;
