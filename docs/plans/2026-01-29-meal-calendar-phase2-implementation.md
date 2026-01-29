# 월별 식단 캘린더 Phase 2 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `fetchMealPlan` 함수를 확장하여 특정 날짜의 식단을 조회하고, 캘린더에 월별 식단 데이터를 표시

**Architecture:** `fetchMealPlan`에 선택적 date 파라미터를 추가하여 하위 호환성 유지. 캘린더 페이지에서 해당 월의 모든 날짜에 대해 병렬 조회 수행 (`Promise.all`). 조회된 데이터를 Map으로 관리하여 빠른 날짜별 조회 지원.

**Tech Stack:** Next.js 14, React, TypeScript, Supabase, Tailwind CSS

**Prerequisites:** Phase 1 완료 (달력보기 버튼 및 정적 캘린더 그리드)

**Design Reference:** `docs/plans/2026-01-29-meal-calendar-design.md` - Phase 2 섹션

---

## Task 1: fetchMealPlan 함수 확장 (TDD)

**Files:**
- Modify: `lib/services/meal-service.ts:53-105`
- Create: `lib/services/meal-service.test.ts`

### Step 1: 테스트 파일 생성 및 실패 테스트 작성

`lib/services/meal-service.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { fetchMealPlan, getTodayDate } from './meal-service'

// Mock Supabase
jest.mock('@/lib/supabase-client', () => ({
  supabase: {
    from: jest.fn()
  }
}))

describe('fetchMealPlan', () => {
  it('should fetch today meal plan when date is not provided', async () => {
    // Mock 설정은 실제 테스트 환경에 맞게 조정 필요
    const userId = 'test-user-123'
    const result = await fetchMealPlan(userId)

    // 오늘 날짜로 조회했는지 확인 (실제 구현에서는 mock 확인)
    expect(result).toBeDefined()
  })

  it('should fetch specific date meal plan when date is provided', async () => {
    const userId = 'test-user-123'
    const targetDate = '2026-01-15'

    const result = await fetchMealPlan(userId, targetDate)

    // 특정 날짜로 조회했는지 확인
    expect(result).toBeDefined()
  })

  it('should return null when meal plan does not exist', async () => {
    const userId = 'test-user-123'
    const targetDate = '2026-01-01'

    const result = await fetchMealPlan(userId, targetDate)

    // 데이터가 없으면 null 반환
    expect(result).toBeNull()
  })

  it('should maintain backward compatibility (no date parameter)', async () => {
    const userId = 'test-user-123'

    // 기존 방식으로 호출
    const result = await fetchMealPlan(userId)

    // 오늘 날짜로 조회되어야 함
    expect(result).toBeDefined()
  })
})
```

### Step 2: 테스트 실행 및 실패 확인

```bash
npm test -- meal-service.test.ts
```

**Expected Output:** 테스트 실패 (date 파라미터가 없어서 타입 에러 또는 로직 에러)

### Step 3: fetchMealPlan 함수 수정

`lib/services/meal-service.ts:53-105`에서 함수 시그니처 및 구현 수정:

```typescript
/**
 * [DB] 특정 날짜의 식단 조회
 * @param userId 사용자 ID
 * @param date 조회할 날짜 (YYYY-MM-DD), 생략 시 오늘 날짜
 */
export async function fetchMealPlan(
    userId: string,
    date?: string
): Promise<MealPlan | null> {
    try {
        const targetDate = date || getTodayDate()

        const { data: dbData, error } = await (supabase as any)
            .from('meal_plans')
            .select('*')
            .eq('user_id', userId)
            .eq('date', targetDate)  // getTodayDate() → targetDate
            .single()

        const data = dbData as any

        if (error) {
            if (error.code === 'PGRST116') {
                return null
            }
            console.error('DB 식단 조회 오류:', error)
            return null
        }

        if (data) {
            let parsedMeals: Meal[] = []
            if (typeof data.meals === 'string') {
                try {
                    parsedMeals = JSON.parse(data.meals)
                } catch (e) {
                    console.error('JSON Parse Error (meals):', e)
                    parsedMeals = []
                }
            } else if (Array.isArray(data.meals)) {
                parsedMeals = data.meals as Meal[]
            }

            if (parsedMeals.length === 1 && Array.isArray(parsedMeals[0])) {
                parsedMeals = (parsedMeals[0] as unknown) as Meal[]
            }

            const plan: MealPlan = {
                ...data,
                meals: parsedMeals,
                preferences: typeof data.preferences === 'string' ? JSON.parse(data.preferences) : (data.preferences as any),
                created_at: new Date(data.created_at),
                updated_at: new Date(data.updated_at)
            }

            return plan
        }
        return null

    } catch (error) {
        console.error('식단 조회 예외:', error)
        return null
    }
}
```

### Step 4: 기존 호출 부분 확인 (하위 호환성)

기존 코드에서 `fetchMealPlan(userId)` 형태로 호출하는 부분이 있는지 확인:

```bash
grep -r "fetchMealPlan" app/
```

**Expected Output:**
- `app/meal-plan/page.tsx`에서 `fetchMealPlan(savedProfile.id)` 호출
- date 파라미터가 선택적이므로 기존 코드는 수정 불필요

### Step 5: 테스트 재실행 (Mock 없이는 실패할 수 있음)

```bash
npm test -- meal-service.test.ts
```

**Expected Output:**
- Mock이 없으면 실제 DB 연결 시도로 실패할 수 있음
- 함수 시그니처는 정상 작동 확인

**Note:** 실제 프로젝트에 Jest 설정이 없다면 이 단계는 건너뛰고 수동 테스트로 대체

### Step 6: 커밋

```bash
git add lib/services/meal-service.ts
git commit -m "feat: add optional date parameter to fetchMealPlan

- fetchMealPlan(userId, date?) 시그니처 변경
- date 파라미터 생략 시 오늘 날짜 사용 (하위 호환성 유지)
- targetDate 변수로 날짜 선택 로직 추가

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: 캘린더 페이지에 월별 데이터 조회 로직 추가

**Files:**
- Modify: `app/meal-plan/calendar/page.tsx`

### Step 1: 프로필 조회 및 인증 로직 추가

`app/meal-plan/calendar/page.tsx` 상단에 필요한 import 추가:

```typescript
'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { generateCalendarGrid, CalendarDay } from '@/lib/utils/calendar-utils'
import { cn } from '@/lib/utils'
import { getProfile } from '@/lib/local-storage'
import { fetchMealPlan, type MealPlan } from '@/lib/services/meal-service'
```

컴포넌트 시작 부분에 상태 추가:

```typescript
export default function MealCalendarPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })
  const [mealPlans, setMealPlans] = useState<Map<string, MealPlan>>(new Map())

  // 프로필 로드
  useEffect(() => {
    const savedProfile = getProfile()
    if (!savedProfile) {
      router.push('/onboarding')
      return
    }
    setProfile(savedProfile)
  }, [router])

  // ... 기존 코드
}
```

### Step 2: 월별 데이터 조회 함수 작성

같은 파일에 월별 데이터 조회 함수 추가:

```typescript
// 프로필이 로드되면 데이터 조회
useEffect(() => {
  if (!profile) return

  loadMonthlyMeals(currentDate.year, currentDate.month)
}, [profile, currentDate.year, currentDate.month])

/**
 * 월별 식단 데이터 조회
 */
const loadMonthlyMeals = async (year: number, month: number) => {
  if (!profile) return

  setLoading(true)

  try {
    // 해당 월의 일수 계산
    const daysInMonth = new Date(year, month, 0).getDate()

    // 모든 날짜에 대해 병렬 조회
    const promises: Promise<MealPlan | null>[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      promises.push(
        fetchMealPlan(profile.id, dateStr).catch((err) => {
          console.error(`Failed to fetch meal for ${dateStr}:`, err)
          return null
        })
      )
    }

    // 병렬 실행
    const results = await Promise.all(promises)

    // Map으로 변환 (날짜별 빠른 조회)
    const mealMap = new Map<string, MealPlan>()
    results.forEach((plan) => {
      if (plan) {
        mealMap.set(plan.date, plan)
      }
    })

    setMealPlans(mealMap)
  } catch (error) {
    console.error('월별 식단 조회 오류:', error)
  } finally {
    setLoading(false)
  }
}
```

### Step 3: 로딩 상태 UI 추가

렌더링 부분에 로딩 상태 추가:

```typescript
if (loading && !profile) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
        <p className="text-gray-600">식단 데이터를 불러오는 중...</p>
      </div>
    </div>
  )
}

if (!profile) return null
```

### Step 4: 브라우저에서 확인

```bash
npm run dev
```

브라우저에서 `/meal-plan/calendar` 접속

**Expected Output:**
- 로딩 스피너 표시 후 캘린더 표시
- 콘솔에 31개 날짜에 대한 DB 조회 로그 (대부분 null일 수 있음)
- 캘린더 그리드는 여전히 빈 상태 (다음 Task에서 데이터 표시)

### Step 5: 커밋

```bash
git add app/meal-plan/calendar/page.tsx
git commit -m "feat: add monthly meal data fetching to calendar

- 프로필 조회 및 인증 체크
- loadMonthlyMeals 함수 구현 (Promise.all 병렬 처리)
- 날짜별 MealPlan을 Map으로 관리
- 로딩 상태 UI 추가
- 월 변경 시 자동 재조회 (useEffect)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: 캘린더 셀에 식단 정보 표시

**Files:**
- Modify: `app/meal-plan/calendar/page.tsx` (CalendarCell 컴포넌트)

### Step 1: CalendarCell에 식단 데이터 전달

기존 CalendarCell 컴포넌트 호출 부분 수정:

```typescript
{week.map((day, dayIdx) => (
  <CalendarCell
    key={day.date}
    day={day}
    mealPlan={mealPlans.get(day.date)}  // 추가
  />
))}
```

### Step 2: CalendarCell 컴포넌트 확장

CalendarCell 컴포넌트를 다음과 같이 수정:

```typescript
// 캘린더 셀 컴포넌트
interface CalendarCellProps {
  day: CalendarDay
  mealPlan?: MealPlan
}

function CalendarCell({ day, mealPlan }: CalendarCellProps) {
  // 식사별 필터링
  const breakfast = mealPlan?.meals.filter(m => m.mealTime === 'breakfast') || []
  const lunch = mealPlan?.meals.filter(m => m.mealTime === 'lunch') || []
  const dinner = mealPlan?.meals.filter(m => m.mealTime === 'dinner') || []
  const snacks = mealPlan?.meals.filter(m => m.mealTime.includes('snack')) || []

  return (
    <div
      className={cn(
        "min-h-20 sm:min-h-24 lg:min-h-28 p-2 border-r last:border-r-0",
        day.isCurrentMonth ? "bg-white" : "bg-gray-50",
        day.isToday && "bg-blue-50"
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
    </div>
  )
}
```

### Step 3: 테스트 데이터 생성 (선택 사항)

실제 식단이 없다면 `/meal-plan` 페이지에서 AI로 오늘 식단을 생성한 후 캘린더에서 확인

또는 직접 DB에 테스트 데이터 삽입:

```sql
-- Supabase SQL Editor에서 실행
INSERT INTO meal_plans (user_id, date, recovery_phase, meals, preferences)
VALUES (
  'your-user-id',
  '2026-01-29',
  'regular',
  '[
    {"id": "1", "name": "샐러드", "mealTime": "breakfast", "nutrition": {"calories": 300, "protein": 10, "fat": 5, "carbs": 40}, "ingredients": ["양상추", "토마토"], "instructions": ["섞기"], "prepTime": 10, "portionSize": "1인분", "phase": "regular"},
    {"id": "2", "name": "계란죽", "mealTime": "lunch", "nutrition": {"calories": 400, "protein": 15, "fat": 8, "carbs": 50}, "ingredients": ["계란", "쌀"], "instructions": ["끓이기"], "prepTime": 20, "portionSize": "1인분", "phase": "soft"},
    {"id": "3", "name": "스시", "mealTime": "dinner", "nutrition": {"calories": 500, "protein": 20, "fat": 10, "carbs": 60}, "ingredients": ["밥", "생선"], "instructions": ["만들기"], "prepTime": 30, "portionSize": "1인분", "phase": "regular"}
  ]'::jsonb,
  '{}'::jsonb
);
```

### Step 4: 브라우저에서 확인

브라우저 새로고침

**Expected Output:**
- 식단이 있는 날짜에 색상별 배지 표시
  - 아침: 주황색
  - 점심: 갈색
  - 저녁: 파란색
  - 간식: 보라색
- 식단명이 길면 truncate 처리
- 호버 시 title로 전체 이름 표시

### Step 5: 반응형 테스트

개발자 도구에서 모바일 뷰 확인

**Expected Output:**
- 모바일: 배지가 작게 표시되지만 읽을 수 있음
- 태블릿/데스크톱: 넉넉한 크기

### Step 6: 커밋

```bash
git add app/meal-plan/calendar/page.tsx
git commit -m "feat: display meal data in calendar cells

- CalendarCell에 mealPlan prop 추가
- 식사별 필터링 (breakfast, lunch, dinner, snacks)
- 색상별 배지 렌더링
  - 아침: 주황색 (bg-orange-500)
  - 점심: 갈색 (bg-amber-700)
  - 저녁: 파란색 (bg-blue-500)
  - 간식: 보라색 (bg-purple-500)
- truncate 처리 및 title 속성으로 전체 이름 표시

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: 로딩 상태 개선 및 에러 처리

**Files:**
- Modify: `app/meal-plan/calendar/page.tsx`

### Step 1: 에러 상태 추가

상태 선언 부분에 에러 추가:

```typescript
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

### Step 2: 에러 처리 로직 추가

`loadMonthlyMeals` 함수의 catch 블록 수정:

```typescript
const loadMonthlyMeals = async (year: number, month: number) => {
  if (!profile) return

  setLoading(true)
  setError(null)  // 에러 초기화

  try {
    // ... 기존 코드

    setMealPlans(mealMap)
  } catch (error) {
    console.error('월별 식단 조회 오류:', error)
    setError('식단 데이터를 불러오는데 실패했습니다.')  // 에러 메시지 설정
  } finally {
    setLoading(false)
  }
}
```

### Step 3: 에러 UI 추가

캘린더 그리드 위에 에러 메시지 추가:

```typescript
{/* Error Message */}
{error && (
  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
    <AlertCircle size={20} />
    <span>{error}</span>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => loadMonthlyMeals(currentDate.year, currentDate.month)}
      className="ml-auto"
    >
      다시 시도
    </Button>
  </div>
)}
```

import에 `AlertCircle` 추가:

```typescript
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
```

### Step 4: 월 변경 시 로딩 오버레이 추가

캘린더 그리드를 감싸는 div에 로딩 오버레이 추가:

```typescript
{/* Calendar Grid */}
<div className="bg-white rounded-lg border overflow-hidden relative">
  {/* Loading Overlay */}
  {loading && profile && (
    <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  )}

  {/* 기존 캘린더 그리드 코드 */}
  {/* ... */}
</div>
```

### Step 5: 브라우저에서 테스트

1. 네트워크를 느리게 설정 (개발자 도구 → Network → Slow 3G)
2. 페이지 새로고침

**Expected Output:**
- 로딩 스피너가 표시됨
- 데이터 로드 완료 후 캘린더 표시

3. 네트워크를 오프라인으로 설정하고 새로고침

**Expected Output:**
- 에러 메시지 표시
- "다시 시도" 버튼 클릭 시 재시도

### Step 6: 커밋

```bash
git add app/meal-plan/calendar/page.tsx
git commit -m "feat: add loading and error handling to calendar

- 에러 상태 추가 및 에러 메시지 표시
- 다시 시도 버튼으로 재조회 가능
- 월 변경 시 로딩 오버레이 표시 (bg-white/70)
- AlertCircle 아이콘 추가

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: 성능 최적화 및 캐싱

**Files:**
- Modify: `app/meal-plan/calendar/page.tsx`

### Step 1: 월별 캐시 상태 추가

```typescript
const [monthlyCache, setMonthlyCache] = useState<Record<string, Map<string, MealPlan>>>({})
```

### Step 2: 캐시 활용 로직 추가

`loadMonthlyMeals` 함수 수정:

```typescript
const loadMonthlyMeals = async (year: number, month: number) => {
  if (!profile) return

  const cacheKey = `${year}-${String(month).padStart(2, '0')}`

  // 캐시 확인
  if (monthlyCache[cacheKey]) {
    console.log(`✅ 캐시에서 ${cacheKey} 데이터 로드`)
    setMealPlans(monthlyCache[cacheKey])
    setLoading(false)
    return
  }

  setLoading(true)
  setError(null)

  try {
    const daysInMonth = new Date(year, month, 0).getDate()
    const promises: Promise<MealPlan | null>[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      promises.push(
        fetchMealPlan(profile.id, dateStr).catch((err) => {
          console.error(`Failed to fetch meal for ${dateStr}:`, err)
          return null
        })
      )
    }

    const results = await Promise.all(promises)

    const mealMap = new Map<string, MealPlan>()
    results.forEach((plan) => {
      if (plan) {
        mealMap.set(plan.date, plan)
      }
    })

    setMealPlans(mealMap)

    // 캐시에 저장
    setMonthlyCache((prev) => ({
      ...prev,
      [cacheKey]: mealMap
    }))

    console.log(`💾 ${cacheKey} 데이터 캐시에 저장`)
  } catch (error) {
    console.error('월별 식단 조회 오류:', error)
    setError('식단 데이터를 불러오는데 실패했습니다.')
  } finally {
    setLoading(false)
  }
}
```

### Step 3: 브라우저에서 테스트

1. `/meal-plan/calendar` 접속 → 콘솔에 "💾 2026-01 데이터 캐시에 저장" 출력
2. `/meal-plan` 페이지로 이동
3. 다시 `/meal-plan/calendar` 접속 → 콘솔에 "✅ 캐시에서 2026-01 데이터 로드" 출력

**Expected Output:**
- 두 번째 방문 시 즉시 데이터 표시 (API 호출 없음)
- 콘솔에 캐시 로그 확인

### Step 4: CalendarCell 메모이제이션

CalendarCell 컴포넌트를 React.memo로 감싸기:

```typescript
import { useState, useMemo, useEffect, memo } from 'react'

// ... 기존 코드

const CalendarCell = memo(function CalendarCell({ day, mealPlan }: CalendarCellProps) {
  // ... 기존 코드
})
```

### Step 5: 성능 측정

React DevTools Profiler로 렌더링 성능 확인

**Expected Output:**
- CalendarCell이 불필요하게 재렌더링되지 않음
- 캐시 히트 시 거의 즉시 렌더링

### Step 6: 커밋

```bash
git add app/meal-plan/calendar/page.tsx
git commit -m "feat: add caching and performance optimization

- 월별 데이터 캐싱 (monthlyCache)
- 캐시 키: YYYY-MM 형식
- 캐시 히트 시 API 호출 생략
- CalendarCell 컴포넌트 메모이제이션 (React.memo)
- 콘솔 로그로 캐싱 동작 확인

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: 최종 검증 및 통합 테스트

**Files:**
- None (수동 테스트)

### Step 1: 전체 플로우 테스트

1. 브라우저에서 `/meal-plan` 접속
2. AI로 오늘 식단 생성 (없는 경우)
3. "달력보기" 버튼 클릭
4. 오늘 날짜에 식단 정보가 표시되는지 확인
5. 다른 날짜에는 빈 셀이 표시되는지 확인
6. 뒤로가기 버튼으로 식단 페이지 복귀

**Expected Output:** 모든 단계가 정상 동작

### Step 2: 여러 날짜 식단 생성 및 확인

1. `/meal-plan` 페이지에서 여러 날의 식단 생성
   - 방법 1: 날짜를 바꿔가며 식단 생성 (Phase 3 이후 가능)
   - 방법 2: DB에 직접 여러 날짜 데이터 삽입
2. 캘린더 페이지에서 여러 날짜의 식단 확인

**Expected Output:**
- 식단이 있는 날짜에만 배지 표시
- 색상이 정확하게 구분됨 (아침/점심/저녁/간식)

### Step 3: 성능 테스트

1. 네트워크를 Slow 3G로 설정
2. 캘린더 페이지 접속
3. 로딩 시간 측정 (대략 31개 요청의 병렬 처리 시간)

**Expected Output:**
- 느린 네트워크에서도 합리적인 시간 내에 로드 (5-10초 이내)
- 로딩 스피너가 명확히 표시됨

4. 캐시 확인
   - 페이지 재방문 시 즉시 로드 (<1초)

### Step 4: 에러 처리 테스트

1. 네트워크를 Offline으로 설정
2. 캘린더 페이지 새로고침

**Expected Output:**
- 에러 메시지 표시
- "다시 시도" 버튼 클릭 가능

3. 네트워크를 Online으로 전환하고 "다시 시도" 클릭

**Expected Output:**
- 정상적으로 데이터 로드

### Step 5: 반응형 테스트

다양한 화면 크기에서 테스트:
- iPhone SE (375px): 배지가 작지만 읽을 수 있음
- iPad (768px): 적절한 크기
- Desktop (1440px): 넉넉한 크기

**Expected Output:** 모든 화면 크기에서 정상 표시

### Step 6: 브라우저 호환성 (선택 사항)

- Chrome, Firefox, Safari에서 테스트

**Expected Output:** 모든 브라우저에서 동일하게 동작

### Step 7: 최종 정리 커밋

```bash
git status
# 변경사항이 있으면 커밋
git add .
git commit -m "test: verify calendar phase 2 implementation

- 전체 플로우 테스트 완료
- 여러 날짜 식단 표시 확인
- 성능 테스트 (병렬 처리 및 캐싱)
- 에러 처리 검증
- 반응형 및 브라우저 호환성 확인

Phase 2 구현 완료

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 완료 체크리스트

Phase 2 구현 완료 조건:

- [x] `fetchMealPlan(userId, date?)` 파라미터 추가
- [x] 월별 데이터 병렬 조회 (`Promise.all`)
- [x] 캘린더 셀에 식단 정보 표시 (색상별 배지)
- [x] 로딩 상태 및 에러 처리
- [x] 월별 데이터 캐싱 (성능 최적화)
- [x] CalendarCell 메모이제이션
- [x] 전체 플로우 검증

**다음 단계:** Phase 3 - 인터랙션 추가 (월 이동, 날짜 클릭, URL 파라미터)

---

## 알려진 제약사항 및 개선 방향

### 현재 제약사항

1. **많은 API 요청**: 월별로 최대 31번의 `fetchMealPlan` 호출
   - 네트워크 부담 및 Supabase 요청 수 제한 가능성
   - **향후 개선**: `fetchMonthlyMealPlans` 함수를 다시 추가하여 서버에서 한 번에 조회

2. **캐시 무효화**: 현재 캐시는 페이지 새로고침 시 사라짐
   - **향후 개선**: 로컬 스토리지 또는 세션 스토리지에 캐싱

3. **타임존 이슈**: 서버와 클라이언트의 타임존 차이로 날짜가 어긋날 수 있음
   - **향후 개선**: UTC 기준으로 통일하거나 사용자 타임존 고려

### 서버 사이드 최적화 (Phase 2 완료 후 고려)

```typescript
// 향후 추가할 함수 예시
export async function fetchMonthlyMealPlans(
  userId: string,
  year: number,
  month: number
): Promise<MealPlan[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endMonth = month === 12 ? 1 : month + 1
  const endYear = month === 12 ? year + 1 : year
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lt('date', endDate)

  // 31번 요청 → 1번 요청으로 감소
  return data || []
}
```

이렇게 하면 Phase 2의 성능이 크게 향상되지만, 현재는 기존 코드 수정을 최소화하기 위해 `fetchMealPlan` 확장 방식 사용.

---

## 참고 자료

- **Design Document**: `docs/plans/2026-01-29-meal-calendar-design.md`
- **Phase 1 Plan**: `docs/plans/2026-01-29-meal-calendar-phase1-implementation.md`
- **Supabase Docs**: https://supabase.com/docs/reference/javascript/select
- **React Performance**: https://react.dev/reference/react/memo
