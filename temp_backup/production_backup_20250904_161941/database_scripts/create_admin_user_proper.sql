-- Gerçek Admin Kullanıcısı Oluşturma
-- Bu dosya gerçek admin hesabı oluşturmak için kullanılır

-- 1. Önce mevcut admin kullanıcıları kontrol et
SELECT 
    id, 
    name, 
    username, 
    email,
    permissions,
    has_credentials,
    status
FROM consultants 
WHERE 
    (permissions->>'settings')::boolean = true 
    OR (permissions->>'consultants')::boolean = true
    OR username = 'admin'
ORDER BY created_at;

-- 2. Eğer admin yoksa, güvenli bir admin oluştur
-- NOT: Bu şifreyi çalıştırdıktan sonra değiştirin!
DO $$
DECLARE
    admin_exists INTEGER;
    admin_password TEXT := 'Admin123!'; -- GÜÇLÜ ŞİFRE KULLANIN!
    hashed_password TEXT;
BEGIN
    -- Admin varlığını kontrol et
    SELECT COUNT(*) INTO admin_exists 
    FROM consultants 
    WHERE (permissions->>'settings')::boolean = true;
    
    IF admin_exists = 0 THEN
        -- Şifreyi hash'le (basit örnek)
        hashed_password := encode(digest(admin_password || 'vize_crm_salt_2024', 'sha256'), 'hex');
        
        -- Admin kullanıcı oluştur
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
            hashed_password,
            admin_password,
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
        
        RAISE NOTICE 'Admin kullanıcısı oluşturuldu:';
        RAISE NOTICE 'Kullanıcı Adı: admin';
        RAISE NOTICE 'Şifre: %', admin_password;
        RAISE NOTICE 'ÖNEMLİ: Bu şifreyi hemen değiştirin!';
    ELSE
        RAISE NOTICE 'Zaten % admin kullanıcısı mevcut.', admin_exists;
    END IF;
END $$;

-- 3. Son kontrol - admin kullanıcılarını listele
SELECT 
    'Admin kullanıcılar:' as mesaj,
    id, 
    name, 
    username, 
    email,
    department,
    position,
    status
FROM consultants 
WHERE (permissions->>'settings')::boolean = true;

-- 4. Güvenlik önerileri
SELECT 'GÜVENLİK ÖNERİLERİ:' as baslik,
       '1. Admin şifresini hemen değiştirin' as oneri_1,
       '2. Güçlü şifre kullanın (min 8 karakter, büyük/küçük harf, rakam, özel karakter)' as oneri_2,
       '3. Admin hesabını sadece gerekli kişilerle paylaşın' as oneri_3,
       '4. Düzenli olarak şifre değiştirin' as oneri_4;
