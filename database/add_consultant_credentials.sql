-- Danışmanlar tablosuna kimlik bilgileri sütunlarını ekle

-- Kullanıcı adı sütunu
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS username VARCHAR(100);

-- Şifre sütunu (SHA-256 hash olarak saklanır)
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS password VARCHAR(64);

-- Kimlik bilgilerinin atanıp atanmadığını kontrol eden boolean sütun
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS has_credentials BOOLEAN DEFAULT FALSE;

-- İndeks ekleme (performans için)
CREATE INDEX IF NOT EXISTS idx_consultants_username ON consultants(username);
CREATE INDEX IF NOT EXISTS idx_consultants_has_credentials ON consultants(has_credentials);

-- Kullanıcı adının benzersiz olması için kısıtlama
ALTER TABLE consultants 
ADD CONSTRAINT unique_consultant_username UNIQUE (username);

-- Güncelleme zamanı sütunu varsa güncelle, yoksa ekle
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Trigger ile otomatik updated_at güncellemesi
CREATE OR REPLACE FUNCTION update_consultants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'ı oluştur (varsa önce sil)
DROP TRIGGER IF EXISTS trigger_consultants_updated_at ON consultants;
CREATE TRIGGER trigger_consultants_updated_at
    BEFORE UPDATE ON consultants
    FOR EACH ROW
    EXECUTE FUNCTION update_consultants_updated_at();

-- Mevcut danışmanların has_credentials değerini güncelle
UPDATE consultants 
SET has_credentials = (username IS NOT NULL AND username != '' AND password IS NOT NULL AND password != '')
WHERE has_credentials IS NULL OR has_credentials = FALSE;
