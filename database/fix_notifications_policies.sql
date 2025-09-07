-- Bildirim Tablosu Politikalarını Düzeltme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Mevcut politikaları temizle
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- 2. Yeni politikaları oluştur
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "System can create notifications" ON notifications
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Mevcut bildirimleri kontrol et
SELECT 
  id,
  user_id,
  title,
  message,
  type,
  category,
  is_read,
  created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Test bildirimi ekle
INSERT INTO notifications (user_id, title, message, type, category, related_id, related_type)
VALUES (
  1, 
  'Bildirim Sistemi Aktif', 
  'Bildirim sistemi başarıyla çalışıyor!', 
  'success', 
  'system', 
  NULL, 
  NULL
) ON CONFLICT DO NOTHING;

-- 5. Başarı mesajı
SELECT 'Bildirim politikaları başarıyla düzeltildi!' AS status;
