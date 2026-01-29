# 증상 체크 페이지 데이터 구조 개선 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 증상 체크 페이지의 데이터 바인딩 버그를 수정하고 모든 질문 항목이 독립적으로 저장되도록 개선

**Architecture:** 타입 정의를 먼저 확장한 후 DB 마이그레이션을 실행하고, UI 컴포넌트를 수정합니다. TDD 방식으로 테스트를 먼저 작성하고 구현을 진행하며, 각 단계마다 커밋합니다.

**Tech Stack:** TypeScript, React, Next.js, react-hook-form, Supabase, Vitest

---

## Task 1: 타입 정의 업데이트

**Files:**
- Modify: `lib/types/symptom.types.ts:1-17`

**Step 1: 기존 타입 정의 확인**

Run: `cat lib/types/symptom.types.ts`
Expected: 기존 DIGESTIVE_STATUS와 SymptomLog 인터페이스 확인

**Step 2: 새로운 타입 정의로 교체**

기존 파일 전체를 다음 내용으로 교체:

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

**Step 3: 타입스크립트 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 타입 에러가 발생할 수 있음 (다음 단계에서 수정 예정)

**Step 4: 커밋**

```bash
git add lib/types/symptom.types.ts
git commit -m "refactor: 증상 로그 타입 정의를 세분화하여 각 질문 항목별 독립 필드 추가

- digestiveStatus를 mealIntake와 postMealSymptom으로 분리
- 체온, 배변, 힘든 점 등 새로운 필드 추가
- abnormalSymptoms를 배열로 정의하여 복수 선택 지원
- notes와 customSymptoms 제거

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: DB 마이그레이션 스크립트 생성

**Files:**
- Create: `supabase/migrations/008_update_symptom_schema.sql`

**Step 1: 마이그레이션 스크립트 작성**

```sql
-- 기존 증상 데이터 리셋 (개발 단계이므로 기존 데이터 삭제)
DELETE FROM daily_logs WHERE symptoms IS NOT NULL;

-- symptoms 컬럼은 JSONB이므로 스키마 변경 불필요
-- 새로운 구조의 데이터를 저장할 준비 완료

COMMENT ON COLUMN daily_logs.symptoms IS
'증상 기록 (JSONB): painLevel(0-10), energyLevel(0-10), mealIntake, postMealSymptom, bodyTemperature, bowelStatus, mostDifficult, abnormalSymptoms[]';
```

**Step 2: 마이그레이션 실행 (로컬 환경)**

Run: `npx supabase db reset`
Expected: 성공 메시지 또는 로컬 Supabase가 실행 중이어야 함

**Step 3: 커밋**

```bash
git add supabase/migrations/008_update_symptom_schema.sql
git commit -m "chore: 증상 데이터 스키마 업데이트를 위한 마이그레이션 추가

- 기존 증상 데이터 삭제 (개발 단계)
- JSONB 컬럼 주석 업데이트

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: UI 컴포넌트 - FormData 타입 업데이트

**Files:**
- Modify: `app/symptom-check/page.tsx:15-20`

**Step 1: FormData 타입 수정**

기존:
```typescript
type FormData = {
  painLevel: number;
  energyLevel: number;
  digestiveStatus: "good" | "moderate" | "bad" | "none";
  notes: string;
};
```

변경:
```typescript
import type {
  MealIntakeStatus,
  PostMealSymptom,
  BodyTemperatureStatus,
  BowelStatus,
  MostDifficultAspect,
  AbnormalSymptom
} from '@/lib/types/symptom.types';

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

**Step 2: defaultValues 수정 (line 26-33 부근)**

기존:
```typescript
defaultValues: {
  painLevel: 0,
  energyLevel: 5,
  digestiveStatus: "good",
  notes: "",
},
```

변경:
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
},
```

**Step 3: 타입스크립트 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: UI 부분에서 에러 발생 (다음 단계에서 수정)

**Step 4: 커밋**

```bash
git add app/symptom-check/page.tsx
git commit -m "refactor: 증상 체크 폼 데이터 타입 업데이트

- 새로운 타입 정의를 import하여 FormData 타입 확장
- defaultValues에 모든 새 필드 추가

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: UI 컴포넌트 - 식사 섭취율 섹션 수정

**Files:**
- Modify: `app/symptom-check/page.tsx:127-152`

**Step 1: 섹션 3 (식사 섭취율) register 필드명 변경**

기존 (line 140):
```typescript
{...register("digestiveStatus")}
```

변경:
```typescript
{...register("mealIntake")}
```

**Step 2: 타입스크립트 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러가 줄어들어야 함

**Step 3: 커밋**

```bash
git add app/symptom-check/page.tsx
git commit -m "fix: 식사 섭취율 섹션을 mealIntake 필드에 바인딩

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: UI 컴포넌트 - 식사 후 증상 섹션 수정

**Files:**
- Modify: `app/symptom-check/page.tsx:153-182`

**Step 1: 섹션 4 (식사 후 증상) 수정**

기존 value 매핑:
```typescript
{status === "none" && "더부룩함"}
{status === "bad" && "복부 팽만"}
{status === "moderate" && "속쓰림"}
{status === "moderate2" && "메스꺼움"}
{status === "good" && "없음"}
```

변경된 배열과 매핑:
```typescript
{["bloating", "distension", "heartburn", "nausea", "none"].map((status) => (
  <label
    key={status}
    className="flex items-center space-x-4 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
  >
    <input
      type="radio"
      value={status}
      {...register("postMealSymptom")}
      className="accent-blue-600"
    />
    <span className="text-base text-gray-700 font-semibold whitespace-pre-line">
      {status === "bloating" && "더부룩함"}
      {status === "distension" && "복부 팽만"}
      {status === "heartburn" && "속쓰림"}
      {status === "nausea" && "메스꺼움"}
      {status === "none" && "없음"}
    </span>
  </label>
))}
```

**Step 2: 타입스크립트 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러가 줄어들어야 함

**Step 3: 커밋**

```bash
git add app/symptom-check/page.tsx
git commit -m "fix: 식사 후 증상 섹션을 postMealSymptom 필드에 바인딩하고 value 값 변경

- moderate2를 nausea로 변경
- 각 value를 의미있는 영문 키로 변경

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: UI 컴포넌트 - 체온 이상 여부 섹션 수정

**Files:**
- Modify: `app/symptom-check/page.tsx:183-207`

**Step 1: 섹션 5 (체온 이상 여부) 수정**

기존:
```typescript
{["good", "moderate", "bad"].map((status) => (
  ...
  {...register("digestiveStatus")}
  ...
))}
```

변경:
```typescript
{["normal", "mild_fever", "high_fever"].map((status) => (
  <label
    key={status}
    className="flex items-center space-x-4 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
  >
    <input
      type="radio"
      value={status}
      {...register("bodyTemperature")}
      className="accent-blue-600"
    />
    <span className="text-base text-gray-700 font-semibold">
      {status === "normal" && "정상"}
      {status === "mild_fever" && "미열"}
      {status === "high_fever" && "38도 이상"}
    </span>
  </label>
))}
```

**Step 2: 타입스크립트 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러가 줄어들어야 함

**Step 3: 커밋**

```bash
git add app/symptom-check/page.tsx
git commit -m "fix: 체온 이상 여부 섹션을 bodyTemperature 필드에 바인딩

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: UI 컴포넌트 - 배변 상태 섹션 수정

**Files:**
- Modify: `app/symptom-check/page.tsx:208-233`

**Step 1: 섹션 6 (배변 상태) 수정**

기존:
```typescript
{...register("digestiveStatus")}
```

변경:
```typescript
{...register("bowelStatus")}
```

value는 이미 "good", "moderate", "bad", "none"이므로 "normal", "constipation", "diarrhea", "none"으로 변경:

```typescript
{["normal", "constipation", "diarrhea", "none"].map((status) => (
  <label
    key={status}
    className="flex items-center space-x-4 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
  >
    <input
      type="radio"
      value={status}
      {...register("bowelStatus")}
      className="accent-blue-600"
    />
    <span className="text-base text-gray-700 font-semibold">
      {status === "normal" && "정상"}
      {status === "constipation" && "변비"}
      {status === "diarrhea" && "설사"}
      {status === "none" && "아직 없음"}
    </span>
  </label>
))}
```

**Step 2: 타입스크립트 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러가 줄어들어야 함

**Step 3: 커밋**

```bash
git add app/symptom-check/page.tsx
git commit -m "fix: 배변 상태 섹션을 bowelStatus 필드에 바인딩

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: UI 컴포넌트 - 가장 힘들었던 점 섹션 수정 및 중복 제거

**Files:**
- Modify: `app/symptom-check/page.tsx:234-293`

**Step 1: 중복된 섹션 7 제거 (line 264-293)**

264-293번 줄의 두 번째 "오늘 가장 힘들었던 점" 섹션을 완전히 삭제

**Step 2: 첫 번째 섹션 7 (line 234-263) 수정**

기존:
```typescript
{["good", "moderate", "moderate2", "bad", "none"].map((status) => (
  ...
  {...register("digestiveStatus")}
  ...
))}
```

변경:
```typescript
{["meal", "pain", "sleep", "activity", "none"].map((status) => (
  <label
    key={status}
    className="flex items-center space-x-4 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
  >
    <input
      type="radio"
      value={status}
      {...register("mostDifficult")}
      className="accent-blue-600"
    />
    <span className="text-base text-gray-700 font-semibold">
      {status === "meal" && "식사"}
      {status === "pain" && "통증"}
      {status === "sleep" && "수면"}
      {status === "activity" && "활동"}
      {status === "none" && "없음"}
    </span>
  </label>
))}
```

**Step 3: 타입스크립트 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러가 줄어들어야 함

**Step 4: 커밋**

```bash
git add app/symptom-check/page.tsx
git commit -m "fix: 가장 힘들었던 점 섹션의 중복 제거 및 mostDifficult 필드에 바인딩

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: UI 컴포넌트 - 특이 증상 체크 섹션을 체크박스로 변경

**Files:**
- Modify: `app/symptom-check/page.tsx:294-323`

**Step 1: 섹션 8 (특이 증상 체크)를 radio에서 checkbox로 변경**

기존:
```typescript
<input
  type="radio"
  value={status}
  {...register("digestiveStatus")}
  className="accent-blue-600"
/>
```

변경 (Controller 사용):
```typescript
<Controller
  name="abnormalSymptoms"
  control={control}
  render={({ field: { value, onChange } }) => (
    <div className="grid grid-cols-2 gap-2 pt-4">
      {["wound_pain_increase", "wound_redness", "severe_abdominal_pain", "vomiting", "none"].map((symptom) => {
        const checked = value?.includes(symptom as AbnormalSymptom) || false;
        return (
          <label
            key={symptom}
            className="flex items-center space-x-4 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                const newValue = e.target.checked;
                const currentSymptoms = value || [];

                if (symptom === 'none') {
                  // "없음" 선택 시 다른 모든 증상 해제
                  onChange(newValue ? ['none'] : []);
                } else {
                  // 다른 증상 선택 시 "없음" 제거
                  const filtered = currentSymptoms.filter(s => s !== 'none');
                  if (newValue) {
                    onChange([...filtered, symptom as AbnormalSymptom]);
                  } else {
                    onChange(filtered.filter(s => s !== symptom));
                  }
                }
              }}
              className="accent-blue-600"
            />
            <span className="text-base text-gray-700 font-semibold whitespace-pre-line">
              {symptom === "wound_pain_increase" && "상처 통증\\n증가"}
              {symptom === "wound_redness" && "상처 부위\\n발적 / 열감"}
              {symptom === "severe_abdominal_pain" && "심한 복부\\n통증"}
              {symptom === "vomiting" && "구토"}
              {symptom === "none" && "없음"}
            </span>
          </label>
        );
      })}
    </div>
  )}
/>
```

**Step 2: 타입스크립트 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 3: 커밋**

```bash
git add app/symptom-check/page.tsx
git commit -m "feat: 특이 증상 체크를 체크박스로 변경하고 '없음' 상호 배타 로직 구현

- radio에서 checkbox로 변경하여 복수 선택 가능
- '없음' 선택 시 다른 증상 자동 해제
- 다른 증상 선택 시 '없음' 자동 해제

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: UI 컴포넌트 - 기타 메모 섹션 제거

**Files:**
- Modify: `app/symptom-check/page.tsx:325-334`

**Step 1: 주석 처리된 notes textarea 완전히 제거**

325-334번 줄의 주석 처리된 코드 블록을 완전히 삭제

**Step 2: 타입스크립트 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 3: 커밋**

```bash
git add app/symptom-check/page.tsx
git commit -m "refactor: 사용하지 않는 기타 메모 섹션 제거

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: 테스트 작성 - 타입 및 mock 데이터 업데이트

**Files:**
- Modify: `tests/pages/symptom-check.test.tsx`

**Step 1: 실패하는 테스트 작성**

기존 테스트를 새로운 구조에 맞춰 수정:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SymptomCheckPage from '@/app/symptom-check/page'
import { saveSymptomLog } from '@/lib/services/log-service'

// Mock useRouter
const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: vi.fn(),
        back: mockBack,
    }),
}))

// Mock saveSymptomLog service
vi.mock('@/lib/services/log-service', () => ({
    saveSymptomLog: vi.fn().mockResolvedValue(true)
}))

// Mock profile
vi.mock('@/lib/local-storage', () => ({
    getProfile: () => ({
        id: 'profile-123',
        user_id: 'user-123',
        surgery_date: '2026-05-01'
    })
}))

describe('Symptom Check Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders symptom check form with all sections', () => {
        render(<SymptomCheckPage />)
        expect(screen.getByText('컨디션 기록')).toBeDefined()
        expect(screen.getByText(/통증 정도/i)).toBeDefined()
        expect(screen.getByText(/기력/i)).toBeDefined()
        expect(screen.getByText(/식사 섭취율/i)).toBeDefined()
        expect(screen.getByText(/식사 후 증상/i)).toBeDefined()
        expect(screen.getByText(/체온 이상 여부/i)).toBeDefined()
        expect(screen.getByText(/배변 상태/i)).toBeDefined()
        expect(screen.getByText(/오늘 가장 힘들었던 점/i)).toBeDefined()
        expect(screen.getByText(/특이 증상 체크/i)).toBeDefined()
        expect(screen.getByRole('button', { name: /저장하기/i })).toBeDefined()
    })

    it('submits form with all field values', async () => {
        render(<SymptomCheckPage />)

        // 폼 제출
        const submitButton = screen.getByRole('button', { name: /저장하기/i })
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(saveSymptomLog).toHaveBeenCalledWith(
                'profile-123',
                expect.any(String),
                expect.objectContaining({
                    painLevel: expect.any(Number),
                    energyLevel: expect.any(Number),
                    mealIntake: expect.any(String),
                    postMealSymptom: expect.any(String),
                    bodyTemperature: expect.any(String),
                    bowelStatus: expect.any(String),
                    mostDifficult: expect.any(String),
                    abnormalSymptoms: expect.any(Array),
                })
            )
        })
    })

    it('handles abnormal symptoms checkbox - none exclusivity', async () => {
        // 이 테스트는 UI 상호작용을 검증
        // "없음" 체크 시 다른 증상들이 해제되는지 확인
        // 구현 후 추가 작성
    })
})
```

**Step 2: 테스트 실행하여 실패 확인**

Run: `npm test tests/pages/symptom-check.test.tsx`
Expected: 일부 테스트 통과, abnormal symptoms 테스트는 미구현

**Step 3: 커밋**

```bash
git add tests/pages/symptom-check.test.tsx
git commit -m "test: 증상 체크 페이지 테스트 업데이트

- 새로운 필드들을 포함하도록 테스트 수정
- 폼 제출 시 모든 필드가 저장되는지 검증
- 특이 증상 상호 배타 로직 테스트 스켈레톤 추가

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: 수동 테스트 및 검증

**Files:**
- N/A (수동 테스트)

**Step 1: 개발 서버 실행**

Run: `npm run dev`
Expected: http://localhost:3000 에서 서버 시작

**Step 2: 증상 체크 페이지 접근**

브라우저에서 http://localhost:3000/symptom-check 접근

**Step 3: 수동 테스트 체크리스트 수행**

- [ ] 모든 섹션이 표시되는지 확인
- [ ] 각 섹션의 라디오 버튼이 독립적으로 작동하는지 확인
- [ ] 특이 증상에서 여러 개 체크박스 선택 가능한지 확인
- [ ] 특이 증상에서 "없음" 선택 시 다른 체크박스가 해제되는지 확인
- [ ] 다른 증상 선택 시 "없음"이 해제되는지 확인
- [ ] 폼 제출 시 모든 값이 저장되는지 확인 (개발자 도구 콘솔)
- [ ] 저장 후 대시보드로 이동하는지 확인

**Step 4: 브라우저 콘솔에서 저장된 데이터 확인**

개발자 도구에서 saveSymptomLog 호출 시 전달되는 데이터 구조 확인:
```json
{
  "painLevel": 3,
  "energyLevel": 7,
  "mealIntake": "good",
  "postMealSymptom": "none",
  "bodyTemperature": "normal",
  "bowelStatus": "normal",
  "mostDifficult": "none",
  "abnormalSymptoms": []
}
```

**Step 5: 모든 테스트 실행**

Run: `npm test`
Expected: 모든 테스트 통과

**Step 6: 타입스크립트 컴파일 최종 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 7: 최종 커밋**

```bash
git add -A
git commit -m "chore: 증상 체크 페이지 데이터 구조 개선 완료

수동 테스트 완료:
- 모든 섹션 독립적으로 작동 확인
- 특이 증상 복수 선택 및 상호 배타 로직 검증
- 데이터 저장 및 라우팅 정상 작동 확인

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 구현 완료 후 체크리스트

- [ ] 타입 정의 업데이트 완료
- [ ] DB 마이그레이션 실행 완료
- [ ] UI 컴포넌트 수정 완료 (8개 섹션)
- [ ] 특이 증상 체크박스 및 상호 배타 로직 구현
- [ ] 테스트 코드 업데이트 완료
- [ ] 수동 테스트 통과
- [ ] 타입스크립트 컴파일 에러 없음
- [ ] 모든 단계 커밋 완료

---

## 예상 소요 시간

- Task 1-2: 타입 및 마이그레이션 (10분)
- Task 3-10: UI 컴포넌트 수정 (30분)
- Task 11: 테스트 작성 (15분)
- Task 12: 수동 테스트 및 검증 (15분)
- **총 예상 시간**: 약 70분

---

## 문제 해결 가이드

**문제 1: Supabase 마이그레이션 실행 실패**
- 로컬 Supabase가 실행 중인지 확인: `npx supabase status`
- 실행 중이 아니면: `npx supabase start`

**문제 2: 타입 에러가 해결되지 않음**
- IDE를 재시작하여 TypeScript 언어 서버 리프레시
- `node_modules/.cache` 삭제 후 재빌드

**문제 3: 체크박스 상호 배타 로직이 작동하지 않음**
- react-hook-form의 Controller를 제대로 사용하는지 확인
- onChange 핸들러에서 배열을 제대로 업데이트하는지 확인

**문제 4: 테스트 실패**
- Mock 데이터가 새로운 타입 구조와 일치하는지 확인
- 테스트에서 사용하는 selector가 실제 UI와 일치하는지 확인
