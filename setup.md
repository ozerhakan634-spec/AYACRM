# 🚀 Hızlı Kurulum - Dosya Yükleme Sorunu Çözümü

## ⚡ 5 Dakikada Çözüm

### 1️⃣ Environment Dosyası Oluşturun
Proje kök dizininde `.env.local` dosyası oluşturun:

```bash
# Windows PowerShell
New-Item -Path ".env.local" -ItemType File

# Windows CMD
type nul > .env.local

# Linux/Mac
touch .env.local
```

### 2️⃣ Supabase Bilgilerini Ekleyin
`.env.local` dosyasına şunları ekleyin:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Bu bilgileri almak için:**
- [Supabase Dashboard](https://supabase.com/dashboard) → Proje → Settings → API

### 3️⃣ Storage Bucket Oluşturun
Supabase Dashboard'da:
- **Storage** → **New Bucket**
- Bucket adı: `documents`
- **Public** işaretleyin
- **Create bucket**

### 4️⃣ Veritabanı Şemasını Çalıştırın
Supabase Dashboard'da:
- **SQL Editor** → **New query**
- `database/schema.sql` içeriğini kopyalayın
- **Run** butonuna tıklayın

### 5️⃣ Test Edin
```bash
npm run dev
```

Belgeler sayfasına gidin → **🧪 Dosya Yükleme Testi** → Bir dosya seçin → **Test Et**

## 🔍 Hata Kontrolü

### Console'da Hata Görürseniz:
1. **F12** tuşuna basın
2. **Console** sekmesine gidin
3. Hata mesajını kopyalayın

### Yaygın Hatalar:

#### ❌ "Storage bucket bulunamadı"
**Çözüm:** Supabase Dashboard → Storage → New Bucket → `documents`

#### ❌ "Environment değişkenleri eksik"
**Çözüm:** `.env.local` dosyasını oluşturun ve Supabase bilgilerini ekleyin

#### ❌ "Dosya yükleme izni yok"
**Çözüm:** Supabase Dashboard → Storage → Policies → New Policy

## 📱 Test Dosyası

Test için küçük bir PDF veya resim dosyası kullanın:
- Boyut: 1MB'den küçük
- Format: PDF, JPG, PNG
- İçerik: Herhangi bir test dosyası

## 🆘 Yardım Gerekirse

1. **Console hatalarını** kopyalayın
2. **Supabase Dashboard** log'larını kontrol edin
3. **Environment değişkenlerini** doğrulayın
4. **Storage bucket** varlığını kontrol edin

## ✅ Başarı Kriterleri

Dosya yükleme çalışıyor demektir:
- ✅ Dosya seçilebiliyor
- ✅ "Test Et" butonu aktif
- ✅ Yükleme sırasında loading gösteriliyor
- ✅ "Test Başarılı!" mesajı görünüyor
- ✅ Dosya bilgileri detay olarak gösteriliyor

## 🎯 Sonraki Adımlar

Dosya yükleme çalıştıktan sonra:
1. **Müşteri ekleyin** (Clients sayfasından)
2. **Belge yükleyin** (Documents sayfasından)
3. **Müşteriye belge ata** (Müşteri modal'ından) 