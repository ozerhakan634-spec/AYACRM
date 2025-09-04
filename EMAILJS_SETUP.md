# 📧 EmailJS ile Kişisel E-posta Bildirimi Kurulumu

## 🎯 Amaç
Müşterilerin destek talepleri gönderdiğinde kişisel e-posta adresinize otomatik bildirim gelmesi için EmailJS kurulumu.

## 🚀 Hızlı Kurulum (5 Dakika)

### 1. EmailJS Hesabı Oluşturma
1. **EmailJS'e gidin**: https://www.emailjs.com/
2. **"Sign Up"** butonuna tıklayın
3. **Gmail hesabınızla** giriş yapın
4. **Ücretsiz planı** seçin (aylık 200 e-posta)

### 2. E-posta Servisi Ekleme
1. **Dashboard'da** "Email Services" sekmesine gidin
2. **"Add New Service"** butonuna tıklayın
3. **"Gmail"** seçin
4. **Gmail hesabınızla** bağlayın
5. **Service ID'yi** kopyalayın (örn: `service_abc123`)

### 3. E-posta Şablonu Oluşturma
1. **"Email Templates"** sekmesine gidin
2. **"Create New Template"** butonuna tıklayın
3. **Template adı**: "CRM Destek Bildirimi"
4. **Aşağıdaki HTML kodunu** yapıştırın:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Yeni Destek Talebi</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #2563eb; margin-top: 0;">🔔 Yeni Destek Talebi Alındı</h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">{{ticket_subject}}</h3>
            <p><strong>Gönderen:</strong> {{customer_name}} ({{customer_email}})</p>
            <p><strong>Öncelik:</strong> {{priority}}</p>
            <p><strong>Tarih:</strong> {{date}}</p>
        </div>
        
        <div style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p><strong>Mesaj:</strong></p>
            <p style="line-height: 1.6;">{{ticket_message}}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="{{crm_url}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Destek Talebini Görüntüle
            </a>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
            <p>Bu e-posta CRM sisteminizden otomatik olarak gönderilmiştir.</p>
        </div>
    </div>
</body>
</html>
```

5. **Template ID'yi** kopyalayın (örn: `template_xyz789`)

### 4. Public Key Alma
1. **"Account"** sekmesine gidin
2. **"API Keys"** bölümünde **Public Key'i** kopyalayın
3. **"Save"** butonuna tıklayın

### 5. Kod Ayarları
`src/services/simpleEmailService.js` dosyasında şu değerleri güncelleyin:

```javascript
// EmailJS ayarları
SERVICE_ID: 'service_abc123', // Sizin Service ID'niz
TEMPLATE_ID: 'template_xyz789', // Sizin Template ID'niz
PUBLIC_KEY: 'public_key_123', // Sizin Public Key'iniz

// Admin e-posta adresi
ADMIN_EMAIL: 'your-personal-email@gmail.com', // Kişisel e-posta adresiniz
```

## 🧪 Test Etme

### 1. Test E-postası Gönderme
```javascript
// Console'da test edin
import { SimpleEmailService } from './src/services/simpleEmailService';

const testData = {
  subject: 'Test Destek Talebi',
  name: 'Test Müşteri',
  email: 'test@example.com',
  message: 'Bu bir test mesajıdır.',
  priority: 'medium',
  created_at: new Date().toISOString()
};

SimpleEmailService.sendSupportNotification(testData);
```

### 2. CRM'de Test
1. **CRM sisteminde** yeni destek talebi oluşturun
2. **E-posta adresinizde** bildirimi kontrol edin
3. **E-posta içindeki linke** tıklayarak CRM'e gidin

## 📧 E-posta Özellikleri

### Admin Bildirimi
- **Konu**: 🔔 Yeni Destek Talebi: [Konu]
- **İçerik**: Müşteri bilgileri, öncelik, mesaj
- **Buton**: CRM'e direkt link
- **Tasarım**: Profesyonel HTML format

### Müşteri Bildirimi
- **Konu**: ✅ Destek Talebinize Yanıt: [Konu]
- **İçerik**: Admin yanıtı, orijinal talep
- **Buton**: Destek sayfasına link
- **Tasarım**: Kullanıcı dostu format

## 🔧 Sorun Giderme

### E-posta Gelmiyor
- Service ID'nin doğru olduğunu kontrol edin
- Template ID'nin doğru olduğunu kontrol edin
- Public Key'in doğru olduğunu kontrol edin
- Gmail hesabının bağlı olduğunu kontrol edin

### EmailJS Hatası
- Console'da hata mesajlarını kontrol edin
- EmailJS hesabınızın aktif olduğunu kontrol edin
- Aylık e-posta limitini kontrol edin (ücretsiz: 200)

### Template Hatası
- Template HTML'inin doğru olduğunu kontrol edin
- Değişken isimlerinin doğru olduğunu kontrol edin
- Template'in aktif olduğunu kontrol edin

## 💰 Maliyet

### Ücretsiz Plan
- **Aylık 200 e-posta** ücretsiz
- **Gmail servisi** ücretsiz
- **Temel şablonlar** ücretsiz

### Ücretli Planlar
- **Pro**: $15/ay - 1,000 e-posta
- **Business**: $50/ay - 5,000 e-posta

## 🚀 Avantajlar

✅ **Kolay Kurulum**: 5 dakikada hazır
✅ **Ücretsiz**: Aylık 200 e-posta ücretsiz
✅ **Güvenli**: Gmail ile güvenli gönderim
✅ **Profesyonel**: HTML formatında güzel e-postalar
✅ **Mobil Uyumlu**: Telefonunuzda da görüntülenir
✅ **Anında**: Müşteri talep gönderir göndermez bildirim

## 📞 Destek

Kurulum sırasında sorun yaşarsanız:
- EmailJS dokümantasyonunu kontrol edin
- Console'da hata mesajlarını kontrol edin
- Gmail hesap ayarlarını kontrol edin
- Template değişkenlerini kontrol edin
