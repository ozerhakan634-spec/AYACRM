# RLS (Row Level Security) Sorunu Çözümü

## 🚨 Sorun
```
aaa.jpg: new row violates row-level security policy for table "documents"
```

Bu hata, Supabase'de RLS politikalarının dosya yükleme işlemi için doğru ayarlanmadığını gösteriyor.

## 🔧 Hızlı Çözüm

### 1. Supabase Dashboard'a Giriş
1. [Supabase Dashboard](https://supabase.com/dashboard) adresine gidin
2. Projenizi seçin
3. **SQL Editor** bölümüne gidin

### 2. RLS Politikalarını Düzelt
Aşağıdaki SQL kodunu çalıştırın:

```sql
-- Önce mevcut politikaları temizle
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON documents;

-- Storage için de mevcut politikaları temizle
DROP POLICY IF EXISTS "Enable file operations for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable file uploads for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable file downloads for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable file updates for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable file deletions for authenticated users" ON storage.objects;

-- Documents tablosu için yeni politikalar
CREATE POLICY "Enable all operations for authenticated users" ON documents
FOR ALL USING (auth.role() = 'authenticated');

-- Storage objects için politikalar
CREATE POLICY "Enable file uploads for authenticated users" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Enable file downloads for authenticated users" ON storage.objects
FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Enable file updates for authenticated users" ON storage.objects
FOR UPDATE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Enable file deletions for authenticated users" ON storage.objects
FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- RLS'nin aktif olduğundan emin ol
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

### 3. Alternatif Hızlı Çözüm (Test İçin)
Eğer yukarıdaki çözüm çalışmazsa, geçici olarak tüm işlemlere izin veren politika:

```sql
-- Geçici çözüm (sadece test için)
DROP POLICY IF EXISTS "Allow all operations" ON documents;
CREATE POLICY "Allow all operations" ON documents FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all storage operations" ON storage.objects;
CREATE POLICY "Allow all storage operations" ON storage.objects FOR ALL USING (bucket_id = 'documents');
```

## 🔍 Kontrol Adımları

### 1. Mevcut Politikaları Kontrol Et
```sql
-- Documents tablosu için politikaları listele
SELECT * FROM pg_policies WHERE tablename = 'documents';

-- Storage objects için politikaları listele
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

### 2. RLS Durumunu Kontrol Et
```sql
-- Documents tablosu için RLS durumu
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'documents';

-- Storage objects için RLS durumu
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects';
```

## 🛠️ Manuel Kontrol

### Supabase Dashboard'da:
1. **Authentication** > **Policies** bölümüne gidin
2. `documents` tablosunu seçin
3. Aşağıdaki politikaların var olduğundan emin olun:
   - "Enable all operations for authenticated users"
   - "Enable read access for authenticated users"
   - "Enable insert access for authenticated users"
   - "Enable update access for authenticated users"
   - "Enable delete access for authenticated users"

4. `storage.objects` tablosunu seçin
5. Aşağıdaki politikaların var olduğundan emin olun:
   - "Enable file uploads for authenticated users"
   - "Enable file downloads for authenticated users"
   - "Enable file updates for authenticated users"
   - "Enable file deletions for authenticated users"

## 🚨 Acil Durum Çözümü

Eğer hiçbir çözüm çalışmazsa:

1. **RLS'yi Geçici Olarak Devre Dışı Bırak**:
```sql
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
```

2. **Test Et ve Tekrar Etkinleştir**:
```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
```

## 📋 Test Etme

1. SQL kodunu çalıştırdıktan sonra
2. Uygulamaya geri dönün
3. Dosya yükleme işlemini tekrar deneyin
4. Console'da hata mesajlarını kontrol edin

## 🔄 Sorun Devam Ederse

1. **Supabase Logs**: Dashboard > Logs bölümünü kontrol edin
2. **Browser Console**: F12 > Console'da detaylı hata mesajlarını inceleyin
3. **Network Tab**: F12 > Network'te Supabase isteklerini kontrol edin

Bu adımları takip ettikten sonra RLS sorunu çözülecek ve dosya yükleme işlemi çalışacaktır.
