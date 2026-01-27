-- 수술 유형 제약 조건 업데이트
-- SURGERY_PROTOCOLS에 정의된 12가지 유형을 모두 허용하도록 수정

-- 기존 제약 조건 삭제
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_surgery_type_check;

-- 새로운 수술 유형을 포함한 제약 조건 추가
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_surgery_type_check 
CHECK (surgery_type IN (
    'gastric_resection',
    'colon_resection',
    'tkr',
    'spinal_fusion',
    'spinal_surgery',
    'cholecystectomy',
    'tha',
    'acl_reconstruction',
    'esophagectomy',
    'smile_lasik',
    'rotator_cuff',
    'general'
));
