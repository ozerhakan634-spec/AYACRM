-- Doğru Hash Algoritması ile Admin Düzeltmesi
-- JavaScript crypto.subtle.digest ile aynı sonucu üretir

-- Mevcut admin'i sil
DELETE FROM consultants WHERE username = 'admin';

-- JavaScript ile uyumlu hash oluştur
-- JavaScript: password + 'vize_crm_salt_2024' -> SHA-256 -> hex
INSERT INTO consultants (
    name,
    username,
    email,
    password,
    plain_password,
    has_credentials,
    status,
    department,
    position,
    permissions,
    created_at
) VALUES (
    'Sistem Yöneticisi',
    'admin',
    'admin@vizecrm.com',
    encode(digest('123456vize_crm_salt_2024', 'sha256'), 'hex'),
    '123456',
    true,
    'active',
    'Yönetim',
    'Sistem Yöneticisi',
    '{
        "dashboard": true,
        "clients": true,
        "documents": true,
        "calendar": true,
        "reports": true,
        "finance": true,
        "consultants": true,
        "settings": true
    }'::jsonb,
    NOW()
);

-- Sonucu kontrol et
SELECT 
    'JAVASCRIPT UYUMLU HASH İLE OLUŞTURULAN ADMİN:' as mesaj,
    id,
    name,
    username,
    password as stored_hash,
    plain_password,
    has_credentials,
    status
FROM consultants 
WHERE username = 'admin';

-- Hash doğrulaması (JavaScript ile aynı olmalı)
SELECT 
    'HASH DOĞRULAMA:' as baslik,
    encode(digest('123456vize_crm_salt_2024', 'sha256'), 'hex') as calculated_hash,
    'Bu hash JavaScript hashPassword fonksiyonu ile aynı olmalı' as aciklama;
