# Production Ortamı Kurulum Talimatları

## 🎯 **aya-crm-production Kurulumu**

### **1. Environment Variables Güncelleme**

**Supabase Dashboard'da:**
1. https://supabase.com/dashboard adresine gidin
2. **aya-crm-production** projesini seçin
3. **Settings > API** bölümüne gidin
4. **Project URL** ve **anon public** key'i kopyalayın

**Yerel dosyada:**
```bash
# .env.local dosyasını düzenleyin
VITE_SUPABASE_URL=https://aya-crm-production.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key-here
```

### **2. Database Script'ini Çalıştırın**

**Supabase Dashboard'da:**
1. **aya-crm-production** projesinde **SQL Editor**'e gidin
2. `database/fix_production_environment.sql` dosyasının içeriğini kopyalayın
3. **Run** butonuna tıklayın

### **3. Storage Bucket'larını Kontrol Edin**

**Supabase Dashboard'da:**
1. **Storage** bölümüne gidin
2. Şu bucket'ların var olduğunu kontrol edin:
   - `documents`
   - `profile-photos`
   - `company-logos`

### **4. RLS Politikalarını Kontrol Edin**

**Supabase Dashboard'da:**
1. **Authentication > Policies** bölümüne gidin
2. Tüm tablolar için RLS politikalarının aktif olduğunu kontrol edin

### **5. Test Edin**

**Yerel ortamda:**
```bash
npm run dev
```

**Test edilecek özellikler:**
- ✅ Danışman atama
- ✅ Dosya yükleme
- ✅ Müşteri ekleme/düzenleme
- ✅ Görev oluşturma

### **6. Production Build**

**Deploy için:**
```bash
npm run build
```

**Build dosyaları:**
- `dist/` klasörü production için hazır

## 🔧 **Sorun Giderme**

### **Danışman Atama Hatası (401):**
- RLS politikalarını kontrol edin
- `fix_production_environment.sql` script'ini çalıştırın

### **Dosya Yükleme Hatası:**
- Storage bucket'larını kontrol edin
- Storage RLS politikalarını kontrol edin

### **Veritabanı Bağlantı Hatası:**
- Environment variables'ları kontrol edin
- Supabase proje URL'sini kontrol edin

## 📞 **Destek**

Sorun yaşarsanız:
1. Console hatalarını kontrol edin
2. Supabase Dashboard loglarını kontrol edin
3. Environment variables'ları kontrol edin
