# 하이브리드 AI 온보딩 구현 계획 - Phase 5: 고급 프로파일링 및 통합

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 고급 의학 지표 입력 폼, 추출 결과 확인 화면, 데이터베이스 통합 및 프로파일 저장 완성

**Architecture:** 공통 AdvancedMetricsForm 컴포넌트를 문서/수동 온보딩 양쪽에서 재사용. 추출 결과 확인 화면에서 고급 지표 토글 및 수정 지원. Supabase 스키마 확장 및 프로파일 저장 로직 통합.

**Tech Stack:** Next.js 14 App Router, React Hook Form, Zustand, Supabase, Zod

---

## Phase 5: 고급 프로파일링 및 데이터베이스 통합

### Task 16: AdvancedMetricsForm 공통 컴포넌트

**Files:**
- Create: `components/onboarding/advanced-metrics-form.tsx`

**Step 1: 타입 정의 및 폼 컴포넌트 작성**

Create: `components/onboarding/advanced-metrics-form.tsx`

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface AdvancedMetricsFormData {
  nrs_2002_score?: number
  weight_change_6m?: number
  bmi?: number
  sga_grade?: 'A' | 'B' | 'C'
  serum_albumin?: number
  oral_intake_possible?: boolean
  expected_fasting_days?: number
  intake_rate?: number
  gastric_emptying_delayed?: boolean
  has_gerd?: boolean
  has_sarcopenia?: boolean
}

interface AdvancedMetricsFormProps {
  defaultValues?: Partial<AdvancedMetricsFormData>
  onSubmit: (data: AdvancedMetricsFormData) => void
  onSkip?: () => void
  showSkipButton?: boolean
}

export function AdvancedMetricsForm({
  defaultValues,
  onSubmit,
  onSkip,
  showSkipButton = true
}: AdvancedMetricsFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<AdvancedMetricsFormData>({
    defaultValues
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 영양 위험도 평가 */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">📊 영양 위험도 평가</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              NRS-2002 점수 (0-7점)
            </label>
            <input
              type="number"
              min="0"
              max="7"
              step="1"
              placeholder="예: 4"
              {...register('nrs_2002_score', {
                valueAsNumber: true,
                min: 0,
                max: 7
              })}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              ≥3점: 영양 위험, ≥5점: 고위험
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              혈청 알부민 (g/L)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="예: 35.5"
              {...register('serum_albumin', { valueAsNumber: true })}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              {'<'}30 g/L: 고위험 (단백질 결핍)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              6개월 체중 변화 (kg)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="예: -8 (감소), +3 (증가)"
              {...register('weight_change_6m', { valueAsNumber: true })}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              10-15% 감소 시 중증 위험
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              SGA 등급 (Subjective Global Assessment)
            </label>
            <select
              {...register('sga_grade')}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">선택 안함</option>
              <option value="A">A - 양호</option>
              <option value="B">B - 경증/중등도 영양불량</option>
              <option value="C">C - 중증 영양불량</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 섭취 능력 */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">🍽️ 섭취 능력</h3>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('oral_intake_possible')}
                className="w-5 h-5"
              />
              <span className="font-medium">경구 섭취 가능</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              예상 금식 기간 (일)
            </label>
            <input
              type="number"
              min="0"
              placeholder="예: 7"
              {...register('expected_fasting_days', { valueAsNumber: true })}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              {'>'}5일: 영양 공급 경로 고려, {'>'}14일: 고위험
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              현재 섭취율 (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="예: 60"
              {...register('intake_rate', { valueAsNumber: true })}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              필요량 대비 섭취 비율, {'<'}50%: 추가 보충 필요
            </p>
          </div>
        </div>
      </Card>

      {/* 소화기 기능 */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">🫀 소화기 및 대사</h3>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('gastric_emptying_delayed')}
              className="w-5 h-5"
            />
            <span className="font-medium">위배출 지연</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('has_gerd')}
              className="w-5 h-5"
            />
            <span className="font-medium">위식도역류질환 (GERD)</span>
          </label>
        </div>
      </Card>

      {/* 근육/체력 */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">💪 근육 상태</h3>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('has_sarcopenia')}
              className="w-5 h-5"
            />
            <span className="font-medium">근감소증 (Sarcopenia)</span>
          </label>
          <p className="text-xs text-gray-500">
            근감소증이 있으면 합병증 위험 증가 및 단백질 요구량 상승
          </p>
        </div>
      </Card>

      {/* 안내 메시지 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          💡 이 정보는 더 정밀한 영양 계산과 식단 추천에 활용됩니다.
          검사 결과가 없는 항목은 비워두셔도 됩니다.
        </p>
      </div>

      {/* 버튼 */}
      <div className="flex justify-between">
        {showSkipButton && onSkip && (
          <Button type="button" variant="secondary" onClick={onSkip}>
            건너뛰기
          </Button>
        )}
        <Button type="submit" size="lg" className="ml-auto">
          완료
        </Button>
      </div>
    </form>
  )
}
```

**Step 2: Commit**

```bash
git add components/onboarding/advanced-metrics-form.tsx
git commit -m "feat: add AdvancedMetricsForm common component"
```

---

### Task 17: 추출 결과 확인 화면

**Files:**
- Create: `app/onboarding/document/review/page.tsx`

**Step 1: 확인 화면 페이지 작성**

Create: `app/onboarding/document/review/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDocumentOnboardingStore } from '@/lib/stores/document-onboarding-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BasicFieldReview } from '@/components/onboarding/basic-field-review'
import { AdvancedFieldReview } from '@/components/onboarding/advanced-field-review'
import { ToggleSwitch } from '@/components/ui/toggle-switch'

export default function ReviewPage() {
  const router = useRouter()
  const {
    extractedData,
    advancedEnabled,
    setAdvancedEnabled,
    updateReviewedData
  } = useDocumentOnboardingStore()

  const [editedData, setEditedData] = useState(extractedData)
  const [showAdvancedInput, setShowAdvancedInput] = useState(false)

  useEffect(() => {
    if (!extractedData) {
      router.push('/onboarding/document')
    }
  }, [extractedData, router])

  if (!extractedData) return null

  const handleFieldEdit = (category: 'basic' | 'advanced', field: string, value: any) => {
    setEditedData(prev => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [field]: {
          ...prev![category][field],
          value,
          confidence: 1.0
        }
      }
    }))
  }

  const handleNext = () => {
    updateReviewedData(editedData!)

    if (showAdvancedInput) {
      router.push('/onboarding/document/advanced')
    } else {
      // TODO: 바로 저장 (Task 20에서 구현)
      router.push('/dashboard')
    }
  }

  const getNutritionRiskLevel = (score: number): 'normal' | 'medium' | 'high' => {
    if (score >= 5) return 'high'
    if (score >= 3) return 'medium'
    return 'normal'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">추출 결과 확인</h1>

        {/* 기본 정보 섹션 */}
        <Card className="mb-6 p-8">
          <h2 className="text-2xl font-bold mb-6">✅ 기본 정보</h2>

          <BasicFieldReview
            field={editedData!.basic.surgery_type}
            label="수술 종류"
            options={[
              { value: 'gastric_resection', label: '위절제술' },
              { value: 'colon_resection', label: '대장절제술' },
              { value: 'tkr', label: '슬관절 치환술' },
              { value: 'spinal_fusion', label: '척추 유합술' },
              { value: 'cholecystectomy', label: '담낭절제술' }
            ]}
            onEdit={(value) => handleFieldEdit('basic', 'surgery_type', value)}
          />

          <BasicFieldReview
            field={editedData!.basic.surgery_date}
            label="수술 날짜"
            type="date"
            onEdit={(value) => handleFieldEdit('basic', 'surgery_date', value)}
          />

          {editedData!.basic.age.value && (
            <BasicFieldReview
              field={editedData!.basic.age}
              label="나이"
              type="number"
              onEdit={(value) => handleFieldEdit('basic', 'age', value)}
            />
          )}

          {editedData!.basic.weight.value && (
            <BasicFieldReview
              field={editedData!.basic.weight}
              label="체중 (kg)"
              type="number"
              onEdit={(value) => handleFieldEdit('basic', 'weight', value)}
            />
          )}

          {editedData!.basic.digestive_capacity.value && (
            <BasicFieldReview
              field={editedData!.basic.digestive_capacity}
              label="소화 능력"
              options={[
                { value: 'good', label: '좋음' },
                { value: 'moderate', label: '보통' },
                { value: 'poor', label: '나쁨' }
              ]}
              onEdit={(value) => handleFieldEdit('basic', 'digestive_capacity', value)}
            />
          )}
        </Card>

        {/* 고급 의학 지표 섹션 */}
        <Card className="mb-6 p-8 border-2 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">🔬 고급 의학 지표</h2>
              <p className="text-sm text-gray-600">
                더 정밀한 영양 평가를 위한 임상 지표
              </p>
            </div>

            {extractedData.hasAdvancedData && (
              <ToggleSwitch
                checked={advancedEnabled}
                onChange={setAdvancedEnabled}
              />
            )}
          </div>

          {extractedData.hasAdvancedData ? (
            // 케이스 A: 고급 지표 감지됨
            advancedEnabled && (
              <div className="space-y-4">
                {editedData!.advanced.nrs_2002_score.value !== null && (
                  <AdvancedFieldReview
                    field={editedData!.advanced.nrs_2002_score}
                    label="NRS-2002 점수"
                    unit="점"
                    warningLevel={getNutritionRiskLevel(editedData!.advanced.nrs_2002_score.value)}
                    onEdit={(value) => handleFieldEdit('advanced', 'nrs_2002_score', value)}
                  />
                )}

                {editedData!.advanced.serum_albumin.value !== null && (
                  <AdvancedFieldReview
                    field={editedData!.advanced.serum_albumin}
                    label="혈청 알부민"
                    unit="g/L"
                    warningLevel={editedData!.advanced.serum_albumin.value < 30 ? 'high' : 'normal'}
                    onEdit={(value) => handleFieldEdit('advanced', 'serum_albumin', value)}
                  />
                )}

                {editedData!.advanced.weight_change_6m.value !== null && (
                  <AdvancedFieldReview
                    field={editedData!.advanced.weight_change_6m}
                    label="6개월 체중 변화"
                    unit="kg"
                    onEdit={(value) => handleFieldEdit('advanced', 'weight_change_6m', value)}
                  />
                )}

                {editedData!.advanced.has_sarcopenia.value && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-medium">⚠️ 근감소증 의심됨</p>
                  </div>
                )}
              </div>
            )
          ) : (
            // 케이스 B: 고급 지표 미감지
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-gray-700 mb-4">
                진단서에서 추가 임상 지표를 발견하지 못했습니다
              </p>
              <p className="text-sm text-gray-600 mb-6">
                NRS-2002 점수, 혈청 알부민 등의 임상 검사 결과가 있다면<br/>
                더 정밀한 식단 추천이 가능합니다
              </p>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedInput(true)}
              >
                직접 입력하기
              </Button>
              <p className="text-xs text-gray-500 mt-2">또는 건너뛰기</p>
            </div>
          )}
        </Card>

        {/* 네비게이션 */}
        <div className="flex justify-between">
          <Button variant="secondary" onClick={() => router.back()}>
            이전
          </Button>
          <Button onClick={handleNext} size="lg">
            {showAdvancedInput ? '고급 지표 입력' : '다음'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: 개발 서버에서 확인**

Run: `npm run dev`

브라우저에서 문서 업로드 후 확인 화면 테스트

Expected: 추출된 필드 표시, 신뢰도 점수 표시, 수정 기능 작동

**Step 3: Commit**

```bash
git add app/onboarding/document/review/page.tsx
git commit -m "feat: add document review page with field validation"
```

---

### Task 18: 문서 온보딩 고급 지표 입력 페이지

**Files:**
- Create: `app/onboarding/document/advanced/page.tsx`

**Step 1: 페이지 작성**

Create: `app/onboarding/document/advanced/page.tsx`

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useDocumentOnboardingStore } from '@/lib/stores/document-onboarding-store'
import { AdvancedMetricsForm, type AdvancedMetricsFormData } from '@/components/onboarding/advanced-metrics-form'

export default function DocumentAdvancedPage() {
  const router = useRouter()
  const { extractedData, reviewedData, setAdvancedEnabled, reset } = useDocumentOnboardingStore()

  // 추출된 고급 데이터를 기본값으로 사용
  const defaultValues: Partial<AdvancedMetricsFormData> = {
    nrs_2002_score: extractedData?.advanced.nrs_2002_score.value || undefined,
    serum_albumin: extractedData?.advanced.serum_albumin.value || undefined,
    weight_change_6m: extractedData?.advanced.weight_change_6m.value || undefined,
    sga_grade: extractedData?.advanced.sga_grade.value || undefined,
    has_sarcopenia: extractedData?.advanced.has_sarcopenia.value || undefined,
    has_gerd: extractedData?.advanced.has_gerd.value || undefined,
    gastric_emptying_delayed: extractedData?.advanced.gastric_emptying_delayed.value || undefined,
    oral_intake_possible: extractedData?.advanced.oral_intake_possible.value || undefined,
    expected_fasting_days: extractedData?.advanced.expected_fasting_days.value || undefined,
    intake_rate: extractedData?.advanced.intake_rate.value || undefined
  }

  const handleSubmit = async (data: AdvancedMetricsFormData) => {
    // TODO: Task 20에서 프로파일 저장 로직 구현
    console.log('Advanced metrics:', data)
    reset()
    router.push('/dashboard')
  }

  const handleSkip = async () => {
    setAdvancedEnabled(false)
    // TODO: Task 20에서 저장 로직 구현
    reset()
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center">고급 의학 지표 입력</h1>
        <p className="text-center text-gray-600 mb-8">
          임상 검사 결과를 입력하면 더 정밀한 식단 추천이 가능합니다
        </p>

        <AdvancedMetricsForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          showSkipButton={true}
        />
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/onboarding/document/advanced/page.tsx
git commit -m "feat: add document onboarding advanced metrics page"
```

---

### Task 19: 수동 입력 고급 지표 페이지 및 선택 화면

**Files:**
- Create: `app/onboarding/manual/advanced-prompt/page.tsx`
- Create: `app/onboarding/manual/advanced/page.tsx`
- Modify: `components/onboarding/health-status-step.tsx`

**Step 1: 고급 지표 선택 화면 작성**

Create: `app/onboarding/manual/advanced-prompt/page.tsx`

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdvancedPromptPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          추가 의학 지표를 입력하시겠습니까?
        </h1>

        <Card className="p-8 mb-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🔬</div>
            <h2 className="text-2xl font-bold mb-4">더 정밀한 식단 추천</h2>
            <p className="text-gray-600 mb-4">
              임상 검사 결과(NRS-2002, 혈청 알부민 등)를 입력하면<br/>
              더 정밀한 영양 평가와 식단 추천이 가능합니다
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold mb-2">📋 입력 가능한 지표</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• NRS-2002 영양 위험 점수</li>
              <li>• 혈청 알부민 수치</li>
              <li>• 체중 변화 추이</li>
              <li>• 근감소증 여부</li>
              <li>• 기타 임상 검사 결과</li>
            </ul>
          </div>

          <p className="text-sm text-gray-500 text-center mb-6">
            검사 결과가 없어도 기본 서비스 이용에는 문제가 없습니다
          </p>

          <div className="flex gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                // TODO: Task 20에서 저장 로직 구현
                router.push('/dashboard')
              }}
              className="flex-1"
            >
              건너뛰기
            </Button>
            <Button
              size="lg"
              onClick={() => router.push('/onboarding/manual/advanced')}
              className="flex-1"
            >
              입력하기
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
```

**Step 2: 수동 입력 고급 지표 페이지 작성**

Create: `app/onboarding/manual/advanced/page.tsx`

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { AdvancedMetricsForm, type AdvancedMetricsFormData } from '@/components/onboarding/advanced-metrics-form'

export default function ManualAdvancedPage() {
  const router = useRouter()
  const { formData, resetOnboarding } = useOnboardingStore()

  const handleSubmit = async (data: AdvancedMetricsFormData) => {
    // TODO: Task 20에서 저장 로직 구현
    console.log('Manual advanced metrics:', data)
    resetOnboarding()
    router.push('/dashboard')
  }

  const handleSkip = async () => {
    // TODO: Task 20에서 저장 로직 구현
    resetOnboarding()
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center">추가 임상 지표</h1>
        <p className="text-center text-gray-600 mb-8">
          임상 검사 결과가 있다면 입력해주세요 (선택사항)
        </p>

        <AdvancedMetricsForm
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          showSkipButton={true}
        />
      </div>
    </div>
  )
}
```

**Step 3: health-status-step 수정 (Step 4로 연결)**

Modify: `components/onboarding/health-status-step.tsx`

기존 `onSubmit` 함수를 수정하여 advanced-prompt로 이동:

```typescript
// 기존 코드에서 onSubmit 부분만 수정
const onSubmit = (data: HealthStatusInput) => {
  updateFormData(data)
  router.push('/onboarding/manual/advanced-prompt')
}
```

**Step 4: Commit**

```bash
git add app/onboarding/manual/advanced-prompt/page.tsx app/onboarding/manual/advanced/page.tsx components/onboarding/health-status-step.tsx
git commit -m "feat: add manual onboarding advanced metrics flow"
```

---

### Task 20: 데이터베이스 스키마 확장 및 마이그레이션

**Files:**
- Create: `supabase/migrations/20260127_add_advanced_profile_fields.sql`

**Step 1: 마이그레이션 SQL 작성**

Create: `supabase/migrations/20260127_add_advanced_profile_fields.sql`

```sql
-- user_profiles 테이블에 고급 프로파일 필드 추가
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS advanced_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS advanced_metrics JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual'
    CHECK (data_source IN ('manual', 'document'));

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_data_source ON user_profiles(data_source);
CREATE INDEX IF NOT EXISTS idx_profiles_advanced_enabled ON user_profiles(advanced_enabled);

-- JSONB 필드에 GIN 인덱스 (고급 쿼리용)
CREATE INDEX IF NOT EXISTS idx_profiles_advanced_metrics ON user_profiles USING GIN (advanced_metrics);

-- 코멘트 추가
COMMENT ON COLUMN user_profiles.advanced_enabled IS '고급 의학 지표 사용 여부';
COMMENT ON COLUMN user_profiles.advanced_metrics IS 'NRS-2002, 알부민 등 고급 지표 JSON';
COMMENT ON COLUMN user_profiles.data_source IS '데이터 출처: manual 또는 document';
```

**Step 2: Supabase에서 마이그레이션 실행**

Supabase Dashboard에서 SQL Editor를 열고 위 SQL 실행

또는 Supabase CLI 사용:
```bash
supabase db push
```

Expected: 테이블 확장 완료

**Step 3: Commit**

```bash
git add supabase/migrations/20260127_add_advanced_profile_fields.sql
git commit -m "feat: add advanced profile fields to user_profiles table"
```

---

### Task 21: 프로파일 저장 로직 통합 (profile-actions 확장)

**Files:**
- Modify: `lib/actions/profile-actions.ts`

**Step 1: CreateProfileInput 확장**

Modify: `lib/actions/profile-actions.ts`

기존 타입 확장:

```typescript
'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { AdvancedMedicalMetrics } from '@/lib/types/medical-profile'

export interface CreateProfileInput {
  surgery_type: string
  surgery_date: string
  age?: number
  weight?: number
  height?: number
  digestive_capacity: 'good' | 'moderate' | 'poor'
  comorbidities: string[]
  // 신규 필드
  advanced_enabled?: boolean
  advanced_metrics?: AdvancedMedicalMetrics
  data_source?: 'manual' | 'document'
}

export interface CreateProfileResponse {
  success: boolean
  localStorageKey?: string
  profile?: any
  error?: string
}

export async function createProfile(input: CreateProfileInput): Promise<CreateProfileResponse> {
  try {
    const localStorageKey = uuidv4()

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        surgery_type: input.surgery_type,
        surgery_date: input.surgery_date,
        digestive_capacity: input.digestive_capacity,
        comorbidities: input.comorbidities,
        local_storage_key: localStorageKey,
        // 신규 필드 추가
        advanced_enabled: input.advanced_enabled || false,
        advanced_metrics: input.advanced_metrics || null,
        data_source: input.data_source || 'manual'
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Profile creation error:', error)
      return { success: false, localStorageKey, profile: null, error: error.message }
    }

    return { success: true, localStorageKey, profile: data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to create profile' }
  }
}
```

**Step 2: Commit**

```bash
git add lib/actions/profile-actions.ts
git commit -m "feat: extend profile actions to support advanced metrics"
```

---

### Task 22: 문서 온보딩 저장 로직 완성

**Files:**
- Modify: `app/onboarding/document/advanced/page.tsx`
- Modify: `app/onboarding/document/review/page.tsx`

**Step 1: document/advanced 저장 로직 추가**

Modify: `app/onboarding/document/advanced/page.tsx`

handleSubmit 함수 완성:

```typescript
import { createProfile } from '@/lib/actions/profile-actions'
import { saveProfile } from '@/lib/local-storage'

const handleSubmit = async (data: AdvancedMetricsFormData) => {
  try {
    // 모든 데이터 병합
    const completeProfile = {
      surgery_type: reviewedData?.basic.surgery_type.value || extractedData?.basic.surgery_type.value!,
      surgery_date: reviewedData?.basic.surgery_date.value || extractedData?.basic.surgery_date.value!,
      age: reviewedData?.basic.age.value || extractedData?.basic.age.value,
      weight: reviewedData?.basic.weight.value || extractedData?.basic.weight.value,
      height: reviewedData?.basic.height.value || extractedData?.basic.height.value,
      digestive_capacity: reviewedData?.basic.digestive_capacity.value || extractedData?.basic.digestive_capacity.value || 'moderate',
      comorbidities: reviewedData?.basic.comorbidities.value || extractedData?.basic.comorbidities.value || [],

      advanced_metrics: data,
      advanced_enabled: true,
      data_source: 'document' as const
    }

    // 로컬 저장
    const localProfile = {
      id: crypto.randomUUID(),
      ...completeProfile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    saveProfile(localProfile)

    // Supabase 저장
    await createProfile(completeProfile)

    // 상태 초기화
    reset()

    // 대시보드로 이동
    router.push('/dashboard')

  } catch (error) {
    console.error('Profile save failed:', error)
    alert('프로파일 저장 중 오류가 발생했습니다.')
  }
}

const handleSkip = async () => {
  try {
    const completeProfile = {
      surgery_type: reviewedData?.basic.surgery_type.value || extractedData?.basic.surgery_type.value!,
      surgery_date: reviewedData?.basic.surgery_date.value || extractedData?.basic.surgery_date.value!,
      age: reviewedData?.basic.age.value || extractedData?.basic.age.value,
      weight: reviewedData?.basic.weight.value || extractedData?.basic.weight.value,
      height: reviewedData?.basic.height.value || extractedData?.basic.height.value,
      digestive_capacity: reviewedData?.basic.digestive_capacity.value || extractedData?.basic.digestive_capacity.value || 'moderate',
      comorbidities: reviewedData?.basic.comorbidities.value || extractedData?.basic.comorbidities.value || [],
      advanced_enabled: false,
      data_source: 'document' as const
    }

    const localProfile = {
      id: crypto.randomUUID(),
      ...completeProfile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    saveProfile(localProfile)

    await createProfile(completeProfile)
    reset()
    router.push('/dashboard')

  } catch (error) {
    console.error('Profile save failed:', error)
    alert('프로파일 저장 중 오류가 발생했습니다.')
  }
}
```

**Step 2: document/review 직접 완료 로직 추가**

Modify: `app/onboarding/document/review/page.tsx`

handleNext 함수 수정:

```typescript
import { createProfile } from '@/lib/actions/profile-actions'
import { saveProfile } from '@/lib/local-storage'

const handleNext = async () => {
  updateReviewedData(editedData!)

  if (showAdvancedInput) {
    router.push('/onboarding/document/advanced')
  } else {
    // 바로 저장
    try {
      const completeProfile = {
        surgery_type: editedData!.basic.surgery_type.value!,
        surgery_date: editedData!.basic.surgery_date.value!,
        age: editedData!.basic.age.value,
        weight: editedData!.basic.weight.value,
        height: editedData!.basic.height.value,
        digestive_capacity: editedData!.basic.digestive_capacity.value || 'moderate',
        comorbidities: editedData!.basic.comorbidities.value || [],
        advanced_enabled: advancedEnabled,
        advanced_metrics: advancedEnabled ? extractAdvancedMetrics(editedData!.advanced) : undefined,
        data_source: 'document' as const
      }

      const localProfile = {
        id: crypto.randomUUID(),
        ...completeProfile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      saveProfile(localProfile)

      await createProfile(completeProfile)
      reset()
      router.push('/dashboard')

    } catch (error) {
      console.error('Profile save failed:', error)
      alert('프로파일 저장 중 오류가 발생했습니다.')
    }
  }
}

// 헬퍼 함수
function extractAdvancedMetrics(advanced: any) {
  return {
    nrs_2002_score: advanced.nrs_2002_score.value,
    serum_albumin: advanced.serum_albumin.value,
    weight_change_6m: advanced.weight_change_6m.value,
    sga_grade: advanced.sga_grade.value,
    has_sarcopenia: advanced.has_sarcopenia.value,
    has_gerd: advanced.has_gerd.value,
    gastric_emptying_delayed: advanced.gastric_emptying_delayed.value,
    oral_intake_possible: advanced.oral_intake_possible.value,
    expected_fasting_days: advanced.expected_fasting_days.value,
    intake_rate: advanced.intake_rate.value
  }
}
```

**Step 3: Commit**

```bash
git add app/onboarding/document/advanced/page.tsx app/onboarding/document/review/page.tsx
git commit -m "feat: implement document onboarding save logic with advanced metrics"
```

---

### Task 23: 수동 입력 저장 로직 완성

**Files:**
- Modify: `app/onboarding/manual/advanced/page.tsx`
- Modify: `app/onboarding/manual/advanced-prompt/page.tsx`

**Step 1: manual/advanced 저장 로직 추가**

Modify: `app/onboarding/manual/advanced/page.tsx`

```typescript
import { createProfile } from '@/lib/actions/profile-actions'
import { saveProfile } from '@/lib/local-storage'

const handleSubmit = async (data: AdvancedMetricsFormData) => {
  try {
    const completeProfile = {
      ...formData,
      surgery_type: formData.surgery_type!,
      surgery_date: formData.surgery_date!,
      digestive_capacity: formData.digestive_capacity!,
      comorbidities: formData.comorbidities || [],
      advanced_metrics: data,
      advanced_enabled: true,
      data_source: 'manual' as const
    }

    const localProfile = {
      id: crypto.randomUUID(),
      ...completeProfile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    saveProfile(localProfile)

    await createProfile(completeProfile)
    resetOnboarding()
    router.push('/dashboard')

  } catch (error) {
    console.error('Profile save failed:', error)
    alert('프로파일 저장 중 오류가 발생했습니다.')
  }
}

const handleSkip = async () => {
  try {
    const localProfile = {
      id: crypto.randomUUID(),
      ...formData,
      surgery_type: formData.surgery_type!,
      surgery_date: formData.surgery_date!,
      digestive_capacity: formData.digestive_capacity!,
      comorbidities: formData.comorbidities || [],
      advanced_enabled: false,
      data_source: 'manual' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    saveProfile(localProfile)

    await createProfile({
      ...formData,
      surgery_type: formData.surgery_type!,
      surgery_date: formData.surgery_date!,
      digestive_capacity: formData.digestive_capacity!,
      comorbidities: formData.comorbidities || [],
      advanced_enabled: false,
      data_source: 'manual'
    })

    resetOnboarding()
    router.push('/dashboard')

  } catch (error) {
    console.error('Profile save failed:', error)
    alert('프로파일 저장 중 오류가 발생했습니다.')
  }
}
```

**Step 2: advanced-prompt 건너뛰기 로직 추가**

Modify: `app/onboarding/manual/advanced-prompt/page.tsx`

"건너뛰기" 버튼 onClick 수정:

```typescript
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { createProfile } from '@/lib/actions/profile-actions'
import { saveProfile } from '@/lib/local-storage'

export default function AdvancedPromptPage() {
  const router = useRouter()
  const { formData, resetOnboarding } = useOnboardingStore()

  const handleSkip = async () => {
    try {
      const localProfile = {
        id: crypto.randomUUID(),
        ...formData,
        surgery_type: formData.surgery_type!,
        surgery_date: formData.surgery_date!,
        digestive_capacity: formData.digestive_capacity!,
        comorbidities: formData.comorbidities || [],
        advanced_enabled: false,
        data_source: 'manual' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      saveProfile(localProfile)

      await createProfile({
        ...formData,
        surgery_type: formData.surgery_type!,
        surgery_date: formData.surgery_date!,
        digestive_capacity: formData.digestive_capacity!,
        comorbidities: formData.comorbidities || [],
        advanced_enabled: false,
        data_source: 'manual'
      })

      resetOnboarding()
      router.push('/dashboard')

    } catch (error) {
      console.error('Profile save failed:', error)
      alert('프로파일 저장 중 오류가 발생했습니다.')
    }
  }

  return (
    // ... JSX에서 건너뛰기 버튼 수정
    <Button
      variant="secondary"
      size="lg"
      onClick={handleSkip}
      className="flex-1"
    >
      건너뛰기
    </Button>
  )
}
```

**Step 3: Commit**

```bash
git add app/onboarding/manual/advanced/page.tsx app/onboarding/manual/advanced-prompt/page.tsx
git commit -m "feat: implement manual onboarding save logic with advanced metrics"
```

---

### Task 24: 전체 플로우 통합 테스트

**Files:**
- N/A (테스트)

**Step 1: 문서 온보딩 플로우 테스트**

Run: `npm run dev`

1. http://localhost:3000/onboarding 접속
2. "진단서로 빠르게 시작" 선택
3. 테스트 이미지 업로드 (진단서 샘플)
4. OCR 처리 확인
5. 추출 결과 확인 및 수정
6. 고급 지표 입력 또는 건너뛰기
7. 대시보드 도달 확인
8. 로컬 스토리지 및 Supabase 확인

Expected: 전체 플로우 정상 작동, 프로파일 저장 확인

**Step 2: 수동 입력 플로우 테스트**

1. http://localhost:3000/onboarding 접속
2. "직접 입력하기" 선택
3. Step 1-3 입력
4. 고급 지표 선택 화면
5. 입력 또는 건너뛰기
6. 대시보드 도달 확인

Expected: 전체 플로우 정상 작동

**Step 3: 데이터 검증**

브라우저 개발자 도구 Console:
```javascript
localStorage.getItem('recovery_profile')
```

Supabase Dashboard SQL Editor:
```sql
SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 5;
```

Expected: advanced_enabled, advanced_metrics, data_source 필드 확인

**Step 4: 테스트 결과 문서화**

테스트 결과를 간단히 README 또는 별도 파일에 기록

**Step 5: Final Commit**

```bash
git add -A
git commit -m "test: verify complete hybrid onboarding flow (document + manual)"
```

---

## Phase 5 완료

**구현 완료 항목:**
- [x] Task 16: AdvancedMetricsForm 공통 컴포넌트
- [x] Task 17: 추출 결과 확인 화면
- [x] Task 18: 문서 온보딩 고급 지표 입력
- [x] Task 19: 수동 입력 고급 지표 플로우
- [x] Task 20: 데이터베이스 스키마 확장
- [x] Task 21: 프로파일 저장 로직 확장
- [x] Task 22: 문서 온보딩 저장 완성
- [x] Task 23: 수동 입력 저장 완성
- [x] Task 24: 통합 테스트

**총 Tasks:** 9개
**총 Steps:** ~35개

---

**다음 단계 (Phase 6 - 선택적):**
- LLM 구조화 추출 추가 (extractor 고도화)
- Google Document AI 구현
- 실제 진단서로 정확도 테스트 및 패턴 개선
- 에러 처리 및 UX 개선
- 설정 페이지에서 고급 프로파일 관리

---

**최종 업데이트:** 2026-01-27
