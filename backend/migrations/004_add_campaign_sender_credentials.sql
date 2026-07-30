ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sender_app_password TEXT;
