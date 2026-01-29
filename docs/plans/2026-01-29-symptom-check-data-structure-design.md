# 증상 체크 페이지 데이터 구조 개선 설계

**작성일**: 2026-01-29
**상태**: 승인됨

## 개요

### 문제점
현재 증상 체크 페이지의 UI에는 8개의 질문 항목이 있지만, 모든 radio input이 동일한 `digestiveStatus` 필드에 바인딩되어 있습니다. 이로 인해 사용자가 여러 질문에 답변해도 마지막 선택만 저장되는 치명적인 버그가 있습니다.

### 핵심 변경 사항
1. **타입 정의 확장**: 각 질문 항목별로 독립적인 필드를 가진 새로운 SymptomLog 타입 정의
2. **UI 수정**: 중복된 "오늘 가장 힘들었던 점" 섹션 제거, "특이 증상 체크"를 체크박스로 변경
3. **폼 바인딩 수정**: 각 질문 항목을 올바른 필드명에 바인딩
4. **DB 마이그레이션**: 기존 증상 데이터 리셋 후 새 구조로 시작
5. **notes 필드 제거**: 사용하지 않는 메모 필드 완전 제거

### 접근 방식
타입 안전성을 최우선으로 하여, 각 질문 항목의 가능한 값들을 TypeScript union type으로 명확하게 정의합니다. 이를 통해 컴파일 타임에 잘못된 값 할당을 방지하고, IDE 자동완성과 타입 체크의 이점을 최대한 활용합니다.

---

## 타입 정의 및 데이터 구조

### 새로운 SymptomLog 타입

**파일**: `lib/types/symptom.types.ts`

```typescript
export type MealIntakeStatus = 'none' | 'bad' | 'moderate' | 'good'
export type PostMealSymptom = 'bloating' | 'distension' | 'heartburn' | 'nausea' | 'none'
export type BodyTemperatureStatus = 'normal' | 'mild_fever' | 'high_fever'
export type BowelStatus = 'normal' | 'constipation' | 'diarrhea' | 'none'
export type MostDifficultAspect = 'meal' | 'pain' | 'sleep' | 'activity' | 'none'
export type AbnormalSymptom = 'wound_pain_increase' | 'wound_redness' | 'severe_abdominal_pain' | 'vomiting' | 'none'

export interface SymptomLog {
  painLevel: number              // 0-10
  energyLevel: number            // 0-10
  mealIntake: MealIntakeStatus   // 식사 섭취율
  postMealSymptom: PostMealSymptom  // 식사 후 증상
  bodyTemperature: BodyTemperatureStatus  // 체온 이상 여부
  bowelStatus: BowelStatus       // 배변 상태
  mostDifficult: MostDifficultAspect  // 오늘 가장 힘들었던 점
  abnormalSymptoms: AbnormalSymptom[]  // 특이 증상 체크 (복수 선택)
}

export interface DailyLogEntry {
  profile_id: string
  log_date: string
  symptoms: SymptomLog
}
```

### 설계 결정 사항
- 기존 `digestiveStatus`는 제거하고 더 구체적인 `mealIntake`와 `postMealSymptom`으로 분리
- `abnormalSymptoms`는 배열로 정의하여 복수 선택 지원
- `notes` 필드는 완전히 제거 (UI에서 사용하지 않음)
- `customSymptoms`도 제거 (모든 필드를 명시적으로 정의)

---

## UI 컴포넌트 수정 사항

### FormData 타입 업데이트

**파일**: `app/symptom-check/page.tsx`

```typescript
type FormData = {
  painLevel: number;
  energyLevel: number;
  mealIntake: MealIntakeStatus;
  postMealSymptom: PostMealSymptom;
  bodyTemperature: BodyTemperatureStatus;
  bowelStatus: BowelStatus;
  mostDifficult: MostDifficultAspect;
  abnormalSymptoms: AbnormalSymptom[];
};
```

### defaultValues 수정

```typescript
defaultValues: {
  painLevel: 0,
  energyLevel: 5,
  mealIntake: "good",
  postMealSymptom: "none",
  bodyTemperature: "normal",
  bowelStatus: "normal",
  mostDifficult: "none",
  abnormalSymptoms: [],
}
```

### 주요 UI 변경 사항

| 섹션 | 현재 문제 | 수정 방법 |
|------|----------|----------|
| 섹션 3 (식사 섭취율) | `digestiveStatus`에 바인딩 | `{...register("mealIntake")}` |
| 섹션 4 (식사 후 증상) | `digestiveStatus`에 바인딩, moderate2 값 사용 | `{...register("postMealSymptom")}`, value 값 변경 |
| 섹션 5 (체온) | `digestiveStatus`에 바인딩 | `{...register("bodyTemperature")}` |
| 섹션 6 (배변) | `digestiveStatus`에 바인딩 | `{...register("bowelStatus")}` |
| 섹션 7 (가장 힘들었던 점) | 중복 섹션 존재, `digestiveStatus`에 바인딩 | 중복 제거, `{...register("mostDifficult")}` |
| 섹션 8 (특이 증상) | radio 버튼 사용 | checkbox로 변경, `abnormalSymptoms` 배열로 저장 |

### 식사 후 증상 value 매핑

```typescript
{
  'bloating': '더부룩함',
  'distension': '복부 팽만',
  'heartburn': '속쓰림',
  'nausea': '메스꺼움',
  'none': '없음'
}
```

---

## 데이터 저장 로직

### "없음" 상호 배타 처리

"특이 증상 체크"에서 "없음"이 선택되면 다른 증상들과 상호 배타적으로 동작:

```typescript
const { watch, setValue } = useForm<FormData>(...);

const handleAbnormalSymptomChange = (symptom: AbnormalSymptom, checked: boolean) => {
  const currentSymptoms = watch('abnormalSymptoms') || [];

  if (symptom === 'none') {
    // "없음" 선택 시 다른 모든 증상 해제
    setValue('abnormalSymptoms', checked ? ['none'] : []);
  } else {
    // 다른 증상 선택 시 "없음" 제거
    const filtered = currentSymptoms.filter(s => s !== 'none');
    if (checked) {
      setValue('abnormalSymptoms', [...filtered, symptom]);
    } else {
      setValue('abnormalSymptoms', filtered.filter(s => s !== symptom));
    }
  }
};
```

### onSubmit 함수

기존 `onSubmit` 함수는 수정 없이 그대로 사용 가능합니다. FormData 타입이 변경되므로 자동으로 새로운 필드들이 `saveSymptomLog` 함수에 전달됩니다.

### 유효성 검증 (선택적)

react-hook-form의 기본 기능만으로 충분하지만, 필요시 다음 규칙 추가 가능:
- `painLevel`, `energyLevel`: 0-10 범위 검증
- 모든 선택 필드: required 규칙 추가

---

## 데이터베이스 마이그레이션

### 마이그레이션 스크립트

**파일**: `supabase/migrations/008_update_symptom_schema.sql`

```sql
-- 기존 증상 데이터 리셋 (개발 단계이므로 기존 데이터 삭제)
DELETE FROM daily_logs WHERE symptoms IS NOT NULL;

-- symptoms 컬럼은 JSONB이므로 스키마 변경 불필요
-- 새로운 구조의 데이터를 저장할 준비 완료

-- 선택적: 샘플 데이터 추가 (테스트용)
-- INSERT INTO daily_logs (profile_id, log_date, symptoms) VALUES (
--   'sample-profile-id',
--   CURRENT_DATE,
--   '{
--     "painLevel": 3,
--     "energyLevel": 7,
--     "mealIntake": "good",
--     "postMealSymptom": "none",
--     "bodyTemperature": "normal",
--     "bowelStatus": "normal",
--     "mostDifficult": "none",
--     "abnormalSymptoms": []
--   }'::jsonb
-- );

COMMENT ON COLUMN daily_logs.symptoms IS
'증상 기록 (JSONB): painLevel(0-10), energyLevel(0-10), mealIntake, postMealSymptom, bodyTemperature, bowelStatus, mostDifficult, abnormalSymptoms[]';
```

### 마이그레이션 실행 방법

```bash
# Supabase CLI로 마이그레이션 실행
supabase db reset  # 로컬 개발 환경

# 또는 특정 마이그레이션만 실행
supabase migration up
```

### 주의사항
- 개발 환경에서만 DELETE 실행
- 프로덕션에서는 데이터 백업 후 진행
- JSONB 컬럼이므로 스키마 변경 없이 새 구조 사용 가능

---

## 테스트 고려사항

### 단위 테스트 업데이트

**파일**: `tests/pages/symptom-check.test.tsx`

```typescript
// 테스트 데이터 예시
const mockFormData: FormData = {
  painLevel: 5,
  energyLevel: 6,
  mealIntake: 'moderate',
  postMealSymptom: 'bloating',
  bodyTemperature: 'normal',
  bowelStatus: 'normal',
  mostDifficult: 'pain',
  abnormalSymptoms: ['wound_pain_increase'],
};
```

### 테스트 케이스

1. **폼 제출 테스트**: 모든 필드가 올바르게 저장되는지 확인
2. **"없음" 상호 배타 로직**: abnormalSymptoms에서 'none' 선택 시 다른 증상이 해제되는지 검증
3. **슬라이더 값 변경**: painLevel과 energyLevel이 0-10 범위 내에서 정상 작동하는지 확인
4. **라디오 버튼 선택**: 각 섹션의 radio input이 독립적으로 작동하는지 검증
5. **체크박스 복수 선택**: abnormalSymptoms에 여러 값이 배열로 저장되는지 확인

### 수동 테스트 체크리스트

- [ ] 모든 섹션의 값이 개별적으로 저장되는지 확인
- [ ] 특이 증상에서 여러 개 선택 가능한지 확인
- [ ] "없음" 선택 시 다른 체크박스가 해제되는지 확인
- [ ] 저장 후 대시보드로 이동하는지 확인
- [ ] 저장된 데이터가 DB에 올바른 구조로 들어갔는지 확인

---

## 구현 순서

1. **타입 정의 수정** (`lib/types/symptom.types.ts`)
2. **DB 마이그레이션 실행** (`supabase/migrations/008_update_symptom_schema.sql`)
3. **UI 컴포넌트 수정** (`app/symptom-check/page.tsx`)
   - FormData 타입 업데이트
   - defaultValues 수정
   - 중복 섹션 제거
   - 각 섹션의 register 필드명 수정
   - 특이 증상을 체크박스로 변경
   - "없음" 상호 배타 로직 추가
4. **테스트 코드 업데이트** (`tests/pages/symptom-check.test.tsx`)
5. **수동 테스트 수행**

---

## 예상 영향 범위

- **변경 파일**:
  - `lib/types/symptom.types.ts`
  - `app/symptom-check/page.tsx`
  - `supabase/migrations/008_update_symptom_schema.sql`
  - `tests/pages/symptom-check.test.tsx`

- **영향받지 않는 파일**:
  - `lib/services/log-service.ts` (JSONB 컬럼이므로 수정 불필요)
  - 기타 증상 로그를 조회하는 컴포넌트 (타입 변경만 반영하면 됨)

---

## 리스크 및 고려사항

1. **데이터 손실**: 기존 증상 데이터가 모두 삭제됨 (개발 단계이므로 허용됨)
2. **타입 호환성**: 기존 코드에서 `digestiveStatus` 필드를 참조하는 곳이 있다면 에러 발생 가능
3. **UI/UX 변경**: 특이 증상이 체크박스로 변경되어 사용자 경험이 달라짐

---

## 후속 작업 (선택적)

1. **대시보드에서 증상 데이터 표시**: 새로운 필드들을 대시보드에서 시각화
2. **증상 트렌드 분석**: 시간에 따른 증상 변화 추적 기능
3. **증상 알림**: 특정 증상이 악화되면 알림 제공
