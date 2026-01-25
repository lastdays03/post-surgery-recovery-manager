# 수술 후 통합 회복 관리 매니저 - 시스템 디자인

**작성일**: 2026-01-24
**버전**: 1.0 (MVP)
**상태**: Approved

## 개요

수술 종류와 회복 경과일(D-Day)에 맞춰 임상적으로 검증된 '단계별 영양 식단'과 '재활 운동 스케줄'을 자동 생성하고, 이를 출력 가능한 리포트 형태로 제공하는 디지털 회복 동반자.

### 핵심 결정사항

- **플랫폼**: 반응형 웹 애플리케이션 (PWA)
- **아키텍처**: Serverless (Next.js + Supabase)
- **MVP 범위**: 코어 회복 관리 (프로파일링 + 식단 + 재활 + 기록 + PDF)
- **데이터 관리**: 정적 프로토콜 + DB 사용자 데이터 하이브리드
- **인증 전략**: 로컬 저장 우선 + 선택적 로그인

---

## 1. 기술 스택

### 프론트엔드
- **Next.js 14+** (App Router) - React 기반 풀스택 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 고령 사용자 친화적 큰 버튼/글씨 스타일
- **Zustand** - 가벼운 클라이언트 상태관리
- **React Hook Form** - 온보딩 및 폼 처리
- **Recharts** - 주간 리포트 차트 시각화

### 백엔드/인프라
- **Next.js API Routes** - 서버리스 API 엔드포인트
- **Supabase (PostgreSQL)** - 사용자 프로파일 및 일일 기록
- **Supabase Storage** - PDF 파일 임시 저장
- **Vercel** - 배포 및 호스팅 (서울 리전)
- **React-PDF** (@react-pdf/renderer) - PDF 생성

### 데이터 구조
- `/data/protocols/` - 수술별 프로토콜 (TypeScript 상수)
- `/data/meals/` - 기본 식단 DB (JSON)
- `/data/exercises/` - 재활 운동 라이브러리 (JSON + 이미지 URL)

---

## 2. 데이터 모델

### Supabase 스키마

#### users 테이블
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_anonymous BOOLEAN DEFAULT FALSE
);
```

#### user_profiles 테이블
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NULL,
  surgery_type TEXT NOT NULL CHECK (surgery_type IN (
    'gastric_resection',
    'colon_resection',
    'tkr',
    'spinal_fusion',
    'cholecystectomy'
  )),
  surgery_date DATE NOT NULL,
  digestive_capacity TEXT CHECK (digestive_capacity IN ('good', 'moderate', 'poor')),
  comorbidities TEXT[],
  current_phase TEXT,
  local_storage_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### daily_logs 테이블
```sql
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  meals_completed JSONB,
  exercises_completed JSONB,
  symptoms JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, log_date)
);
```

### 정적 데이터 구조

#### `/data/protocols/surgery-protocols.ts`
```typescript
export const SURGERY_PROTOCOLS = {
  gastric_resection: {
    phases: [
      {
        name: 'liquid',
        daysRange: [0, 3],
        description: '미음/맑은 유동식',
        forbiddenFoods: ['고섬유질', '고지방', '자극성']
      },
      {
        name: 'soft',
        daysRange: [4, 14],
        description: '죽/부드러운 연식',
        forbiddenFoods: ['고섬유질', '고지방']
      },
      {
        name: 'normal',
        daysRange: [15, 60],
        description: '일반식 점진 전환',
        forbiddenFoods: ['고지방', '매운음식']
      }
    ],
    nutritionRequirements: {
      proteinMultiplier: 1.2, // 체중당 g
      calorieTarget: 1800
    }
  },
  colon_resection: {
    phases: [
      {
        name: 'liquid',
        daysRange: [0, 5],
        description: '맑은 유동식',
        forbiddenFoods: ['고섬유질', '유제품', '자극성']
      },
      {
        name: 'soft',
        daysRange: [6, 21],
        description: '저잔사 연식',
        forbiddenFoods: ['고섬유질', '씨앗류']
      },
      {
        name: 'normal',
        daysRange: [22, 90],
        description: '정상식 복귀',
        forbiddenFoods: []
      }
    ],
    nutritionRequirements: {
      proteinMultiplier: 1.0,
      calorieTarget: 2000
    }
  },
  tkr: { // 무릎 인공관절 치환술
    phases: [
      {
        name: 'normal',
        daysRange: [0, 90],
        description: '정상 식단 + 고단백',
        forbiddenFoods: []
      }
    ],
    nutritionRequirements: {
      proteinMultiplier: 1.5, // 근육 회복
      calorieTarget: 2200
    },
    rehabPhases: [
      {
        name: 'protection',
        weekRange: [0, 2],
        description: '보호기 - 침상 운동',
        allowedExercises: ['ankle_pump', 'quad_setting', 'heel_slide']
      },
      {
        name: 'recovery',
        weekRange: [2, 6],
        description: '회복기 - 보행 및 가동범위',
        allowedExercises: ['ankle_pump', 'quad_setting', 'heel_slide', 'slr', 'standing', 'walking']
      },
      {
        name: 'strengthening',
        weekRange: [6, 12],
        description: '강화기 - 근력 강화',
        allowedExercises: ['all_previous', 'stairs', 'mini_squat', 'resistance_band']
      }
    ]
  },
  spinal_fusion: { // 척추유합술
    phases: [
      {
        name: 'normal',
        daysRange: [0, 90],
        description: '정상 식단',
        forbiddenFoods: []
      }
    ],
    nutritionRequirements: {
      proteinMultiplier: 1.2,
      calorieTarget: 2000
    },
    rehabPhases: [
      {
        name: 'protection',
        weekRange: [0, 6],
        description: '보호기 - 안정',
        allowedExercises: ['walking', 'ankle_pump'],
        warnings: ['허리 비틀기 금지', '무거운 물건 들기 금지']
      },
      {
        name: 'recovery',
        weekRange: [6, 12],
        description: '회복기 - 경미한 활동',
        allowedExercises: ['walking', 'core_stabilization', 'stretching']
      }
    ]
  },
  cholecystectomy: { // 담낭 제거
    phases: [
      {
        name: 'liquid',
        daysRange: [0, 1],
        description: '맑은 유동식',
        forbiddenFoods: ['지방', '기름진음식']
      },
      {
        name: 'soft',
        daysRange: [2, 7],
        description: '저지방 연식',
        forbiddenFoods: ['고지방', '튀김', '기름진음식']
      },
      {
        name: 'normal',
        daysRange: [8, 30],
        description: '저지방 일반식',
        forbiddenFoods: ['고지방']
      }
    ],
    nutritionRequirements: {
      proteinMultiplier: 1.0,
      calorieTarget: 1800,
      maxFatPerMeal: 10 // g
    }
  }
}
```

#### `/data/meals/meal-database.json`
```json
[
  {
    "id": "m001",
    "name": "소고기미음",
    "textureType": "liquid",
    "nutrition": {
      "calories": 150,
      "protein": 8,
      "carbs": 20,
      "fat": 3,
      "sodium": 200
    },
    "tags": ["저잔사", "고단백", "덤핑예방"],
    "substitutionGroup": "porridge",
    "ingredients": ["쌀", "소고기", "물", "소금"],
    "prepTime": 30
  },
  {
    "id": "m002",
    "name": "호박죽",
    "textureType": "soft",
    "nutrition": {
      "calories": 180,
      "protein": 4,
      "carbs": 35,
      "fat": 2,
      "sodium": 150
    },
    "tags": ["저잔사", "저지방", "소화잘됨"],
    "substitutionGroup": "porridge",
    "ingredients": ["쌀", "단호박", "물"],
    "prepTime": 25
  },
  {
    "id": "m003",
    "name": "두부찜",
    "textureType": "soft",
    "nutrition": {
      "calories": 120,
      "protein": 12,
      "carbs": 5,
      "fat": 6,
      "sodium": 300
    },
    "tags": ["고단백", "저지방", "연식"],
    "substitutionGroup": "protein_dish",
    "ingredients": ["연두부", "계란", "당근", "간장"],
    "prepTime": 15
  }
]
```

#### `/data/exercises/exercise-database.json`
```json
[
  {
    "id": "ankle_pump",
    "name": "발목 펌프 운동",
    "targetSurgery": ["tkr", "spinal_fusion"],
    "description": "누운 자세에서 발목을 위아래로 움직여 종아리 근육 활성화",
    "sets": 3,
    "reps": 15,
    "imageUrl": "/images/exercises/ankle-pump.gif",
    "videoUrl": "https://example.com/ankle-pump",
    "difficulty": "easy"
  },
  {
    "id": "quad_setting",
    "name": "대퇴사두근 힘주기",
    "targetSurgery": ["tkr"],
    "description": "무릎 아래에 수건을 놓고 무릎을 펴면서 수건을 누르기",
    "sets": 3,
    "reps": 10,
    "holdSeconds": 5,
    "imageUrl": "/images/exercises/quad-setting.gif",
    "difficulty": "easy"
  },
  {
    "id": "slr",
    "name": "하지 직거상 (SLR)",
    "targetSurgery": ["tkr"],
    "description": "무릎을 펴고 다리를 15cm 들어올리기",
    "sets": 3,
    "reps": 10,
    "imageUrl": "/images/exercises/slr.gif",
    "difficulty": "moderate",
    "precautions": ["2주 이후부터 시작", "통증 발생 시 중단"]
  }
]
```

---

## 3. 핵심 기능 로직

### 프로파일링 엔진

```typescript
// /lib/profiling-engine.ts
import { SURGERY_PROTOCOLS } from '@/data/protocols/surgery-protocols'

export interface UserProfile {
  surgery_type: string
  surgery_date: Date
  digestive_capacity: 'good' | 'moderate' | 'poor'
  comorbidities: string[]
  weight?: number
}

export interface RecoveryPhase {
  name: string
  daysRange: [number, number]
  description: string
  forbiddenFoods: string[]
}

export function calculateRecoveryPhase(profile: UserProfile): RecoveryPhase {
  const daysSinceSurgery = getDaysDifference(profile.surgery_date, new Date())
  const protocol = SURGERY_PROTOCOLS[profile.surgery_type]

  let phase = protocol.phases.find(p =>
    daysSinceSurgery >= p.daysRange[0] &&
    daysSinceSurgery <= p.daysRange[1]
  )

  // 소화 능력에 따른 단계 조정
  if (profile.digestive_capacity === 'poor' && phase.name !== 'liquid') {
    const currentIndex = protocol.phases.findIndex(p => p.name === phase.name)
    phase = protocol.phases[Math.max(0, currentIndex - 1)]
  }

  return phase || protocol.phases[protocol.phases.length - 1]
}

function getDaysDifference(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
```

### 식단 생성 알고리즘

```typescript
// /lib/meal-planner.ts
import { MEAL_DATABASE } from '@/data/meals/meal-database.json'

export interface WeeklyMealPlan {
  [day: string]: {
    breakfast: Meal
    lunch: Meal
    dinner: Meal
    snack?: Meal
  }
}

export function generateWeeklyMealPlan(profile: UserProfile): WeeklyMealPlan {
  const phase = calculateRecoveryPhase(profile)
  const protocol = SURGERY_PROTOCOLS[profile.surgery_type]

  // 1. 현재 단계에 맞는 식단 필터링
  const eligibleMeals = MEAL_DATABASE.filter(meal =>
    meal.textureType === phase.name &&
    !hasForbiddenIngredients(meal, phase.forbiddenFoods) &&
    !hasAllergens(meal, profile.comorbidities)
  )

  // 2. 영양 요구량 계산
  const dailyProtein = (profile.weight || 60) * protocol.nutritionRequirements.proteinMultiplier
  const dailyCalories = protocol.calorieTarget

  // 3. 7일 치 식단 생성 (중복 최소화)
  const weekPlan: WeeklyMealPlan = {}
  const usedMeals = new Set<string>()

  for (let day = 0; day < 7; day++) {
    const dayName = ['월', '화', '수', '목', '금', '토', '일'][day]

    weekPlan[dayName] = {
      breakfast: selectMeal(eligibleMeals, usedMeals, 'breakfast', dailyCalories / 4),
      lunch: selectMeal(eligibleMeals, usedMeals, 'lunch', dailyCalories / 3),
      dinner: selectMeal(eligibleMeals, usedMeals, 'dinner', dailyCalories / 3),
    }

    // 필요 시 간식 추가
    const dailyTotal = calculateDailyNutrition(weekPlan[dayName])
    if (dailyTotal.protein < dailyProtein) {
      weekPlan[dayName].snack = selectHighProteinSnack(eligibleMeals, usedMeals)
    }
  }

  return weekPlan
}

function selectMeal(
  meals: Meal[],
  usedMeals: Set<string>,
  mealType: string,
  targetCalories: number
): Meal {
  const available = meals.filter(m => !usedMeals.has(m.id))

  // 칼로리 범위에 맞는 것 우선 선택
  const suitable = available.filter(m =>
    Math.abs(m.nutrition.calories - targetCalories) < 100
  )

  const selected = suitable.length > 0
    ? suitable[Math.floor(Math.random() * suitable.length)]
    : available[Math.floor(Math.random() * available.length)]

  usedMeals.add(selected.id)
  return selected
}

function hasForbiddenIngredients(meal: Meal, forbiddenFoods: string[]): boolean {
  return meal.tags.some(tag => forbiddenFoods.includes(tag))
}

function hasAllergens(meal: Meal, comorbidities: string[]): boolean {
  // 당뇨 → 고당분 제외, 고혈압 → 고나트륨 제외 등
  if (comorbidities.includes('diabetes') && meal.nutrition.carbs > 40) return true
  if (comorbidities.includes('hypertension') && meal.nutrition.sodium > 500) return true
  return false
}
```

### 메뉴 교체 (Swap) 로직

```typescript
// /lib/meal-swapper.ts
export function swapMeal(currentMeal: Meal, profile: UserProfile): Meal[] {
  const phase = calculateRecoveryPhase(profile)

  // 같은 substitutionGroup 내에서 교체 옵션 제공
  const alternatives = MEAL_DATABASE.filter(meal =>
    meal.id !== currentMeal.id &&
    meal.substitutionGroup === currentMeal.substitutionGroup &&
    meal.textureType === phase.name &&
    !hasForbiddenIngredients(meal, phase.forbiddenFoods)
  )

  // 영양소 유사도 순으로 정렬
  return alternatives.sort((a, b) => {
    const diffA = Math.abs(a.nutrition.protein - currentMeal.nutrition.protein)
    const diffB = Math.abs(b.nutrition.protein - currentMeal.nutrition.protein)
    return diffA - diffB
  }).slice(0, 3) // 상위 3개 추천
}
```

### 재활 운동 스케줄러

```typescript
// /lib/exercise-scheduler.ts
import { EXERCISE_DATABASE } from '@/data/exercises/exercise-database.json'

export function getAvailableExercises(profile: UserProfile): Exercise[] {
  const protocol = SURGERY_PROTOCOLS[profile.surgery_type]

  // 정형외과 수술만 재활 프로토콜 존재
  if (!protocol.rehabPhases) return []

  const weekNumber = Math.floor(
    getDaysDifference(profile.surgery_date, new Date()) / 7
  )

  const currentPhase = protocol.rehabPhases.find(phase =>
    weekNumber >= phase.weekRange[0] && weekNumber <= phase.weekRange[1]
  )

  if (!currentPhase) return []

  return EXERCISE_DATABASE.filter(ex =>
    ex.targetSurgery.includes(profile.surgery_type) &&
    currentPhase.allowedExercises.includes(ex.id)
  )
}

export function getDailyExerciseSchedule(profile: UserProfile): Exercise[] {
  const available = getAvailableExercises(profile)

  // 난이도별로 분류하여 균형있게 선택
  const easy = available.filter(ex => ex.difficulty === 'easy')
  const moderate = available.filter(ex => ex.difficulty === 'moderate')

  return [...easy.slice(0, 2), ...moderate.slice(0, 1)]
}
```

---

## 4. UI/UX 설계

### 접근성 디자인 원칙

```typescript
// /styles/accessibility.ts
export const ACCESSIBLE_DESIGN = {
  minTouchTarget: '48px',    // WCAG AAA 기준
  baseFontSize: '18px',      // 일반 텍스트
  headingSize: '24px',       // 제목
  buttonHeight: '56px',      // 주요 버튼
  spacing: '24px',           // 요소 간 여백
  borderWidth: '2px',        // 명확한 경계
  borderRadius: '16px',      // 부드러운 모서리

  colors: {
    primary: '#3B82F6',      // 파랑 (신뢰감)
    success: '#10B981',      // 초록 (완료)
    warning: '#F59E0B',      // 주황 (주의)
    danger: '#EF4444',       // 빨강 (위험)
    text: '#1F2937',         // 진한 회색 (가독성)
    textLight: '#6B7280'     // 연한 회색
  }
}
```

### 페이지 구조

```
/app
  /page.tsx                    # 랜딩 페이지
    - 로컬 스토리지에 프로파일 있으면 /dashboard로 리다이렉트
    - 없으면 "시작하기" 버튼

  /onboarding
    /page.tsx                  # 온보딩 시작
    /step1/page.tsx            # 수술 종류 선택 (큰 카드 버튼)
    /step2/page.tsx            # 수술 날짜 및 현재 상태
    /step3/page.tsx            # 동반질환 체크
    /complete/page.tsx         # 회복 로드맵 생성 완료

  /dashboard/page.tsx          # 메인 대시보드
    - 오늘의 식단 카드 (아침/점심/저녁)
    - 오늘의 운동 카드 (3개)
    - 빠른 증상 체크 버튼
    - D+N일 표시

  /meal-plan/page.tsx          # 이번 주 식단표
    - 일별 탭 (월~일)
    - 각 식사마다 "교체" 버튼
    - 영양 정보 표시
    - PDF 다운로드 버튼

  /exercise-plan/page.tsx      # 이번 주 운동 계획
    - 운동별 GIF/이미지
    - 세트/횟수 표시
    - 큰 체크박스
    - 주의사항 강조

  /symptom-check/page.tsx      # 증상 체크
    - 이모지 통증 척도 (😊😐😣😭)
    - 체온 입력
    - 가스 배출 여부 (예/아니오)
    - 이상 증상 감지 → 경고 메시지

  /reports
    /weekly/page.tsx           # 주간 리포트
      - 식사 달성률 차트
      - 운동 달성률 차트
      - 다음 주 추천사항

  /settings/page.tsx           # 설정
    - 프로필 수정
    - 백업하기 (계정 생성)
    - 알림 설정
    - 앱 정보

  /api
    /meal-plan/route.ts        # 식단 생성 API
    /exercise-plan/route.ts    # 운동 스케줄 API
    /generate-pdf/route.ts     # PDF 생성 API
    /sync-profile/route.ts     # 로컬 → DB 동기화
```

### 주요 컴포넌트

#### 식단 카드
```tsx
// /components/MealCard.tsx
interface MealCardProps {
  meal: Meal
  mealType: 'breakfast' | 'lunch' | 'dinner'
  completed: boolean
  onComplete: () => void
  onSwap: () => void
}

export function MealCard({ meal, mealType, completed, onComplete, onSwap }: MealCardProps) {
  const labels = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁'
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border-4 border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold">{labels[mealType]}</h3>
        {completed && <span className="text-3xl">✓</span>}
      </div>

      <p className="text-xl mb-2">{meal.name}</p>
      <div className="flex gap-4 text-lg text-gray-600 mb-4">
        <span>🍽️ {meal.nutrition.calories}kcal</span>
        <span>💪 단백질 {meal.nutrition.protein}g</span>
      </div>

      <button
        onClick={onComplete}
        disabled={completed}
        className="w-full h-14 bg-green-500 text-white text-xl rounded-xl font-bold
                   disabled:bg-gray-300 disabled:text-gray-500 mb-3"
      >
        {completed ? '✓ 먹었어요' : '먹었어요'}
      </button>

      <button
        onClick={onSwap}
        className="w-full h-14 bg-gray-200 text-gray-700 text-xl rounded-xl font-semibold"
      >
        다른 메뉴로 교체
      </button>
    </div>
  )
}
```

#### 운동 카드
```tsx
// /components/ExerciseCard.tsx
interface ExerciseCardProps {
  exercise: Exercise
  completed: boolean
  onToggle: () => void
}

export function ExerciseCard({ exercise, completed, onToggle }: ExerciseCardProps) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border-4 border-purple-100">
      <div className="flex items-start gap-4 mb-4">
        <img
          src={exercise.imageUrl}
          alt={exercise.name}
          className="w-32 h-32 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{exercise.name}</h3>
          <p className="text-lg text-gray-600 mb-2">{exercise.description}</p>
          <div className="text-lg">
            <span className="font-semibold">{exercise.sets}세트</span>
            <span className="mx-2">·</span>
            <span className="font-semibold">{exercise.reps}회</span>
          </div>
        </div>
      </div>

      {exercise.precautions && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-base text-yellow-800">⚠️ {exercise.precautions.join(', ')}</p>
        </div>
      )}

      <button
        onClick={onToggle}
        className={`w-full h-14 text-xl rounded-xl font-bold transition-colors
                    ${completed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700'}`}
      >
        {completed ? '✓ 완료' : '완료 표시'}
      </button>
    </div>
  )
}
```

#### 증상 체크 이모지 슬라이더
```tsx
// /components/PainScale.tsx
const PAIN_EMOJIS = [
  { level: 0, emoji: '😊', label: '통증 없음' },
  { level: 3, emoji: '😐', label: '약간 불편' },
  { level: 6, emoji: '😣', label: '불편함' },
  { level: 9, emoji: '😭', label: '심한 통증' }
]

export function PainScale({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-8xl mb-4">
          {PAIN_EMOJIS.find(p => p.level >= value)?.emoji || '😊'}
        </div>
        <p className="text-2xl font-semibold">
          {PAIN_EMOJIS.find(p => p.level >= value)?.label}
        </p>
      </div>

      <div className="flex justify-between px-2">
        {PAIN_EMOJIS.map(pain => (
          <button
            key={pain.level}
            onClick={() => onChange(pain.level)}
            className={`w-20 h-20 rounded-full text-4xl transition-all
                        ${value === pain.level
                          ? 'bg-blue-500 scale-110'
                          : 'bg-gray-200'}`}
          >
            {pain.emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
```

---

## 5. PDF 생성

### React-PDF 템플릿

```tsx
// /lib/pdf/weekly-report-template.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12, fontFamily: 'NotoSansKR' },
  header: { fontSize: 24, marginBottom: 20, fontWeight: 'bold' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, marginBottom: 10, fontWeight: 'bold' },
  table: { border: 1, borderColor: '#000' },
  tableRow: { flexDirection: 'row', borderBottom: 1, borderColor: '#ddd' },
  tableCell: { padding: 8, flex: 1 },
  checkBox: { fontSize: 16, marginRight: 5 }
})

export function WeeklyReportPDF({ profile, mealPlan, exercises }: ReportData) {
  const daysSinceSurgery = getDaysDifference(profile.surgery_date, new Date())

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 헤더 */}
        <View>
          <Text style={styles.header}>
            {profile.name || '환자'}님의 이번 주 회복 계획
          </Text>
          <Text>수술일: {formatDate(profile.surgery_date)} (D+{daysSinceSurgery}일)</Text>
          <Text>현재 단계: {profile.current_phase}</Text>
        </View>

        {/* 식단표 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이번 주 식단표</Text>
          <View style={styles.table}>
            {Object.entries(mealPlan).map(([day, meals]) => (
              <View key={day} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '15%', fontWeight: 'bold' }]}>
                  {day}요일
                </Text>
                <View style={[styles.tableCell, { width: '85%' }]}>
                  <Text>아침: {meals.breakfast.name}</Text>
                  <Text>점심: {meals.lunch.name}</Text>
                  <Text>저녁: {meals.dinner.name}</Text>
                  {meals.snack && <Text>간식: {meals.snack.name}</Text>}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 운동 계획 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이번 주 재활 운동</Text>
          {exercises.map(ex => (
            <View key={ex.id} style={{ marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold' }}>□ {ex.name}</Text>
              <Text>   {ex.sets}세트 x {ex.reps}회</Text>
              <Text>   {ex.description}</Text>
            </View>
          ))}
        </View>

        {/* 장보기 리스트 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>장보기 리스트</Text>
          {extractShoppingList(mealPlan).map((item, idx) => (
            <Text key={idx}>□ {item}</Text>
          ))}
        </View>

        {/* 주의사항 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ 이번 주 주의사항</Text>
          <Text>• 음식은 천천히 꼭꼭 씹어 드세요 (30회 이상)</Text>
          <Text>• 통증이 심하거나 열이 나면 즉시 병원에 연락하세요</Text>
          <Text>• 운동 중 통증 발생 시 즉시 중단하세요</Text>
        </View>

        {/* 푸터 */}
        <View style={{ position: 'absolute', bottom: 30, left: 40, right: 40 }}>
          <Text style={{ fontSize: 10, textAlign: 'center', color: '#999' }}>
            본 자료는 일반적인 회복 가이드이며, 담당 의료진의 지시를 우선으로 따라주세요.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

function extractShoppingList(mealPlan: WeeklyMealPlan): string[] {
  const ingredients = new Set<string>()

  Object.values(mealPlan).forEach(day => {
    [day.breakfast, day.lunch, day.dinner, day.snack].forEach(meal => {
      if (meal) {
        meal.ingredients.forEach(ing => ingredients.add(ing))
      }
    })
  })

  return Array.from(ingredients).sort()
}
```

### PDF 생성 API

```typescript
// /app/api/generate-pdf/route.ts
import { renderToStream } from '@react-pdf/renderer'
import { WeeklyReportPDF } from '@/lib/pdf/weekly-report-template'

export async function POST(request: Request) {
  const { profileId, weekStart } = await request.json()

  // 데이터 조회
  const profile = await getProfile(profileId)
  const mealPlan = await getMealPlan(profileId, weekStart)
  const exercises = await getExercisePlan(profileId)

  // PDF 생성
  const stream = await renderToStream(
    <WeeklyReportPDF
      profile={profile}
      mealPlan={mealPlan}
      exercises={exercises}
    />
  )

  return new Response(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recovery-plan-${weekStart}.pdf"`
    }
  })
}
```

---

## 6. 로컬 스토리지 전략

### 데이터 구조

```typescript
// /lib/local-storage.ts
export const LOCAL_STORAGE_KEYS = {
  PROFILE: 'recovery_profile',
  MEAL_PLAN: 'current_meal_plan',
  EXERCISE_PLAN: 'current_exercise_plan',
  DAILY_LOGS: 'daily_logs',
  LAST_SYNC: 'last_sync_timestamp'
}

export interface LocalProfile {
  id: string // UUID v4
  surgery_type: string
  surgery_date: string // ISO format
  digestive_capacity: string
  comorbidities: string[]
  weight?: number
  created_at: string
  updated_at: string
}

export interface LocalDailyLog {
  date: string // YYYY-MM-DD
  meals_completed: { [key: string]: boolean }
  exercises_completed: { [key: string]: boolean }
  symptoms?: {
    pain_level?: number
    temperature?: number
    gas_passed?: boolean
  }
  notes?: string
}

// 로컬 데이터 저장
export function saveProfile(profile: LocalProfile) {
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.PROFILE,
    JSON.stringify(profile)
  )
}

export function getProfile(): LocalProfile | null {
  const data = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILE)
  return data ? JSON.parse(data) : null
}

export function saveDailyLog(log: LocalDailyLog) {
  const logs = getDailyLogs()
  const index = logs.findIndex(l => l.date === log.date)

  if (index >= 0) {
    logs[index] = log
  } else {
    logs.push(log)
  }

  localStorage.setItem(
    LOCAL_STORAGE_KEYS.DAILY_LOGS,
    JSON.stringify(logs)
  )
}

export function getDailyLogs(): LocalDailyLog[] {
  const data = localStorage.getItem(LOCAL_STORAGE_KEYS.DAILY_LOGS)
  return data ? JSON.parse(data) : []
}

// 30일 이상 된 로그 자동 정리
export function cleanupOldLogs() {
  const logs = getDailyLogs()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 30)

  const recentLogs = logs.filter(log =>
    new Date(log.date) >= cutoffDate
  )

  localStorage.setItem(
    LOCAL_STORAGE_KEYS.DAILY_LOGS,
    JSON.stringify(recentLogs)
  )
}
```

### DB 동기화 (백업 기능)

```typescript
// /lib/sync-manager.ts
export async function syncLocalToDatabase(userId: string) {
  const localProfile = getProfile()
  const localLogs = getDailyLogs()

  if (!localProfile) return

  // 1. 프로파일 업로드
  const { data: profile } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      surgery_type: localProfile.surgery_type,
      surgery_date: localProfile.surgery_date,
      digestive_capacity: localProfile.digestive_capacity,
      comorbidities: localProfile.comorbidities,
      local_storage_key: localProfile.id
    })
    .select()
    .single()

  // 2. 일일 기록 업로드
  if (localLogs.length > 0) {
    await supabase
      .from('daily_logs')
      .insert(
        localLogs.map(log => ({
          profile_id: profile.id,
          log_date: log.date,
          meals_completed: log.meals_completed,
          exercises_completed: log.exercises_completed,
          symptoms: log.symptoms,
          notes: log.notes
        }))
      )
  }

  // 3. 동기화 완료 타임스탬프 저장
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.LAST_SYNC,
    new Date().toISOString()
  )
}
```

---

## 7. 배포 및 인프라

### Vercel 설정

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "regions": ["icn1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### 환경 변수

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # 서버 전용
NEXT_PUBLIC_APP_URL=https://recovery-manager.vercel.app
```

### PWA 설정

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60
        }
      }
    }
  ]
})

module.exports = withPWA({
  reactStrictMode: true,
  images: {
    domains: ['supabase.co']
  }
})
```

```json
// public/manifest.json
{
  "name": "수술 후 회복 관리 매니저",
  "short_name": "회복매니저",
  "description": "수술 후 식단과 재활 운동을 관리하는 디지털 동반자",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 성능 최적화

**1. 이미지 최적화**
```tsx
import Image from 'next/image'

<Image
  src={exercise.imageUrl}
  alt={exercise.name}
  width={200}
  height={200}
  loading="lazy"
  quality={80}
/>
```

**2. 폰트 최적화**
```tsx
// app/layout.tsx
import { Noto_Sans_KR } from 'next/font/google'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={notoSansKr.className}>
      <body>{children}</body>
    </html>
  )
}
```

---

## 8. 보안 및 컴플라이언스

### Row Level Security (RLS)

```sql
-- 사용자는 자신의 프로파일만 조회/수정 가능
CREATE POLICY "Users can view own profiles"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- 사용자는 자신의 로그만 조회/생성 가능
CREATE POLICY "Users can view own logs"
ON daily_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = daily_logs.profile_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own logs"
ON daily_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = daily_logs.profile_id
    AND user_id = auth.uid()
  )
);
```

### 의료기기법 준수

**면책 조항**
- 본 서비스는 질병 진단 또는 치료를 목적으로 하지 않음
- 의료 전문가의 조언을 대체할 수 없음
- 모든 건강 관련 결정은 담당 의사와 상의 필요

**UI 표시**
```tsx
// components/MedicalDisclaimer.tsx
export function MedicalDisclaimer() {
  return (
    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
      <p className="text-sm text-yellow-800">
        ⚠️ 본 정보는 일반적인 가이드이며 의료적 조언을 대체하지 않습니다.
        모든 건강 관련 결정은 담당 의료진과 상의하세요.
      </p>
    </div>
  )
}
```

---

## 9. 향후 확장 로드맵

### Phase 2: 스마트 기능 (4-8주)
- 식약처 영양성분 API 연동
- 시판 제품 데이터베이스 구축 (편의점 대체 모드)
- 위험 신호 감지 알고리즘 (발열, 심한 통증)
- 웹 푸시 알림 (식사/운동 시간)

### Phase 3: 프리미엄 (8-12주)
- Stripe 결제 연동 (Freemium → Premium)
- AI 기반 개인화 식단 (OpenAI API)
- 주간 회복 리포트 이메일
- 보호자 공유 기능 (읽기 전용 링크)

### Phase 4: B2B (12주+)
- 병원 관리자 대시보드
- 환자 모니터링 패널
- 병원별 커스텀 프로토콜
- FHIR 데이터 표준 준수

---

## 10. 성공 지표 (KPI)

### MVP 단계
- **사용자 등록**: 1,000명 (3개월)
- **주간 활성 사용자**: 70% 리텐션
- **PDF 다운로드율**: 60% 이상
- **평균 사용 일수**: 21일 이상 (회복 주기)

### 제품-시장 적합성 검증
- **NPS (Net Promoter Score)**: 50+ 목표
- **일일 로깅율**: 80% 이상
- **완료율**: 식단 기록 70%, 운동 기록 50%

---

## 부록: 프로젝트 구조

```
post-surgery-recovery-manager/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── onboarding/
│   │   ├── page.tsx
│   │   ├── step1/page.tsx
│   │   ├── step2/page.tsx
│   │   └── step3/page.tsx
│   ├── dashboard/page.tsx
│   ├── meal-plan/page.tsx
│   ├── exercise-plan/page.tsx
│   ├── symptom-check/page.tsx
│   ├── reports/weekly/page.tsx
│   ├── settings/page.tsx
│   └── api/
│       ├── meal-plan/route.ts
│       ├── exercise-plan/route.ts
│       ├── generate-pdf/route.ts
│       └── sync-profile/route.ts
├── components/
│   ├── MealCard.tsx
│   ├── ExerciseCard.tsx
│   ├── PainScale.tsx
│   ├── MedicalDisclaimer.tsx
│   └── ui/ (shadcn/ui 컴포넌트)
├── lib/
│   ├── profiling-engine.ts
│   ├── meal-planner.ts
│   ├── meal-swapper.ts
│   ├── exercise-scheduler.ts
│   ├── local-storage.ts
│   ├── sync-manager.ts
│   ├── supabase-client.ts
│   └── pdf/
│       └── weekly-report-template.tsx
├── data/
│   ├── protocols/
│   │   └── surgery-protocols.ts
│   ├── meals/
│   │   └── meal-database.json
│   └── exercises/
│       └── exercise-database.json
├── styles/
│   ├── globals.css
│   └── accessibility.ts
├── public/
│   ├── manifest.json
│   ├── icons/
│   └── images/exercises/
├── docs/
│   └── plans/
│       └── 2026-01-24-recovery-manager-design.md
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.local
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

**문서 끝**
