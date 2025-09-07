-- Test Destek Talepleri Oluşturma
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Test destek talepleri ekle
INSERT INTO support_tickets (title, description, status, priority, user_id, admin_response)
VALUES 
(
  'belge yüklenmiyor',
  'hızlı aksiyon alalım lütfen',
  'open',
  'high',
  1,
  NULL
),
(
  'Sistem yavaş çalışıyor',
  'Sayfalar çok yavaş yükleniyor, yardım eder misiniz?',
  'in_progress',
  'medium',
  1,
  'Sorunu inceliyoruz, yakında çözülecek.'
),
(
  'Şifremi unuttum',
  'Giriş yapamıyorum, şifremi sıfırlayabilir misiniz?',
  'resolved',
  'urgent',
  1,
  'Yeni şifreniz e-posta adresinize gönderildi.'
),
(
  'Rapor oluşturma sorunu',
  'Raporlar sayfasında hata alıyorum',
  'closed',
  'low',
  1,
  'Sorun çözüldü, artık raporlarınızı oluşturabilirsiniz.'
);

-- Mevcut destek taleplerini kontrol et
SELECT 
  id,
  title,
  description,
  status,
  priority,
  user_id,
  admin_response,
  created_at,
  updated_at
FROM support_tickets 
ORDER BY created_at DESC;

-- Başarı mesajı
SELECT 'Test destek talepleri başarıyla oluşturuldu!' AS status;
