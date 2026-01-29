# 월별 식단 캘린더 Phase 3 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 캘린더를 실용적으로 만들기 위한 인터랙션 추가 - 월 이동, 날짜 클릭, URL 파라미터 지원

**Architecture:** 캘린더 페이지에서 월 이동 기능 구현하고, 날짜 클릭 시 식단 페이지로 라우팅. 식단 페이지는 URL 쿼리 파라미터를 읽어 특정 날짜의 식단을 조회하도록 확장. 뒤로가기 시 캘린더로 복귀하도록 네비게이션 흐름 완성.

**Tech Stack:** Next.js 14, React, TypeScript, useSearchParams, useRouter

**Prerequisites:** Phase 1, Phase 2 완료

**Design Reference:** `docs/plans/2026-01-29-meal-calendar-design.md` - Phase 3 섹션

---

## Task 1: 월 이동 버튼 기능 구현

**Files:**
- Modify: `app/meal-plan/calendar/page.tsx`

### Step 1: 월 이동 핸들러 함수 작성

월 네비게이션 버튼 위에 핸들러 함수 추가:

```typescript
/**
 * 이전 달로 이동
 */
const handlePreviousMonth = () => {
  setCurrentDate((prev) => {
    if (prev.month === 1) {
      return { year: prev.year - 1, month: 12 }
    }
    return { year: prev.year, month: prev.month - 1 }
  })
}

/**
 * 다음 달로 이동
 */
const handleNextMonth = () => {
  setCurrentDate((prev) => {
    if (prev.month === 12) {
      return { year: prev.year + 1, month: 1 }
    }
    return { year: prev.year, month: prev.month + 1 }
  })
}
```

### Step 2: 버튼에 핸들러 연결 및 disabled 제거

월 네비게이션 버튼 수정:

```typescript
<div className="flex items-center justify-center gap-4 mb-8">
  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8"
    onClick={handlePreviousMonth}
    disabled={loading}  // disabled → disabled={loading}
  >
    <ChevronLeft className="h-5 w-5" />
  </Button>

  <h2 className="text-2xl font-bold text-gray-900 min-w-[200px] text-center">
    {currentDate.year}년 {currentDate.month}월
  </h2>

  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8"
    onClick={handleNextMonth}
    disabled={loading}  // disabled → disabled={loading}
  >
    <ChevronRight className="h-5 w-5" />
  </Button>
</div>
```

### Step 3: 브라우저에서 테스트

```bash
npm run dev
```

캘린더 페이지에서 월 이동 버튼 클릭

**Expected Output:**
- 좌 화살표 클릭 → 이전 달로 이동
- 우 화살표 클릭 → 다음 달로 이동
- 12월에서 우 클릭 → 다음 해 1월
- 1월에서 좌 클릭 → 이전 해 12월
- 월 변경 시 자동으로 데이터 재조회 (Phase 2의 useEffect)

### Step 4: 로딩 중 버튼 비활성화 확인

네트워크를 Slow 3G로 설정하고 월 이동

**Expected Output:**
- 로딩 중에는 버튼이 비활성화됨
- 로딩 완료 후 버튼 다시 활성화

### Step 5: 커밋

```bash
git add app/meal-plan/calendar/page.tsx
git commit -m "feat: implement month navigation buttons

- handlePreviousMonth, handleNextMonth 함수 추가
- 12월 ↔ 1월 연도 경계 처리
- 로딩 중 버튼 비활성화
- useEffect로 자동 데이터 재조회

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: 날짜 클릭 이벤트 구현

**Files:**
- Modify: `app/meal-plan/calendar/page.tsx` (CalendarCell 컴포넌트)

### Step 1: 날짜 클릭 핸들러 함수 작성

컴포넌트 상단에 핸들러 추가:

```typescript
const router = useRouter()

/**
 * 날짜 클릭 핸들러
 */
const handleDateClick = (date: string, hasMealPlan: boolean) => {
  if (!hasMealPlan) {
    // 식단이 없는 날짜 클릭 시 (선택: 토스트 메시지)
    console.log(`${date}에는 등록된 식단이 없습니다.`)
    return
  }

  // 식단 페이지로 이동
  router.push(`/meal-plan?date=${date}`)
}
```

### Step 2: CalendarCell에 클릭 핸들러 전달

CalendarCell 호출 부분 수정:

```typescript
{week.map((day, dayIdx) => (
  <CalendarCell
    key={day.date}
    day={day}
    mealPlan={mealPlans.get(day.date)}
    onClick={handleDateClick}  // 추가
  />
))}
```

### Step 3: CalendarCell 컴포넌트 수정

CalendarCell을 클릭 가능하게 수정:

```typescript
interface CalendarCellProps {
  day: CalendarDay
  mealPlan?: MealPlan
  onClick: (date: string, hasMealPlan: boolean) => void  // 추가
}

const CalendarCell = memo(function CalendarCell({ day, mealPlan, onClick }: CalendarCellProps) {
  const hasMealPlan = !!mealPlan

  // 식사별 필터링
  const breakfast = mealPlan?.meals.filter(m => m.mealTime === 'breakfast') || []
  const lunch = mealPlan?.meals.filter(m => m.mealTime === 'lunch') || []
  const dinner = mealPlan?.meals.filter(m => m.mealTime === 'dinner') || []
  const snacks = mealPlan?.meals.filter(m => m.mealTime.includes('snack')) || []

  return (
    <button
      onClick={() => onClick(day.date, hasMealPlan)}
      disabled={!day.isCurrentMonth}
      className={cn(
        "min-h-20 sm:min-h-24 lg:min-h-28 p-2 border-r last:border-r-0 text-left transition-colors",
        day.isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50",
        day.isToday && "bg-blue-50",
        hasMealPlan && day.isCurrentMonth && "cursor-pointer",
        !hasMealPlan && day.isCurrentMonth && "cursor-default"
      )}
    >
      <div
        className={cn(
          "text-sm font-semibold mb-1",
          day.isCurrentMonth ? "text-gray-900" : "text-gray-400",
          day.isToday && "text-blue-600 font-bold"
        )}
      >
        {day.day}
      </div>

      {/* 식단 정보 */}
      <div className="space-y-1">
        {breakfast.map((meal) => (
          <div
            key={meal.id}
            className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded truncate"
            title={meal.name}
          >
            {meal.name}
          </div>
        ))}
        {lunch.map((meal) => (
          <div
            key={meal.id}
            className="text-xs bg-amber-700 text-white px-1.5 py-0.5 rounded truncate"
            title={meal.name}
          >
            {meal.name}
          </div>
        ))}
        {dinner.map((meal) => (
          <div
            key={meal.id}
            className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded truncate"
            title={meal.name}
          >
            {meal.name}
          </div>
        ))}
        {snacks.map((meal) => (
          <div
            key={meal.id}
            className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded truncate"
            title={meal.name}
          >
            {meal.name}
          </div>
        ))}
      </div>
    </button>
  )
})
```

### Step 4: 브라우저에서 테스트

1. 식단이 있는 날짜 클릭

**Expected Output:**
- `/meal-plan?date=YYYY-MM-DD` 페이지로 이동
- 아직 식단 페이지에서 date 파라미터를 처리하지 않으므로 오늘 식단이 표시될 수 있음 (Task 3에서 수정)

2. 식단이 없는 날짜 클릭

**Expected Output:**
- 콘솔에 메시지 출력 (선택: 토스트 메시지)
- 페이지 이동 없음

3. 호버 효과 확인

**Expected Output:**
- 식단이 있는 날짜에 호버 시 배경색 변경 (`hover:bg-gray-50`)
- 커서가 pointer로 변경

### Step 5: 커밋

```bash
git add app/meal-plan/calendar/page.tsx
git commit -m "feat: implement date click event

- handleDateClick 함수 추가
- CalendarCell을 button으로 변경
- 식단이 있는 날짜만 클릭 가능
- 식단 페이지로 라우팅 (?date=YYYY-MM-DD)
- 호버 효과 및 커서 스타일

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: 식단 페이지 URL 파라미터 지원

**Files:**
- Modify: `app/meal-plan/page.tsx`

### Step 1: useSearchParams import 및 파라미터 읽기

`app/meal-plan/page.tsx` 상단에 import 추가:

```typescript
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'  // useSearchParams 추가
```

컴포넌트 시작 부분에서 쿼리 파라미터 읽기:

```typescript
export default function MealPlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')  // YYYY-MM-DD 또는 null

  // ... 기존 상태들
```

### Step 2: loadProfileAndGenerateMeals 함수 수정

date 파라미터를 고려하도록 수정:

```typescript
const loadProfileAndGenerateMeals = async () => {
  const savedProfile = getProfile()

  if (!savedProfile) {
    router.push('/onboarding')
    return
  }

  setProfile(savedProfile)

  // Calculate current phase
  const userProfile: UserProfile = {
    ...savedProfile,
    surgery_date: new Date(savedProfile.surgery_date),
    created_at: new Date(savedProfile.created_at),
    updated_at: new Date(savedProfile.updated_at)
  }

  try {
    const currentPhase = calculateRecoveryPhase(userProfile)
    setCurrentPhaseName(currentPhase.description)

    // Map phase name
    let mealPhase: 'liquid' | 'soft' | 'regular' = 'soft'
    if (currentPhase.name === 'liquid') mealPhase = 'liquid'
    else if (currentPhase.name === 'normal') mealPhase = 'regular'
    else mealPhase = 'soft'

    setRecoveryPhase(mealPhase)

    let hasData = false

    // 날짜 파라미터가 있으면 해당 날짜, 없으면 오늘
    const targetDate = dateParam || getTodayDate()

    // 1. 로컬 캐시 우선 확인 (오늘 날짜만)
    if (!dateParam) {
      console.log('1️⃣ 로컬 캐시 확인 중... (Fast Load)')
      const cachedPlan = getTodayMealPlan(savedProfile.id)

      if (cachedPlan && isMealPlanValid(cachedPlan, mealPhase)) {
        console.log('✅ 로컬 캐시 식단 사용')
        setMeals(cachedPlan.meals)
        setLoading(false)
        hasData = true
      }
    }

    // 2. DB 조회
    const shouldRevalidate = !hasData || !isCacheValid()

    if (shouldRevalidate) {
      console.log(`2️⃣ DB에서 ${targetDate} 식단 조회`)
      try {
        const dbPlan = await fetchMealPlan(savedProfile.id, targetDate)

        if (dbPlan && isMealPlanValid(dbPlan, mealPhase)) {
          console.log('✅ DB 최신 데이터 수신 - UI 업데이트')
          setMeals(dbPlan.meals)
          setLoading(false)
          hasData = true
        }
      } catch (dbError) {
        console.error('DB 동기화 실패 (로컬 데이터 유지):', dbError)
      }
    }

    // 3. 데이터 없음: LLM 생성 (오늘 날짜만)
    if (!hasData) {
      if (!dateParam || targetDate === getTodayDate()) {
        console.log('3️⃣ 데이터 없음 - LLM으로 새 식단 생성')
        await generateMeals(savedProfile.id, mealPhase, savedProfile.surgery_type)
      } else {
        // 과거/미래 날짜는 식단 없음 표시
        setError(`${targetDate}에는 등록된 식단이 없습니다.`)
        setLoading(false)
      }
    }
  } catch (e) {
    console.error('Error:', e)
  }

  setLoading(false)
}
```

### Step 3: 날짜 파라미터 변경 시 재로드

useEffect에 dateParam 의존성 추가:

```typescript
useEffect(() => {
  if (!initializedRef.current) {
    initializedRef.current = true
    loadProfileAndGenerateMeals()
  }
}, [dateParam])  // dateParam 추가
```

**주의:** dateParam이 변경될 때마다 재로드되도록 하려면 initializedRef 로직 수정 필요:

```typescript
const prevDateRef = useRef<string | null>(null)

useEffect(() => {
  // 날짜가 변경되었거나 첫 로드
  if (prevDateRef.current !== dateParam) {
    prevDateRef.current = dateParam
    loadProfileAndGenerateMeals()
  }
}, [dateParam])
```

### Step 4: 헤더 날짜 표시 동적 변경

날짜 표시 부분 수정:

```typescript
// 표시할 날짜 계산
const displayDate = dateParam
  ? new Date(dateParam + 'T00:00:00').toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  : new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

return (
  // ... 기존 코드
  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
    {displayDate} 식단
  </h1>
  // ... 기존 코드
)
```

### Step 5: isMealPlanValid 함수 수정 (선택 사항)

`lib/services/meal-service.ts`의 `isMealPlanValid` 함수를 수정하여 다른 날짜도 허용:

```typescript
/**
 * 식단 유효성 검증
 * @param plan 식단 계획
 * @param currentPhase 현재 회복 단계
 * @param targetDate 조회할 날짜 (기본: 오늘)
 */
export function isMealPlanValid(
  plan: MealPlan | null,
  currentPhase: 'liquid' | 'soft' | 'regular',
  targetDate?: string
): boolean {
  if (!plan) return false

  const expectedDate = targetDate || getTodayDate()
  if (plan.date !== expectedDate) return false

  if (plan.recovery_phase !== currentPhase) return false

  if (!plan.meals || plan.meals.length === 0) return false

  return true
}
```

그리고 호출 부분 수정:

```typescript
// Before
if (cachedPlan && isMealPlanValid(cachedPlan, mealPhase)) { ... }

// After
if (cachedPlan && isMealPlanValid(cachedPlan, mealPhase, targetDate)) { ... }
```

### Step 6: 브라우저에서 테스트

1. 캘린더에서 식단이 있는 날짜 클릭

**Expected Output:**
- `/meal-plan?date=2026-01-29` 형태의 URL
- 해당 날짜의 식단이 표시됨
- 헤더에 "2026년 1월 29일 식단" 표시

2. 브라우저 뒤로가기

**Expected Output:**
- 캘린더 페이지로 복귀

3. 식단이 없는 날짜를 URL에 직접 입력 (`/meal-plan?date=2026-02-01`)

**Expected Output:**
- "2026-02-01에는 등록된 식단이 없습니다." 에러 메시지

### Step 7: 커밋

```bash
git add app/meal-plan/page.tsx lib/services/meal-service.ts
git commit -m "feat: add date parameter support to meal plan page

- useSearchParams로 date 쿼리 파라미터 읽기
- dateParam이 있으면 해당 날짜 식단 조회
- 헤더 날짜 표시 동적 변경
- isMealPlanValid에 targetDate 파라미터 추가
- 식단 없는 날짜는 에러 메시지 표시
- dateParam 변경 시 자동 재로드

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: 반응형 및 UX 개선

**Files:**
- Modify: `app/meal-plan/calendar/page.tsx`

### Step 1: 모바일 월 네비게이션 개선

모바일에서 년월 표시가 작을 수 있으므로 조정:

```typescript
<h2 className="text-xl sm:text-2xl font-bold text-gray-900 min-w-[160px] sm:min-w-[200px] text-center">
  {currentDate.year}년 {currentDate.month}월
</h2>
```

### Step 2: 식단이 없는 날짜 호버 효과 제거

CalendarCell에서 식단 없는 날짜는 호버 효과 제거:

```typescript
className={cn(
  "min-h-20 sm:min-h-24 lg:min-h-28 p-2 border-r last:border-r-0 text-left transition-colors",
  day.isCurrentMonth ? "bg-white" : "bg-gray-50",
  day.isToday && "bg-blue-50",
  hasMealPlan && day.isCurrentMonth && "cursor-pointer hover:bg-gray-50",  // 조건부 hover
  !hasMealPlan && day.isCurrentMonth && "cursor-default"
)}
```

### Step 3: 접근성 개선 (aria-label 추가)

CalendarCell 버튼에 aria-label 추가:

```typescript
<button
  onClick={() => onClick(day.date, hasMealPlan)}
  disabled={!day.isCurrentMonth}
  aria-label={
    hasMealPlan
      ? `${day.date} 식단 보기`
      : `${day.date} (식단 없음)`
  }
  className={cn(
    // ... 기존 클래스
  )}
>
```

### Step 4: 키보드 네비게이션 지원

월 이동 버튼에 aria-label 추가:

```typescript
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  onClick={handlePreviousMonth}
  disabled={loading}
  aria-label="이전 달"
>
  <ChevronLeft className="h-5 w-5" />
</Button>

{/* ... */}

<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  onClick={handleNextMonth}
  disabled={loading}
  aria-label="다음 달"
>
  <ChevronRight className="h-5 w-5" />
</Button>
```

### Step 5: 브라우저에서 접근성 테스트

1. 키보드만으로 네비게이션 (`Tab`, `Enter`, `Space`)

**Expected Output:**
- Tab으로 버튼 간 이동 가능
- Enter 또는 Space로 클릭 가능

2. 스크린 리더 모드 (선택 사항)

**Expected Output:**
- aria-label이 정확히 읽힘

### Step 6: 커밋

```bash
git add app/meal-plan/calendar/page.tsx
git commit -m "feat: improve responsiveness and accessibility

- 모바일 월 표시 크기 조정
- 식단 없는 날짜 호버 효과 제거
- aria-label 추가 (접근성 개선)
- 키보드 네비게이션 지원

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: E2E 테스트 및 최종 검증

**Files:**
- None (수동 테스트)

### Step 1: 전체 플로우 테스트

**시나리오 1: 오늘 식단 → 캘린더 → 다른 날짜 클릭**

1. `/meal-plan` 접속
2. AI로 오늘 식단 생성 (없는 경우)
3. "달력보기" 버튼 클릭
4. 오늘 날짜에 식단 표시 확인
5. 다른 날짜 식단 생성 (DB 직접 입력 또는 다음 날 생성)
6. 캘린더에서 해당 날짜 클릭
7. 식단 상세 페이지로 이동 확인
8. 뒤로가기 → 캘린더 복귀

**Expected Output:** 모든 단계가 매끄럽게 동작

---

**시나리오 2: 월 이동 및 데이터 로드**

1. 캘린더 페이지에서 다음 달로 이동 (우 화살표)
2. 로딩 스피너 확인
3. 빈 캘린더 표시 (식단 없음)
4. 이전 달로 이동 (좌 화살표)
5. 식단이 있는 달로 돌아옴

**Expected Output:**
- 월 이동이 부드럽게 동작
- 로딩 상태가 명확히 표시
- 캐시가 있는 월은 즉시 로드

---

**시나리오 3: 식단 없는 날짜 클릭**

1. 캘린더에서 식단 없는 날짜 클릭

**Expected Output:**
- 페이지 이동 없음
- 콘솔에 메시지 출력

---

### Step 2: 다양한 년도/월 테스트

1. 2025년 12월 → 다음 달 (2026년 1월)
2. 2026년 1월 → 이전 달 (2025년 12월)
3. 2024년 2월 (윤년) → 29일까지 표시 확인

**Expected Output:** 모든 연도 경계가 정확히 처리됨

---

### Step 3: URL 직접 접근 테스트

1. `/meal-plan?date=2026-01-29` 직접 입력

**Expected Output:**
- 해당 날짜 식단 표시
- 헤더에 "2026년 1월 29일 식단"

2. `/meal-plan?date=invalid-date` 입력

**Expected Output:**
- 오류 처리 또는 오늘 날짜로 폴백

---

### Step 4: 성능 테스트

1. 네트워크를 Slow 3G로 설정
2. 월 이동 및 날짜 클릭
3. 로딩 시간 측정

**Expected Output:**
- 로딩 스피너가 명확히 표시
- 캐시가 있는 경우 즉시 표시

---

### Step 5: 반응형 테스트

다양한 화면 크기에서 테스트:
- iPhone SE (375px)
- iPad (768px)
- Desktop (1440px)

**Expected Output:**
- 모든 화면에서 클릭 가능
- 버튼과 텍스트가 읽기 쉬움

---

### Step 6: 브라우저 호환성 (선택 사항)

- Chrome
- Firefox
- Safari

**Expected Output:** 모든 브라우저에서 동일하게 동작

---

### Step 7: 최종 정리 커밋

```bash
git status
# 변경사항이 있으면 커밋
git add .
git commit -m "test: verify calendar phase 3 implementation

- 전체 플로우 테스트 완료
  - 오늘 식단 → 캘린더 → 다른 날짜 클릭
  - 월 이동 및 데이터 로드
  - 식단 없는 날짜 클릭
- 다양한 년도/월 경계 테스트
- URL 직접 접근 테스트
- 성능 및 반응형 테스트
- 브라우저 호환성 확인

Phase 3 구현 완료 - 월별 식단 캘린더 기능 완성

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 완료 체크리스트

Phase 3 구현 완료 조건:

- [x] 월 이동 버튼 기능 (좌/우 화살표)
- [x] 연도 경계 처리 (12월 ↔ 1월)
- [x] 날짜 클릭 이벤트
- [x] 식단 페이지 URL 파라미터 지원 (`?date=YYYY-MM-DD`)
- [x] 헤더 날짜 동적 표시
- [x] 뒤로가기 네비게이션
- [x] 반응형 및 접근성 개선
- [x] 전체 플로우 검증

**프로젝트 완료:** 월별 식단 캘린더 Phase 1, 2, 3 모두 완성

---

## 전체 기능 요약

### 완성된 기능

1. **Phase 1: 기본 UI**
   - ✅ 달력보기 버튼
   - ✅ 정적 캘린더 그리드
   - ✅ 요일 헤더, 오늘 날짜 강조

2. **Phase 2: 데이터 연동**
   - ✅ `fetchMealPlan(userId, date?)` 확장
   - ✅ 월별 데이터 병렬 조회
   - ✅ 색상별 식단 배지 표시
   - ✅ 로딩 및 에러 처리
   - ✅ 월별 캐싱

3. **Phase 3: 인터랙션**
   - ✅ 월 이동 기능
   - ✅ 날짜 클릭 → 식단 페이지 이동
   - ✅ URL 파라미터 지원
   - ✅ 반응형 및 접근성

### 네비게이션 흐름

```
/meal-plan
  ↓ (달력보기 클릭)
/meal-plan/calendar (2026년 1월)
  ↓ (월 이동)
/meal-plan/calendar (2026년 2월)
  ↓ (날짜 클릭)
/meal-plan?date=2026-02-15
  ↓ (뒤로가기)
/meal-plan/calendar (2026년 2월)
```

---

## 향후 개선 사항 (선택)

### 성능 최적화

1. **서버 사이드 월별 조회**
   - `fetchMonthlyMealPlans` 함수 재추가
   - 31번 요청 → 1번 요청으로 감소

2. **로컬 스토리지 캐싱**
   - 월별 데이터를 로컬 스토리지에 저장
   - TTL 30분 설정

### UX 개선

1. **토스트 메시지**
   - 식단 없는 날짜 클릭 시 토스트
   - 에러 발생 시 토스트

2. **애니메이션**
   - 월 전환 슬라이드 효과
   - 날짜 클릭 시 페이드 효과

3. **스와이프 제스처**
   - 모바일에서 좌우 스와이프로 월 이동

### 추가 기능

1. **주간 뷰**
   - 주간/월간 토글

2. **영양소 통계**
   - 월간 평균 칼로리, 단백질 차트

3. **식단 복사**
   - 드래그 앤 드롭으로 날짜 간 식단 복사

---

## 문제 해결 가이드

### 문제 1: 날짜 클릭 시 식단이 표시되지 않음

**원인:** `isMealPlanValid` 함수가 targetDate를 고려하지 않음

**해결:**
```typescript
// meal-service.ts
export function isMealPlanValid(
  plan: MealPlan | null,
  currentPhase: 'liquid' | 'soft' | 'regular',
  targetDate?: string  // 추가
): boolean {
  if (!plan) return false
  const expectedDate = targetDate || getTodayDate()
  if (plan.date !== expectedDate) return false
  // ...
}
```

---

### 문제 2: 뒤로가기 시 이전 월이 표시됨

**원인:** 월별 캐시가 브라우저 히스토리와 동기화되지 않음

**해결:** 브라우저 뒤로가기는 정상 동작. 캘린더 페이지가 항상 현재 월로 초기화되는 것이 의도된 동작. 만약 이전 월을 유지하려면 URL에 월 정보 포함 필요 (`/meal-plan/calendar?year=2026&month=1`)

---

### 문제 3: 모바일에서 배지가 잘림

**원인:** 셀 높이가 부족하거나 배지가 너무 많음

**해결:**
```typescript
// 모바일 최소 높이 증가
className="min-h-24 sm:min-h-24 lg:min-h-28"

// 또는 배지 개수 제한
{breakfast.slice(0, 1).map(...)}  // 첫 번째만 표시
```

---

## 참고 자료

- **Design Document**: `docs/plans/2026-01-29-meal-calendar-design.md`
- **Phase 1 Plan**: `docs/plans/2026-01-29-meal-calendar-phase1-implementation.md`
- **Phase 2 Plan**: `docs/plans/2026-01-29-meal-calendar-phase2-implementation.md`
- **Next.js Routing**: https://nextjs.org/docs/app/api-reference/functions/use-search-params
- **React Hooks**: https://react.dev/reference/react/hooks
