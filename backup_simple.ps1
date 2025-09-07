# Basit Production Yedek Alma Script'i
Write-Host "Production Yedek Alma Baslatiyor..." -ForegroundColor Green

# Tarih damgası
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = "production_backup_$TIMESTAMP"

# Yedek klasörü oluştur
New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
Write-Host "Yedek klasoru olusturuldu: $BACKUP_DIR" -ForegroundColor Yellow

# 1. Frontend Build Yedeği
Write-Host "Frontend build yedegi aliniyor..." -ForegroundColor Yellow
npm run build
Copy-Item -Path "dist" -Destination "$BACKUP_DIR/frontend_build" -Recurse -Force
Write-Host "Frontend build yedegi alindi" -ForegroundColor Green

# 2. Kaynak Kod Yedeği
Write-Host "Kaynak kod yedegi aliniyor..." -ForegroundColor Yellow
Copy-Item -Path "src" -Destination "$BACKUP_DIR/source_code" -Recurse -Force
Copy-Item -Path "public" -Destination "$BACKUP_DIR/public_assets" -Recurse -Force
Copy-Item -Path "package.json" -Destination "$BACKUP_DIR/" -Force
Copy-Item -Path "package-lock.json" -Destination "$BACKUP_DIR/" -Force
Copy-Item -Path "vite.config.js" -Destination "$BACKUP_DIR/" -Force
Copy-Item -Path "tailwind.config.js" -Destination "$BACKUP_DIR/" -Force
Copy-Item -Path "postcss.config.js" -Destination "$BACKUP_DIR/" -Force
Write-Host "Kaynak kod yedegi alindi" -ForegroundColor Green

# 3. Veritabanı Script'leri Yedeği
Write-Host "Veritabani script'leri yedegi aliniyor..." -ForegroundColor Yellow
Copy-Item -Path "database" -Destination "$BACKUP_DIR/database_scripts" -Recurse -Force
Write-Host "Veritabani script'leri yedegi alindi" -ForegroundColor Green

# 4. Konfigürasyon Dosyaları
Write-Host "Konfigurasyon dosyalari yedegi aliniyor..." -ForegroundColor Yellow
if (Test-Path ".env.example") { Copy-Item -Path ".env.example" -Destination "$BACKUP_DIR/" -Force }
if (Test-Path "README.md") { Copy-Item -Path "README.md" -Destination "$BACKUP_DIR/" -Force }
if (Test-Path "deploy.md") { Copy-Item -Path "deploy.md" -Destination "$BACKUP_DIR/" -Force }
Write-Host "Konfigurasyon dosyalari yedegi alindi" -ForegroundColor Green

# 5. Sıkıştırma
Write-Host "Yedek sikistiriliyor..." -ForegroundColor Yellow
Compress-Archive -Path $BACKUP_DIR -DestinationPath "${BACKUP_DIR}.zip" -Force
Write-Host "Yedek sikistirildi: ${BACKUP_DIR}.zip" -ForegroundColor Green

# 6. Temizlik
Write-Host "Gecici dosyalar temizleniyor..." -ForegroundColor Yellow
Remove-Item -Path $BACKUP_DIR -Recurse -Force
Write-Host "Temizlik tamamlandi" -ForegroundColor Green

Write-Host "Production yedek alma tamamlandi!" -ForegroundColor Green
Write-Host "Yedek dosyasi: ${BACKUP_DIR}.zip" -ForegroundColor Yellow
Write-Host ""
Write-Host "ONEMLI: Supabase backup'ini manuel olarak almayi unutmayin!" -ForegroundColor Red
Write-Host "Supabase Dashboard -> aya-crm-production -> Settings -> Database -> Backups" -ForegroundColor Cyan
