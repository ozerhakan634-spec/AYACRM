-- Sistem Yöneticisi Hesabı Oluşturma
-- UYARI: Bu script'i çalıştırmadan önce aşağıdaki hash'lerin doğru olduğundan emin olun!

-- ÖNEMLİ: HASH HESAPLAMA
-- Şifrelerin hash'lenmesi için aşağıdaki yöntem kullanılır:
-- SHA-256(şifre + 'vize_crm_salt_2024')

-- Doğru hash'leri hesaplamak için TeamManagement sayfasında
-- bir danışmana geçici olarak şifre atayıp database'den kontrol edebilirsiniz.

-- Geçici admin kullanıcısı (hash hesaplaması için)
INSERT INTO consultants (
    name,
    email,
    phone,
    department,
    position,
    status,
    username,
    has_credentials,
    permissions,
    created_at,
    updated_at
) VALUES (
    'Sistem Yöneticisi',
    'admin@vizedanismanlik.com',
    '+90 212 555 0001',
    'Bilgi İşlem',
    'Sistem Yöneticisi',
    'active',
    'admin',
    false,
    '{"dashboard": true, "clients": true, "documents": true, "calendar": true, "reports": true, "finance": true, "consultants": true, "settings": true}',
    NOW(),
    NOW()
) ON CONFLICT (username) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- Alternatif admin hesapları için hazır komutlar (gerekirse)

-- VİZE CRM Super Admin
INSERT INTO consultants (
    name, email, phone, department, position, status,
    username, password, has_credentials, permissions, created_at, updated_at
) VALUES (
    'Vize CRM Admin',
    'superadmin@vizedanismanlik.com',
    '+90 212 555 0000',
    'Yönetim',
    'Genel Müdür',
    'active',
    'superadmin',
    -- Şifre: vize2024 (SHA-256 hash'i)
    '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    true,
    '{"dashboard": true, "clients": true, "documents": true, "calendar": true, "reports": true, "finance": true, "consultants": true, "settings": true}',
    NOW(),
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- Test Danışmanı (sınırlı izinler)
INSERT INTO consultants (
    name, email, phone, department, position, status,
    username, password, has_credentials, permissions, created_at, updated_at
) VALUES (
    'Test Danışmanı',
    'test@vizedanismanlik.com',
    '+90 212 555 9999',
    'Vize Danışmanlığı',
    'Uzman',
    'active',
    'testuser',
    -- Şifre: test123 (SHA-256 hash'i)  
    'ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae',
    true,
    '{"dashboard": true, "clients": true, "documents": false, "calendar": true, "reports": false, "finance": false, "consultants": false, "settings": false}',
    NOW(),
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- Veritabanı güncellemelerini kontrol et
SELECT 
    name,
    username,
    email,
    department,
    position,
    status,
    has_credentials,
    permissions
FROM consultants 
WHERE username IN ('admin', 'superadmin', 'testuser')
ORDER BY username;
