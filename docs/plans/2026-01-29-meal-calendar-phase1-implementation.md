# 월별 식단 캘린더 Phase 1 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 식단 페이지에 "달력보기" 버튼을 추가하고, 클릭 시 정적 캘린더 그리드를 보여주는 기본 페이지 구현

**Architecture:** Next.js App Router를 사용하여 `/meal-plan/calendar` 라우트 생성. 캘린더 날짜 계산 로직은 별도 유틸리티 함수로 분리하여 테스트 가능하게 구성. 이번 Phase에서는 데이터 연동 없이 정적 UI만 구현.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui, lucide-react

**Design Reference:** `docs/plans/2026-01-29-meal-calendar-design.md`

---

## Task 1: 캘린더 유틸리티 함수 작성 (TDD)

**Files:**
- Create: `lib/utils/calendar-utils.ts`
- Create: `lib/utils/calendar-utils.test.ts`

### Step 1: 테스트 파일 생성 및 첫 번째 실패 테스트 작성

`lib/utils/calendar-utils.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals'
import { generateCalendarGrid, CalendarDay } from './calendar-utils'

describe('generateCalendarGrid', () => {
  it('should generate correct grid for January 2026', () => {
    const grid = generateCalendarGrid(2026, 1)

    // 2026년 1월 1일은 수요일 (일=0, 월=1, 화=2, 수=3)
    // 따라서 첫 주는 일(28), 월(29), 화(30), 수(1), 목(2), 금(3), 토(4)

    expect(grid.length).toBeGreaterThan(0) // 최소 1주 이상
    expect(grid[0].length).toBe(7) // 각 주는 7일

    // 첫 주의 수요일(인덱스 3)이 1월 1일이어야 함
    const firstWeek = grid[0]
    const jan1st = firstWeek.find(day => day.day === 1 && day.isCurrentMonth)
    expect(jan1st).toBeDefined()
    expect(jan1st?.date).toBe('2026-01-01')
  })

  it('should include previous month days for padding', () => {
    const grid = generateCalendarGrid(2026, 1)
    const firstWeek = grid[0]

    // 1월 1일이 수요일이므로 앞에 일(28), 월(29), 화(30)가 있어야 함
    const prevMonthDays = firstWeek.filter(day => !day.isCurrentMonth && day.day > 20)
    expect(prevMonthDays.length).toBe(3)
  })

  it('should mark today correctly', () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1

    const grid = generateCalendarGrid(year, month)
    const todayStr = today.toISOString().split('T')[0]

    let foundToday = false
    for (const week of grid) {
      for (const day of week) {
        if (day.date === todayStr) {
          expect(day.isToday).toBe(true)
          foundToday = true
        }
      }
    }

    expect(foundToday).toBe(true)
  })

  it('should handle February in leap year (2024)', () => {
    const grid = generateCalendarGrid(2024, 2)

    // 2024년 2월은 윤년이므로 29일까지
    let maxDay = 0
    for (const week of grid) {
      for (const day of week) {
        if (day.isCurrentMonth && day.day > maxDay) {
          maxDay = day.day
        }
      }
    }

    expect(maxDay).toBe(29)
  })

  it('should handle December to January transition', () => {
    const grid = generateCalendarGrid(2025, 12)

    // 12월의 마지막 날짜들 확인
    let hasDecember31 = false
    for (const week of grid) {
      for (const day of week) {
        if (day.isCurrentMonth && day.day === 31) {
          hasDecember31 = true
          expect(day.date).toBe('2025-12-31')
        }
      }
    }

    expect(hasDecember31).toBe(true)
  })
})
```

### Step 2: 테스트 실행 및 실패 확인

```bash
npm test -- calendar-utils.test.ts
```

**Expected Output:** 테스트 파일을 찾을 수 없거나, calendar-utils 모듈을 찾을 수 없다는 에러

### Step 3: 최소 구현 작성

`lib/utils/calendar-utils.ts`:

```typescript
export interface CalendarDay {
  date: string        // YYYY-MM-DD
  day: number         // 1-31
  isCurrentMonth: boolean
  isToday: boolean
}

/**
 * 특정 월의 캘린더 그리드 생성
 * @param year 년도
 * @param month 월 (1-12)
 * @returns 주차별로 그룹화된 날짜 배열 (각 주는 일요일부터 시작)
 */
export function generateCalendarGrid(year: number, month: number): CalendarDay[][] {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  const firstDayOfWeek = firstDay.getDay() // 0 (일) ~ 6 (토)
  const daysInMonth = lastDay.getDate()

  const weeks: CalendarDay[][] = []
  let currentWeek: CalendarDay[] = []

  // 이전 달 날짜로 빈 칸 채우기
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate()

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    currentWeek.push({
      date: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}`,
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: false
    })
  }

  // 현재 달 날짜 채우기
  const today = new Date().toISOString().split('T')[0]

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    currentWeek.push({
      date: dateStr,
      day,
      isCurrentMonth: true,
      isToday: dateStr === today
    })

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // 다음 달 날짜로 마지막 주 채우기
  if (currentWeek.length > 0) {
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year

    let day = 1
    while (currentWeek.length < 7) {
      currentWeek.push({
        date: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day,
        isCurrentMonth: false,
        isToday: false
      })
      day++
    }
    weeks.push(currentWeek)
  }

  return weeks
}
```

### Step 4: 테스트 실행 및 통과 확인

```bash
npm test -- calendar-utils.test.ts
```

**Expected Output:** All tests pass (5개 테스트 모두 통과)

### Step 5: 커밋

```bash
git add lib/utils/calendar-utils.ts lib/utils/calendar-utils.test.ts
git commit -m "feat: add calendar grid generation utility

- generateCalendarGrid 함수 구현
- 이전/다음 달 날짜 패딩 처리
- 오늘 날짜 마킹 로직
- 윤년 처리 및 연도 경계 처리
- 단위 테스트 추가 (5개 테스트 케이스)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: 캘린더 페이지 기본 구조 생성

**Files:**
- Create: `app/meal-plan/calendar/page.tsx`

### Step 1: 빈 페이지 컴포넌트 작성

`app/meal-plan/calendar/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'

export default function MealCalendarPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">식단 캘린더</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled
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
            disabled
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Calendar Grid Placeholder */}
        <div className="bg-white rounded-lg border p-4">
          <p className="text-center text-gray-500">캘린더 그리드가 여기에 표시됩니다</p>
        </div>
      </div>
    </div>
  )
}
```

### Step 2: 브라우저에서 페이지 확인

```bash
npm run dev
```

브라우저에서 `http://localhost:3000/meal-plan/calendar` 접속

**Expected Output:**
- "식단 캘린더" 헤더 표시
- 뒤로가기 버튼 표시
- "2026년 1월" (현재 년월) 표시
- 좌우 화살표 버튼 표시 (비활성화)
- "캘린더 그리드가 여기에 표시됩니다" 플레이스홀더

### Step 3: 커밋

```bash
git add app/meal-plan/calendar/page.tsx
git commit -m "feat: create calendar page basic structure

- 헤더 및 뒤로가기 버튼
- 월 네비게이션 UI (기능 없음)
- 플레이스홀더 컨텐츠

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: 캘린더 그리드 컴포넌트 구현

**Files:**
- Modify: `app/meal-plan/calendar/page.tsx`

### Step 1: 캘린더 그리드 렌더링 로직 추가

`app/meal-plan/calendar/page.tsx`에서 플레이스홀더 부분을 다음으로 교체:

```typescript
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { generateCalendarGrid, CalendarDay } from '@/lib/utils/calendar-utils'
import { cn } from '@/lib/utils'

export default function MealCalendarPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })

  // 캘린더 그리드 생성 (메모이제이션)
  const calendarGrid = useMemo(
    () => generateCalendarGrid(currentDate.year, currentDate.month),
    [currentDate.year, currentDate.month]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">식단 캘린더</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled
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
            disabled
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b bg-gray-50">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
              <div
                key={day}
                className={cn(
                  "py-3 text-center text-sm font-semibold",
                  idx === 0 ? "text-red-600" : "text-gray-700",
                  idx === 6 && "text-blue-600"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          {calendarGrid.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map((day, dayIdx) => (
                <CalendarCell key={day.date} day={day} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 캘린더 셀 컴포넌트
function CalendarCell({ day }: { day: CalendarDay }) {
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

      {/* 식단 정보는 나중에 추가 */}
      <div className="space-y-1">
        {/* Empty for now */}
      </div>
    </div>
  )
}
```

### Step 2: 브라우저에서 확인

브라우저 새로고침 (`http://localhost:3000/meal-plan/calendar`)

**Expected Output:**
- 7x5 또는 7x6 캘린더 그리드 표시
- 요일 헤더 (일요일은 빨강, 토요일은 파랑)
- 현재 월의 날짜는 진한 글씨, 이전/다음 달은 회색
- 오늘 날짜는 파란색 배경과 굵은 글씨

### Step 3: 반응형 테스트

브라우저 개발자 도구에서 모바일 뷰로 전환하여 확인

**Expected Output:**
- 모바일: 셀 높이가 작아짐 (`min-h-20`)
- 태블릿: 중간 높이 (`min-h-24`)
- 데스크톱: 넉넉한 높이 (`min-h-28`)

### Step 4: 커밋

```bash
git add app/meal-plan/calendar/page.tsx
git commit -m "feat: implement calendar grid rendering

- generateCalendarGrid 유틸리티 함수 사용
- 7x5/7x6 그리드 렌더링
- 요일 헤더 (일요일 빨강, 토요일 파랑)
- 오늘 날짜 강조 (파란색 배경)
- 이전/다음 달 날짜 회색 처리
- 반응형 셀 높이 (모바일/태블릿/데스크톱)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: 식단 페이지에 달력보기 버튼 추가

**Files:**
- Modify: `app/meal-plan/page.tsx:300-327`

### Step 1: Calendar 아이콘 import 추가

`app/meal-plan/page.tsx` 상단의 lucide-react import에 `Calendar` 추가:

```typescript
import { RefreshCw, MessageSquare, Loader2, ArrowLeft, AlertCircle, X, Calendar } from 'lucide-react'
```

### Step 2: 달력보기 버튼 추가

`app/meal-plan/page.tsx`의 버튼 영역 (약 300-327줄 근처)을 다음과 같이 수정:

기존:
```typescript
<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
  <Button
    onClick={() => setShowChat(!showChat)}
    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white border border-transparent h-9 px-4 text-sm rounded-full shadow-sm"
  >
    <MessageSquare size={14} />
    {showChat ? '대화 닫기' : 'AI와 대화하기'}
  </Button>

  <Button
    variant="outline"
    onClick={handleRegenerate}
    disabled={generating}
    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-900 border-gray-200 hover:bg-gray-50 h-9 px-4 text-sm rounded-full shadow-sm"
  >
    <RefreshCw className={generating ? 'animate-spin' : ''} size={14} />
    {generating ? '생성 중...' : '식단 다시 추천받기'}
  </Button>
</div>
```

수정 후:
```typescript
<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
  <Button
    variant="outline"
    onClick={() => router.push('/meal-plan/calendar')}
    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-900 border-gray-200 hover:bg-gray-50 h-9 px-4 text-sm rounded-full shadow-sm"
  >
    <Calendar size={14} />
    달력보기
  </Button>

  <Button
    onClick={() => setShowChat(!showChat)}
    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white border border-transparent h-9 px-4 text-sm rounded-full shadow-sm"
  >
    <MessageSquare size={14} />
    {showChat ? '대화 닫기' : 'AI와 대화하기'}
  </Button>

  <Button
    variant="outline"
    onClick={handleRegenerate}
    disabled={generating}
    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-900 border-gray-200 hover:bg-gray-50 h-9 px-4 text-sm rounded-full shadow-sm"
  >
    <RefreshCw className={generating ? 'animate-spin' : ''} size={14} />
    {generating ? '생성 중...' : '식단 다시 추천받기'}
  </Button>
</div>
```

### Step 3: 브라우저에서 확인

1. `http://localhost:3000/meal-plan` 접속
2. "달력보기" 버튼 확인
3. 버튼 클릭

**Expected Output:**
- "달력보기" 버튼이 가장 왼쪽에 표시됨
- 버튼 클릭 시 `/meal-plan/calendar` 페이지로 이동
- 캘린더 페이지에서 뒤로가기 버튼 클릭 시 식단 페이지로 복귀

### Step 4: 모바일 뷰 확인

개발자 도구에서 모바일 뷰로 전환하여 버튼 레이아웃 확인

**Expected Output:**
- 모바일: 버튼 3개가 세로로 쌓임
- 데스크톱: 버튼 3개가 가로로 나열

### Step 5: 커밋

```bash
git add app/meal-plan/page.tsx
git commit -m "feat: add calendar view button to meal plan page

- Calendar 아이콘 import 추가
- 달력보기 버튼을 버튼 그룹 맨 앞에 추가
- /meal-plan/calendar 페이지로 라우팅
- 반응형 레이아웃 유지 (모바일 세로, 데스크톱 가로)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: E2E 테스트 및 최종 검증

**Files:**
- None (수동 테스트)

### Step 1: 전체 플로우 테스트

1. 개발 서버 실행 (`npm run dev`)
2. `/meal-plan` 페이지 접속
3. "달력보기" 버튼 클릭
4. 캘린더 그리드 확인
   - 현재 월의 모든 날짜 표시
   - 오늘 날짜 강조 (파란색 배경)
   - 이전/다음 달 날짜 회색 처리
5. 뒤로가기 버튼 클릭
6. 식단 페이지로 복귀 확인

**Expected Output:** 모든 단계가 정상 동작

### Step 2: 다양한 월 테스트 (코드 수정 필요)

`app/meal-plan/calendar/page.tsx`에서 초기 상태를 다음으로 변경하여 테스트:

```typescript
// 윤년 2월 테스트
const [currentDate, setCurrentDate] = useState({
  year: 2024,
  month: 2
})
```

브라우저 새로고침 후 2월 29일까지 표시되는지 확인

```typescript
// 12월 테스트
const [currentDate, setCurrentDate] = useState({
  year: 2025,
  month: 12
})
```

브라우저 새로고침 후 12월 31일까지 표시되는지 확인

**테스트 완료 후 원래대로 복구**:
```typescript
const [currentDate, setCurrentDate] = useState({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1
})
```

### Step 3: 반응형 테스트

개발자 도구에서 다양한 화면 크기 테스트:
- iPhone SE (375px)
- iPad (768px)
- Desktop (1440px)

**Expected Output:**
- 모든 화면 크기에서 캘린더가 정상적으로 표시됨
- 셀 높이가 화면 크기에 따라 조정됨
- 버튼과 텍스트가 잘 보임

### Step 4: 브라우저 호환성 테스트 (선택 사항)

- Chrome
- Firefox
- Safari

**Expected Output:** 모든 브라우저에서 동일하게 동작

### Step 5: 최종 커밋 (변경사항이 있다면)

```bash
git status
# 변경사항이 있으면 커밋
git add .
git commit -m "test: verify calendar phase 1 implementation

- 전체 플로우 테스트 완료
- 다양한 월 테스트 (2월 윤년, 12월 등)
- 반응형 테스트 완료
- 브라우저 호환성 확인

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 완료 체크리스트

Phase 1 구현 완료 조건:

- [x] `generateCalendarGrid` 유틸리티 함수 및 테스트 작성
- [x] 캘린더 페이지 기본 구조 생성 (`/meal-plan/calendar`)
- [x] 캘린더 그리드 렌더링 (정적, 데이터 없음)
- [x] 식단 페이지에 "달력보기" 버튼 추가
- [x] 전체 네비게이션 플로우 동작 확인
- [x] 반응형 디자인 동작 확인

**다음 단계:** Phase 2 - 데이터 조회 함수 확장 및 식단 표시

---

## 주의사항

1. **타임존 이슈**: `new Date().toISOString().split('T')[0]`를 사용하여 오늘 날짜를 구할 때 타임존 차이로 인해 날짜가 하루 어긋날 수 있습니다. 현재는 단순 구현이지만 Phase 2에서 서버 시간과 동기화 필요.

2. **월 이동 버튼**: Phase 1에서는 `disabled` 상태로 두었습니다. Phase 3에서 기능 구현 예정.

3. **성능**: `useMemo`를 사용하여 캘린더 그리드 계산을 메모이제이션했지만, Phase 2에서 데이터 조회가 추가되면 추가 최적화 필요.

4. **테스트 설정**: Jest가 설정되지 않은 경우, 다음 명령으로 설정:
   ```bash
   npm install -D jest @types/jest ts-jest
   npx ts-jest config:init
   ```

5. **cn 유틸리티**: Tailwind CSS 클래스 병합을 위해 `lib/utils`의 `cn` 함수 사용. 없다면 추가 필요.
