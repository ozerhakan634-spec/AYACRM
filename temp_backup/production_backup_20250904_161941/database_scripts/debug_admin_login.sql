-- Admin login debug
-- Bu dosya admin kullanıcısının durumunu detaylıca kontrol eder

-- 1. Admin kullanıcısını tam detayıyla kontrol et
SELECT 
    'ADMİN KULLANICI DURUMU:' as baslik,
    id,
    name,
    username,
    email,
    password as stored_password_hash,
    plain_password,
    has_credentials,
    status,
    department,
    position,
    permissions,
    created_at
FROM consultants 
WHERE username = 'admin';

-- 2. Hash algoritması testi
SELECT 
    'HASH ALGORİTMA TESTİ:' as baslik,
    'JavaScript ile aynı olmalı' as aciklama,
    encode(sha256(('123456' || 'vize_crm_salt_2024')::bytea), 'hex') as calculated_hash;

-- 3. Tüm consultants'ları listele (admin var mı kontrol)
SELECT 
    'TÜM KULLANICILAR:' as baslik,
    id,
    name,
    username,
    has_credentials,
    status
FROM consultants 
ORDER BY created_at;

-- 4. Permissions kontrolü
SELECT 
    'ADMİN YETKİLERİ:' as baslik,
    username,
    permissions
FROM consultants 
WHERE username = 'admin';

-- 5. Authentication şartlarını kontrol et
SELECT 
    'AUTH ŞARTLARI:' as baslik,
    username,
    CASE WHEN username = 'admin' THEN '✅' ELSE '❌' END as username_ok,
    CASE WHEN has_credentials = true THEN '✅' ELSE '❌' END as has_credentials_ok,
    CASE WHEN status = 'active' THEN '✅' ELSE '❌' END as status_ok,
    CASE 
        WHEN username = 'admin' AND has_credentials = true AND status = 'active' 
        THEN '✅ TÜM ŞARTLAR TAMAM' 
        ELSE '❌ SORUN VAR' 
    END as genel_durum
FROM consultants 
WHERE username = 'admin';
