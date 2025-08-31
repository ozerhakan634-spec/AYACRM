@echo off
echo ========================================
echo    Vize CRM - Dosya Yükleme Testi
echo ========================================
echo.
echo 1. Environment dosyası kontrol ediliyor...
if not exist ".env.local" (
    echo ❌ .env.local dosyası bulunamadı!
    echo.
    echo Lütfen önce .env.local dosyası oluşturun:
    echo - Supabase URL ve API Key ekleyin
    echo - Dosya içeriği için setup.md'yi okuyun
    echo.
    pause
    exit /b 1
) else (
    echo ✅ .env.local dosyası bulundu
)

echo.
echo 2. Bağımlılıklar kontrol ediliyor...
if not exist "node_modules" (
    echo 📦 node_modules bulunamadı, yükleniyor...
    npm install
) else (
    echo ✅ node_modules mevcut
)

echo.
echo 3. Proje başlatılıyor...
echo 🌐 http://localhost:5173 adresinde açılacak
echo.
echo Dosya yükleme testi için:
echo - Belgeler sayfasına gidin
echo - "🧪 Dosya Yükleme Testi" bölümünü açın
echo - Bir dosya seçin ve "Test Et" butonuna tıklayın
echo.
echo Hata durumunda F12 ile console'u kontrol edin
echo.
pause
npm run dev 