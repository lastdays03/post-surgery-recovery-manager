-- 기존 증상 데이터 리셋 (개발 단계이므로 기존 데이터 삭제)
DELETE FROM daily_logs WHERE symptoms IS NOT NULL;

-- symptoms 컬럼은 JSONB이므로 스키마 변경 불필요
-- 새로운 구조의 데이터를 저장할 준비 완료

COMMENT ON COLUMN daily_logs.symptoms IS
'증상 기록 (JSONB): painLevel(0-10), energyLevel(0-10), mealIntake, postMealSymptom, bodyTemperature, bowelStatus, mostDifficult, abnormalSymptoms[]';
