-- Basit Admin Düzeltmesi
-- Bu dosya admin kullanıcısını basit şifre ile oluşturur

-- Mevcut admin'i sil
DELETE FROM consultants WHERE username = 'admin';

-- Yeni admin oluştur (basit şifre: 123456)
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
    encode(sha256(('123456' || 'vize_crm_salt_2024')::bytea), 'hex'),
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
    'YENİ ADMİN BİLGİLERİ:' as mesaj,
    name,
    username,
    'Şifre: 123456' as sifre,
    status,
    has_credentials
FROM consultants 
WHERE username = 'admin';
