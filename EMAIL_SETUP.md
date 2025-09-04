# 📧 E-posta Bildirim Sistemi Kurulum Rehberi

## 🎯 Amaç
Müşterilerin destek talepleri gönderdiğinde size otomatik olarak e-posta bildirimi gelmesi için sistem kurulumu.

## 📋 Gerekli Adımlar

### 1. Gmail App Password Oluşturma

1. **Gmail hesabınıza giriş yapın**
2. **Google Hesap ayarlarına gidin**: https://myaccount.google.com/
3. **Güvenlik** sekmesine tıklayın
4. **2 Adımlı Doğrulama**'yı etkinleştirin
5. **Uygulama Şifreleri**'ne gidin
6. **"Diğer"** seçeneğini seçin ve bir isim verin (örn: "CRM Destek Sistemi")
7. **Oluşturulan 16 haneli şifreyi kaydedin**

### 2. Supabase Edge Functions Kurulumu

#### Supabase CLI Kurulumu
```bash
npm install -g supabase
```

#### Proje Bağlama
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_ID
```

#### Edge Functions Deploy Etme
```bash
# E-posta fonksiyonlarını deploy et
supabase functions deploy send-support-notification
supabase functions deploy send-customer-notification
```

### 3. Environment Değişkenleri Ayarlama

Supabase Dashboard'da **Settings > Edge Functions** bölümünde şu değişkenleri ekleyin:

```env
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password
ADMIN_EMAIL=admin@yourcompany.com
CRM_URL=https://your-crm-domain.com
```

### 4. Test Etme

1. **Destek talebi oluşturun**
2. **E-posta bildiriminin geldiğini kontrol edin**
3. **Admin yanıtı verin**
4. **Müşteriye bildirimin gittiğini kontrol edin**

## 🔧 Sorun Giderme

### E-posta Gönderilmiyor
- Gmail App Password'ün doğru olduğunu kontrol edin
- 2 Adımlı Doğrulama'nın etkin olduğunu kontrol edin
- Environment değişkenlerinin doğru ayarlandığını kontrol edin

### Edge Function Hatası
- Supabase CLI'nın güncel olduğunu kontrol edin
- Proje ID'sinin doğru olduğunu kontrol edin
- Function'ların başarıyla deploy edildiğini kontrol edin

## 📧 E-posta Şablonları

### Admin Bildirimi
- **Konu**: 🔔 Yeni Destek Talebi: [Konu]
- **İçerik**: Talep detayları, öncelik, gönderen bilgileri
- **Buton**: Destek Talebini Görüntüle

### Müşteri Bildirimi
- **Konu**: ✅ Destek Talebinize Yanıt: [Konu]
- **İçerik**: Admin yanıtı, durum güncellemesi
- **Buton**: Destek Taleplerimi Görüntüle

## 🚀 Avantajlar

✅ **Anında Bildirim**: Müşteri talep gönderir göndermez e-posta alırsınız
✅ **Profesyonel Görünüm**: HTML formatında güzel e-postalar
✅ **Kolay Erişim**: E-posta içindeki butonla direkt CRM'e gidebilirsiniz
✅ **Müşteri Memnuniyeti**: Müşteriler yanıtlarını e-posta ile alır
✅ **Durum Takibi**: Durum değişikliklerinde otomatik bildirim

## 📞 Destek

Kurulum sırasında sorun yaşarsanız:
- Supabase dokümantasyonunu kontrol edin
- Gmail güvenlik ayarlarını gözden geçirin
- Environment değişkenlerini tekrar kontrol edin
