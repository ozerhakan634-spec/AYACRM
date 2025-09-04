# EmailJS Template (İkonsuz Temiz Versiyon)

## Template İçeriği
Aşağıdaki template içeriğini kullanın (tüm ikonlar kaldırıldı):

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Yeni Destek Talebi</title>
</head>
<body style="font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            Yeni Destek Talebi Alındı
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #e74c3c; margin-top: 0;">Destek Talebi Detayları:</h3>
            
            <p style="margin: 5px 0;"><strong>Müşteri Adı:</strong> {{name}}</p>
            <p style="margin: 5px 0;"><strong>E-posta:</strong> {{email}}</p>
            <p style="margin: 5px 0;"><strong>Konu:</strong> {{subject}}</p>
            <p style="margin: 5px 0;"><strong>Öncelik:</strong> {{priority}}</p>
            <p style="margin: 5px 0;"><strong>Kategori:</strong> {{category}}</p>
            <p style="margin: 5px 0;"><strong>Tarih:</strong> {{created_at}}</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #e0e0e0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Mesaj:</h3>
            <p style="white-space: pre-wrap;">{{message}}</p>
        </div>
        
        <div style="background-color: #e6ffe6; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #c3e6cb;">
            <h3 style="color: #28a745; margin-top: 0;">Hızlı Erişim:</h3>
            <p style="margin: 5px 0;">Destek talebini görüntülemek için CRM sistemine giriş yapın:</p>
            <p style="margin: 10px 0;"><a href="https://admin.ayajourneys.com/dashboard/support-management" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">CRM Sistemine Git</a></p>
        </div>
        
        <p style="font-size: 0.9em; color: #777; text-align: center; margin-top: 30px;">Bu e-posta otomatik olarak gönderilmiştir. Lütfen bu e-postayı yanıtlamayın.</p>
    </div>
</body>
</html>
```

## Template Değişkenleri
Template'de kullanılan değişkenler:
- `{{name}}` - Müşteri adı
- `{{email}}` - Müşteri e-postası
- `{{subject}}` - Destek talebi konusu
- `{{message}}` - Destek talebi mesajı
- `{{priority}}` - Öncelik seviyesi
- `{{category}}` - Kategori
- `{{created_at}}` - Oluşturulma tarihi
- `{{admin_email}}` - Admin e-posta adresi

## Güncelleme Adımları
1. EmailJS Dashboard'a gidin: https://dashboard.emailjs.com/
2. Email Templates sekmesine gidin
3. Mevcut template'i düzenleyin
4. Eski içeriği tamamen silin
5. Yukarıdaki HTML kodunu yapıştırın
6. Save butonuna tıklayın
7. Test edin
