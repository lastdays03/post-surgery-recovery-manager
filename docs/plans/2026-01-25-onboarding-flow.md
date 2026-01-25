# 온보딩 플로우 UI 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 사용자 프로필 입력을 위한 다단계 온보딩 플로우를 구현하고, 로컬 스토리지에 저장 후 대시보드로 이동

**Architecture:** React Hook Form + Zustand 상태관리를 사용한 3단계 온보딩 플로우 (수술 정보 → 개인 정보 → 건강 상태). 각 단계는 검증을 거쳐 다음 단계로 진행하며, 최종적으로 프로파일을 로컬 스토리지와 Supabase에 저장.

**Tech Stack:** Next.js 14 App Router, React Hook Form, Zod, Zustand, Tailwind CSS, Lucide React Icons

---

## Phase 6: 온보딩 플로우 UI

### Task 1: 온보딩 상태 관리 스토어 생성

**Files:**
- Create: `lib/stores/onboarding-store.ts`

**Step 1: Zustand 스토어 타입 정의**

Create: `lib/stores/onboarding-store.ts`

```typescript
import { create } from 'zustand'

export type OnboardingStep = 1 | 2 | 3

export interface OnboardingFormData {
  // Step 1: 수술 정보
  surgery_type: string
  surgery_date: string

  // Step 2: 개인 정보
  age?: number
  weight?: number
  height?: number

  // Step 3: 건강 상태
  digestive_capacity: 'good' | 'moderate' | 'poor'
  comorbidities: string[]
}

interface OnboardingState {
  currentStep: OnboardingStep
  formData: Partial<OnboardingFormData>
  setStep: (step: OnboardingStep) => void
  updateFormData: (data: Partial<OnboardingFormData>) => void
  resetOnboarding: () => void
}

const initialFormData: Partial<OnboardingFormData> = {}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  formData: initialFormData,
  setStep: (step) => set({ currentStep: step }),
  updateFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data }
    })),
  resetOnboarding: () => set({ currentStep: 1, formData: initialFormData })
}))
```

**Step 2: 스토어 테스트 (선택적)**

간단한 수동 테스트로 확인 가능

**Step 3: Commit**

```bash
git add lib/stores/onboarding-store.ts
git commit -m "feat: add onboarding state management store"
```

---

### Task 2: 온보딩 폼 검증 스키마 작성

**Files:**
- Create: `lib/schemas/onboarding-schema.ts`

**Step 1: Zod 검증 스키마 작성**

Create: `lib/schemas/onboarding-schema.ts`

```typescript
import { z } from 'zod'

// Step 1: 수술 정보 스키마
export const surgeryInfoSchema = z.object({
  surgery_type: z.enum([
    'gastric_resection',
    'colon_resection',
    'tkr',
    'spinal_fusion',
    'cholecystectomy'
  ], {
    errorMap: () => ({ message: '수술 종류를 선택해주세요' })
  }),
  surgery_date: z.string().min(1, '수술 날짜를 입력해주세요')
    .refine((date) => {
      const surgeryDate = new Date(date)
      const today = new Date()
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(today.getMonth() - 6)

      return surgeryDate <= today && surgeryDate >= sixMonthsAgo
    }, {
      message: '수술 날짜는 오늘부터 최대 6개월 전까지 가능합니다'
    })
})

// Step 2: 개인 정보 스키마
export const personalInfoSchema = z.object({
  age: z.number()
    .min(18, '만 18세 이상만 사용 가능합니다')
    .max(100, '올바른 나이를 입력해주세요')
    .optional(),
  weight: z.number()
    .min(30, '올바른 체중을 입력해주세요')
    .max(200, '올바른 체중을 입력해주세요')
    .optional(),
  height: z.number()
    .min(100, '올바른 키를 입력해주세요')
    .max(250, '올바른 키를 입력해주세요')
    .optional()
})

// Step 3: 건강 상태 스키마
export const healthStatusSchema = z.object({
  digestive_capacity: z.enum(['good', 'moderate', 'poor'], {
    errorMap: () => ({ message: '소화 능력을 선택해주세요' })
  }),
  comorbidities: z.array(z.string()).default([])
})

export type SurgeryInfoInput = z.infer<typeof surgeryInfoSchema>
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>
export type HealthStatusInput = z.infer<typeof healthStatusSchema>
```

**Step 2: Commit**

```bash
git add lib/schemas/onboarding-schema.ts
git commit -m "feat: add onboarding form validation schemas"
```

---

### Task 3: 공통 UI 컴포넌트 작성

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/input.tsx`

**Step 1: Button 컴포넌트 작성**

Create: `components/ui/button.tsx`

```typescript
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50'
  }

  const sizeStyles = {
    sm: 'px-4 py-2 text-base',
    md: 'px-8 py-4 text-xl',
    lg: 'px-12 py-6 text-2xl'
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

**Step 2: Card 컴포넌트 작성**

Create: `components/ui/card.tsx`

```typescript
import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-8 ${className}`}>
      {children}
    </div>
  )
}
```

**Step 3: Input 컴포넌트 작성**

Create: `components/ui/input.tsx`

```typescript
import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="mb-6">
        <label className="block text-xl font-semibold mb-2 text-gray-700">
          {label}
        </label>
        <input
          ref={ref}
          className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:outline-none focus:border-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-red-500 text-base">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
```

**Step 4: Commit**

```bash
git add components/ui/
git commit -m "feat: add common UI components (Button, Card, Input)"
```

---

### Task 4: Step 1 - 수술 정보 입력 컴포넌트

**Files:**
- Create: `components/onboarding/surgery-info-step.tsx`

**Step 1: 수술 정보 입력 컴포넌트 작성**

Create: `components/onboarding/surgery-info-step.tsx`

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { surgeryInfoSchema, type SurgeryInfoInput } from '@/lib/schemas/onboarding-schema'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const SURGERY_OPTIONS = [
  { value: 'gastric_resection', label: '위절제술', emoji: '🏥' },
  { value: 'colon_resection', label: '대장절제술', emoji: '🏥' },
  { value: 'tkr', label: '슬관절 치환술', emoji: '🦵' },
  { value: 'spinal_fusion', label: '척추 유합술', emoji: '🦴' },
  { value: 'cholecystectomy', label: '담낭절제술', emoji: '🏥' }
]

export function SurgeryInfoStep() {
  const { formData, updateFormData, setStep } = useOnboardingStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<SurgeryInfoInput>({
    resolver: zodResolver(surgeryInfoSchema),
    defaultValues: {
      surgery_type: formData.surgery_type || '',
      surgery_date: formData.surgery_date || ''
    }
  })

  const selectedSurgery = watch('surgery_type')

  const onSubmit = (data: SurgeryInfoInput) => {
    updateFormData(data)
    setStep(2)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-4xl font-bold mb-8 text-center">수술 정보 입력</h2>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* 수술 종류 선택 */}
          <div className="mb-8">
            <label className="block text-xl font-semibold mb-4 text-gray-700">
              수술 종류를 선택해주세요
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SURGERY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-6 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedSurgery === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    value={option.value}
                    {...register('surgery_type')}
                    className="sr-only"
                  />
                  <span className="text-3xl mr-4">{option.emoji}</span>
                  <span className="text-lg font-medium">{option.label}</span>
                </label>
              ))}
            </div>
            {errors.surgery_type && (
              <p className="mt-2 text-red-500 text-base">{errors.surgery_type.message}</p>
            )}
          </div>

          {/* 수술 날짜 입력 */}
          <Input
            type="date"
            label="수술 날짜"
            error={errors.surgery_date?.message}
            {...register('surgery_date')}
          />

          {/* 다음 버튼 */}
          <div className="flex justify-end mt-8">
            <Button type="submit" size="lg">
              다음 단계
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
```

**Step 2: zodResolver 패키지 설치**

```bash
npm install @hookform/resolvers
```

**Step 3: Commit**

```bash
git add components/onboarding/surgery-info-step.tsx package.json package-lock.json
git commit -m "feat: add surgery info step component"
```

---

### Task 5: Step 2 - 개인 정보 입력 컴포넌트

**Files:**
- Create: `components/onboarding/personal-info-step.tsx`

**Step 1: 개인 정보 입력 컴포넌트 작성**

Create: `components/onboarding/personal-info-step.tsx`

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { personalInfoSchema, type PersonalInfoInput } from '@/lib/schemas/onboarding-schema'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function PersonalInfoStep() {
  const { formData, updateFormData, setStep } = useOnboardingStore()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PersonalInfoInput>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      age: formData.age,
      weight: formData.weight,
      height: formData.height
    }
  })

  const onSubmit = (data: PersonalInfoInput) => {
    updateFormData(data)
    setStep(3)
  }

  const handleBack = () => {
    setStep(1)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-4xl font-bold mb-8 text-center">개인 정보 입력</h2>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <p className="text-lg text-gray-600 mb-6">
            더 정확한 영양 계산을 위해 아래 정보를 입력해주세요. (선택사항)
          </p>

          <Input
            type="number"
            label="나이"
            placeholder="예: 45"
            error={errors.age?.message}
            {...register('age', { valueAsNumber: true })}
          />

          <Input
            type="number"
            label="체중 (kg)"
            placeholder="예: 65"
            error={errors.weight?.message}
            {...register('weight', { valueAsNumber: true })}
          />

          <Input
            type="number"
            label="키 (cm)"
            placeholder="예: 170"
            error={errors.height?.message}
            {...register('height', { valueAsNumber: true })}
          />

          {/* 버튼 그룹 */}
          <div className="flex justify-between mt-8">
            <Button type="button" variant="secondary" onClick={handleBack}>
              이전
            </Button>
            <Button type="submit" size="lg">
              다음 단계
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/onboarding/personal-info-step.tsx
git commit -m "feat: add personal info step component"
```

---

### Task 6: Step 3 - 건강 상태 입력 컴포넌트

**Files:**
- Create: `components/onboarding/health-status-step.tsx`

**Step 1: 건강 상태 입력 컴포넌트 작성**

Create: `components/onboarding/health-status-step.tsx`

```typescript
'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { healthStatusSchema, type HealthStatusInput } from '@/lib/schemas/onboarding-schema'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const DIGESTIVE_OPTIONS = [
  { value: 'good', label: '좋음', description: '소화에 큰 문제 없음' },
  { value: 'moderate', label: '보통', description: '가끔 불편함' },
  { value: 'poor', label: '나쁨', description: '자주 소화불량' }
] as const

const COMORBIDITY_OPTIONS = [
  '당뇨',
  '고혈압',
  '심장질환',
  '신장질환',
  '간질환',
  '없음'
]

export function HealthStatusStep() {
  const { formData, updateFormData, setStep } = useOnboardingStore()

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<HealthStatusInput>({
    resolver: zodResolver(healthStatusSchema),
    defaultValues: {
      digestive_capacity: formData.digestive_capacity || 'good',
      comorbidities: formData.comorbidities || []
    }
  })

  const selectedDigestive = watch('digestive_capacity')
  const selectedComorbidities = watch('comorbidities')

  const handleBack = () => {
    setStep(2)
  }

  return {
    // Component JSX will be in Step 2
  }
}
```

**Step 2: 건강 상태 컴포넌트 JSX 완성**

Continue in: `components/onboarding/health-status-step.tsx`

```typescript
  const onSubmit = (data: HealthStatusInput) => {
    updateFormData(data)
    // 다음 Task에서 프로파일 저장 로직 구현
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-4xl font-bold mb-8 text-center">건강 상태 입력</h2>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* 소화 능력 */}
          <div className="mb-8">
            <label className="block text-xl font-semibold mb-4 text-gray-700">
              현재 소화 능력은 어떠신가요?
            </label>
            <Controller
              name="digestive_capacity"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {DIGESTIVE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all text-center ${
                        selectedDigestive === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        checked={field.value === option.value}
                        onChange={() => field.onChange(option.value)}
                        className="sr-only"
                      />
                      <div className="text-lg font-bold mb-2">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.digestive_capacity && (
              <p className="mt-2 text-red-500 text-base">{errors.digestive_capacity.message}</p>
            )}
          </div>

          {/* 기저질환 */}
          <div className="mb-8">
            <label className="block text-xl font-semibold mb-4 text-gray-700">
              기저질환이 있으신가요? (복수 선택 가능)
            </label>
            <Controller
              name="comorbidities"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {COMORBIDITY_OPTIONS.map((option) => {
                    const isSelected = field.value.includes(option)
                    const isNone = option === '없음'

                    return (
                      <label
                        key={option}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all text-center ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (isNone) {
                              // "없음" 선택 시 다른 모든 항목 해제
                              field.onChange(e.target.checked ? ['없음'] : [])
                            } else {
                              // 다른 항목 선택 시 "없음" 해제
                              const newValue = e.target.checked
                                ? [...field.value.filter(v => v !== '없음'), option]
                                : field.value.filter(v => v !== option)
                              field.onChange(newValue)
                            }
                          }}
                          className="sr-only"
                        />
                        <span className="text-base font-medium">{option}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            />
          </div>

          {/* 버튼 그룹 */}
          <div className="flex justify-between mt-8">
            <Button type="button" variant="secondary" onClick={handleBack}>
              이전
            </Button>
            <Button type="submit" size="lg">
              완료
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add components/onboarding/health-status-step.tsx
git commit -m "feat: add health status step component"
```

---

### Task 7: 프로파일 저장 로직 구현

**Files:**
- Create: `lib/actions/profile-actions.ts`
- Modify: `components/onboarding/health-status-step.tsx`

**Step 1: 프로파일 저장 액션 작성**

Create: `lib/actions/profile-actions.ts`

```typescript
'use server'

import { supabaseAdmin } from '@/lib/supabase-client'
import { v4 as uuidv4 } from 'uuid'

export interface CreateProfileInput {
  surgery_type: string
  surgery_date: string
  age?: number
  weight?: number
  height?: number
  digestive_capacity: 'good' | 'moderate' | 'poor'
  comorbidities: string[]
}

export async function createProfile(input: CreateProfileInput) {
  try {
    const localStorageKey = uuidv4()

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        surgery_type: input.surgery_type,
        surgery_date: input.surgery_date,
        digestive_capacity: input.digestive_capacity,
        comorbidities: input.comorbidities,
        local_storage_key: localStorageKey
      })
      .select()
      .single()

    if (error) {
      console.error('Profile creation error:', error)
      // Supabase 에러 시에도 로컬 저장은 진행
      return { success: true, localStorageKey, profile: null }
    }

    return { success: true, localStorageKey, profile: data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to create profile' }
  }
}
```

**Step 2: UUID 패키지 설치**

```bash
npm install uuid
npm install -D @types/uuid
```

**Step 3: health-status-step에 저장 로직 추가**

Modify: `components/onboarding/health-status-step.tsx`

```typescript
// 파일 상단에 추가
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createProfile } from '@/lib/actions/profile-actions'
import { saveProfile } from '@/lib/local-storage'

// 컴포넌트 내부에 추가
export function HealthStatusStep() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { formData, updateFormData, setStep, resetOnboarding } = useOnboardingStore()

  // ... 기존 코드 ...

  const onSubmit = async (data: HealthStatusInput) => {
    setIsSubmitting(true)
    updateFormData(data)

    try {
      // 모든 폼 데이터 수집
      const completeData = {
        ...formData,
        ...data
      }

      // 로컬 스토리지에 저장
      const localProfile = {
        id: crypto.randomUUID(),
        surgery_type: completeData.surgery_type!,
        surgery_date: completeData.surgery_date!,
        digestive_capacity: data.digestive_capacity,
        comorbidities: data.comorbidities,
        weight: completeData.weight,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      saveProfile(localProfile)

      // Supabase에 저장 시도 (실패해도 진행)
      await createProfile({
        surgery_type: completeData.surgery_type!,
        surgery_date: completeData.surgery_date!,
        age: completeData.age,
        weight: completeData.weight,
        height: completeData.height,
        digestive_capacity: data.digestive_capacity,
        comorbidities: data.comorbidities
      })

      // 온보딩 상태 초기화
      resetOnboarding()

      // 대시보드로 이동
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('프로파일 저장 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ... JSX에서 완료 버튼 수정 ...
  // <Button type="submit" size="lg" disabled={isSubmitting}>
  //   {isSubmitting ? '저장 중...' : '완료'}
  // </Button>
}
```

**Step 4: Commit**

```bash
git add lib/actions/profile-actions.ts components/onboarding/health-status-step.tsx package.json package-lock.json
git commit -m "feat: add profile creation and save logic"
```

---

### Task 8: 온보딩 메인 페이지 구현

**Files:**
- Create: `app/onboarding/page.tsx`
- Create: `components/onboarding/progress-indicator.tsx`

**Step 1: 진행 상태 표시 컴포넌트 작성**

Create: `components/onboarding/progress-indicator.tsx`

```typescript
'use client'

import { useOnboardingStore, type OnboardingStep } from '@/lib/stores/onboarding-store'

const STEPS = [
  { step: 1, label: '수술 정보' },
  { step: 2, label: '개인 정보' },
  { step: 3, label: '건강 상태' }
]

export function ProgressIndicator() {
  const { currentStep } = useOnboardingStore()

  return (
    <div className="mb-12">
      <div className="flex items-center justify-center">
        {STEPS.map((item, index) => (
          <div key={item.step} className="flex items-center">
            {/* 단계 원 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  currentStep >= item.step
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {item.step}
              </div>
              <span className="mt-2 text-sm font-medium text-gray-600">
                {item.label}
              </span>
            </div>

            {/* 연결선 */}
            {index < STEPS.length - 1 && (
              <div
                className={`w-24 h-1 mx-4 ${
                  currentStep > item.step ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: 온보딩 메인 페이지 작성**

Create: `app/onboarding/page.tsx`

```typescript
'use client'

import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { ProgressIndicator } from '@/components/onboarding/progress-indicator'
import { SurgeryInfoStep } from '@/components/onboarding/surgery-info-step'
import { PersonalInfoStep } from '@/components/onboarding/personal-info-step'
import { HealthStatusStep } from '@/components/onboarding/health-status-step'

export default function OnboardingPage() {
  const { currentStep } = useOnboardingStore()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 text-center">프로필 설정</h1>
        <p className="text-xl text-gray-600 mb-12 text-center">
          맞춤 회복 계획을 위해 정보를 입력해주세요
        </p>

        <ProgressIndicator />

        {currentStep === 1 && <SurgeryInfoStep />}
        {currentStep === 2 && <PersonalInfoStep />}
        {currentStep === 3 && <HealthStatusStep />}
      </div>
    </div>
  )
}
```

**Step 3: 개발 서버에서 확인**

```bash
npm run dev
```

http://localhost:3000/onboarding 접속하여 온보딩 플로우 테스트

Expected:
- Step 1: 수술 종류 선택 및 날짜 입력 가능
- Step 2: 개인 정보 입력 가능, 이전 버튼 작동
- Step 3: 건강 상태 입력 후 완료 시 대시보드로 이동

**Step 4: Commit**

```bash
git add app/onboarding/ components/onboarding/progress-indicator.tsx
git commit -m "feat: add onboarding main page with step navigation"
```

---

### Task 9: 대시보드 플레이스홀더 페이지

**Files:**
- Create: `app/dashboard/page.tsx`

**Step 1: 임시 대시보드 페이지 작성**

Create: `app/dashboard/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/local-storage'
import { calculateRecoveryPhase } from '@/lib/profiling-engine'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedProfile = getProfile()

    if (!savedProfile) {
      router.push('/onboarding')
      return
    }

    setProfile(savedProfile)
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">로딩 중...</div>
      </div>
    )
  }

  if (!profile) return null

  const userProfile = {
    ...profile,
    surgery_date: new Date(profile.surgery_date)
  }

  const currentPhase = calculateRecoveryPhase(userProfile)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">대시보드</h1>

        <Card className="mb-8">
          <h2 className="text-3xl font-bold mb-4">현재 회복 단계</h2>
          <p className="text-2xl text-blue-600 font-semibold mb-2">
            {currentPhase.name.toUpperCase()} 단계
          </p>
          <p className="text-lg text-gray-600 mb-4">
            {currentPhase.description}
          </p>
          <p className="text-base text-gray-500">
            권장 기간: {currentPhase.daysRange[0]}일 ~ {currentPhase.daysRange[1]}일
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <h3 className="text-2xl font-bold mb-4">🍽️ 식단 계획</h3>
            <p className="text-gray-600 mb-4">맞춤 식단을 확인하세요</p>
            <Button onClick={() => router.push('/meal-plan')} className="w-full">
              식단 보기
            </Button>
          </Card>

          <Card>
            <h3 className="text-2xl font-bold mb-4">💪 운동 계획</h3>
            <p className="text-gray-600 mb-4">재활 운동을 확인하세요</p>
            <Button onClick={() => router.push('/exercise-plan')} className="w-full">
              운동 보기
            </Button>
          </Card>

          <Card>
            <h3 className="text-2xl font-bold mb-4">📊 회복 기록</h3>
            <p className="text-gray-600 mb-4">일일 기록을 입력하세요</p>
            <Button onClick={() => alert('Phase 7에서 구현 예정')} className="w-full">
              기록하기
            </Button>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="secondary"
            onClick={() => {
              if (confirm('프로파일을 삭제하시겠습니까?')) {
                localStorage.clear()
                router.push('/')
              }
            }}
          >
            프로파일 삭제
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: 개발 서버에서 전체 플로우 테스트**

```bash
npm run dev
```

테스트 시나리오:
1. http://localhost:3000 접속 → "시작하기" 클릭
2. 온보딩 플로우 완료
3. 대시보드 표시 확인
4. 브라우저 새로고침 → 대시보드 유지 확인
5. 프로파일 삭제 → 랜딩 페이지로 이동 확인

**Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add dashboard placeholder with profile display"
```

---

## 실행 가이드

### 온보딩 플로우 테스트

1. **개발 서버 실행**
```bash
npm run dev
```

2. **테스트 시나리오**
- http://localhost:3000 접속
- "시작하기" 버튼 클릭
- Step 1: 수술 종류 선택 (예: 위절제술), 날짜 입력
- Step 2: 개인 정보 입력 (선택)
- Step 3: 소화 능력 선택, 기저질환 선택
- "완료" 클릭
- 대시보드 표시 확인

3. **로컬 스토리지 확인**
```javascript
// 브라우저 개발자 도구 Console에서
localStorage.getItem('recovery_profile')
```

### Phase 7 이후 작업

Phase 6 완료 후 다음 단계:
- Phase 7: 대시보드 상세 구현, 식단/운동 페이지
- Phase 8: AI 챗봇 구현
- Phase 9: 증상 분석 및 주간 리포트
- Phase 10: PDF 생성 및 최적화

---

## 구현 완료 체크리스트

- ✅ Zustand 온보딩 상태 관리
- ✅ Zod 폼 검증 스키마
- ✅ 공통 UI 컴포넌트 (Button, Card, Input)
- ✅ Step 1: 수술 정보 입력
- ✅ Step 2: 개인 정보 입력
- ✅ Step 3: 건강 상태 입력
- ✅ 프로파일 저장 (로컬 + Supabase)
- ✅ 진행 상태 표시
- ✅ 온보딩 메인 페이지
- ✅ 대시보드 플레이스홀더

Total: 9 Tasks, ~18 Steps
