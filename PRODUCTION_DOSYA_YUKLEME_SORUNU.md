# Production Ortamı Dosya Yükleme Sorunu Çözümü

## 🚨 Sorun
Local'de çalışan dosya yükleme özelliği production ortamında (admin.ayajourneys.com) çalışmıyor.

## 🔍 Tespit Edilen Sorunlar

### 1. Environment Değişkenleri Eksikliği
Production ortamında Supabase environment değişkenleri Netlify'da ayarlanmamış.

### 2. 401 Unauthorized Hatası
Supabase bağlantısı production ortamında yetkilendirme hatası veriyor.

## 🛠️ Çözüm Adımları

### 1. Netlify Environment Variables Ayarlama

#### Netlify Dashboard'a Giriş:
1. [Netlify Dashboard](https://app.netlify.com) adresine gidin
2. admin.ayajourneys.com sitesini seçin
3. **Site settings** > **Environment variables** bölümüne gidin

#### Environment Variables Ekleme:
Aşağıdaki değişkenleri ekleyin:

```
Key: VITE_SUPABASE_URL
Value: https://hyxdpeeoultnxyotncdd.supabase.co

Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5eGRwZWVvdWx0bnh5b3RuY2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzQsImV4cCI6MjA1MDU0ODk3NH0.example
```

### 2. Supabase Production Ayarları

#### Storage Bucket Kontrolü:
1. [Supabase Dashboard](https://supabase.com/dashboard) adresine gidin
2. Projenizi seçin
3. **Storage** > **Buckets** bölümüne gidin
4. `documents` bucket'ının var olduğundan emin olun
5. Yoksa "New bucket" ile oluşturun:
   - Name: `documents`
   - Public: ✅ İşaretleyin

#### RLS (Row Level Security) Ayarları:
**Authentication** > **Policies** bölümünden:

```sql
-- Documents tablosu için
CREATE POLICY "Enable all operations for authenticated users" ON documents
FOR ALL USING (auth.role() = 'authenticated');

-- Storage objects için
CREATE POLICY "Enable file operations for authenticated users" ON storage.objects
FOR ALL USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
```

### 3. Netlify Redeploy

Environment variables ekledikten sonra:
1. Netlify Dashboard'da **Deploys** bölümüne gidin
2. **Trigger deploy** > **Deploy site** butonuna tıklayın
3. Deploy'in tamamlanmasını bekleyin

### 4. Test Etme

1. admin.ayajourneys.com adresine gidin
2. Giriş yapın
3. Belgeler sayfasına gidin
4. Dosya yükleme işlemini test edin
5. Browser console'da hata mesajlarını kontrol edin

## 🔧 Debug Araçları

### Console'da Kontrol Edilecekler:
```javascript
// Environment debug bilgileri
DatabaseService.debugEnvironment();

// Supabase bağlantı testi
supabase.from('documents').select('count').limit(1);
```

### Beklenen Console Çıktısı:
```
🔍 Environment Debug Bilgileri: {
  isProduction: true,
  environment: "production",
  hostname: "admin.ayajourneys.com",
  supabaseUrl: "Mevcut",
  supabaseAnonKey: "Mevcut",
  supabaseUrlLength: 45,
  supabaseAnonKeyLength: 255
}
```

## 🚨 Hata Kodları ve Çözümleri

### "Production ortamında environment değişkenleri eksik"
- **Çözüm:** Netlify Environment Variables'ı kontrol edin

### "401 Unauthorized"
- **Çözüm:** Supabase API anahtarının doğru olduğundan emin olun

### "Storage bucket bulunamadı"
- **Çözüm:** Supabase Dashboard'da documents bucket'ını oluşturun

### "RLS policy violation"
- **Çözüm:** Supabase RLS policies'leri kontrol edin

## 📞 Acil Durum Kontrolleri

### 1. Netlify Environment Variables:
- Site settings > Environment variables
- VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY mevcut mu?

### 2. Supabase Projesi:
- Proje aktif mi?
- API anahtarları doğru mu?
- Storage bucket'ları oluşturulmuş mu?

### 3. DNS ve Domain:
- admin.ayajourneys.com doğru Netlify sitesine yönlendiriliyor mu?
- SSL sertifikası aktif mi?

## 🔄 Deploy Sonrası Kontroller

1. **Environment Variables**: Netlify'da doğru ayarlandı mı?
2. **Supabase Bağlantısı**: Console'da hata var mı?
3. **Storage Bucket**: Supabase'de documents bucket'ı var mı?
4. **RLS Policies**: Dosya yükleme izinleri var mı?

## 📋 Checklist

- [ ] Netlify Environment Variables eklendi
- [ ] Supabase documents bucket oluşturuldu
- [ ] RLS policies ayarlandı
- [ ] Netlify redeploy yapıldı
- [ ] Production'da test edildi
- [ ] Console'da hata yok
- [ ] Dosya yükleme çalışıyor

## 🆘 Sorun Devam Ederse

1. **Netlify Logs**: Site settings > Functions > Logs
2. **Supabase Logs**: Dashboard > Logs
3. **Browser Console**: F12 > Console
4. **Network Tab**: F12 > Network (dosya yükleme sırasında)

Bu adımları takip ettikten sonra production ortamında dosya yükleme sorunu çözülecektir.
