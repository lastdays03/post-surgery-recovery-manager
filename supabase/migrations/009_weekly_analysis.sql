-- 주간 분석 결과 저장 테이블
CREATE TABLE weekly_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, week_start)
);

-- 인덱스
CREATE INDEX idx_weekly_analysis_profile ON weekly_analysis(profile_id);
CREATE INDEX idx_weekly_analysis_week ON weekly_analysis(week_start DESC);

-- RLS 정책
ALTER TABLE weekly_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly analysis" ON weekly_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = weekly_analysis.profile_id
      AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

-- 주석
COMMENT ON TABLE weekly_analysis IS '주간 AI 분석 결과 저장';
COMMENT ON COLUMN weekly_analysis.analysis_data IS '구조화된 분석 결과 (WeeklyAnalysisResult)';
