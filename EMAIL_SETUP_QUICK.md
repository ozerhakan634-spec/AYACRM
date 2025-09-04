# 🚀 CRM'e Girmeden E-posta Ayarları Yapma Rehberi

## 📧 **Yöntem 1: Tarayıcı Console'dan (En Hızlı)**

### 🎯 **Adım 1: CRM'e Giriş Yapın**
1. **Tarayıcıda** CRM adresinize gidin
2. **Admin hesabınızla** giriş yapın
3. **F12** tuşuna basın (Developer Tools açılır)

### 🎯 **Adım 2: Console'a Kod Yazın**
Console sekmesine şu kodu yazın:

```javascript
// EmailJS ayarlarınızı buraya yazın
const emailSettings = {
  serviceId: 'service_abc123', // EmailJS Service ID'niz
  templateId: 'template_xyz789', // EmailJS Template ID'niz  
  publicKey: 'public_key_123', // EmailJS Public Key'iniz
  adminEmail: 'your-email@gmail.com' // Kişisel e-posta adresiniz
};

// Ayarları kaydet
localStorage.setItem('emailjs_settings', JSON.stringify(emailSettings));

// Başarı mesajı
console.log('✅ E-posta ayarları başarıyla kaydedildi!');
console.log('📧 Artık destek talepleri', emailSettings.adminEmail, 'adresine gelecek');
```

### 🎯 **Adım 3: Test Edin**
Console'a şu kodu yazın:

```javascript
// Test e-postası gönder
const testData = {
  subject: 'Test Destek Talebi',
  name: 'Test Müşteri',
  email: 'test@example.com',
  message: 'Bu bir test mesajıdır. E-posta bildirim sistemi çalışıyor!',
  priority: 'medium',
  created_at: new Date().toISOString()
};

// Test gönder
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
}).then(response => response.json())
  .then(data => console.log('Test sonucu:', data));
```

---

## 📧 **Yöntem 2: URL Parametresi ile (Gelişmiş)**

### 🎯 **Adım 1: URL Oluşturun**
CRM adresinizin sonuna şu parametreleri ekleyin:

```
https://your-crm.com/dashboard/settings?emailjs_service=service_abc123&emailjs_template=template_xyz789&emailjs_key=public_key_123&admin_email=your-email@gmail.com
```

### 🎯 **Adım 2: Sayfayı Açın**
Bu URL'yi tarayıcıda açın, ayarlar otomatik olarak yüklenecek.

---

## 📧 **Yöntem 3: Bookmark ile (En Pratik)**

### 🎯 **Adım 1: Bookmark Oluşturun**
1. **Yeni bookmark** oluşturun
2. **Adı**: "CRM Email Setup"
3. **URL**: Aşağıdaki kodu kullanın

```javascript
javascript:(function(){
  const settings = {
    serviceId: 'service_abc123',
    templateId: 'template_xyz789', 
    publicKey: 'public_key_123',
    adminEmail: 'your-email@gmail.com'
  };
  localStorage.setItem('emailjs_settings', JSON.stringify(settings));
  alert('✅ E-posta ayarları kaydedildi!');
})();
```

### 🎯 **Adım 2: Kullanın**
CRM'deyken bu bookmark'a tıklayın, ayarlar otomatik kaydedilir.

---

## 📧 **Yöntem 4: Browser Extension (En Profesyonel)**

### 🎯 **Adım 1: Extension Oluşturun**
`manifest.json` dosyası:

```json
{
  "manifest_version": 2,
  "name": "CRM Email Setup",
  "version": "1.0",
  "permissions": ["activeTab", "storage"],
  "browser_action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [{
    "matches": ["*://your-crm.com/*"],
    "js": ["content.js"]
  }]
}
```

### 🎯 **Adım 2: Popup Oluşturun**
`popup.html` dosyası:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { width: 300px; padding: 20px; }
    input { width: 100%; margin: 5px 0; }
    button { width: 100%; margin-top: 10px; }
  </style>
</head>
<body>
  <h3>CRM E-posta Ayarları</h3>
  <input type="text" id="serviceId" placeholder="Service ID">
  <input type="text" id="templateId" placeholder="Template ID">
  <input type="text" id="publicKey" placeholder="Public Key">
  <input type="email" id="adminEmail" placeholder="Admin Email">
  <button onclick="saveSettings()">Kaydet</button>
  
  <script>
    function saveSettings() {
      const settings = {
        serviceId: document.getElementById('serviceId').value,
        templateId: document.getElementById('templateId').value,
        publicKey: document.getElementById('publicKey').value,
        adminEmail: document.getElementById('adminEmail').value
      };
      
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.executeScript(tabs[0].id, {
          code: `
            localStorage.setItem('emailjs_settings', '${JSON.stringify(settings)}');
            alert('✅ E-posta ayarları kaydedildi!');
          `
        });
      });
    }
  </script>
</body>
</html>
```

---

## 🎯 **En Pratik Çözüm: Yöntem 1**

**Console yöntemi** en hızlı ve güvenilir olanı. Sadece:

1. **CRM'e giriş yapın**
2. **F12** tuşuna basın
3. **Console'a** ayarlarınızı yazın
4. **Enter** tuşuna basın

**Bu kadar!** Artık destek talepleri e-posta adresinize gelecek.

---

## 📋 **EmailJS Bilgilerinizi Hazırlayın**

Ayarları yapmadan önce şunları hazırlayın:

- ✅ **Service ID**: `service_abc123` (EmailJS Dashboard'dan)
- ✅ **Template ID**: `template_xyz789` (EmailJS Dashboard'dan)  
- ✅ **Public Key**: `public_key_123` (EmailJS Dashboard'dan)
- ✅ **Kişisel E-posta**: `your-email@gmail.com`

---

## 🔍 **Ayarları Kontrol Etme**

Console'a şu kodu yazarak ayarları kontrol edebilirsiniz:

```javascript
const settings = JSON.parse(localStorage.getItem('emailjs_settings'));
console.log('📧 Mevcut ayarlar:', settings);
```

**Bu yöntemlerle CRM'e girmeden e-posta ayarlarınızı yapabilirsiniz!** 🎉
