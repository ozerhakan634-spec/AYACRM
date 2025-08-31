-- AYA JOURNEY KULLANICILARI İÇİN HIZLI ÇÖZÜM
-- Eğer TeamManagement sayfasından ekleyemezseniz bu SQL'i çalıştırın

-- Önce mevcut kullanıcıları silin (varsa)
DELETE FROM consultants WHERE username IN ('ayajourney', 'ayauzman', 'ayafinans');

-- Yeni kullanıcıları ekleyin (şifresiz)
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
) VALUES 
(
    'Aya Journey Yöneticisi',
    'yonetici@ayajourney.com',
    '+90 212 555 7001',
    'Genel Yönetim',
    'Sistem Yöneticisi',
    'active',
    'ayajourney',
    false,
    '{"dashboard": true, "clients": true, "documents": true, "calendar": true, "reports": true, "finance": true, "consultants": true, "settings": true}',
    NOW(),
    NOW()
),
(
    'Aya Journey Uzmanı',
    'uzman@ayajourney.com',
    '+90 212 555 7002',
    'Vize Danışmanlığı',
    'Vize Uzmanı',
    'active',
    'ayauzman',
    false,
    '{"dashboard": true, "clients": true, "documents": true, "calendar": true, "reports": false, "finance": false, "consultants": false, "settings": false}',
    NOW(),
    NOW()
),
(
    'Aya Journey Muhasebe',
    'muhasebe@ayajourney.com',
    '+90 212 555 7003',
    'Finans',
    'Muhasebe Uzmanı',
    'active',
    'ayafinans',
    false,
    '{"dashboard": true, "clients": true, "documents": false, "calendar": false, "reports": true, "finance": true, "consultants": false, "settings": false}',
    NOW(),
    NOW()
);

-- Kontrol et
SELECT name, username, email, has_credentials FROM consultants WHERE username LIKE 'aya%';
