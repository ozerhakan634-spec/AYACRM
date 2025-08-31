# 🎯 AYA JOURNEY - VİZE CRM SİSTEMİ

## 📋 MÜŞTERİ BİLGİLERİ
- **Firma Adı**: Aya Journey
- **Sektör**: Vize Danışmanlığı
- **Durum**: İlk Müşteri - Satış Tamamlandı ✅
- **Teslim Tarihi**: 2024

---

## 🔐 SİSTEM GİRİŞ BİLGİLERİ

### 👑 YÖNETİCİ HESABI ✅ HAZIR
```
Kullanıcı Adı: ayajourney
Şifre: aya2024
Yetki: Tam Yönetici
E-posta: yonetici@ayajourney.com
Durum: ✅ TEST EDİLDİ - ÇALIŞIYOR
```

### 👨‍💼 UZMAN HESABI
```
Kullanıcı Adı: ayauzman
Şifre: uzman123  
Yetki: Vize Uzmanı
E-posta: uzman@ayajourney.com
```

### 💰 MUHASEBE HESABI
```
Kullanıcı Adı: ayafinans
Şifre: finans123
Yetki: Mali İşler
E-posta: muhasebe@ayajourney.com
```

---

## 🛠️ KURULUM TALİMATLARI

### 1. VERİTABANI KURULUMU
```sql
-- Aşağıdaki SQL dosyasını çalıştırın:
psql -d veritabani_adi -f database/add_consultant_credentials.sql
psql -d veritabani_adi -f database/create_aya_journey_user.sql
```

### 2. İLK GİRİŞ
1. Sisteme `ayajourney` kullanıcısı ile giriş yapın
2. Takım Yönetimi sayfasına gidin
3. Her kullanıcının Key ikonuna tıklayarak şifreleri atayın:
   - ayajourney → aya2024
   - ayauzman → uzman123
   - ayafinans → finans123

### 3. SİSTEM AYARLARI
- Şirket bilgilerini Settings'den güncelleyin
- Logo ekleyin
- E-posta ayarlarını yapın

---

## 👥 KULLANICI YETKİLERİ

| Sayfa | Yönetici | Uzman | Muhasebe |
|-------|----------|-------|----------|
| Dashboard | ✅ | ✅ | ✅ |
| Müşteriler | ✅ | ✅ | ✅ |
| Belgeler | ✅ | ✅ | ❌ |
| Takvim | ✅ | ✅ | ❌ |
| Raporlar | ✅ | ❌ | ✅ |
| Finans | ✅ | ❌ | ✅ |
| Danışmanlar | ✅ | ❌ | ❌ |
| Ayarlar | ✅ | ❌ | ❌ |

---

## 📊 ÖRNEK VERİLER

Sistem 5 örnek müşteri ile gelir:
1. **Ahmet Yılmaz** - Amerika Turist Vizesi (Aktif)
2. **Fatma Demir** - İngiltere Öğrenci Vizesi (Bekliyor)
3. **Mehmet Kaya** - Kanada İş Vizesi (Tamamlandı)
4. **Ayşe Öztürk** - Almanya Aile Birleşimi (Aktif)
5. **Can Polat** - Avustralya Turist Vizesi (Bekliyor)

### 💰 Mali Durum
- **Toplam Gelir**: 6.500 TL
- **Tamamlanan İşlemler**: 3 adet
- **Bekleyen Ödemeler**: 2.000 TL

---

## 🚀 SİSTEM ÖZELLİKLERİ

### ✅ MEVCUT ÖZELLİKLER
- 👥 Müşteri Yönetimi
- 📄 Belge Takibi
- 📅 Randevu Sistemi
- 💰 Mali İşlemler
- 📊 Raporlama
- 👨‍💼 Personel Yönetimi
- 🔐 Kullanıcı İzinleri
- 📱 Responsive Tasarım

### 🔧 TEKNİK DETAYLAR
- **Frontend**: React.js
- **UI**: Tailwind CSS
- **Database**: PostgreSQL/Supabase
- **Authentication**: Şifreli giriş sistemi
- **Deploy**: Netlify hazır

---

## 📞 DESTEK BİLGİLERİ

### 🛠️ TEKNİK DESTEK
- Sistem kurulumu tamamlandı
- Tüm özellikler test edildi
- Production ortamında çalışmaya hazır

### 📋 TESLİM SONRASI
1. ✅ Kullanıcı hesapları oluşturuldu
2. ✅ Örnek veriler yüklendi
3. ✅ İzin sistemi yapılandırıldı
4. ✅ Database yapısı hazır
5. ⏳ Müşteri eğitimi bekliyor

---

## 🎉 BAŞARILAR!

İlk müşteriniz **Aya Journey** için Vize CRM sistemi başarıyla hazırlandı!

**Not**: Bu bilgileri güvenli bir yerde saklayın ve müşteriye teslim ederken gerekli eğitimi verin.
