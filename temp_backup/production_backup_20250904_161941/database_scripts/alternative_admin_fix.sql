-- Alternatif Admin Düzeltmesi
-- Hash algoritması sorununu çözmek için farklı yaklaşım

-- Önce mevcut admin'i kontrol et
SELECT * FROM consultants WHERE username = 'admin';

-- Admin'i sil ve yeniden oluştur (farklı hash yöntemi)
DELETE FROM consultants WHERE username = 'admin';

-- MD5 hash ile dene (bazı sistemlerde bu kullanılır)
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
    md5('123456' || 'vize_crm_salt_2024'),
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
    'ALTERNATİF HASH İLE OLUŞTURULAN ADMİN:' as mesaj,
    id,
    name,
    username,
    password as hash_value,
    plain_password,
    has_credentials,
    status
FROM consultants 
WHERE username = 'admin';

-- Hash testleri
SELECT 
    'HASH TEST SONUÇLARI:' as baslik,
    md5('123456' || 'vize_crm_salt_2024') as md5_hash,
    encode(sha256(('123456' || 'vize_crm_salt_2024')::bytea), 'hex') as sha256_hash;
