-- Test Bildirimi Oluşturma
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Test bildirimleri ekle
INSERT INTO notifications (user_id, title, message, type, category, related_id, related_type)
VALUES 
(1, 'Hoş Geldiniz!', 'Sisteme başarıyla giriş yaptınız. Hoş geldiniz!', 'success', 'system', NULL, NULL),
(1, 'Yeni Görev Atandı', 'Size yeni bir görev atandı: Müşteri görüşmesi planla', 'info', 'task', 1, 'task'),
(1, 'Yeni Müşteri Atandı', 'Size yeni bir müşteri atandı: Ahmet Yılmaz', 'success', 'client', 1, 'client'),
(1, 'Destek Talebi Güncellendi', 'Destek talebinizin durumu güncellendi: İşleme Alındı', 'info', 'support', 1, 'support_ticket');

-- Mevcut bildirimleri kontrol et
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
ORDER BY created_at DESC;

-- Başarı mesajı
SELECT 'Test bildirimleri başarıyla oluşturuldu!' AS status;
