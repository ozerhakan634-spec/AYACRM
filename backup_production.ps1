# Production Yedek Alma Script'i (PowerShell)
# Bu script production ortamının tam yedeğini alır

Write-Host "Production Yedek Alma Baslatiliyor..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Tarih damgası
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = "production_backup_$TIMESTAMP"

# Yedek klasörü oluştur
New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
Write-Host "Yedek klasörü oluşturuldu: $BACKUP_DIR" -ForegroundColor Yellow

# 1. Frontend Build Yedeği
Write-Host "Frontend build yedeği alınıyor..." -ForegroundColor Yellow
npm run build
Copy-Item -Path "dist" -Destination "$BACKUP_DIR/frontend_build" -Recurse -Force
Write-Host "Frontend build yedeği alındı" -ForegroundColor Green

# 2. Kaynak Kod Yedeği
Write-Host "Kaynak kod yedeği alınıyor..." -ForegroundColor Yellow
Copy-Item -Path "src" -Destination "$BACKUP_DIR/source_code" -Recurse -Force
Copy-Item -Path "public" -Destination "$BACKUP_DIR/public_assets" -Recurse -Force
Copy-Item -Path "package.json" -Destination "$BACKUP_DIR/" -Force
Copy-Item -Path "package-lock.json" -Destination "$BACKUP_DIR/" -Force
Copy-Item -Path "vite.config.js" -Destination "$BACKUP_DIR/" -Force
Copy-Item -Path "tailwind.config.js" -Destination "$BACKUP_DIR/" -Force
Copy-Item -Path "postcss.config.js" -Destination "$BACKUP_DIR/" -Force
Write-Host "Kaynak kod yedeği alındı" -ForegroundColor Green

# 3. Veritabanı Script'leri Yedeği
Write-Host "Veritabanı script'leri yedeği alınıyor..." -ForegroundColor Yellow
Copy-Item -Path "database" -Destination "$BACKUP_DIR/database_scripts" -Recurse -Force
Write-Host "Veritabanı script'leri yedeği alındı" -ForegroundColor Green

# 4. Konfigürasyon Dosyaları
Write-Host "Konfigürasyon dosyaları yedeği alınıyor..." -ForegroundColor Yellow
if (Test-Path ".env.example") { Copy-Item -Path ".env.example" -Destination "$BACKUP_DIR/" -Force }
if (Test-Path "README.md") { Copy-Item -Path "README.md" -Destination "$BACKUP_DIR/" -Force }
if (Test-Path "deploy.md") { Copy-Item -Path "deploy.md" -Destination "$BACKUP_DIR/" -Force }
Write-Host "Konfigürasyon dosyaları yedeği alındı" -ForegroundColor Green

# 5. Yedek Raporu Oluştur
Write-Host "Yedek raporu oluşturuluyor..." -ForegroundColor Yellow
$REPORT_CONTENT = @"
# Production Yedek Raporu

**Tarih:** $(Get-Date)
**Ortam:** Production (aya-crm-production)
**URL:** admin.ayajourneys.com

## Yedeklenen Bileşenler:

### 1. Frontend Build
- Konum: frontend_build/
- İçerik: Production için optimize edilmiş dosyalar

### 2. Kaynak Kod
- Konum: source_code/
- İçerik: React uygulaması kaynak kodları

### 3. Veritabanı Script'leri
- Konum: database_scripts/
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

"@

$REPORT_CONTENT | Out-File -FilePath "$BACKUP_DIR/BACKUP_REPORT.md" -Encoding UTF8
Write-Host "Yedek raporu oluşturuldu" -ForegroundColor Green

# 6. Sıkıştırma
Write-Host "Yedek sıkıştırılıyor..." -ForegroundColor Yellow
Compress-Archive -Path $BACKUP_DIR -DestinationPath "${BACKUP_DIR}.zip" -Force
Write-Host "Yedek sıkıştırıldı: ${BACKUP_DIR}.zip" -ForegroundColor Green

# 7. Temizlik
Write-Host "Geçici dosyalar temizleniyor..." -ForegroundColor Yellow
Remove-Item -Path $BACKUP_DIR -Recurse -Force
Write-Host "Temizlik tamamlandı" -ForegroundColor Green

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Production yedek alma tamamlandı!" -ForegroundColor Green
Write-Host "Yedek dosyası: ${BACKUP_DIR}.zip" -ForegroundColor Yellow
Write-Host "Rapor: BACKUP_REPORT.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "ÖNEMLİ: Supabase backup'ını manuel olarak almayı unutmayın!" -ForegroundColor Red
Write-Host "Supabase Dashboard -> aya-crm-production -> Settings -> Database -> Backups" -ForegroundColor Cyan


