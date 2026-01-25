-- Users 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_anonymous BOOLEAN DEFAULT FALSE
);

-- User Profiles 테이블
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  surgery_type TEXT NOT NULL CHECK (surgery_type IN (
    'gastric_resection',
    'colon_resection',
    'tkr',
    'spinal_fusion',
    'cholecystectomy'
  )),
  surgery_date DATE NOT NULL,
  digestive_capacity TEXT CHECK (digestive_capacity IN ('good', 'moderate', 'poor')),
  comorbidities TEXT[] DEFAULT '{}',
  current_phase TEXT,
  local_storage_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Logs 테이블
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  meals_completed JSONB DEFAULT '{}',
  exercises_completed JSONB DEFAULT '{}',
  symptoms JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, log_date)
);

-- 인덱스
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_local_key ON user_profiles(local_storage_key);
CREATE INDEX idx_daily_logs_profile ON daily_logs(profile_id);
CREATE INDEX idx_daily_logs_date ON daily_logs(log_date DESC);

-- Row Level Security 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own profiles" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own profiles" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own profiles" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own logs" ON daily_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = daily_logs.profile_id
      AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert own logs" ON daily_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = daily_logs.profile_id
      AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

CREATE POLICY "Users can update own logs" ON daily_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = daily_logs.profile_id
      AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );
