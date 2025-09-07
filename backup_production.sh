#!/bin/bash

# Production Yedek Alma Script'i
# Bu script production ortamının tam yedeğini alır

echo "🚀 Production Yedek Alma Başlatılıyor..."
echo "========================================"

# Tarih damgası
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="production_backup_$TIMESTAMP"

# Yedek klasörü oluştur
mkdir -p $BACKUP_DIR
echo "📁 Yedek klasörü oluşturuldu: $BACKUP_DIR"

# 1. Frontend Build Yedeği
echo "📦 Frontend build yedeği alınıyor..."
npm run build
cp -r dist/ $BACKUP_DIR/frontend_build/
echo "✅ Frontend build yedeği alındı"

# 2. Kaynak Kod Yedeği
echo "💻 Kaynak kod yedeği alınıyor..."
cp -r src/ $BACKUP_DIR/source_code/
cp -r public/ $BACKUP_DIR/public_assets/
cp package.json $BACKUP_DIR/
cp package-lock.json $BACKUP_DIR/
cp vite.config.js $BACKUP_DIR/
cp tailwind.config.js $BACKUP_DIR/
cp postcss.config.js $BACKUP_DIR/
echo "✅ Kaynak kod yedeği alındı"

# 3. Veritabanı Script'leri Yedeği
echo "🗄️ Veritabanı script'leri yedeği alınıyor..."
cp -r database/ $BACKUP_DIR/database_scripts/
echo "✅ Veritabanı script'leri yedeği alındı"

# 4. Konfigürasyon Dosyaları
echo "⚙️ Konfigürasyon dosyaları yedeği alınıyor..."
cp .env.example $BACKUP_DIR/
cp README.md $BACKUP_DIR/
cp deploy.md $BACKUP_DIR/
echo "✅ Konfigürasyon dosyaları yedeği alındı"

# 5. Yedek Raporu Oluştur
echo "📋 Yedek raporu oluşturuluyor..."
cat > $BACKUP_DIR/BACKUP_REPORT.md << EOF
# Production Yedek Raporu

**Tarih:** $(date)
**Ortam:** Production (aya-crm-production)
**URL:** admin.ayajourneys.com

## Yedeklenen Bileşenler:

### 1. Frontend Build
- Konum: \`frontend_build/\`
- İçerik: Production için optimize edilmiş dosyalar

### 2. Kaynak Kod
- Konum: \`source_code/\`
- İçerik: React uygulaması kaynak kodları

### 3. Veritabanı Script'leri
- Konum: \`database_scripts/\`
- İçerik: SQL script'leri ve migration'lar

### 4. Konfigürasyon
- Konum: Root klasör
- İçerik: Package.json, config dosyaları

## Önemli Notlar:

⚠️ **Environment Variables:** .env dosyası güvenlik nedeniyle yedeklenmedi
⚠️ **Supabase Backup:** Supabase Dashboard'dan manuel olarak alınmalı
⚠️ **Domain Ayarları:** Hosting platformunda kontrol edilmeli

## Geri Yükleme:

1. Supabase backup'ını geri yükle
2. Frontend build'i deploy et
3. Environment variables'ları ayarla
4. Domain ayarlarını kontrol et

## Dosya Boyutları:

$(du -sh $BACKUP_DIR/*)

EOF

echo "✅ Yedek raporu oluşturuldu"

# 6. Sıkıştırma
echo "🗜️ Yedek sıkıştırılıyor..."
tar -czf "${BACKUP_DIR}.tar.gz" $BACKUP_DIR/
echo "✅ Yedek sıkıştırıldı: ${BACKUP_DIR}.tar.gz"

# 7. Temizlik
echo "🧹 Geçici dosyalar temizleniyor..."
rm -rf $BACKUP_DIR/
echo "✅ Temizlik tamamlandı"

echo "========================================"
echo "🎉 Production yedek alma tamamlandı!"
echo "📁 Yedek dosyası: ${BACKUP_DIR}.tar.gz"
echo "📋 Rapor: BACKUP_REPORT.md"
echo ""
echo "⚠️  ÖNEMLİ: Supabase backup'ını manuel olarak almayı unutmayın!"
echo "🔗 Supabase Dashboard → aya-crm-production → Settings → Database → Backups"
