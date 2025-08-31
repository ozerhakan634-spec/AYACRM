-- EKSİK SÜTUNLARI CONSULTANTS TABLOSUNA EKLE

-- Department sütunu ekle
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Position sütunu ekle  
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS position VARCHAR(100);

-- Status sütunu ekle
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Created_at sütunu ekle
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Updated_at sütunu ekle
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Username sütunu ekle
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE;

-- Password sütunu ekle (SHA-256 hash için)
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS password VARCHAR(64);

-- Plain password sütunu ekle (görüntüleme için)
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS plain_password VARCHAR(255);

-- Has_credentials sütunu ekle
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS has_credentials BOOLEAN DEFAULT FALSE;

-- Permissions sütunu ekle (JSON)
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Kontrol sorgusu - tablo yapısını göster
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'consultants' 
ORDER BY ordinal_position;
