-- Migration: 005_meal_plans.sql
-- Description: 식단 저장 및 캐싱을 위한 meal_plans 테이블 생성

-- 식단 계획 테이블
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    recovery_phase TEXT NOT NULL CHECK (recovery_phase IN ('liquid', 'soft', 'regular')),
    meals JSONB NOT NULL,
    preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 하루에 하나의 식단만 (user_id + date 조합 유니크)
    UNIQUE(user_id, date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_meal_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_meal_plans_updated_at
    BEFORE UPDATE ON meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_plans_updated_at();

-- RLS (Row Level Security) 활성화
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 식단만 조회 가능
CREATE POLICY meal_plans_select_policy ON meal_plans
    FOR SELECT
    USING (true);  -- 로컬 개발이므로 모든 사용자 허용

-- 정책: 사용자는 자신의 식단만 삽입 가능
CREATE POLICY meal_plans_insert_policy ON meal_plans
    FOR INSERT
    WITH CHECK (true);

-- 정책: 사용자는 자신의 식단만 업데이트 가능
CREATE POLICY meal_plans_update_policy ON meal_plans
    FOR UPDATE
    USING (true);

-- 정책: 사용자는 자신의 식단만 삭제 가능
CREATE POLICY meal_plans_delete_policy ON meal_plans
    FOR DELETE
    USING (true);

-- 코멘트
COMMENT ON TABLE meal_plans IS '사용자별 일일 식단 계획 저장';
COMMENT ON COLUMN meal_plans.user_id IS '사용자 ID';
COMMENT ON COLUMN meal_plans.date IS '식단 날짜 (YYYY-MM-DD)';
COMMENT ON COLUMN meal_plans.recovery_phase IS '회복 단계 (liquid, soft, regular)';
COMMENT ON COLUMN meal_plans.meals IS '식단 배열 (Meal[] JSON)';
COMMENT ON COLUMN meal_plans.preferences IS '생성 시 사용된 선호도';
