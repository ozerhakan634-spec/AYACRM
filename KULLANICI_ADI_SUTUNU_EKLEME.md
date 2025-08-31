# 🗄️ Kullanıcı Adı Sütunu Ekleme Rehberi

## 📋 Sorun
CRM uygulamasında müşteri eklerken şu hata alınıyor:
```
Müşteri ekleme hatası: Could not find the 'kullanici_adi' column of 'clients' in the schema cache
```

## 🔧 Çözüm
Veritabanına `kullanici_adi` sütunu eklemek gerekiyor.

## 🚀 Adım Adım Kurulum

### 1️⃣ Supabase Dashboard'a Giriş
- [Supabase Dashboard](https://supabase.com/dashboard) açın
- Projenizi seçin

### 2️⃣ SQL Editor'ı Açın
- Sol menüden **SQL Editor** seçin
- **New Query** butonuna tıklayın

### 3️⃣ SQL Komutunu Çalıştırın
Aşağıdaki SQL kodunu yapıştırın ve **Run** butonuna tıklayın:

```sql
-- Kullanici_adi sütununu ekle
ALTER TABLE clients 
ADD COLUMN kullanici_adi VARCHAR(100);

-- Sütun açıklamasını ekle
COMMENT ON COLUMN clients.kullanici_adi IS 'Kullanıcı adı';

-- Mevcut kayıtlar için varsayılan değer ata
UPDATE clients 
SET kullanici_adi = COALESCE(name, 'Kullanıcı_' || id) 
WHERE kullanici_adi IS NULL;
```

### 4️⃣ Kontrol Edin
Sütunun eklendiğini kontrol etmek için:

```sql
-- Sütun bilgilerini kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name = 'kullanici_adi';

-- Örnek veri ile test et
SELECT id, name, kullanici_adi, email 
FROM clients 
LIMIT 5;
```

## ✅ Beklenen Sonuç
- `kullanici_adi` sütunu `clients` tablosuna eklenir
- Mevcut müşteri kayıtları için varsayılan değerler atanır
- CRM uygulamasında müşteri ekleme hatası çözülür

## 🔍 Hata Durumunda
Eğer hata alırsanız:
1. **Table not found**: `clients` tablosunun var olduğundan emin olun
2. **Permission denied**: RLS politikalarını kontrol edin
3. **Column already exists**: Sütun zaten eklenmiş olabilir

## 📱 Test
Sütun eklendikten sonra:
1. CRM uygulamasını yenileyin
2. Yeni müşteri eklemeyi deneyin
3. `kullanici_adi` alanının çalıştığını kontrol edin

## 🎯 Sonraki Adımlar
- Kullanıcı adı validasyonu ekleyebilirsiniz
- Benzersiz kullanıcı adı kontrolü yapabilirsiniz
- Kullanıcı adı formatı belirleyebilirsiniz 