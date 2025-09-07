-- Admin şifresini düzelt
-- Bu dosya admin kullanıcısının şifresini doğru hash ile güncelleyecek

-- Önce mevcut admin kullanıcısını kontrol et
SELECT 
    id,
    name,
    username,
    password,
    plain_password,
    has_credentials
FROM consultants 
WHERE username = 'admin';

-- Admin şifresini güncelle (JavaScript ile aynı hash algoritmasını kullan)
UPDATE consultants 
SET 
    password = encode(sha256(('Admin123!' || 'vize_crm_salt_2024')::bytea), 'hex'),
    plain_password = 'Admin123!',
    has_credentials = true,
    status = 'active'
WHERE username = 'admin';

-- Güncellenmiş kullanıcıyı kontrol et
SELECT 
    'Admin kullanıcısı güncellendi:' as mesaj,
    id,
    name,
    username,
    has_credentials,
    status
FROM consultants 
WHERE username = 'admin';

-- Test için hash'i kontrol et
SELECT 
    'Hash kontrol:' as mesaj,
    username,
    password as stored_hash,
    encode(sha256(('Admin123!' || 'vize_crm_salt_2024')::bytea), 'hex') as calculated_hash,
    CASE 
        WHEN password = encode(sha256(('Admin123!' || 'vize_crm_salt_2024')::bytea), 'hex') 
        THEN 'EŞLEŞIYOR ✅' 
        ELSE 'EŞLEŞMIYOR ❌' 
    END as hash_durumu
FROM consultants 
WHERE username = 'admin';
