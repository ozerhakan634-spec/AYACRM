# 🔔 Webhook Bildirim Sistemi Kurulum Rehberi

## 🎯 Amaç
Müşterilerin destek talepleri gönderdiğinde Slack veya Discord'a otomatik bildirim gelmesi için sistem kurulumu.

## 📋 Seçenekler

### 1. Slack Webhook (Önerilen)
- ✅ Kolay kurulum
- ✅ Mobil bildirimler
- ✅ Profesyonel görünüm
- ✅ Ücretsiz

### 2. Discord Webhook
- ✅ Ücretsiz
- ✅ Güzel embed mesajlar
- ✅ Mobil uygulama
- ✅ Özelleştirilebilir

## 🔧 Slack Webhook Kurulumu

### 1. Slack Workspace'e Giriş
1. **Slack'e giriş yapın**: https://slack.com/
2. **Workspace'inizi seçin**

### 2. Webhook URL Oluşturma
1. **Apps** sekmesine gidin
2. **"Incoming Webhooks"** aratın ve ekleyin
3. **"Add to Slack"** butonuna tıklayın
4. **Kanal seçin** (örn: #destek-talepleri)
5. **"Add Incoming WebHooks integration"** butonuna tıklayın
6. **Webhook URL'yi kopyalayın**

### 3. Environment Değişkeni Ekleme
`.env` dosyasına ekleyin:
```env
REACT_APP_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## 🔧 Discord Webhook Kurulumu

### 1. Discord Sunucusuna Giriş
1. **Discord'a giriş yapın**
2. **Sunucunuzu seçin**

### 2. Webhook URL Oluşturma
1. **Kanal ayarlarına gidin** (kanal üzerinde sağ tık)
2. **"Integrations"** sekmesine tıklayın
3. **"Webhooks"** bölümüne gidin
4. **"New Webhook"** butonuna tıklayın
5. **Webhook adı verin** (örn: "CRM Destek Sistemi")
6. **"Copy Webhook URL"** butonuna tıklayın

### 3. Environment Değişkeni Ekleme
`.env` dosyasına ekleyin:
```env
REACT_APP_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL
```

## 🚀 Test Etme

### 1. Destek Talebi Oluşturun
- CRM sisteminde yeni destek talebi oluşturun
- Slack/Discord kanalında bildirimin geldiğini kontrol edin

### 2. Bildirim Özellikleri
- **Öncelik renkleri**: Acil (kırmızı), Yüksek (turuncu), Orta (sarı), Düşük (yeşil)
- **Müşteri bilgileri**: Ad, e-posta
- **Mesaj içeriği**: Talep detayları
- **Zaman damgası**: Talep oluşturulma zamanı

## 📱 Mobil Bildirimler

### Slack Mobil
1. **Slack mobil uygulamasını indirin**
2. **Workspace'inize giriş yapın**
3. **Bildirim ayarlarını yapılandırın**
4. **Destek kanalını takip edin**

### Discord Mobil
1. **Discord mobil uygulamasını indirin**
2. **Sunucunuza giriş yapın**
3. **Bildirim ayarlarını yapılandırın**
4. **Destek kanalını takip edin**

## 🎨 Özelleştirme

### Slack Mesaj Formatı
```json
{
  "text": "🔔 *Yeni Destek Talebi*",
  "attachments": [{
    "color": "#ff0000",
    "title": "Talep Konusu",
    "fields": [
      {"title": "Gönderen", "value": "Müşteri Adı", "short": true},
      {"title": "Öncelik", "value": "🔴 Acil", "short": true},
      {"title": "Mesaj", "value": "Talep içeriği..."}
    ]
  }]
}
```

### Discord Embed Formatı
```json
{
  "embeds": [{
    "title": "🔔 Yeni Destek Talebi",
    "description": "Talep konusu",
    "color": 16711680,
    "fields": [
      {"name": "Gönderen", "value": "Müşteri Adı", "inline": true},
      {"name": "Öncelik", "value": "🔴 Acil", "inline": true}
    ]
  }]
}
```

## 🔧 Sorun Giderme

### Webhook Çalışmıyor
- URL'nin doğru olduğunu kontrol edin
- Environment değişkeninin doğru ayarlandığını kontrol edin
- Webhook'un aktif olduğunu kontrol edin

### Bildirim Gelmiyor
- Kanal izinlerini kontrol edin
- Webhook URL'sinin güncel olduğunu kontrol edin
- Console'da hata mesajlarını kontrol edin

### Yanlış Kanal
- Webhook URL'sini yeniden oluşturun
- Doğru kanalı seçtiğinizden emin olun

## 🚀 Avantajlar

✅ **Anında Bildirim**: Müşteri talep gönderir göndermez bildirim alırsınız
✅ **Mobil Erişim**: Telefonunuzdan bildirimleri görebilirsiniz
✅ **Kolay Kurulum**: 5 dakikada kurulum tamamlanır
✅ **Ücretsiz**: Slack ve Discord webhook'ları ücretsizdir
✅ **Profesyonel**: Renkli ve düzenli mesajlar
✅ **Takım Çalışması**: Tüm takım üyeleri bildirimleri görebilir

## 📞 Destek

Kurulum sırasında sorun yaşarsanız:
- Webhook URL'sini tekrar kontrol edin
- Environment değişkenlerini doğru ayarladığınızdan emin olun
- Console'da hata mesajlarını kontrol edin
- Webhook'u test etmek için Postman kullanabilirsiniz
