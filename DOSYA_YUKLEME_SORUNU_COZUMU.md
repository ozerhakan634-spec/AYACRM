# Dosya Yükleme Sorunu Çözümü

## Sorun
Belgeler sayfasından dosya yüklenmiyor. Bu sorun genellikle aşağıdaki nedenlerden kaynaklanır:

## Çözüm Adımları

### 1. Environment Değişkenlerini Ayarlayın
Proje kök dizininde `.env.local` dosyası oluşturun:

```bash
# Supabase Veritabanı Konfigürasyonu
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Bu değerleri nereden alacağınız:**
1. [Supabase Dashboard](https://supabase.com/dashboard) adresine gidin
2. Projenizi seçin
3. **Settings > API** bölümüne gidin
4. **Project URL** ve **anon public** key'i kopyalayın

### 2. Supabase Storage Bucket Oluşturun
1. Supabase Dashboard'da **Storage** bölümüne gidin
2. **New Bucket** butonuna tıklayın
3. Bucket adı olarak `documents` yazın
4. **Public** seçeneğini işaretleyin
5. **Create bucket** butonuna tıklayın

### 3. Veritabanı Şemasını Güncelleyin
`database/schema.sql` dosyasındaki şemayı Supabase'de çalıştırın:

```sql
-- Documents tablosu için güncellenmiş şema
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'identity',
  description TEXT,
  fileName VARCHAR(255),
  originalFileName VARCHAR(255),
  fileSize DECIMAL(10,2),
  fileType VARCHAR(100),
  fileUrl TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  clientId BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  clientName VARCHAR(255),
  consultant_id BIGINT REFERENCES consultants(id) ON DELETE SET NULL,
  uploadedDate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. RLS (Row Level Security) Ayarlarını Kontrol Edin
Supabase Dashboard'da **Authentication > Policies** bölümünden:

1. **documents** tablosu için **New Policy** oluşturun
2. **Policy name**: `Enable all operations for authenticated users`
3. **Target roles**: `authenticated`
4. **Policy definition**:
```sql
-- Okuma izni
CREATE POLICY "Enable read access for authenticated users" ON documents
FOR SELECT USING (auth.role() = 'authenticated');

-- Yazma izni
CREATE POLICY "Enable insert access for authenticated users" ON documents
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Güncelleme izni
CREATE POLICY "Enable update access for authenticated users" ON documents
FOR UPDATE USING (auth.role() = 'authenticated');

-- Silme izni
CREATE POLICY "Enable delete access for authenticated users" ON documents
FOR DELETE USING (auth.role() = 'authenticated');
```

### 5. Storage Policies Ayarlayın
**Storage > Policies** bölümünden:

1. **documents** bucket'ı için **New Policy** oluşturun
2. **Policy name**: `Enable file operations for authenticated users`
3. **Policy definition**:
```sql
-- Dosya yükleme izni
CREATE POLICY "Enable file uploads for authenticated users" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Dosya okuma izni
CREATE POLICY "Enable file downloads for authenticated users" ON storage.objects
FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Dosya güncelleme izni
CREATE POLICY "Enable file updates for authenticated users" ON storage.objects
FOR UPDATE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Dosya silme izni
CREATE POLICY "Enable file deletions for authenticated users" ON storage.objects
FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
```

### 6. Test Edin
1. Uygulamayı yeniden başlatın: `npm run dev`
2. Belgeler sayfasına gidin
3. Bir dosya seçin ve yüklemeyi deneyin
4. Browser console'da hata mesajlarını kontrol edin

## Hata Mesajları ve Çözümleri

### "Storage bucket bulunamadı"
- Supabase Dashboard'da Storage > Buckets bölümünden `documents` bucket'ını oluşturun

### "Dosya yükleme izni yok"
- Storage Policies'de dosya yükleme iznini kontrol edin
- RLS ayarlarını kontrol edin

### "Veritabanı bağlantısı kurulamadı"
- `.env.local` dosyasındaki Supabase URL ve key'i kontrol edin
- Supabase projesinin aktif olduğundan emin olun

### "Ağ bağlantısı hatası"
- İnternet bağlantınızı kontrol edin
- Supabase URL'inin doğru olduğundan emin olun

## Debug İpuçları

1. **Browser Console**: F12 tuşuna basarak console'da hata mesajlarını kontrol edin
2. **Network Tab**: Dosya yükleme sırasında network isteklerini izleyin
3. **Supabase Logs**: Dashboard'da Logs bölümünden hataları kontrol edin

## Yardım

Eğer sorun devam ederse:
1. Console'daki hata mesajlarını kopyalayın
2. Supabase Dashboard'daki log'ları kontrol edin
3. Environment değişkenlerinin doğru olduğundan emin olun
4. Storage bucket ve policies'lerin oluşturulduğunu kontrol edin 