# 🎯 Price Sütunu Ekleme Rehberi

## 📋 **Sorun**
Finans bölümünde müşteri fiyatlarını güncellerken aşağıdaki hata alınıyor:
```
Could not find the 'price' column of 'clients' in the schema cache
```

## 🔧 **Çözüm**
`clients` tablosuna fiyat sütunları eklemek gerekiyor.

## 📝 **Adımlar**

### 1. **SQL Dosyasını Çalıştır**
```bash
# Supabase Dashboard'da SQL Editor'ı aç
# add_price_column.sql dosyasının içeriğini kopyala ve çalıştır
```

### 2. **Alternatif: Manuel Ekleme**
```sql
-- Price sütunu ekle
ALTER TABLE clients ADD COLUMN price DECIMAL(12,2) DEFAULT 0.00;

-- Fiyat sütunu ekle (Türkçe)
ALTER TABLE clients ADD COLUMN fiyat DECIMAL(12,2) DEFAULT 0.00;

-- Amount sütunu ekle
ALTER TABLE clients ADD COLUMN amount DECIMAL(12,2) DEFAULT 0.00;
```

### 3. **Kontrol Et**
```sql
-- Sütunların eklendiğini doğrula
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
  AND column_name IN ('price', 'fiyat', 'amount');
```

## ✅ **Beklenen Sonuç**
- `price` sütunu: DECIMAL(12,2) tipinde
- `fiyat` sütunu: DECIMAL(12,2) tipinde  
- `amount` sütunu: DECIMAL(12,2) tipinde
- Tüm sütunlar varsayılan olarak 0.00 değerine sahip

## 🚀 **Sonrası**
Sütunlar eklendikten sonra:
- Finans sayfasında düzenle butonu çalışacak
- Müşteri fiyatları güncellenebilecek
- Ödeme ekleme işlemi hatasız çalışacak

## 📞 **Yardım**
Eğer hala sorun yaşıyorsanız:
1. Supabase Dashboard'da SQL Editor'ı kontrol edin
2. Hata mesajlarını paylaşın
3. Veritabanı bağlantısını test edin
