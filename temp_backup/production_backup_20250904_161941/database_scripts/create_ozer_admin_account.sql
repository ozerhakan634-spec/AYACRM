-- Özer için Tam Yetkili Admin Hesabı Oluşturma
-- Bu hesap tüm CRM özelliklerine erişim sağlar

-- 1. Önce mevcut durumu kontrol et
SELECT 
    'MEVCUT DURUM:' as baslik,
    COUNT(*) as toplam_kullanici,
    COUNT(CASE WHEN (permissions->>'settings')::boolean = true THEN 1 END) as admin_sayisi
FROM consultants;

-- 2. Özer admin hesabı oluştur
DO $$
DECLARE
    ozer_exists INTEGER;
    ozer_password TEXT := 'OzerAdmin2024!'; -- GÜÇLÜ ŞİFRE!
    hashed_password TEXT;
BEGIN
    -- Özer hesabının varlığını kontrol et
    SELECT COUNT(*) INTO ozer_exists 
    FROM consultants 
    WHERE email = 'ozerhakan634@gmail.com' OR username = 'ozer';
    
    IF ozer_exists = 0 THEN
        -- Şifreyi hash'le
        hashed_password := encode(digest(ozer_password || 'vize_crm_salt_2024', 'sha256'), 'hex');
        
        -- Özer admin kullanıcısı oluştur
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
            'Özer Hakan - Sistem Yöneticisi',
            'ozer',
            'ozerhakan634@gmail.com',
            hashed_password,
            ozer_password,
            true,
            'active',
            'Yönetim',
            'Genel Müdür',
            '{
                "dashboard": true,
                "clients": true,
                "documents": true,
                "tasks": true,
                "calendar": true,
                "reports": true,
                "finance": true,
                "consultants": true,
                "chatbot": true,
                "support": true,
                "settings": true
            }'::jsonb,
            NOW()
        );
        
        RAISE NOTICE '✅ Özer admin hesabı başarıyla oluşturuldu!';
        RAISE NOTICE '📧 E-posta: ozerhakan634@gmail.com';
        RAISE NOTICE '👤 Kullanıcı Adı: ozer';
        RAISE NOTICE '🔑 Şifre: %', ozer_password;
        RAISE NOTICE '⚠️  ÖNEMLİ: Bu şifreyi güvenli bir yerde saklayın!';
    ELSE
        RAISE NOTICE '❌ Özer hesabı zaten mevcut!';
    END IF;
END $$;

-- 3. Oluşturulan hesabı kontrol et
SELECT 
    'ÖZER HESABI KONTROL:' as baslik,
    id,
    name,
    username,
    email,
    department,
    position,
    status,
    permissions,
    created_at
FROM consultants 
WHERE email = 'ozerhakan634@gmail.com' OR username = 'ozer';

-- 4. Tüm admin kullanıcıları listele
SELECT 
    'TÜM ADMİN KULLANICILAR:' as baslik,
    id,
    name,
    username,
    email,
    CASE 
        WHEN (permissions->>'settings')::boolean = true THEN '✅ ADMIN'
        ELSE '❌ NORMAL'
    END as admin_durumu,
    created_at
FROM consultants 
WHERE (permissions->>'settings')::boolean = true
ORDER BY created_at;

-- 5. Güvenlik önerileri
SELECT 
    '🔒 GÜVENLİK ÖNERİLERİ:' as baslik,
    '1. Şifrenizi kimseyle paylaşmayın' as oneri_1,
    '2. Düzenli olarak şifre değiştirin' as oneri_2,
    '3. Hesabınızı sadece güvenli cihazlardan kullanın' as oneri_3,
    '4. Şüpheli aktivite durumunda hemen şifre değiştirin' as oneri_4;
