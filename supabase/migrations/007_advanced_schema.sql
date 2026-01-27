-- Add basic body metrics and advanced metrics columns to user_profiles

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS height NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS advanced_metrics JSONB DEFAULT '{}';

-- Create index for advanced metrics searching if needed (gin index for jsonb)
CREATE INDEX IF NOT EXISTS idx_user_profiles_advanced_metrics ON user_profiles USING gin (advanced_metrics);
