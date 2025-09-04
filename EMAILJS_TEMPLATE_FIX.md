# EmailJS Template Düzeltme Rehberi

## 🔧 Sorun
Şu anda gelen e-postalar çok genel içerikli:
- "A message by has been received. Kindly respond at your earliest convenience."

## ✅ Çözüm
EmailJS template'ini düzeltmek için:

### 1. EmailJS Dashboard'a Gidin
1. https://dashboard.emailjs.com/ adresine gidin
2. **Email Templates** sekmesine gidin
3. Mevcut template'i düzenleyin veya yeni template oluşturun

### 2. Template İçeriği
Aşağıdaki template içeriğini kullanın:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Yeni Destek Talebi</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            🆕 Yeni Destek Talebi Alındı
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #e74c3c; margin-top: 0;">Destek Talebi Detayları:</h3>
            
            <p><strong>👤 Müşteri Adı:</strong> {{name}}</p>
            <p><strong>📧 E-posta:</strong> {{email}}</p>
            <p><strong>📋 Konu:</strong> {{subject}}</p>
            <p><strong>🚨 Öncelik:</strong> {{priority}}</p>
            <p><strong>📂 Kategori:</strong> {{category}}</p>
            <p><strong>📅 Tarih:</strong> {{created_at}}</p>
        </div>
        
        <div style="background-color: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #2c3e50; margin-top: 0;">📝 Mesaj:</h4>
            <p style="white-space: pre-wrap;">{{message}}</p>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #27ae60; margin-top: 0;">🔗 Hızlı Erişim:</h4>
            <p>Destek talebini görüntülemek için CRM sistemine giriş yapın:</p>
            <p><a href="https://admin.ayajourneys.com/dashboard/support-management" style="color: #3498db; text-decoration: none;">📊 Destek Yönetimi Sayfası</a></p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #7f8c8d; font-size: 12px;">
            <p>Bu e-posta AYA Journey CRM sistemi tarafından otomatik olarak gönderilmiştir.</p>
            <p>📧 {{admin_email}} | 🌐 admin.ayajourneys.com</p>
        </div>
    </div>
</body>
</html>
```

### 3. Template Değişkenleri
Template'de kullanılan değişkenler:
- `{{name}}` - Müşteri adı
- `{{email}}` - Müşteri e-postası
- `{{subject}}` - Destek talebi konusu
- `{{message}}` - Destek talebi mesajı
- `{{priority}}` - Öncelik seviyesi
- `{{category}}` - Kategori
- `{{created_at}}` - Oluşturulma tarihi
- `{{admin_email}}` - Admin e-posta adresi

### 4. Template'i Güncelleyin
1. EmailJS Dashboard'da template'i açın
2. HTML içeriğini yukarıdaki kodla değiştirin
3. **Save** butonuna tıklayın

### 5. Test Edin
Template güncellendikten sonra:
1. CRM'de yeni bir destek talebi oluşturun
2. E-postanın düzgün gelip gelmediğini kontrol edin

## 🎯 Beklenen Sonuç
Artık e-postalar şu bilgileri içerecek:
- Müşteri bilgileri
- Destek talebi detayları
- Mesaj içeriği
- CRM'e hızlı erişim linki
