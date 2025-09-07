-- Consultants tablosuna eksik sütunları ekle
-- PostgreSQL için temiz SQL

-- Plain password sütunu ekle
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS plain_password VARCHAR(255);

-- Username sütunu ekle  
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS username VARCHAR(100);

-- Password sütunu ekle
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS password VARCHAR(64);

-- Has credentials sütunu ekle
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS has_credentials BOOLEAN DEFAULT FALSE;

-- Department sütunu ekle
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Position sütunu ekle
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS position VARCHAR(100);

-- Permissions sütunu ekle
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Created at sütunu ekle
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Updated at sütunu ekle
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Username için unique constraint ekle (varsa hata vermez)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_username' 
        AND table_name = 'consultants'
    ) THEN
        ALTER TABLE consultants ADD CONSTRAINT unique_username UNIQUE (username);
    END IF;
END $$;

-- Kontrol sorgusu
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'consultants' 
ORDER BY ordinal_position;
