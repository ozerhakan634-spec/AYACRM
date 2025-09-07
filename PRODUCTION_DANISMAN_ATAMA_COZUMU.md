# Production Ortamı Danışman Atama Sorunu Çözümü

## 🚨 Sorun
- Development ortamında (`ozerhakan634-spec's Project`) danışman atama çalışıyor
- Production ortamında (`aya-crm-production`) danışman atama çalışmıyor
- 401 RLS hatası ve notification trigger hataları alınıyor

## 🔍 Analiz
Development'ta çalışan kod:
```javascript
const { data, error } = await supabase
  .from('clients')
  .update({ consultant_id: consultantId })
  .eq('id', consultantModal.client.id)
  .select();
```

## 📋 Çözüm Adımları

### 1. Production Supabase Dashboard'a Giriş
- `aya-crm-production` projesine giriş yapın
- SQL Editor'ü açın

### 2. Environment Kontrolü
```sql
-- Bu scripti çalıştırın:
-- database/check_production_environment.sql
```
Bu script size şunları gösterecek:
- Tablo yapıları
- RLS durumları
- Mevcut politikalar
- Trigger'lar
- Veri sayıları

### 3. Kapsamlı Çözüm Scripti
```sql
-- Bu scripti çalıştırın:
-- database/fix_production_consultant_assignment.sql
```
Bu script şunları yapacak:
- Mevcut durumu kontrol eder
- Notification trigger'larını devre dışı bırakır
- RLS politikalarını basitleştirir
- Test danışman ataması yapar
- RLS'yi tekrar etkinleştirir

### 4. Client-Side Debug
Production'da browser console'da şu komutları çalıştırın:

```javascript
// Environment kontrolü
window.productionDebug.checkEnvironment()

// Supabase bağlantı testi
window.productionDebug.testSupabaseConnection()

// RLS politikaları kontrolü
window.productionDebug.checkRLSPolicies()

// Test danışman ataması
window.productionDebug.performTestAssignment()

// Kapsamlı rapor
window.productionDebug.generateDebugReport()
```

### 5. Manuel RLS Düzeltmesi (Gerekirse)
Supabase Dashboard > Authentication > Policies bölümünde:

#### Clients Tablosu:
- Tüm mevcut politikaları silin
- Yeni politika ekleyin:
  - **Policy Name**: "Enable all operations for authenticated users"
  - **Target Roles**: `authenticated`
  - **Using Expression**: `auth.role() = 'authenticated'`
  - **Operation**: `ALL`

#### Consultants Tablosu:
- Tüm mevcut politikaları silin
- Yeni politika ekleyin:
  - **Policy Name**: "Enable all operations for authenticated users"
  - **Target Roles**: `authenticated`
  - **Using Expression**: `auth.role() = 'authenticated'`
  - **Operation**: `ALL`

#### Notifications Tablosu:
- Tüm mevcut politikaları silin
- Yeni politika ekleyin:
  - **Policy Name**: "Enable all operations for authenticated users"
  - **Target Roles**: `authenticated`
  - **Using Expression**: `auth.role() = 'authenticated'`
  - **Operation**: `ALL`

### 6. Storage Bucket Kontrolü
Supabase Dashboard > Storage bölümünde:
- `documents` bucket'ının mevcut olduğunu kontrol edin
- Public access ayarlarını kontrol edin

### 7. Test Etme
1. Production'da bir müşteriye danışman atamayı deneyin
2. Browser console'da hata mesajlarını kontrol edin
3. Network tab'ında Supabase isteklerini kontrol edin

## 🔧 Debug Komutları

### Browser Console'da:
```javascript
// Supabase bağlantısını test et
supabase.from('clients').select('id, name').limit(1)

// RLS politikalarını test et
supabase.from('clients').update({name: 'test'}).eq('id', 1)

// Notification trigger'larını test et
supabase.from('notifications').insert({title: 'test', user_id: 1, category: 'info'})
```

### SQL Editor'de:
```sql
-- RLS durumunu kontrol et
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('clients', 'consultants', 'notifications');

-- Politikaları kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('clients', 'consultants', 'notifications');
```

## 📊 Beklenen Sonuçlar

### Başarılı Çözüm:
- ✅ Danışman atama işlemi çalışır
- ✅ Console'da hata mesajı görünmez
- ✅ Network tab'ında 200 OK yanıtları
- ✅ RLS politikaları doğru çalışır

### Hala Sorun Varsa:
- ❌ Console'da RLS hatası devam eder
- ❌ Network tab'ında 401/403 hataları
- ❌ Notification trigger hataları

## 🆘 Acil Durum Çözümü

Eğer hiçbir şey çalışmazsa:

```sql
-- Tüm RLS'yi geçici olarak devre dışı bırak
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE consultants DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;

-- Tüm trigger'ları devre dışı bırak
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE trigger_name LIKE '%notification%' OR trigger_name LIKE '%client%'
    LOOP
        EXECUTE 'ALTER TABLE clients DISABLE TRIGGER ' || trigger_record.trigger_name;
    END LOOP;
END $$;
```

## 📞 Destek

Sorun devam ederse:
1. Browser console'daki hata mesajlarını paylaşın
2. SQL script sonuçlarını paylaşın
3. Network tab'ındaki Supabase isteklerini paylaşın
4. Production environment bilgilerini paylaşın

---

**Not**: Bu çözüm production ortamına özeldir. Development ortamını etkilemez.
