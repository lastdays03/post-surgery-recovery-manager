# 수술 후 회복 관리 매니저 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Next.js + Supabase + OpenAI GPT-4o를 사용하여 수술 후 회복을 돕는 AI 기반 웹 애플리케이션 구축

**Architecture:**
- 프론트엔드: Next.js 14 App Router + TypeScript + Tailwind CSS
- 백엔드: Next.js API Routes + Supabase PostgreSQL + pgvector
- AI: OpenAI GPT-4o (챗봇, 식단 생성) + RAG (벡터 검색)

**Tech Stack:** Next.js 14, TypeScript, Supabase, OpenAI API, Tailwind CSS, Zustand, React Hook Form, React-PDF

---

## Phase 1: 프로젝트 초기 설정 (Foundation)

### Task 1: Next.js 프로젝트 초기화

**Files:**
- Create: `package.json`
- Create: `next.config.js`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`

**Step 1: Next.js 프로젝트 생성**

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

Expected: 프로젝트 구조 생성 완료

**Step 2: 필수 의존성 설치**

```bash
npm install @supabase/supabase-js@latest zustand react-hook-form @react-pdf/renderer openai zod lucide-react
npm install -D @types/node
```

**Step 3: 개발 서버 실행 확인**

```bash
npm run dev
```

Expected: http://localhost:3000 에서 Next.js 기본 페이지 표시

**Step 4: Commit**

```bash
git add .
git commit -m "chore: initialize Next.js 14 project with TypeScript and Tailwind"
```

---

### Task 2: 프로젝트 디렉토리 구조 생성

**Files:**
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `lib/.gitkeep`
- Create: `components/.gitkeep`
- Create: `data/.gitkeep`
- Create: `public/.gitkeep`

**Step 1: 디렉토리 생성**

```bash
mkdir -p app/api app/onboarding app/dashboard app/meal-plan app/exercise-plan app/symptom-check app/reports/weekly app/settings
mkdir -p lib/ai
mkdir -p components/ui
mkdir -p data/protocols data/meals data/exercises
mkdir -p public/images/exercises public/icons
mkdir -p supabase/migrations
mkdir -p scripts
```

**Step 2: .gitkeep 파일 생성**

```bash
touch lib/.gitkeep components/.gitkeep data/.gitkeep public/.gitkeep
```

**Step 3: 환경 변수 템플릿 생성**

Create: `.env.local.example`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=
NEXT_PUBLIC_ENABLE_AI_CHAT=true

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cost Limits
MAX_DAILY_AI_COST_PER_USER=0.50
```

**Step 4: .gitignore 업데이트**

Modify: `.gitignore`

```
# 기존 내용 유지
.env.local
.env*.local
```

**Step 5: Commit**

```bash
git add .
git commit -m "chore: create project directory structure"
```

---

### Task 3: Supabase 클라이언트 설정

**Files:**
- Create: `lib/supabase-client.ts`
- Create: `lib/types/database.types.ts`

**Step 1: Supabase 클라이언트 생성**

Create: `lib/supabase-client.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// 서버 사이드용 (Service Role Key)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

**Step 2: 데이터베이스 타입 정의**

Create: `lib/types/database.types.ts`

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          is_anonymous: boolean
        }
        Insert: {
          id: string
          created_at?: string
          is_anonymous?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          is_anonymous?: boolean
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string | null
          surgery_type: string
          surgery_date: string
          digestive_capacity: string
          comorbidities: string[]
          current_phase: string | null
          local_storage_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          surgery_type: string
          surgery_date: string
          digestive_capacity: string
          comorbidities?: string[]
          current_phase?: string | null
          local_storage_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          surgery_type?: string
          surgery_date?: string
          digestive_capacity?: string
          comorbidities?: string[]
          current_phase?: string | null
          local_storage_key?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_logs: {
        Row: {
          id: string
          profile_id: string
          log_date: string
          meals_completed: Json | null
          exercises_completed: Json | null
          symptoms: Json | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          log_date: string
          meals_completed?: Json | null
          exercises_completed?: Json | null
          symptoms?: Json | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          log_date?: string
          meals_completed?: Json | null
          exercises_completed?: Json | null
          symptoms?: Json | null
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}
```

**Step 3: Commit**

```bash
git add lib/
git commit -m "feat: add Supabase client and database types"
```

---

## Phase 2: 데이터베이스 마이그레이션

### Task 4: Supabase 데이터베이스 스키마 생성

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: 초기 스키마 마이그레이션 파일 작성**

Create: `supabase/migrations/001_initial_schema.sql`

```sql
-- Users 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_anonymous BOOLEAN DEFAULT FALSE
);

-- User Profiles 테이블
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  surgery_type TEXT NOT NULL CHECK (surgery_type IN (
    'gastric_resection',
    'colon_resection',
    'tkr',
    'spinal_fusion',
    'cholecystectomy'
  )),
  surgery_date DATE NOT NULL,
  digestive_capacity TEXT CHECK (digestive_capacity IN ('good', 'moderate', 'poor')),
  comorbidities TEXT[] DEFAULT '{}',
  current_phase TEXT,
  local_storage_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Logs 테이블
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  meals_completed JSONB DEFAULT '{}',
  exercises_completed JSONB DEFAULT '{}',
  symptoms JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, log_date)
);

-- 인덱스
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_local_key ON user_profiles(local_storage_key);
CREATE INDEX idx_daily_logs_profile ON daily_logs(profile_id);
CREATE INDEX idx_daily_logs_date ON daily_logs(log_date DESC);

-- Row Level Security 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own profiles" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own profiles" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own profiles" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own logs" ON daily_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = daily_logs.profile_id
      AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert own logs" ON daily_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = daily_logs.profile_id
      AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

CREATE POLICY "Users can update own logs" ON daily_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = daily_logs.profile_id
      AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );
```

**Step 2: Supabase 프로젝트에 마이그레이션 적용**

Supabase 대시보드에서:
1. SQL Editor 열기
2. 위 SQL 복사하여 실행
3. 또는 Supabase CLI 사용: `supabase db push`

**Step 3: 마이그레이션 확인**

Supabase Table Editor에서 테이블 생성 확인:
- users
- user_profiles
- daily_logs

**Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add initial database schema migration"
```

---

### Task 5: AI용 벡터 데이터베이스 마이그레이션

**Files:**
- Create: `supabase/migrations/002_vector_search.sql`

**Step 1: 벡터 확장 및 지식 베이스 테이블 생성**

Create: `supabase/migrations/002_vector_search.sql`

```sql
-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 지식 베이스 테이블
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 벡터 유사도 검색용 IVFFlat 인덱스
CREATE INDEX ON knowledge_base
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 메타데이터 검색용 GIN 인덱스
CREATE INDEX idx_kb_metadata ON knowledge_base USING gin(metadata);

-- 벡터 유사도 검색 함수
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_base.id,
    knowledge_base.content,
    knowledge_base.metadata,
    1 - (knowledge_base.embedding <=> query_embedding) AS similarity
  FROM knowledge_base
  WHERE
    1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
    AND (filter = '{}'::jsonb OR knowledge_base.metadata @> filter)
  ORDER BY knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

**Step 2: Supabase에 마이그레이션 적용**

Supabase SQL Editor에서 실행

**Step 3: 벡터 확장 확인**

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

Expected: vector 확장이 설치되어 있어야 함

**Step 4: Commit**

```bash
git add supabase/migrations/002_vector_search.sql
git commit -m "feat: add pgvector extension and knowledge base schema"
```

---

### Task 6: AI 모니터링 테이블 마이그레이션

**Files:**
- Create: `supabase/migrations/003_ai_tables.sql`

**Step 1: AI 관련 테이블 생성**

Create: `supabase/migrations/003_ai_tables.sql`

```sql
-- 대화 히스토리
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_profile ON chat_conversations(profile_id);

-- 토큰 사용량 추적
CREATE TABLE token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  endpoint TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost DECIMAL(10, 6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_usage_user_date ON token_usage(user_id, date);
CREATE INDEX idx_token_usage_date ON token_usage(date DESC);

-- AI 성능 메트릭
CREATE TABLE ai_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost DECIMAL(10, 6) NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_metrics_created_at ON ai_metrics(created_at DESC);
CREATE INDEX idx_ai_metrics_success ON ai_metrics(success) WHERE NOT success;

-- RLS 정책
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON chat_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = chat_conversations.profile_id
      AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

CREATE POLICY "Users can view own token usage" ON token_usage
  FOR SELECT USING (auth.uid() = user_id);

-- ai_metrics는 관리자만 조회 가능 (RLS 정책 없음)
```

**Step 2: Supabase에 마이그레이션 적용**

**Step 3: Commit**

```bash
git add supabase/migrations/003_ai_tables.sql
git commit -m "feat: add AI monitoring tables (conversations, token usage, metrics)"
```

---

## Phase 3: 정적 데이터 구축

### Task 7: 수술 프로토콜 데이터 생성

**Files:**
- Create: `data/protocols/surgery-protocols.ts`
- Create: `lib/types/protocol.types.ts`

**Step 1: 프로토콜 타입 정의**

Create: `lib/types/protocol.types.ts`

```typescript
export interface RecoveryPhase {
  name: string
  daysRange: [number, number]
  description: string
  forbiddenFoods: string[]
}

export interface RehabPhase {
  name: string
  weekRange: [number, number]
  description: string
  allowedExercises: string[]
  warnings?: string[]
}

export interface SurgeryProtocol {
  phases: RecoveryPhase[]
  nutritionRequirements: {
    proteinMultiplier: number
    calorieTarget: number
    maxFatPerMeal?: number
  }
  rehabPhases?: RehabPhase[]
}

export type SurgeryType =
  | 'gastric_resection'
  | 'colon_resection'
  | 'tkr'
  | 'spinal_fusion'
  | 'cholecystectomy'
```

**Step 2: 수술 프로토콜 데이터 작성**

Create: `data/protocols/surgery-protocols.ts`

```typescript
import type { SurgeryProtocol, SurgeryType } from '@/lib/types/protocol.types'

export const SURGERY_PROTOCOLS: Record<SurgeryType, SurgeryProtocol> = {
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
      proteinMultiplier: 1.2,
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
  tkr: {
    phases: [
      {
        name: 'normal',
        daysRange: [0, 90],
        description: '정상 식단 + 고단백',
        forbiddenFoods: []
      }
    ],
    nutritionRequirements: {
      proteinMultiplier: 1.5,
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
  spinal_fusion: {
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
  cholecystectomy: {
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
      maxFatPerMeal: 10
    }
  }
}
```

**Step 3: Commit**

```bash
git add data/protocols/ lib/types/protocol.types.ts
git commit -m "feat: add surgery protocol data and types"
```

---

### Task 8: 식단 및 운동 데이터베이스 생성

**Files:**
- Create: `data/meals/meal-database.json`
- Create: `data/exercises/exercise-database.json`
- Create: `lib/types/meal.types.ts`
- Create: `lib/types/exercise.types.ts`

**Step 1: 식단 타입 정의**

Create: `lib/types/meal.types.ts`

```typescript
export interface Meal {
  id: string
  name: string
  textureType: 'liquid' | 'soft' | 'normal'
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    sodium: number
  }
  tags: string[]
  substitutionGroup: string
  ingredients: string[]
  prepTime: number
}
```

**Step 2: 식단 데이터 작성**

Create: `data/meals/meal-database.json`

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

**Step 3: 운동 타입 정의**

Create: `lib/types/exercise.types.ts`

```typescript
export interface Exercise {
  id: string
  name: string
  targetSurgery: string[]
  description: string
  sets: number
  reps: number
  holdSeconds?: number
  imageUrl: string
  videoUrl?: string
  difficulty: 'easy' | 'moderate' | 'hard'
  precautions?: string[]
}
```

**Step 4: 운동 데이터 작성**

Create: `data/exercises/exercise-database.json`

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

**Step 5: Commit**

```bash
git add data/ lib/types/
git commit -m "feat: add meal and exercise databases with types"
```

---

## Phase 4: 코어 비즈니스 로직

### Task 9: 프로파일링 엔진 구현

**Files:**
- Create: `lib/profiling-engine.ts`
- Create: `lib/types/user.types.ts`

**Step 1: 사용자 타입 정의**

Create: `lib/types/user.types.ts`

```typescript
export interface UserProfile {
  id?: string
  user_id?: string | null
  surgery_type: string
  surgery_date: Date
  digestive_capacity: 'good' | 'moderate' | 'poor'
  comorbidities: string[]
  weight?: number
  current_phase?: string
  local_storage_key?: string
  created_at?: Date
  updated_at?: Date
}
```

**Step 2: 프로파일링 엔진 작성**

Create: `lib/profiling-engine.ts`

```typescript
import { SURGERY_PROTOCOLS } from '@/data/protocols/surgery-protocols'
import type { RecoveryPhase } from './types/protocol.types'
import type { UserProfile } from './types/user.types'

export function getDaysDifference(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function calculateRecoveryPhase(profile: UserProfile): RecoveryPhase {
  const daysSinceSurgery = getDaysDifference(profile.surgery_date, new Date())
  const protocol = SURGERY_PROTOCOLS[profile.surgery_type as keyof typeof SURGERY_PROTOCOLS]

  if (!protocol) {
    throw new Error(`Unknown surgery type: ${profile.surgery_type}`)
  }

  let phase = protocol.phases.find(
    p => daysSinceSurgery >= p.daysRange[0] && daysSinceSurgery <= p.daysRange[1]
  )

  // 소화 능력에 따른 단계 조정
  if (profile.digestive_capacity === 'poor' && phase && phase.name !== 'liquid') {
    const currentIndex = protocol.phases.findIndex(p => p.name === phase!.name)
    if (currentIndex > 0) {
      phase = protocol.phases[currentIndex - 1]
    }
  }

  // 범위를 벗어나면 마지막 단계 반환
  return phase || protocol.phases[protocol.phases.length - 1]
}

export function calculateNutritionRequirements(profile: UserProfile) {
  const protocol = SURGERY_PROTOCOLS[profile.surgery_type as keyof typeof SURGERY_PROTOCOLS]
  const weight = profile.weight || 60

  return {
    dailyProtein: weight * protocol.nutritionRequirements.proteinMultiplier,
    dailyCalories: protocol.nutritionRequirements.calorieTarget,
    maxFatPerMeal: protocol.nutritionRequirements.maxFatPerMeal
  }
}
```

**Step 3: 간단한 테스트 작성 (선택적)**

Create: `__tests__/profiling-engine.test.ts` (나중에 추가)

**Step 4: Commit**

```bash
git add lib/profiling-engine.ts lib/types/user.types.ts
git commit -m "feat: add profiling engine for recovery phase calculation"
```

---

### Task 10: 로컬 스토리지 관리자 구현

**Files:**
- Create: `lib/local-storage.ts`

**Step 1: 로컬 스토리지 유틸리티 작성**

Create: `lib/local-storage.ts`

```typescript
import type { UserProfile } from './types/user.types'

export const LOCAL_STORAGE_KEYS = {
  PROFILE: 'recovery_profile',
  MEAL_PLAN: 'current_meal_plan',
  EXERCISE_PLAN: 'current_exercise_plan',
  DAILY_LOGS: 'daily_logs',
  LAST_SYNC: 'last_sync_timestamp'
} as const

export interface LocalProfile {
  id: string
  surgery_type: string
  surgery_date: string
  digestive_capacity: string
  comorbidities: string[]
  weight?: number
  created_at: string
  updated_at: string
}

export interface LocalDailyLog {
  date: string
  meals_completed: { [key: string]: boolean }
  exercises_completed: { [key: string]: boolean }
  symptoms?: {
    pain_level?: number
    temperature?: number
    gas_passed?: boolean
  }
  notes?: string
}

// 프로파일 저장
export function saveProfile(profile: LocalProfile): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_STORAGE_KEYS.PROFILE, JSON.stringify(profile))
}

// 프로파일 조회
export function getProfile(): LocalProfile | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILE)
  return data ? JSON.parse(data) : null
}

// 일일 로그 저장
export function saveDailyLog(log: LocalDailyLog): void {
  if (typeof window === 'undefined') return

  const logs = getDailyLogs()
  const index = logs.findIndex(l => l.date === log.date)

  if (index >= 0) {
    logs[index] = log
  } else {
    logs.push(log)
  }

  localStorage.setItem(LOCAL_STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs))
}

// 일일 로그 조회
export function getDailyLogs(): LocalDailyLog[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(LOCAL_STORAGE_KEYS.DAILY_LOGS)
  return data ? JSON.parse(data) : []
}

// 오래된 로그 정리 (30일 이상)
export function cleanupOldLogs(): void {
  if (typeof window === 'undefined') return

  const logs = getDailyLogs()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 30)

  const recentLogs = logs.filter(log => new Date(log.date) >= cutoffDate)

  localStorage.setItem(LOCAL_STORAGE_KEYS.DAILY_LOGS, JSON.stringify(recentLogs))
}

// 프로파일 삭제
export function clearProfile(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LOCAL_STORAGE_KEYS.PROFILE)
}

// 모든 데이터 삭제
export function clearAllData(): void {
  if (typeof window === 'undefined') return
  Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}
```

**Step 2: Commit**

```bash
git add lib/local-storage.ts
git commit -m "feat: add local storage manager for offline support"
```

---

## Phase 5: AI 인프라 구축

### Task 11: OpenAI 클라이언트 및 임베딩 생성

**Files:**
- Create: `lib/ai/embeddings.ts`

**Step 1: 임베딩 유틸리티 작성**

Create: `lib/ai/embeddings.ts`

```typescript
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-client'
import { SURGERY_PROTOCOLS } from '@/data/protocols/surgery-protocols'
import mealDatabase from '@/data/meals/meal-database.json'
import exerciseDatabase from '@/data/exercises/exercise-database.json'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' ').trim(),
  })

  return response.data[0].embedding
}

// 수술 프로토콜 인덱싱
export async function indexSurgeryProtocols() {
  const protocols = Object.entries(SURGERY_PROTOCOLS)

  for (const [surgeryType, protocol] of protocols) {
    // 회복 단계별 인덱싱
    for (const phase of protocol.phases) {
      const document = `
수술 종류: ${surgeryType}
회복 단계: ${phase.name} (${phase.description})
기간: ${phase.daysRange[0]}일 ~ ${phase.daysRange[1]}일
금기 식품: ${phase.forbiddenFoods.join(', ')}
권장 영양: 단백질 ${protocol.nutritionRequirements.proteinMultiplier}g/kg, 칼로리 ${protocol.nutritionRequirements.calorieTarget}kcal
      `.trim()

      const embedding = await generateEmbedding(document)

      await supabaseAdmin.from('knowledge_base').insert({
        content: document,
        embedding: JSON.stringify(embedding), // pgvector는 배열을 문자열로 변환
        metadata: {
          category: 'protocol',
          surgery_type: surgeryType,
          phase: phase.name,
          tags: phase.forbiddenFoods
        }
      })

      console.log(`✅ Indexed protocol: ${surgeryType} - ${phase.name}`)
    }

    // 재활 프로토콜 인덱싱
    if (protocol.rehabPhases) {
      for (const rehabPhase of protocol.rehabPhases) {
        const document = `
수술 종류: ${surgeryType}
재활 단계: ${rehabPhase.name} (${rehabPhase.description})
주차: ${rehabPhase.weekRange[0]}주 ~ ${rehabPhase.weekRange[1]}주
허용 운동: ${rehabPhase.allowedExercises.join(', ')}
주의사항: ${rehabPhase.warnings?.join('. ') || '없음'}
        `.trim()

        const embedding = await generateEmbedding(document)

        await supabaseAdmin.from('knowledge_base').insert({
          content: document,
          embedding: JSON.stringify(embedding),
          metadata: {
            category: 'rehab',
            surgery_type: surgeryType,
            phase: rehabPhase.name,
            tags: rehabPhase.allowedExercises,
            warnings: rehabPhase.warnings || []
          }
        })

        console.log(`✅ Indexed rehab: ${surgeryType} - ${rehabPhase.name}`)
      }
    }
  }
}

// 식단 데이터베이스 인덱싱
export async function indexMealDatabase() {
  for (const meal of mealDatabase) {
    const document = `
메뉴명: ${meal.name}
식감 타입: ${meal.textureType}
영양 정보: 칼로리 ${meal.nutrition.calories}kcal, 단백질 ${meal.nutrition.protein}g, 탄수화물 ${meal.nutrition.carbs}g, 지방 ${meal.nutrition.fat}g, 나트륨 ${meal.nutrition.sodium}mg
특징: ${meal.tags.join(', ')}
재료: ${meal.ingredients.join(', ')}
조리 시간: ${meal.prepTime}분
대체 그룹: ${meal.substitutionGroup}
    `.trim()

    const embedding = await generateEmbedding(document)

    await supabaseAdmin.from('knowledge_base').insert({
      content: document,
      embedding: JSON.stringify(embedding),
      metadata: {
        category: 'meal',
        meal_id: meal.id,
        texture_type: meal.textureType,
        tags: meal.tags,
        substitution_group: meal.substitutionGroup
      }
    })

    console.log(`✅ Indexed meal: ${meal.name}`)
  }
}

// 운동 데이터베이스 인덱싱
export async function indexExerciseDatabase() {
  for (const exercise of exerciseDatabase) {
    const document = `
운동명: ${exercise.name}
대상 수술: ${exercise.targetSurgery.join(', ')}
설명: ${exercise.description}
난이도: ${exercise.difficulty}
세트/횟수: ${exercise.sets}세트 x ${exercise.reps}회
${exercise.holdSeconds ? `유지 시간: ${exercise.holdSeconds}초` : ''}
주의사항: ${exercise.precautions?.join('. ') || '없음'}
    `.trim()

    const embedding = await generateEmbedding(document)

    await supabaseAdmin.from('knowledge_base').insert({
      content: document,
      embedding: JSON.stringify(embedding),
      metadata: {
        category: 'exercise',
        exercise_id: exercise.id,
        target_surgery: exercise.targetSurgery,
        difficulty: exercise.difficulty,
        precautions: exercise.precautions || []
      }
    })

    console.log(`✅ Indexed exercise: ${exercise.name}`)
  }
}
```

**Step 2: Commit**

```bash
git add lib/ai/embeddings.ts
git commit -m "feat: add OpenAI embeddings generator for knowledge base"
```

---

### Task 12: 지식 베이스 인덱싱 스크립트

**Files:**
- Create: `scripts/index-knowledge-base.ts`

**Step 1: 인덱싱 스크립트 작성**

Create: `scripts/index-knowledge-base.ts`

```typescript
import {
  indexSurgeryProtocols,
  indexMealDatabase,
  indexExerciseDatabase
} from '../lib/ai/embeddings'

async function main() {
  console.log('🚀 Starting knowledge base indexing...\n')

  try {
    console.log('📋 Indexing surgery protocols...')
    await indexSurgeryProtocols()
    console.log('✅ Surgery protocols indexed\n')

    console.log('🍽️  Indexing meal database...')
    await indexMealDatabase()
    console.log('✅ Meal database indexed\n')

    console.log('💪 Indexing exercise database...')
    await indexExerciseDatabase()
    console.log('✅ Exercise database indexed\n')

    console.log('🎉 Indexing complete!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Indexing failed:', error)
    process.exit(1)
  }
}

main()
```

**Step 2: package.json에 스크립트 추가**

Modify: `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "index-kb": "tsx scripts/index-knowledge-base.ts"
  }
}
```

**Step 3: tsx 설치 (TypeScript 실행용)**

```bash
npm install -D tsx
```

**Step 4: Commit**

```bash
git add scripts/ package.json
git commit -m "feat: add knowledge base indexing script"
```

---

## Phase 6: 간단한 시작 - 랜딩 페이지

### Task 13: 랜딩 페이지 및 레이아웃

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

**Step 1: 루트 레이아웃 수정**

Modify: `app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: '수술 후 회복 관리 매니저',
  description: '수술 후 식단과 재활 운동을 관리하는 디지털 동반자',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={notoSansKr.className}>
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
```

**Step 2: 랜딩 페이지 작성**

Modify: `app/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/local-storage'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 로컬 스토리지에 프로파일이 있으면 대시보드로 리다이렉트
    const profile = getProfile()
    if (profile) {
      router.push('/dashboard')
    } else {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-6">
          수술 후 회복 관리 매니저
        </h1>
        <p className="text-2xl text-gray-600 mb-12">
          수술 종류와 회복 단계에 맞는 식단과 재활 운동을
          <br />
          자동으로 생성해드립니다
        </p>

        <button
          onClick={() => router.push('/onboarding')}
          className="px-12 py-6 bg-blue-500 text-white text-2xl font-bold rounded-2xl
                     hover:bg-blue-600 transition-colors shadow-lg"
        >
          시작하기
        </button>

        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-4xl mb-2">🍽️</div>
            <p className="text-lg font-semibold">맞춤 식단</p>
          </div>
          <div>
            <div className="text-4xl mb-2">💪</div>
            <p className="text-lg font-semibold">재활 운동</p>
          </div>
          <div>
            <div className="text-4xl mb-2">📊</div>
            <p className="text-lg font-semibold">회복 추적</p>
          </div>
        </div>
      </div>
    </main>
  )
}
```

**Step 3: 개발 서버에서 확인**

```bash
npm run dev
```

http://localhost:3000 접속하여 랜딩 페이지 확인

**Step 4: Commit**

```bash
git add app/
git commit -m "feat: add landing page with profile redirect"
```

---

## 실행 가이드

### 초기 설정 체크리스트

**1. 환경 변수 설정**

`.env.local` 파일 생성:

```bash
cp .env.local.example .env.local
```

필수 환경 변수 입력:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API 키

**2. 데이터베이스 마이그레이션**

Supabase SQL Editor에서 순서대로 실행:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_vector_search.sql`
3. `supabase/migrations/003_ai_tables.sql`

**3. 지식 베이스 인덱싱**

```bash
npm run index-kb
```

Expected output:
```
🚀 Starting knowledge base indexing...
📋 Indexing surgery protocols...
✅ Indexed protocol: gastric_resection - liquid
✅ Indexed protocol: gastric_resection - soft
...
🎉 Indexing complete!
```

**4. 개발 서버 실행**

```bash
npm run dev
```

### 개발 워크플로우

**매 작업마다:**
1. 기능 구현
2. 로컬 테스트
3. 커밋 (명확한 커밋 메시지)
4. 다음 Task로 진행

**권장 커밋 메시지 형식:**
- `feat: add [기능]` - 새 기능
- `fix: resolve [버그]` - 버그 수정
- `refactor: improve [부분]` - 리팩토링
- `chore: update [항목]` - 설정/도구 변경

### 다음 단계 (Phase 6-10)

이 계획서는 **Phase 1-5 (Foundation + AI Infrastructure)**까지 포함합니다.

**Phase 6-10 (별도 구현 계획 필요):**
- Phase 6: 온보딩 플로우 UI
- Phase 7: 대시보드 및 식단/운동 페이지
- Phase 8: AI 챗봇 구현
- Phase 9: 증상 분석 및 주간 리포트
- Phase 10: PDF 생성 및 최적화

각 Phase는 독립적인 구현 계획으로 작성하여 순차적으로 진행하는 것을 권장합니다.

---

## 실행 옵션

**Plan complete and saved to `docs/plans/2026-01-24-implementation-plan.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Stay in this session
- Fresh subagent per task + code review

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints
- Guide them to open new session in worktree
- **REQUIRED SUB-SKILL:** New session uses superpowers:executing-plans

**Which approach?**
