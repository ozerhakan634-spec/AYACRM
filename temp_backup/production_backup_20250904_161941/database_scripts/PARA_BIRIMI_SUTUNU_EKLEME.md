# 💰 Para Birimi Sütunu Ekleme Rehberi

## 📋 **Sorun**
Finans bölümünde para birimi seçimi yapılıyor ama hep TL olarak gösteriliyor. Bu, veritabanında para birimi bilgisinin kaydedilmemesinden kaynaklanıyor.

## 🔧 **Çözüm**
`clients` tablosuna para birimi sütunları eklemek gerekiyor.

## 📝 **Adımlar**

### 1. **SQL Dosyasını Çalıştır**
```bash
# Supabase Dashboard'da SQL Editor'ı aç
# add_currency_columns.sql dosyasının içeriğini kopyala ve çalıştır
```

### 2. **Alternatif: Manuel Ekleme**
```sql
-- Currency sütunu ekle
ALTER TABLE clients ADD COLUMN currency VARCHAR(10) DEFAULT 'TRY';

-- Para birimi sütunu ekle (Türkçe)
ALTER TABLE clients ADD COLUMN para_birimi VARCHAR(10) DEFAULT 'TRY';

-- İndeksler oluştur
CREATE INDEX idx_clients_currency ON clients(currency);
CREATE INDEX idx_clients_para_birimi ON clients(para_birimi);
```

### 3. **Kontrol Et**
```sql
-- Sütunların eklendiğini doğrula
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
  AND column_name IN ('currency', 'para_birimi');
```

## 🎯 **Beklenen Sonuç**
- ✅ Para birimi seçimi kaydedilecek
- ✅ Euro, Dolar, Sterlin seçimleri çalışacak
- ✅ Finans sayfasında doğru para birimi gösterilecek

## 📊 **Desteklenen Para Birimleri**
- **TRY**: Türk Lirası (₺)
- **EUR**: Euro (€)
- **USD**: Dolar ($)
- **GBP**: Sterlin (£)

## 🚀 **Test Et**
1. Finans sayfasını aç
2. Yeni ödeme ekle
3. Para birimi seç (Euro, Dolar, Sterlin)
4. Kaydet
5. Para biriminin doğru kaydedildiğini kontrol et
