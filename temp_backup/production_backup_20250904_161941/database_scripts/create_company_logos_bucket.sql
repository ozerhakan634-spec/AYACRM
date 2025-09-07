-- Şirket logoları için storage bucket oluştur
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- Not: Storage bucket'ları SQL ile değil, Supabase Dashboard veya API ile oluşturulur
-- Bu dosya referans amaçlı hazırlandı

/*
Supabase Dashboard'da aşağıdaki adımları takip edin:

1. Supabase Dashboard > Storage > Buckets
2. "New bucket" butonuna tıklayın
3. Bucket bilgileri:
   - Name: company-logos
   - Public bucket: ✓ (işaretli)
   - File size limit: 5MB
   - Allowed MIME types: 
     * image/svg+xml
     * image/png  
     * image/jpeg
     * image/jpg
     * image/webp
4. "Create bucket" butonuna tıklayın

Alternatif olarak JavaScript API ile oluşturabilirsiniz:

```javascript
const { data, error } = await supabase.storage
  .createBucket('company-logos', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: [
      'image/svg+xml', 
      'image/png', 
      'image/jpeg', 
      'image/jpg', 
      'image/webp'
    ]
  });
```
*/

SELECT 'Company logos bucket manuel olarak oluşturulmalıdır. Yukarıdaki talimatları takip edin.' as message;
