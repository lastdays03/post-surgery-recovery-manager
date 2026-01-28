# 온보딩 플로우 재설계 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**목표:** 사용자 친화적인 대화형 온보딩 프로세스 구현 - react-day-picker를 사용한 커스텀 날짜 선택기와 간소화된 건강 설문 폼

**아키텍처:** Zustand 기반 상태 관리, TDD 접근법으로 테스트 우선 작성, 각 단계별 UI 컴포넌트 분리

**기술 스택:** Next.js 16, React 19, TypeScript, react-day-picker 9.13, date-fns 4.1, Zod, react-hook-form, Vitest

---

## Task 1: 날짜 선택 테스트 작성

**파일:**
- Create: `test/date-picker.test.tsx`
- Reference: `components/onboarding/onboarding-chat.tsx:184-196`

**Step 1: 날짜 선택기 렌더링 테스트 작성**

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OnboardingChat } from '@/components/onboarding/onboarding-chat'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'

describe('OnboardingChat - Date Picker', () => {
  beforeEach(() => {
    useOnboardingStore.setState({
      currentStep: 1,
      formData: {},
      confirmationStatus: 'confirmed',
      isDatePickerOpen: false
    })
  })

  it('should render react-day-picker when confirmation status is confirmed', () => {
    render(<OnboardingChat />)

    // DayPicker가 렌더링되는지 확인
    const calendar = screen.getByRole('application')
    expect(calendar).toBeInTheDocument()
  })

  it('should show date completion button', () => {
    render(<OnboardingChat />)

    const button = screen.getByText('날짜 선택 완료하기')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-black')
  })
})
```

**Step 2: 테스트 실행하여 실패 확인**

Run: `npm test test/date-picker.test.tsx`
Expected: FAIL - "react-day-picker not found" 또는 "날짜 선택 완료하기 button not found"

**Step 3: 커밋**

```bash
git add test/date-picker.test.tsx
git commit -m "test: add date picker rendering tests (RED)"
```

---

## Task 2: react-day-picker 통합 구현

**파일:**
- Modify: `components/onboarding/onboarding-chat.tsx:1-247`

**Step 1: import 추가 및 상태 정의**

```tsx
// 파일 상단에 추가
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import 'react-day-picker/dist/style.css'

// OnboardingChat 컴포넌트 내부, 기존 상태 아래 추가
const [selectedDate, setSelectedDate] = useState<Date | undefined>()
```

**Step 2: 기존 date input을 DayPicker로 교체**

기존 코드 (184-196행) 제거:
```tsx
{/* Date Picker UI (Placeholder for now) */}
{confirmationStatus === 'confirmed' && !isComplete && !isLoading && messages[messages.length - 1].role === 'assistant' && (
  <div className="flex justify-center p-4 animate-in fade-in slide-in-from-bottom-2">
    <div className="bg-white p-4 rounded-xl shadow-md border w-full max-w-xs">
      <label className="block text-sm font-medium text-gray-700 mb-2">수술일자 선택</label>
      <input
        type="date"
        className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        onChange={(e) => handleDateSelect(e.target.value)}
      />
    </div>
  </div>
)}
```

새 코드로 교체:
```tsx
{/* Date Picker with react-day-picker */}
{confirmationStatus === 'confirmed' && !isComplete && !isLoading && messages[messages.length - 1].role === 'assistant' && (
  <div className="flex justify-center p-4 animate-in fade-in slide-in-from-bottom-2">
    <div className="bg-white p-6 rounded-xl shadow-md border w-full max-w-sm">
      <p className="text-sm font-medium text-gray-700 mb-4 text-center">
        그러면 수술은 언제 받으셨나요?
      </p>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        locale={ko}
        defaultMonth={new Date()}
        className="mx-auto"
        styles={{
          caption: { justifyContent: 'center' },
          head_cell: { width: '40px', fontSize: '14px', color: '#6b7280' },
          cell: { width: '40px', height: '40px' },
          day: {
            fontSize: '14px',
            borderRadius: '50%',
          },
          day_selected: {
            backgroundColor: '#3b82f6',
            color: 'white',
          },
        }}
      />
      <button
        onClick={handleDateConfirm}
        disabled={!selectedDate}
        className="w-full mt-4 py-3 bg-black text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        날짜 선택 완료하기
      </button>
    </div>
  </div>
)}
```

**Step 3: handleDateConfirm 함수 구현**

기존 `handleDateSelect` 함수 (116-120행) 제거 후, 새로운 함수 추가:
```tsx
const handleDateConfirm = () => {
  if (!selectedDate) return

  const formattedDate = format(selectedDate, 'yyyy-MM-dd')
  const displayDate = format(selectedDate, 'yyyy년 M월 d일', { locale: ko })

  updateFormData({ surgery_date: formattedDate })

  // 확인 메시지 표시
  setMessages((prev) => [
    ...prev,
    { role: 'user', content: `${displayDate} 선택됐어요` }
  ])

  setIsComplete(true)
}
```

**Step 4: 테스트 실행하여 통과 확인**

Run: `npm test test/date-picker.test.tsx`
Expected: PASS - 모든 테스트 통과

**Step 5: 커밋**

```bash
git add components/onboarding/onboarding-chat.tsx
git commit -m "feat: integrate react-day-picker for date selection

- Replace native date input with react-day-picker
- Add custom styling for calendar UI
- Implement date confirmation with formatted message
- Add disabled state for completion button"
```

---

## Task 3: 날짜 선택 인터랙션 테스트 작성

**파일:**
- Modify: `test/date-picker.test.tsx`

**Step 1: 날짜 클릭 및 완료 버튼 테스트 추가**

```tsx
import userEvent from '@testing-library/user-event'

describe('OnboardingChat - Date Picker Interactions', () => {
  it('should enable completion button when date is selected', async () => {
    const user = userEvent.setup()
    render(<OnboardingChat />)

    const button = screen.getByText('날짜 선택 완료하기')
    expect(button).toBeDisabled()

    // 날짜 클릭 (예: 15일)
    const dateButton = screen.getByRole('button', { name: '15' })
    await user.click(dateButton)

    expect(button).not.toBeDisabled()
  })

  it('should display confirmation message after date selection', async () => {
    const user = userEvent.setup()
    render(<OnboardingChat />)

    // 날짜 선택
    const dateButton = screen.getByRole('button', { name: '15' })
    await user.click(dateButton)

    // 완료 버튼 클릭
    const confirmButton = screen.getByText('날짜 선택 완료하기')
    await user.click(confirmButton)

    // 확인 메시지 표시 확인 (정규표현식 사용)
    expect(screen.getByText(/선택됐어요$/)).toBeInTheDocument()
  })

  it('should update onboarding store with selected date', async () => {
    const user = userEvent.setup()
    render(<OnboardingChat />)

    const dateButton = screen.getByRole('button', { name: '15' })
    await user.click(dateButton)

    const confirmButton = screen.getByText('날짜 선택 완료하기')
    await user.click(confirmButton)

    const state = useOnboardingStore.getState()
    expect(state.formData.surgery_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
```

**Step 2: 테스트 실행**

Run: `npm test test/date-picker.test.tsx`
Expected: PASS (이미 구현되어 있어야 함)

**Step 3: 커밋**

```bash
git add test/date-picker.test.tsx
git commit -m "test: add date picker interaction tests"
```

---

## Task 4: 스토어 타입 정리 (성별 필드 제거)

**파일:**
- Modify: `lib/stores/onboarding-store.ts:1-55`

**Step 1: 스토어 타입 업데이트 테스트 작성**

```tsx
// test/onboarding-store.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'

describe('OnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.getState().resetOnboarding()
  })

  it('should not include gender field in formData type', () => {
    const { formData } = useOnboardingStore.getState()

    // @ts-expect-error - gender should not exist
    expect(formData.gender).toBeUndefined()
  })

  it('should update form data without gender', () => {
    useOnboardingStore.getState().updateFormData({
      surgery_type: '맹장 수술',
      age: 30,
      weight: 65,
      height: 170
    })

    const { formData } = useOnboardingStore.getState()
    expect(formData.surgery_type).toBe('맹장 수술')
    expect(formData.age).toBe(30)
    // @ts-expect-error
    expect(formData.gender).toBeUndefined()
  })
})
```

**Step 2: 테스트 실행하여 실패 확인**

Run: `npm test test/onboarding-store.test.tsx`
Expected: PASS (gender가 여전히 존재하므로 타입 에러가 발생하지 않음)

**Step 3: 스토어 타입 수정**

```typescript
// lib/stores/onboarding-store.ts
export interface OnboardingFormData {
    // Step 1: 수술 정보
    surgery_type: string
    surgery_date: string

    // Step 2: 개인 정보
    age?: number
    // gender 필드 제거
    weight?: number
    height?: number

    // Step 3: 건강 상태
    digestive_capacity: 'good' | 'moderate' | 'poor'
    comorbidities: string[]
}
```

**Step 4: 타입 체크 및 테스트 실행**

Run: `npx tsc --noEmit`
Expected: No errors

Run: `npm test test/onboarding-store.test.tsx`
Expected: PASS

**Step 5: 커밋**

```bash
git add lib/stores/onboarding-store.ts test/onboarding-store.test.tsx
git commit -m "refactor: remove gender field from onboarding store

- Update OnboardingFormData interface
- Remove gender from type definitions
- Add store tests to verify changes"
```

---

## Task 5: 폼 컴포넌트 테스트 작성 (성별 제거, 3열 레이아웃)

**파일:**
- Modify: `test/verify-onboarding-form.test.tsx`

**Step 1: 기존 테스트 업데이트 및 새 테스트 추가**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'

describe('OnboardingForm - Layout and Fields', () => {
  beforeEach(() => {
    useOnboardingStore.setState({
      currentStep: 2,
      formData: {
        surgery_type: '맹장 수술',
        surgery_date: '2026-01-27'
      },
      confirmationStatus: 'idle',
      isDatePickerOpen: false
    })
  })

  it('should not render gender field', () => {
    render(<OnboardingForm />)

    // 성별 관련 요소가 없어야 함
    expect(screen.queryByTestId('gender-male')).not.toBeInTheDocument()
    expect(screen.queryByTestId('gender-female')).not.toBeInTheDocument()
    expect(screen.queryByText('성별')).not.toBeInTheDocument()
  })

  it('should render age, weight, height fields in 3-column grid', () => {
    render(<OnboardingForm />)

    const ageInput = screen.getByLabelText('나이')
    const weightInput = screen.getByLabelText('몸무게 (kg)')
    const heightInput = screen.getByLabelText('키 (cm)')

    expect(ageInput).toBeInTheDocument()
    expect(weightInput).toBeInTheDocument()
    expect(heightInput).toBeInTheDocument()

    // 3열 그리드 확인 (부모 요소가 grid-cols-3 클래스를 가져야 함)
    const container = ageInput.closest('.grid')
    expect(container).toHaveClass('grid-cols-3')
  })

  it('should show validation error when submitting empty form', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm />)

    const submitButton = screen.getByText('완료 및 가이드 시작')
    await user.click(submitButton)

    expect(screen.getByText('나이를 입력해주세요.')).toBeInTheDocument()
    expect(screen.getByText('키를 입력해주세요.')).toBeInTheDocument()
    expect(screen.getByText('몸무게를 입력해주세요.')).toBeInTheDocument()
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm />)

    await user.type(screen.getByLabelText('나이'), '30')
    await user.type(screen.getByLabelText('몸무게 (kg)'), '65')
    await user.type(screen.getByLabelText('키 (cm)'), '170')

    const submitButton = screen.getByText('완료 및 가이드 시작')
    await user.click(submitButton)

    // 에러 메시지가 없어야 함
    expect(screen.queryByText(/입력해주세요/)).not.toBeInTheDocument()
  })
})
```

**Step 2: 테스트 실행하여 실패 확인**

Run: `npm test test/verify-onboarding-form.test.tsx`
Expected: FAIL - "gender-male found" 또는 "not grid-cols-3"

**Step 3: 커밋**

```bash
git add test/verify-onboarding-form.test.tsx
git commit -m "test: update form tests for gender removal and 3-column layout (RED)"
```

---

## Task 6: 폼 컴포넌트 리팩토링

**파일:**
- Modify: `components/onboarding/onboarding-form.tsx:1-177`

**Step 1: Zod 스키마 업데이트**

```tsx
// 기존 스키마 (17-27행) 수정
const onboardingFormSchema = z.object({
    // Basic Info
    age: z.coerce.number().min(1, '나이를 입력해주세요.'),
    // gender 필드 제거
    height: z.coerce.number().min(1, '키를 입력해주세요.'),
    weight: z.coerce.number().min(1, '몸무게를 입력해주세요.'),

    // Health Info
    digestiveCapacity: z.string().min(1, '소화 기능을 선택해주세요.'),
    comorbidities: z.string().optional(),
})
```

**Step 2: defaultValues에서 gender 제거**

```tsx
// 기존 defaultValues (37-45행) 수정
const form = useForm<any>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
        age: formData.age ? String(formData.age) : '',
        // gender 제거
        height: formData.height ? String(formData.height) : '',
        weight: formData.weight ? String(formData.weight) : '',
        digestiveCapacity: '100',
        comorbidities: '',
    }
})
```

**Step 3: onSubmit에서 gender 제거**

```tsx
// 기존 onSubmit (47-74행) 수정
const onSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true)
    try {
        updateFormData({
            age: data.age,
            // gender 제거
            height: data.height,
            weight: data.weight,
        })

        const profileData = {
            ...formData,
            ...data,
        }

        console.log('Submitting profile:', profileData)
        // await createProfile(profileData)
        // setStep(3)

    } catch (error) {
        console.error('Failed to submit onboarding:', error)
    } finally {
        setIsSubmitting(false)
    }
}
```

**Step 4: JSX 레이아웃 변경 - 성별 제거 및 3열 그리드**

```tsx
{/* Basic Info Section */}
<div className="space-y-4">
    <h3 className="font-semibold text-gray-700">기본 정보</h3>
    <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
            <Label htmlFor="age">나이</Label>
            <Input id="age" type="number" placeholder="예: 30" {...form.register('age')} />
            {form.formState.errors.age && <p className="text-red-500 text-xs">{String(form.formState.errors.age.message)}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="weight">몸무게 (kg)</Label>
            <Input id="weight" type="number" placeholder="예: 65" {...form.register('weight')} />
            {form.formState.errors.weight && <p className="text-red-500 text-xs">{String(form.formState.errors.weight.message)}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="height">키 (cm)</Label>
            <Input id="height" type="number" placeholder="예: 170" {...form.register('height')} />
            {form.formState.errors.height && <p className="text-red-500 text-xs">{String(form.formState.errors.height.message)}</p>}
        </div>
    </div>
</div>
```

기존 성별 섹션 (88-126행) 전체 제거

**Step 5: 테스트 실행하여 통과 확인**

Run: `npm test test/verify-onboarding-form.test.tsx`
Expected: PASS

**Step 6: 타입 체크**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: 커밋**

```bash
git add components/onboarding/onboarding-form.tsx
git commit -m "refactor: remove gender field and update to 3-column layout

- Remove gender from Zod schema
- Update form layout to 3-column grid (age, weight, height)
- Remove gender field from defaultValues and onSubmit
- Update field order to match design mockup"
```

---

## Task 7: 전체 온보딩 플로우 통합 테스트

**파일:**
- Create: `test/onboarding-integration.test.tsx`

**Step 1: 통합 테스트 작성**

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OnboardingPage from '@/app/onboarding/manual/page'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'

// Mock fetch for AI API
global.fetch = vi.fn()

describe('Onboarding Flow Integration', () => {
  beforeEach(() => {
    useOnboardingStore.getState().resetOnboarding()
    vi.clearAllMocks()

    // Mock AI response
    ;(global.fetch as any).mockResolvedValue({
      json: async () => ({
        message: '맹장 수술이 맞나요?',
        extractedData: { surgery_type: '맹장 수술' }
      })
    })
  })

  it('should complete full onboarding flow', async () => {
    const user = userEvent.setup()
    render(<OnboardingPage />)

    // Step 1 시작 확인
    expect(screen.getByText('01 AI 상담')).toHaveClass('text-blue-600')
    expect(screen.getByText('02 건강 정보')).toHaveClass('text-gray-600')

    // 1. 수술명 입력
    const input = screen.getByPlaceholderText('메시지를 입력해 주세요...')
    await user.type(input, '맹장 수술')
    await user.click(screen.getByRole('button', { name: /send/i }))

    // 2. 확인 버튼 클릭
    await waitFor(() => {
      expect(screen.getByText('네, 맞아요')).toBeInTheDocument()
    })
    await user.click(screen.getByText('네, 맞아요'))

    // 3. 날짜 선택
    await waitFor(() => {
      expect(screen.getByText('날짜 선택 완료하기')).toBeInTheDocument()
    })
    const dateButton = screen.getByRole('button', { name: '15' })
    await user.click(dateButton)
    await user.click(screen.getByText('날짜 선택 완료하기'))

    // 4. Step 2로 전환
    await waitFor(() => {
      expect(screen.getByText('다음 단계로 이동')).toBeInTheDocument()
    })
    await user.click(screen.getByText('다음 단계로 이동'))

    // 5. Step 2 확인
    await waitFor(() => {
      expect(screen.getByText('02 건강 정보')).toHaveClass('text-blue-600')
      expect(screen.getByText('기본 정보 및 건강 상태')).toBeInTheDocument()
    })

    // 6. 폼 작성
    await user.type(screen.getByLabelText('나이'), '30')
    await user.type(screen.getByLabelText('몸무게 (kg)'), '65')
    await user.type(screen.getByLabelText('키 (cm)'), '170')

    // 7. 제출
    await user.click(screen.getByText('완료 및 가이드 시작'))

    // 8. 스토어 상태 확인
    const state = useOnboardingStore.getState()
    expect(state.formData.surgery_type).toBe('맹장 수술')
    expect(state.formData.surgery_date).toBeTruthy()
    expect(state.formData.age).toBe(30)
    expect(state.formData.weight).toBe(65)
    expect(state.formData.height).toBe(170)
  })
})
```

**Step 2: 테스트 실행**

Run: `npm test test/onboarding-integration.test.tsx`
Expected: PASS

**Step 3: 커밋**

```bash
git add test/onboarding-integration.test.tsx
git commit -m "test: add end-to-end onboarding flow integration test"
```

---

## Task 8: 반응형 디자인 개선

**파일:**
- Modify: `components/onboarding/onboarding-form.tsx:86-140`
- Modify: `components/onboarding/onboarding-chat.tsx:184-220`

**Step 1: 폼 반응형 레이아웃 추가**

```tsx
{/* Basic Info Section - 반응형 그리드 */}
<div className="space-y-4">
    <h3 className="font-semibold text-gray-700">기본 정보</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
            <Label htmlFor="age">나이</Label>
            <Input id="age" type="number" placeholder="예: 30" {...form.register('age')} />
            {form.formState.errors.age && <p className="text-red-500 text-xs">{String(form.formState.errors.age.message)}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="weight">몸무게 (kg)</Label>
            <Input id="weight" type="number" placeholder="예: 65" {...form.register('weight')} />
            {form.formState.errors.weight && <p className="text-red-500 text-xs">{String(form.formState.errors.weight.message)}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="height">키 (cm)</Label>
            <Input id="height" type="number" placeholder="예: 170" {...form.register('height')} />
            {form.formState.errors.height && <p className="text-red-500 text-xs">{String(form.formState.errors.height.message)}</p>}
        </div>
    </div>
</div>
```

**Step 2: 날짜 선택기 반응형 개선**

```tsx
{/* Date Picker with react-day-picker - 반응형 */}
{confirmationStatus === 'confirmed' && !isComplete && !isLoading && messages[messages.length - 1].role === 'assistant' && (
  <div className="flex justify-center p-4 animate-in fade-in slide-in-from-bottom-2">
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border w-full max-w-xs sm:max-w-sm">
      <p className="text-sm font-medium text-gray-700 mb-4 text-center">
        그러면 수술은 언제 받으셨나요?
      </p>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        locale={ko}
        defaultMonth={new Date()}
        className="mx-auto"
        styles={{
          caption: { justifyContent: 'center' },
          head_cell: { width: '36px', fontSize: '12px', color: '#6b7280' },
          cell: { width: '36px', height: '36px' },
          day: {
            fontSize: '13px',
            borderRadius: '50%',
          },
          day_selected: {
            backgroundColor: '#3b82f6',
            color: 'white',
          },
        }}
        modifiersStyles={{
          selected: {
            backgroundColor: '#3b82f6',
            color: 'white',
          },
        }}
      />
      <button
        onClick={handleDateConfirm}
        disabled={!selectedDate}
        className="w-full mt-4 py-2.5 sm:py-3 text-sm sm:text-base bg-black text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        날짜 선택 완료하기
      </button>
    </div>
  </div>
)}
```

**Step 3: 빌드 및 확인**

Run: `npm run build`
Expected: Build succeeds

**Step 4: 커밋**

```bash
git add components/onboarding/onboarding-form.tsx components/onboarding/onboarding-chat.tsx
git commit -m "style: improve responsive design for mobile and tablet

- Update form grid to responsive (1 col mobile, 2 col tablet, 3 col desktop)
- Adjust date picker sizing for smaller screens
- Update button and text sizing with responsive variants"
```

---

## Task 9: 린팅 및 타입 체크

**파일:**
- All modified files

**Step 1: 린팅 실행 및 수정**

Run: `npm run lint`
Expected: Fix any linting errors

**Step 2: 타입 체크 실행**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: 전체 테스트 실행**

Run: `npm test`
Expected: All tests pass

**Step 4: 빌드 최종 확인**

Run: `npm run build`
Expected: Build succeeds

**Step 5: 수정사항 커밋 (있을 경우)**

```bash
git add .
git commit -m "fix: resolve linting and type errors"
```

---

## Task 10: 최종 검증 및 문서 업데이트

**파일:**
- Update: `docs/plans/PLAN_onboarding_redesign.md`

**Step 1: 체크리스트 업데이트**

```markdown
## 4. Quality Gates
- [x] Build success.
- [x] Tests pass.
- [x] Linting pass.
- [x] Type check pass.
- [x] Date picker integrated with react-day-picker.
- [x] Gender field removed from form.
- [x] 3-column responsive layout implemented.
```

**Step 2: 구현 완료 섹션 추가**

```markdown
## Implementation Complete

**Date:** 2026-01-28
**Status:** ✅ Ready for Review

### Changes Made:
1. Integrated react-day-picker for date selection
2. Removed gender field from store and form
3. Updated form layout to 3-column responsive grid
4. Added comprehensive tests for all changes
5. Ensured responsive design for mobile/tablet/desktop

### Test Coverage:
- Date picker rendering and interactions
- Form validation without gender field
- End-to-end onboarding flow
- Store state management

### Next Steps:
1. Manual testing on actual devices
2. Code review
3. Deploy to staging environment
```

**Step 3: 문서 커밋**

```bash
git add docs/plans/PLAN_onboarding_redesign.md
git commit -m "docs: update plan with implementation complete status"
```

**Step 4: 최종 푸시**

```bash
git push origin HEAD
```

---

## Success Criteria Checklist

- [ ] react-day-picker 통합 완료 및 테스트 통과
- [ ] 성별 필드 제거 (스토어, 폼, 테스트)
- [ ] 3열 반응형 그리드 레이아웃 구현
- [ ] 날짜 확인 메시지 표시 기능
- [ ] 전체 온보딩 플로우 통합 테스트 통과
- [ ] 빌드, 린팅, 타입 체크 모두 통과
- [ ] 반응형 디자인 (모바일 375px, 태블릿 768px, 데스크톱 1280px)
- [ ] 모든 변경사항 커밋 및 문서화

---

## 참고 리소스

- **Design Document:** `docs/plans/2026-01-28-onboarding-redesign-design.md`
- **react-day-picker Docs:** https://daypicker.dev/
- **date-fns Docs:** https://date-fns.org/
- **Vitest Docs:** https://vitest.dev/
- **Testing Library:** https://testing-library.com/

---

**Plan Version:** 1.0
**Last Updated:** 2026-01-28
**Author:** Claude Code Agent
