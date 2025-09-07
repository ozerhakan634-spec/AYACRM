-- Test destek talebi oluştur
-- Bu script test amaçlı destek talebi oluşturur

-- 1. Test destek talebi oluştur
INSERT INTO support_tickets (
    user_id,
    name,
    email,
    subject,
    message,
    priority,
    category,
    status,
    created_at
) VALUES (
    1, -- Test user_id
    'Test Müşteri',
    'test@example.com',
    'Test Destek Talebi',
    'Bu bir test destek talebidir. Sistem çalışıyor mu kontrol etmek için oluşturuldu.',
    'medium',
    'general',
    'open',
    NOW()
);

-- 2. Oluşturulan talebi kontrol et
SELECT 
    'TEST TALEBİ OLUŞTURULDU:' as baslik,
    id,
    subject,
    name,
    email,
    status,
    priority,
    created_at
FROM support_tickets 
WHERE subject = 'Test Destek Talebi'
ORDER BY created_at DESC;

-- 3. Tüm destek taleplerini listele
SELECT 
    'TÜM TALEPLER:' as baslik,
    COUNT(*) as toplam_talep
FROM support_tickets;
