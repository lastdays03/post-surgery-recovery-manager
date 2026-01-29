# 월별 식단 캘린더 화면 설계 (수정됨)

**작성일**: 2026-01-29
**수정일**: 2026-01-29
**버전**: 2.0
**목적**: 식단 페이지에 월별 캘린더 뷰를 추가하여 사용자가 한 달 동안의 식단 내역을 한눈에 보고 특정 날짜의 식단으로 빠르게 이동할 수 있도록 함

## ⚠️ 중요 변경사항

**v1.0 → v2.0 주요 변경점**:
- `fetchMonthlyMealPlans` 함수가 제거되어 **단계별 구현 전략**으로 변경
- Phase 1: 버튼 + 기본 페이지 (정적 그리드)
- Phase 2: 데이터 조회 함수 확장 (`fetchMealPlan` 파라미터 추가)
- Phase 3: 인터랙션 추가 (월 이동, 클릭 이벤트)

---

## 1. 요구사항 요약

### 기능 요구사항
- 식단 페이지 상단의 "달력보기" 버튼 클릭 시 월별 캘린더 화면으로 이동
- 월별로 모든 식단 내역을 캘린더 형태로 표시
- 식단이 있는 날짜를 클릭하면 해당 날짜의 식단 상세 페이지로 이동
- 년/월 양옆의 화살표 버튼으로 이전/다음 달로 이동 가능
- 상단 버튼들(AI와 대화하기, 식단 다시 추천받기)은 식단 페이지와 동일한 기능 제공

### UI 요구사항
- 첨부된 디자인 이미지를 참고하여 구현
- 각 날짜 셀에 식단 정보를 간소화하여 표시 (한 식사당 한 줄)
- 오늘 날짜 시각적 강조
- 반응형 디자인 지원 (모바일/태블릿/데스크톱)

---

## 2. 아키텍처 설계

### 2.1 라우팅 구조

**새로운 페이지**: `/meal-plan/calendar`
- 식단 페이지와 독립적인 별도 라우트로 구성
- 명확한 URL 구조로 뒤로가기 및 북마크 지원
- 식단 페이지의 "달력보기" 버튼을 통해 접근

**네비게이션 흐름**:
```
/meal-plan → (달력보기 클릭) → /meal-plan/calendar
/meal-plan/calendar → (날짜 클릭) → /meal-plan?date=YYYY-MM-DD
/meal-plan?date=YYYY-MM-DD → (뒤로가기) → /meal-plan/calendar
```

### 2.2 파일 구조

**생성할 파일**:
```
/app/meal-plan/calendar/page.tsx          # 캘린더 메인 페이지
/components/meal-plan/meal-calendar.tsx   # 재사용 가능한 캘린더 컴포넌트
/lib/utils/calendar-utils.ts              # 날짜 계산 유틸리티 함수
```

**수정할 파일**:
```
/app/meal-plan/page.tsx                   # 날짜 파라미터 지원 추가
```

### 2.3 단계별 구현 전략

#### Phase 1: 버튼 + 기본 캘린더 페이지 ⭐ (현재 단계)

**목표**: 식단 페이지에 "달력보기" 버튼을 추가하고, 클릭 시 정적 캘린더 그리드를 보여주는 페이지로 이동

**구현 내용**:
1. 식단 페이지에 "달력보기" 버튼 추가
   - 기존 "AI와 대화하기", "식단 다시 추천받기" 버튼 옆에 배치
   - `router.push('/meal-plan/calendar')` 로 이동
2. 캘린더 페이지 생성 (`/app/meal-plan/calendar/page.tsx`)
   - 기본 레이아웃 (헤더, 뒤로가기 버튼)
   - 정적 캘린더 그리드 (현재 월 기준)
3. 캘린더 유틸리티 함수 (`/lib/utils/calendar-utils.ts`)
   - `generateCalendarGrid(year, month)` - 날짜 배열 생성
   - 이전/다음 달 날짜 포함

**포함되지 않는 것**:
- DB 데이터 조회 및 표시
- 날짜 클릭 이벤트
- 월 이동 버튼 (UI만 표시, 기능 없음)

**데이터 흐름**:
```
1. 식단 페이지에서 "달력보기" 클릭
   ↓
2. /meal-plan/calendar 페이지 이동
   ↓
3. 현재 년/월 기준으로 정적 그리드 생성
   ↓
4. 빈 캘린더 셀 렌더링 (날짜 숫자만 표시)
```

---

#### Phase 2: 데이터 조회 함수 확장 및 표시

**목표**: `fetchMealPlan`을 확장하여 특정 날짜의 식단을 조회하고 캘린더에 표시

**구현 내용**:
1. `meal-service.ts` 수정
   ```typescript
   // Before
   export async function fetchMealPlan(userId: string): Promise<MealPlan | null>

   // After
   export async function fetchMealPlan(
     userId: string,
     date?: string  // 선택적 파라미터 (기본값: 오늘)
   ): Promise<MealPlan | null>
   ```
2. 캘린더 페이지에서 월별 데이터 조회
   - 해당 월의 모든 날짜에 대해 `fetchMealPlan` 호출
   - `Promise.all`로 병렬 처리 (성능 최적화)
3. 조회된 식단 데이터를 캘린더 셀에 표시
   - 아침/점심/저녁/간식 배지 렌더링
   - 식단 없는 날은 빈 셀 유지

**데이터 흐름**:
```
1. 페이지 로드
   ↓
2. 프로필 확인 (없으면 /onboarding 리다이렉트)
   ↓
3. 해당 월의 모든 날짜 생성 (1일~31일)
   ↓
4. 각 날짜에 대해 fetchMealPlan(userId, date) 호출
   ↓
5. 조회된 데이터를 날짜별로 매핑
   ↓
6. 캘린더 그리드에 식단 정보 렌더링
```

**성능 최적화**:
- 최대 31개의 병렬 요청 (한 달 최대 일수)
- 결과 캐싱하여 동일 월 재방문 시 재사용
- 로딩 상태 표시

---

#### Phase 3: 인터랙션 추가 (최종 단계)

**목표**: 캘린더를 실용적으로 만들기 위한 사용자 인터랙션 구현

**구현 내용**:
1. 월 이동 버튼 기능 구현
   - `< 2026년 1월 >` 좌우 화살표 클릭 시 월 변경
   - 상태 업데이트 후 Phase 2 데이터 조회 로직 재실행
2. 날짜 클릭 이벤트
   - 식단이 있는 날짜 클릭 시 `/meal-plan?date=YYYY-MM-DD`로 이동
   - 식단이 없는 날짜는 클릭 불가 (또는 토스트 메시지)
3. 식단 페이지 수정
   - URL 쿼리 파라미터 `date` 지원
   - `fetchMealPlan(userId, dateParam)` 호출
   - 날짜 표시 동적 변경
4. 로딩 및 에러 처리
   - 월 변경 시 로딩 오버레이
   - DB 오류 시 에러 메시지

**데이터 흐름**:
```
[월 변경 시]
1. 좌/우 화살표 클릭
   ↓
2. year/month 상태 업데이트
   ↓
3. Phase 2 데이터 조회 로직 실행
   ↓
4. 로딩 상태 표시 후 캘린더 갱신

[날짜 클릭 시]
1. 식단이 있는 날짜 클릭
   ↓
2. /meal-plan?date=YYYY-MM-DD 이동
   ↓
3. 식단 페이지에서 해당 날짜 식단 로드
   ↓
4. 식단 상세 정보 표시
```

---

## 3. UI/UX 설계

### 3.1 화면 구성

**헤더 영역**:
```
┌─────────────────────────────────────────────────────┐
│ [←] 캘린더                                          │
├─────────────────────────────────────────────────────┤
│                 < 2026년 1월 >                      │
│                                                      │
│ [AI와 대화하기] [식단 다시 추천받기]               │
└─────────────────────────────────────────────────────┘
```

**캘린더 영역**:
```
┌───┬───┬───┬───┬───┬───┬───┐
│ 일│ 월│ 화│ 수│ 목│ 금│ 토│
├───┼───┼───┼───┼───┼───┼───┤
│   │   │   │ 1 │ 2 │ 3 │ 4 │
│   │   │   │   │   │   │   │
├───┼───┼───┼───┼───┼───┼───┤
│ 5 │ 6 │...│   │   │   │   │
│   │   │샐러드│   │   │   │   │
│   │   │계란죽│   │   │   │   │
│   │   │스시 │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┘
```

### 3.2 캘린더 셀 디자인

**식단이 있는 날짜**:
```
┌─────────────┐
│     14      │ ← 날짜 숫자
├─────────────┤
│  [샐러드]   │ ← 아침 (주황색 배지)
│  [계란죽]   │ ← 점심 (갈색 배지)
│  [스시]     │ ← 저녁 (파란색 배지)
│  [스시]     │ ← 간식 (보라색 배지)
└─────────────┘
```

**식단이 없는 날짜**:
```
┌─────────────┐
│     15      │
│             │
│   (빈 셀)   │
│             │
└─────────────┘
```

**오늘 날짜**:
```
┌═════════════┐ ← 파란색 테두리
║     17      ║
║  [샐러드]   ║
║  [계란죽]   ║
║  [스시]     ║
└═════════════┘
```

### 3.3 색상 체계

식사 시간별 배지 색상:
- **아침**: 주황색 (`bg-orange-500`)
- **점심**: 갈색 (`bg-amber-700`)
- **저녁**: 파란색 (`bg-blue-500`)
- **간식**: 보라색 (`bg-purple-500`)

상태별 색상:
- **오늘 날짜**: 파란색 테두리 (`border-blue-500 border-2`)
- **식단 있는 날**: 흰색 배경 (`bg-white`)
- **식단 없는 날**: 회색 배경 (`bg-gray-50`)
- **이전/다음 달 날짜**: 연한 회색 텍스트 (`text-gray-400`)

### 3.4 반응형 디자인

**모바일 (< 640px)**:
- 셀 높이: `min-h-20`
- 식단명 길이 제한: 최대 4글자까지 표시 후 말줄임표
- 배지 크기: `text-xs px-1 py-0.5`
- 폰트 크기: 날짜 `text-sm`, 식단명 `text-xs`

**태블릿 (640px ~ 1024px)**:
- 셀 높이: `min-h-28`
- 식단명 길이 제한: 최대 8글자까지 표시
- 배지 크기: `text-sm px-2 py-1`
- 폰트 크기: 날짜 `text-base`, 식단명 `text-sm`

**데스크톱 (> 1024px)**:
- 셀 높이: `min-h-32`
- 식단명 전체 표시
- 배지 크기: `text-sm px-2 py-1`
- 폰트 크기: 날짜 `text-lg`, 식단명 `text-sm`

---

## 4. 기술 스택 및 구현 세부사항

### 4.1 상태 관리

```typescript
// 캘린더 페이지 상태
const [profile, setProfile] = useState<UserProfile | null>(null)
const [currentDate, setCurrentDate] = useState({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1
})
const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

### 4.2 데이터 조회

```typescript
// 월별 식단 데이터 로드
const loadMonthlyMeals = async () => {
  setLoading(true)
  setError(null)

  try {
    const plans = await fetchMonthlyMealPlans(
      profile.id,
      currentDate.year,
      currentDate.month
    )
    setMealPlans(plans)
  } catch (err) {
    console.error('식단 조회 오류:', err)
    setError('식단 데이터를 불러올 수 없습니다.')
  } finally {
    setLoading(false)
  }
}

// 특정 날짜의 식단 찾기
const getMealPlanForDate = (date: string): MealPlan | undefined => {
  return mealPlans.find(plan => plan.date === date)
}
```

### 4.3 캘린더 그리드 생성 로직

```typescript
// calendar-utils.ts

/**
 * 특정 월의 캘린더 그리드 생성
 * @param year 년도
 * @param month 월 (1-12)
 * @returns 주차별로 그룹화된 날짜 배열
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

export interface CalendarDay {
  date: string        // YYYY-MM-DD
  day: number         // 1-31
  isCurrentMonth: boolean
  isToday: boolean
}
```

### 4.4 날짜 클릭 핸들러

```typescript
const handleDateClick = (date: string, hasMealPlan: boolean) => {
  if (!hasMealPlan) {
    // 식단이 없는 날짜 클릭 시
    toast.error('해당 날짜에 등록된 식단이 없습니다.')
    return
  }

  // 식단 페이지로 이동
  router.push(`/meal-plan?date=${date}`)
}
```

---

## 5. 식단 페이지 수정 사항

### 5.1 날짜 파라미터 지원

```typescript
// /app/meal-plan/page.tsx

'use client'

import { useSearchParams } from 'next/navigation'

export default function MealPlanPage() {
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date') // YYYY-MM-DD or null

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      loadProfileAndGenerateMeals()
    }
  }, [dateParam]) // dateParam 변경 시 재로드

  const loadProfileAndGenerateMeals = async () => {
    const savedProfile = getProfile()
    if (!savedProfile) {
      router.push('/onboarding')
      return
    }

    setProfile(savedProfile)

    // 날짜 파라미터가 있으면 해당 날짜, 없으면 오늘
    const targetDate = dateParam || getTodayDate()

    try {
      // ... (기존 recovery phase 계산 로직)

      // 특정 날짜의 식단 조회
      const dbPlan = await fetchMealPlan(savedProfile.id, targetDate)

      if (dbPlan && isMealPlanValid(dbPlan, mealPhase)) {
        setMeals(dbPlan.meals)
        setLoading(false)
        return
      }

      // 식단이 없으면 생성 (오늘 날짜만)
      if (targetDate === getTodayDate()) {
        await generateMeals(savedProfile.id, mealPhase, savedProfile.surgery_type)
      } else {
        setError('해당 날짜의 식단이 없습니다.')
        setLoading(false)
      }
    } catch (e) {
      console.error('Error:', e)
      setLoading(false)
    }
  }
}
```

### 5.2 헤더 날짜 표시 수정

```typescript
// 동적 날짜 표시
const displayDate = dateParam
  ? new Date(dateParam).toLocaleDateString('ko-KR', {
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
  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
    {displayDate} 식단
  </h1>
)
```

### 5.3 달력보기 버튼 동작

```typescript
<Button
  variant="outline"
  onClick={() => router.push('/meal-plan/calendar')}
  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-900 border-gray-200 hover:bg-gray-50 h-9 px-4 text-sm rounded-full shadow-sm"
>
  <Calendar size={14} />
  달력보기
</Button>
```

---

## 6. 에러 처리 및 엣지 케이스

### 6.1 에러 시나리오

| 시나리오 | 처리 방법 |
|---------|----------|
| DB 조회 실패 | 로컬 캐시 확인 후 에러 메시지 표시 |
| 네트워크 오류 | "식단 데이터를 불러올 수 없습니다" 토스트 |
| 프로필 없음 | `/onboarding`으로 리다이렉트 |
| 식단 없는 날짜 클릭 | 토스트로 안내 (생성 페이지 미구현) |
| 잘못된 날짜 포맷 | 오늘 날짜로 폴백 |

### 6.2 로딩 상태

**페이지 첫 로드**:
```tsx
{loading && (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
      <p className="text-gray-600">식단 데이터를 불러오는 중...</p>
    </div>
  </div>
)}
```

**월 변경 시**:
```tsx
{loading && (
  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
    <Loader2 className="animate-spin text-blue-600" size={32} />
  </div>
)}
```

### 6.3 빈 상태 처리

```tsx
{mealPlans.length === 0 && !loading && (
  <div className="text-center py-12">
    <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
    <p className="text-gray-600">이번 달에 등록된 식단이 없습니다.</p>
  </div>
)}
```

---

## 7. 성능 최적화 (Phase 2 이후 적용)

### 7.1 데이터 조회 최적화

**Phase 2에서 고려사항**:
- 월별로 최대 31번의 `fetchMealPlan` 호출 필요
- `Promise.all`로 병렬 처리하여 속도 개선
- 실패한 요청은 무시하고 계속 진행

```typescript
// 월별 데이터 조회 예시
const loadMonthlyMeals = async (year: number, month: number) => {
  const daysInMonth = new Date(year, month, 0).getDate()
  const promises = []

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    promises.push(
      fetchMealPlan(userId, date).catch(() => null) // 실패 시 null 반환
    )
  }

  const results = await Promise.all(promises)
  // results: (MealPlan | null)[]
  return results.filter(plan => plan !== null)
}
```

### 7.2 캐싱 전략

- 조회한 월별 데이터를 메모리에 캐싱
- 동일 월 재방문 시 API 호출 생략
- 옵션: 로컬 스토리지에 캐싱 (TTL 30분)

```typescript
const [monthlyCache, setMonthlyCache] = useState<Record<string, MealPlan[]>>({})

// 캐시 키: "2026-01"
const cacheKey = `${year}-${String(month).padStart(2, '0')}`
if (monthlyCache[cacheKey]) {
  setMealPlans(monthlyCache[cacheKey])
} else {
  const plans = await loadMonthlyMeals(year, month)
  setMonthlyCache(prev => ({ ...prev, [cacheKey]: plans }))
  setMealPlans(plans)
}
```

### 7.3 렌더링 최적화

```typescript
// 캘린더 셀 컴포넌트 메모이제이션
const CalendarCell = React.memo(({ day, mealPlan, onClick }: CalendarCellProps) => {
  // ... 셀 렌더링 로직
})
```

### 7.4 이미지 최적화

- 식단 이미지가 추가될 경우 Next.js Image 컴포넌트 사용
- lazy loading 적용

---

## 8. 테스트 계획 (Phase별 분리)

### 8.1 Phase 1 테스트

**단위 테스트**:
- `calendar-utils.ts`의 `generateCalendarGrid` 함수
  - 월의 첫 날이 일요일인 경우
  - 월의 첫 날이 토요일인 경우
  - 윤년 2월 처리 (2024년 2월 = 29일)
  - 연도 경계 (12월 → 1월, 1월 → 12월)

**수동 테스트**:
- 식단 페이지에서 "달력보기" 버튼 클릭 → 캘린더 페이지 이동 확인
- 캘린더 그리드가 정상적으로 렌더링되는지 확인
- 뒤로가기 버튼으로 식단 페이지 복귀 확인

### 8.2 Phase 2 테스트

**단위 테스트**:
- `fetchMealPlan(userId, date?)` 함수
  - date 파라미터가 없을 때 오늘 날짜 조회
  - date 파라미터가 있을 때 해당 날짜 조회
  - 존재하지 않는 날짜 조회 시 null 반환

**통합 테스트**:
- 월별 데이터 조회 로직 (Promise.all)
- 캘린더에 식단 데이터 표시 확인
- 로딩 상태 표시 확인

### 8.3 Phase 3 테스트

**통합 테스트**:
- 월 이동 버튼 클릭 → 데이터 재조회 확인
- 날짜 클릭 → 식단 페이지 이동 확인
- 식단 페이지에서 URL 파라미터로 특정 날짜 식단 조회
- 에러 상태 처리 (네트워크 오류, 프로필 없음 등)

### 8.3 E2E 테스트

- 식단 페이지 → 달력보기 → 날짜 클릭 → 식단 상세 플로우
- 뒤로가기 동작 확인
- 다양한 화면 크기에서 반응형 테스트

---

## 9. 향후 개선 사항

### 9.1 추가 기능 (선택 사항)

- **식단 없는 날짜 클릭 시 생성 기능**: 해당 날짜의 식단을 AI로 즉시 생성
- **주간 뷰 추가**: 캘린더 상단에 주간/월간 토글 제공
- **영양소 통계**: 월간 평균 칼로리, 단백질 섭취량 차트
- **드래그 앤 드롭**: 날짜 간 식단 복사/이동
- **필터링**: 특정 회복 단계의 식단만 표시

### 9.2 UI/UX 개선

- **애니메이션**: 월 전환 시 슬라이드 효과
- **스와이프 제스처**: 모바일에서 좌우 스와이프로 월 이동
- **식단 미리보기**: 날짜에 호버 시 툴팁으로 식단 요약 표시
- **색상 커스터마이징**: 사용자가 식사별 배지 색상 선택

---

## 10. 구현 우선순위 (수정됨)

### Phase 1: 버튼 + 기본 페이지 ⭐ (현재)
1. [ ] 식단 페이지에 "달력보기" 버튼 추가
2. [ ] 캘린더 페이지 생성 (`/app/meal-plan/calendar/page.tsx`)
3. [ ] 캘린더 유틸리티 함수 (`/lib/utils/calendar-utils.ts`)
4. [ ] 정적 캘린더 그리드 렌더링 (날짜만 표시)
5. [ ] 기본 레이아웃 및 헤더 (뒤로가기 버튼)

**완료 조건**:
- "달력보기" 버튼 클릭 시 캘린더 페이지로 이동
- 현재 월 기준으로 빈 캘린더 그리드 표시
- 뒤로가기 버튼으로 식단 페이지 복귀

---

### Phase 2: 데이터 연동
1. [ ] `fetchMealPlan(userId, date?)` 파라미터 추가
2. [ ] 월별 데이터 조회 로직 (`Promise.all` 병렬 처리)
3. [ ] 캘린더 셀에 식단 정보 표시 (배지)
4. [ ] 로딩 상태 및 에러 처리
5. [ ] 오늘 날짜 강조

**완료 조건**:
- 해당 월의 모든 식단이 캘린더에 표시됨
- 식단이 있는 날짜와 없는 날짜 구분 가능
- 로딩 중에는 스켈레톤 UI 표시

---

### Phase 3: 인터랙션 구현
1. [ ] 월 이동 버튼 기능 (좌/우 화살표)
2. [ ] 날짜 클릭 이벤트 (식단 페이지로 이동)
3. [ ] 식단 페이지 URL 파라미터 지원 (`?date=YYYY-MM-DD`)
4. [ ] 식단 페이지 날짜 동적 표시
5. [ ] 반응형 디자인 개선

**완료 조건**:
- 월을 자유롭게 이동하며 해당 월의 식단 확인 가능
- 날짜 클릭 시 해당 날짜의 식단 상세 페이지로 이동
- 식단 페이지에서 뒤로가기 시 캘린더로 복귀

---

### 향후 개선 (선택 사항)
1. 식단 없는 날짜 클릭 시 AI 생성 기능
2. 월 전환 애니메이션 효과
3. 월간 영양소 통계 차트
4. 모바일 스와이프 제스처
5. 주간 뷰 추가

---

## 11. 기술 부채 및 주의사항

### 11.1 알려진 제약사항

**Phase 2에서 발생 가능한 문제**:
- 월별로 최대 31번의 `fetchMealPlan` 호출
  - 네트워크 요청이 많아져 속도 저하 가능
  - `Promise.all`로 병렬 처리하지만 여전히 부담
  - **해결 방안**: 향후 `fetchMonthlyMealPlans` 함수를 다시 추가하여 서버에서 한 번에 조회하도록 최적화

**로컬 스토리지 충돌**:
- 기존 캐시 TTL(10분)이 짧아 월간 데이터와 맞지 않음
- **해결 방안**: 캘린더 페이지는 별도 캐시 키 사용 (`meal_calendar_cache_YYYY-MM`)

**데이터 일관성**:
- `fetchMealPlan`이 오늘 날짜만 조회하도록 하드코딩되어 있음
- Phase 2에서 date 파라미터를 추가하면 기존 코드와 충돌 가능성
- **해결 방안**: date 파라미터를 선택적(optional)으로 만들어 하위 호환성 유지

### 11.2 브라우저 호환성

- `Date` API 사용 시 타임존 고려 필요
- `toLocaleDateString` 포맷이 브라우저마다 다를 수 있음
- 필요시 `date-fns` 라이브러리 사용 고려

### 11.3 향후 최적화 방향

**서버 사이드 개선**:
1. `fetchMonthlyMealPlans` 함수 재추가
2. Supabase에서 `.gte()`, `.lt()`로 범위 쿼리 한 번에 처리
3. 클라이언트 요청 수를 31번 → 1번으로 감소

**예상 구현** (Phase 2 완료 후):
```typescript
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

  // ... 데이터 파싱 및 반환
}
```

---

## 12. 참고 자료

- 디자인 목업: 첨부된 캘린더 화면 이미지
- 기존 코드베이스:
  - `/app/meal-plan/page.tsx` - 식단 페이지 구조 참고
  - `/lib/services/meal-service.ts` - 데이터 조회 함수
  - `/components/meal-plan/meal-card.tsx` - 식단 카드 UI 참고
- 사용 중인 UI 라이브러리: shadcn/ui, Tailwind CSS, lucide-react

---

## 부록: 예상 구현 코드 스니펫

### A. CalendarCell 컴포넌트

```tsx
interface CalendarCellProps {
  day: CalendarDay
  mealPlan?: MealPlan
  onClick: (date: string, hasMealPlan: boolean) => void
}

const CalendarCell = ({ day, mealPlan, onClick }: CalendarCellProps) => {
  const hasMealPlan = !!mealPlan

  return (
    <button
      onClick={() => onClick(day.date, hasMealPlan)}
      disabled={!day.isCurrentMonth}
      className={cn(
        "min-h-20 sm:min-h-28 lg:min-h-32 p-2 border rounded-lg text-left transition-colors",
        day.isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50 text-gray-400",
        day.isToday && "border-blue-500 border-2",
        hasMealPlan && "cursor-pointer",
        !hasMealPlan && "cursor-default"
      )}
    >
      <div className="text-sm sm:text-base lg:text-lg font-semibold mb-1">
        {day.day}
      </div>

      {hasMealPlan && (
        <div className="space-y-1">
          {mealPlan.meals.filter(m => m.mealTime === 'breakfast').map(meal => (
            <div key={meal.id} className="text-xs bg-orange-500 text-white px-1 py-0.5 rounded truncate">
              {meal.name}
            </div>
          ))}
          {mealPlan.meals.filter(m => m.mealTime === 'lunch').map(meal => (
            <div key={meal.id} className="text-xs bg-amber-700 text-white px-1 py-0.5 rounded truncate">
              {meal.name}
            </div>
          ))}
          {mealPlan.meals.filter(m => m.mealTime === 'dinner').map(meal => (
            <div key={meal.id} className="text-xs bg-blue-500 text-white px-1 py-0.5 rounded truncate">
              {meal.name}
            </div>
          ))}
          {mealPlan.meals.filter(m => m.mealTime.includes('snack')).map(meal => (
            <div key={meal.id} className="text-xs bg-purple-500 text-white px-1 py-0.5 rounded truncate">
              {meal.name}
            </div>
          ))}
        </div>
      )}
    </button>
  )
}
```

---

## 요약

**현재 상태**:
- `fetchMealPlan`은 오늘 날짜만 조회
- `fetchMonthlyMealPlans` 함수는 제거됨
- 단계별 구현 전략 수립 완료

**다음 작업**:
1. **Phase 1 시작**: 식단 페이지에 "달력보기" 버튼 추가 및 기본 캘린더 페이지 생성
2. Phase 1 완료 후 → Phase 2 (데이터 연동)
3. Phase 2 완료 후 → Phase 3 (인터랙션)

**주요 결정 사항**:
- ✅ 별도 페이지 라우팅 (`/meal-plan/calendar`)
- ✅ 단계별 구현 (Phase 1 → 2 → 3)
- ✅ `fetchMealPlan` 확장 방식 (date 파라미터 추가)
- ✅ 간소화된 셀 표시 (식사당 한 줄)

---

**문서 버전**: 2.0 (수정됨)
**다음 단계**: Phase 1 구현 시작
