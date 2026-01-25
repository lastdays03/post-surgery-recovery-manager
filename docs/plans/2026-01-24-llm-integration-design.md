# LLM 통합 디자인 - 수술 후 회복 관리 매니저

**작성일**: 2026-01-24
**버전**: 1.0
**상태**: Approved
**기반 문서**: [2026-01-24-recovery-manager-design.md](./2026-01-24-recovery-manager-design.md)

## 개요

기존 룰 기반 회복 관리 시스템에 OpenAI GPT-4o를 통합하여 다음 기능을 AI로 강화합니다:
1. **대화형 질문응답 챗봇** - 24/7 가상 간호사
2. **스마트 식단 생성** - 개인 선호도 반영 맞춤 식단
3. **증상 분석 및 리스크 평가** - 지능형 건강 모니터링
4. **주간 리포트 자동 생성** - 자연어 피드백

## 핵심 결정사항

- **LLM 서비스**: OpenAI GPT-4o (한국어 우수, Function Calling 지원)
- **임베딩 모델**: text-embedding-3-small (1536 차원)
- **검색 방식**: RAG (Retrieval-Augmented Generation)
- **벡터 DB**: Supabase pgvector (기존 인프라 활용)
- **비용 목표**: 사용자당 월 $0.40 이하 (최적화 후)

---

## 1. LLM 통합 아키텍처

### 전체 플로우

```
사용자 질문
  ↓
[1] 입력 검증 (프롬프트 인젝션 방지)
  ↓
[2] OpenAI Embeddings API
  ↓
[3] Supabase pgvector 유사도 검색
  ↓
[4] 관련 문서 + 사용자 프로파일 결합
  ↓
[5] GPT-4o 프롬프트 생성
  ↓
[6] OpenAI Chat Completion API
  ↓
[7] 응답 검증 (의료 면책 조항 확인)
  ↓
[8] 사용자에게 반환
  ↓
[9] 대화 히스토리 저장 + 토큰 사용량 추적
```

### 기술 스택 추가

**AI/ML**
- OpenAI GPT-4o - 텍스트 생성
- OpenAI text-embedding-3-small - 벡터 임베딩
- Supabase pgvector - 벡터 데이터베이스

**모니터링**
- Upstash Redis - Rate limiting (선택적)
- Supabase Analytics - 토큰 사용량 추적

---

## 2. 데이터베이스 확장

### 벡터 확장 및 지식 베이스

```sql
-- supabase/migrations/002_vector_search.sql

-- 벡터 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 지식 베이스 테이블
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,              -- 원본 텍스트
  embedding vector(1536),              -- 벡터 임베딩
  metadata JSONB NOT NULL,             -- 카테고리, 태그 등
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 벡터 유사도 검색용 인덱스 (IVFFlat 알고리즘)
CREATE INDEX ON knowledge_base
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 메타데이터 검색용 인덱스
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

### 대화 및 모니터링 테이블

```sql
-- supabase/migrations/003_ai_tables.sql

-- 대화 히스토리
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  messages JSONB NOT NULL,  -- [{role, content, timestamp}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_profile ON chat_conversations(profile_id);

-- 토큰 사용량 추적
CREATE TABLE token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  endpoint TEXT NOT NULL,          -- 'chat', 'meal_plan', 'symptom_analysis'
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost DECIMAL(10, 6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_usage_user_date ON token_usage(user_id, date);

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
```

---

## 3. 벡터 임베딩 생성

### 임베딩 유틸리티

```typescript
// /lib/ai/embeddings.ts
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase-client'
import { SURGERY_PROTOCOLS } from '@/data/protocols/surgery-protocols'
import { MEAL_DATABASE } from '@/data/meals/meal-database.json'
import { EXERCISE_DATABASE } from '@/data/exercises/exercise-database.json'

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
    // 각 회복 단계별 인덱싱
    for (const phase of protocol.phases) {
      const document = `
수술 종류: ${surgeryType}
회복 단계: ${phase.name} (${phase.description})
기간: ${phase.daysRange[0]}일 ~ ${phase.daysRange[1]}일
금기 식품: ${phase.forbiddenFoods.join(', ')}
권장 영양: 단백질 ${protocol.nutritionRequirements.proteinMultiplier}g/kg, 칼로리 ${protocol.nutritionRequirements.calorieTarget}kcal
      `.trim()

      const embedding = await generateEmbedding(document)

      await supabase.from('knowledge_base').insert({
        content: document,
        embedding,
        metadata: {
          category: 'protocol',
          surgery_type: surgeryType,
          phase: phase.name,
          tags: phase.forbiddenFoods
        }
      })
    }

    // 재활 프로토콜 인덱싱 (정형외과 수술)
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

        await supabase.from('knowledge_base').insert({
          content: document,
          embedding,
          metadata: {
            category: 'rehab',
            surgery_type: surgeryType,
            phase: rehabPhase.name,
            tags: rehabPhase.allowedExercises,
            warnings: rehabPhase.warnings || []
          }
        })
      }
    }
  }
}

// 식단 데이터베이스 인덱싱
export async function indexMealDatabase() {
  for (const meal of MEAL_DATABASE) {
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

    await supabase.from('knowledge_base').insert({
      content: document,
      embedding,
      metadata: {
        category: 'meal',
        meal_id: meal.id,
        texture_type: meal.textureType,
        tags: meal.tags,
        substitution_group: meal.substitutionGroup
      }
    })
  }
}

// 운동 데이터베이스 인덱싱
export async function indexExerciseDatabase() {
  for (const exercise of EXERCISE_DATABASE) {
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

    await supabase.from('knowledge_base').insert({
      content: document,
      embedding,
      metadata: {
        category: 'exercise',
        exercise_id: exercise.id,
        target_surgery: exercise.targetSurgery,
        difficulty: exercise.difficulty,
        precautions: exercise.precautions || []
      }
    })
  }
}
```

### 초기 인덱싱 스크립트

```typescript
// /scripts/index-knowledge-base.ts
import {
  indexSurgeryProtocols,
  indexMealDatabase,
  indexExerciseDatabase
} from '@/lib/ai/embeddings'

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
  } catch (error) {
    console.error('❌ Indexing failed:', error)
    process.exit(1)
  }
}

main()
```

```json
// package.json 스크립트 추가
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "index-kb": "tsx scripts/index-knowledge-base.ts"
  }
}
```

---

## 4. RAG 검색 로직

```typescript
// /lib/ai/rag-search.ts
import { generateEmbedding } from './embeddings'
import { supabase } from '@/lib/supabase-client'

export interface KnowledgeDocument {
  id: string
  content: string
  metadata: {
    category: string
    [key: string]: any
  }
  similarity: number
}

export async function searchKnowledgeBase(
  query: string,
  profile: UserProfile,
  options: {
    limit?: number
    threshold?: number
    category?: string
  } = {}
): Promise<KnowledgeDocument[]> {
  const {
    limit = 5,
    threshold = 0.7,
    category
  } = options

  // 1. 질문을 벡터로 변환
  const queryEmbedding = await generateEmbedding(query)

  // 2. 사용자 수술 타입에 맞는 필터
  const filter: any = {
    surgery_type: profile.surgery_type
  }

  if (category) {
    filter.category = category
  }

  // 3. 벡터 유사도 검색
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
    filter
  })

  if (error) {
    console.error('RAG search error:', error)
    throw error
  }

  return data || []
}

// 하이브리드 검색: 벡터 + 키워드
export async function hybridSearch(
  query: string,
  profile: UserProfile,
  keywords: string[]
): Promise<KnowledgeDocument[]> {
  const vectorResults = await searchKnowledgeBase(query, profile, { limit: 10 })

  // 키워드 매칭으로 재정렬
  const scored = vectorResults.map(doc => {
    let keywordScore = 0
    const content = doc.content.toLowerCase()

    keywords.forEach(keyword => {
      if (content.includes(keyword.toLowerCase())) {
        keywordScore += 0.1
      }
    })

    return {
      ...doc,
      finalScore: doc.similarity + keywordScore
    }
  })

  return scored
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 5)
}
```

---

## 5. AI 질문응답 챗봇

```typescript
// /lib/ai/chat-assistant.ts
import OpenAI from 'openai'
import { searchKnowledgeBase } from './rag-search'
import { sanitizeUserInput, validateAIResponse } from './safety-guardrails'
import { calculateRecoveryPhase, getDaysDifference } from '@/lib/profiling-engine'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export async function chatWithAssistant(
  userMessage: string,
  profile: UserProfile,
  conversationHistory: ChatMessage[] = []
): Promise<{ response: string, usage: any }> {
  // 1. 입력 검증
  const sanitizedMessage = sanitizeUserInput(userMessage)

  // 2. RAG로 관련 지식 검색
  const relevantDocs = await searchKnowledgeBase(
    sanitizedMessage,
    profile,
    { limit: 3, threshold: 0.7 }
  )

  // 3. 컨텍스트 구성
  const contextDocs = relevantDocs
    .map(doc => `[${doc.metadata.category}]\n${doc.content}`)
    .join('\n\n---\n\n')

  const daysSinceSurgery = getDaysDifference(profile.surgery_date, new Date())
  const currentPhase = calculateRecoveryPhase(profile)

  // 4. System Prompt
  const systemPrompt = `
당신은 수술 후 회복을 돕는 친절한 AI 어시스턴트입니다.

## 환자 정보
- 수술 종류: ${profile.surgery_type}
- 수술일: ${formatDate(profile.surgery_date)} (D+${daysSinceSurgery}일)
- 현재 회복 단계: ${currentPhase.description}
- 소화 능력: ${profile.digestive_capacity}
- 동반 질환: ${profile.comorbidities.join(', ') || '없음'}

## 관련 지식
${contextDocs || '(검색된 관련 정보 없음)'}

## 응답 지침
1. **쉬운 언어**: 고령 사용자를 고려하여 의학 용어 최소화
2. **짧은 문장**: 한 문장 30자 이내 권장, 줄바꿈으로 가독성 향상
3. **긴급 상황 감지**: 다음 증상 시 즉시 병원 방문 권고
   - 체온 38.5°C 이상
   - 통증 수치 8 이상
   - 심한 부종/발적
   - 48시간 이상 가스 배출 없음 (소화기 수술)
4. **불확실성 인정**: 확실하지 않으면 "담당 의료진과 상의하세요"
5. **친근한 톤**: 이모지 적절히 사용 (😊 🍽️ 💪 등)

## 의료 면책
**중요**: 본 서비스는 의료 조언을 대체할 수 없습니다.
모든 답변 끝에 반드시 "궁금한 점은 담당 의사 선생님과 상담하세요 😊"를 추가하세요.
  `.trim()

  // 5. 대화 메시지 구성
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })),
    { role: 'user', content: sanitizedMessage }
  ]

  // 6. GPT-4o 호출
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.7,
    max_tokens: 500,
  })

  const aiResponse = response.choices[0].message.content || '죄송합니다. 답변을 생성할 수 없습니다.'

  // 7. 응답 검증
  if (!validateAIResponse(aiResponse)) {
    throw new Error('AI 응답이 안전 기준을 충족하지 않습니다.')
  }

  return {
    response: aiResponse,
    usage: response.usage
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR').format(date)
}
```

---

## 6. AI 스마트 식단 생성

```typescript
// /lib/ai/meal-generator.ts
import OpenAI from 'openai'
import { searchKnowledgeBase } from './rag-search'
import { calculateRecoveryPhase } from '@/lib/profiling-engine'
import { SURGERY_PROTOCOLS } from '@/data/protocols/surgery-protocols'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface MealPreferences {
  dislikedFoods?: string[]
  availableIngredients?: string[]
  preferredCuisine?: string
}

export async function generateAIMealPlan(
  profile: UserProfile,
  preferences?: MealPreferences
): Promise<{ mealPlan: WeeklyMealPlan, usage: any }> {
  const currentPhase = calculateRecoveryPhase(profile)
  const protocol = SURGERY_PROTOCOLS[profile.surgery_type]

  // 1. 사용 가능한 식단 검색
  const mealQuery = `${currentPhase.name} 식감의 ${profile.surgery_type} 수술 후 식단`
  const relevantMeals = await searchKnowledgeBase(
    mealQuery,
    profile,
    { limit: 20, category: 'meal' }
  )

  // 2. 프롬프트 구성
  const prompt = `
다음 조건에 맞는 7일간의 식단을 JSON 형식으로 생성하세요.

## 환자 정보
- 수술: ${profile.surgery_type}
- 현재 회복 단계: ${currentPhase.description}
- 금기 식품: ${currentPhase.forbiddenFoods.join(', ')}
- 일일 단백질 목표: ${(profile.weight || 60) * protocol.nutritionRequirements.proteinMultiplier}g
- 일일 칼로리 목표: ${protocol.calorieTarget}kcal

## 사용자 선호
- 싫어하는 음식: ${preferences?.dislikedFoods?.join(', ') || '없음'}
- 냉장고 재료: ${preferences?.availableIngredients?.join(', ') || '없음'}
- 선호 스타일: ${preferences?.preferredCuisine || '한식'}

## 사용 가능한 메뉴 옵션
${relevantMeals.map(m => m.content).slice(0, 15).join('\n\n')}

## 출력 형식 (JSON)
\`\`\`json
{
  "월": {
    "breakfast": {
      "name": "소고기미음",
      "reason": "소화가 잘 되고 단백질 보충에 좋습니다"
    },
    "lunch": { "name": "...", "reason": "..." },
    "dinner": { "name": "...", "reason": "..." }
  },
  "화": { ... },
  ... (수~일)
}
\`\`\`

## 제약사항
1. **금기 식품 절대 포함 금지**
2. 영양 균형 고려 (단백질/탄수화물/지방 비율)
3. 다양성 확보 (같은 메뉴 하루에 2번 이상 반복 금지)
4. 냉장고 재료가 있으면 우선 활용
5. 싫어하는 음식 제외
  `.trim()

  // 3. GPT-4o 호출 (JSON 모드)
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.8,  // 창의성 향상
    max_tokens: 2000,
  })

  const aiMealPlan = JSON.parse(response.choices[0].message.content || '{}')

  // 4. 데이터 모델 변환
  const weeklyMealPlan: WeeklyMealPlan = {}
  const days = ['월', '화', '수', '목', '금', '토', '일']

  days.forEach(day => {
    if (aiMealPlan[day]) {
      weeklyMealPlan[day] = {
        breakfast: {
          name: aiMealPlan[day].breakfast.name,
          reason: aiMealPlan[day].breakfast.reason,
          // 실제 meal 객체는 DB에서 조회
        },
        lunch: {
          name: aiMealPlan[day].lunch.name,
          reason: aiMealPlan[day].lunch.reason,
        },
        dinner: {
          name: aiMealPlan[day].dinner.name,
          reason: aiMealPlan[day].dinner.reason,
        }
      }
    }
  })

  return {
    mealPlan: weeklyMealPlan,
    usage: response.usage
  }
}
```

---

## 7. 증상 분석 및 리스크 평가

```typescript
// /lib/ai/symptom-analyzer.ts
import OpenAI from 'openai'
import { getDaysDifference } from '@/lib/profiling-engine'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface SymptomInput {
  pain_level: number          // 0-10
  temperature?: number        // 섭씨
  gas_passed: boolean
  other_symptoms?: string
}

export interface SymptomAnalysis {
  riskLevel: 'low' | 'medium' | 'high'
  recommendation: string
  shouldContactDoctor: boolean
  explanation: string
}

export async function analyzeSymptoms(
  symptoms: SymptomInput,
  profile: UserProfile,
  recentLogs: LocalDailyLog[]
): Promise<{ analysis: SymptomAnalysis, usage: any }> {
  const daysSinceSurgery = getDaysDifference(profile.surgery_date, new Date())

  // 증상 트렌드 분석
  const symptomTrend = recentLogs
    .filter(log => log.symptoms)
    .map(log => ({
      date: log.date,
      pain: log.symptoms?.pain_level || 0,
      temp: log.symptoms?.temperature || 36.5
    }))

  const prompt = `
수술 후 회복 중인 환자의 증상을 분석하고 리스크 수준을 평가하세요.

## 환자 정보
- 수술 종류: ${profile.surgery_type}
- 수술 후 경과: D+${daysSinceSurgery}일

## 현재 증상
- 통증 수치: ${symptoms.pain_level}/10
- 체온: ${symptoms.temperature ? `${symptoms.temperature}°C` : '측정하지 않음'}
- 가스 배출: ${symptoms.gas_passed ? '예' : '아니오'}
${symptoms.other_symptoms ? `- 기타 증상: ${symptoms.other_symptoms}` : ''}

## 최근 7일 증상 추이
${symptomTrend.length > 0
  ? symptomTrend.map(s => `${s.date}: 통증 ${s.pain}/10, 체온 ${s.temp}°C`).join('\n')
  : '(최근 기록 없음)'
}

## 리스크 평가 기준

### High Risk (즉시 병원 방문 필요)
- 체온 38.5°C 이상
- 통증 수치 8 이상이 지속됨
- 수술 부위 심한 부종, 발적, 고름
- 대장/위 수술 후 48시간 이상 가스 배출 없음
- 호흡 곤란, 가슴 통증
- 지속적인 구토

### Medium Risk (24시간 내 의사 상담)
- 체온 37.5~38.5°C
- 통증 수치 6~7이 지속됨
- 통증 수치가 급격히 증가 (2점 이상)
- 식사 후 지속적인 불편감

### Low Risk (정상 회복 범위)
- 위 조건에 해당하지 않음
- 경미한 불편감은 수술 후 정상

## 출력 형식 (JSON)
\`\`\`json
{
  "riskLevel": "low|medium|high",
  "shouldContactDoctor": true|false,
  "recommendation": "환자가 취해야 할 구체적인 조치 (2-3문장)",
  "explanation": "왜 이런 판단을 내렸는지 쉽게 설명 (2-3문장)"
}
\`\`\`

**중요**: 의학적 판단이므로 보수적으로 평가하세요. 애매하면 medium 또는 high로 분류하세요.
  `.trim()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,  // 의료 판단은 낮은 temperature
    max_tokens: 600,
  })

  const analysis = JSON.parse(response.choices[0].message.content || '{}')

  return {
    analysis,
    usage: response.usage
  }
}
```

---

## 8. 주간 리포트 자동 생성

```typescript
// /lib/ai/report-generator.ts
import OpenAI from 'openai'
import { getDaysDifference } from '@/lib/profiling-engine'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateWeeklyReport(
  profile: UserProfile,
  weekLogs: LocalDailyLog[]
): Promise<{ report: string, usage: any }> {
  const daysSinceSurgery = getDaysDifference(profile.surgery_date, new Date())

  // 통계 계산
  const stats = {
    mealCompletion: calculateMealCompletion(weekLogs),
    exerciseCompletion: calculateExerciseCompletion(weekLogs),
    avgPain: calculateAvgPain(weekLogs),
    avgTemp: calculateAvgTemp(weekLogs),
  }

  const prompt = `
다음 주간 회복 데이터를 분석하여 환자에게 친절하고 격려하는 톤으로 리포트를 작성하세요.

## 환자 정보
- 수술 종류: ${profile.surgery_type}
- 수술 후 경과: D+${daysSinceSurgery}일

## 이번 주 통계
- 식사 완료율: ${stats.mealCompletion}%
- 운동 완료율: ${stats.exerciseCompletion}%
- 평균 통증 수치: ${stats.avgPain.toFixed(1)}/10
- 평균 체온: ${stats.avgTemp.toFixed(1)}°C

## 일별 세부 데이터
${weekLogs.map((log, idx) => `
${['월', '화', '수', '목', '금', '토', '일'][idx]}요일 (${log.date}):
- 식사: ${Object.values(log.meals_completed || {}).filter(Boolean).length}/3 완료
- 운동: ${Object.values(log.exercises_completed || {}).filter(Boolean).length}개 완료
- 통증: ${log.symptoms?.pain_level || 0}/10
${log.notes ? `- 메모: ${log.notes}` : ''}
`).join('\n')}

## 리포트 구성 (마크다운 형식)

### 📊 한 주 요약
(2-3문장으로 전반적인 회복 진행 상황 요약)

### 👏 이번 주 잘한 점
(2-3개 항목, 구체적으로 칭찬)
- 예: 식사를 규칙적으로 하셨네요! 특히 수요일에는 3끼를 모두 완료하셨어요 🎉

### 💡 다음 주 개선 제안
(1-2개 항목, 부드럽게 제안)
- 예: 운동을 조금 더 늘려보시면 어떨까요? 주 3-4회 목표로 해보세요 😊

### 🎯 다음 주 목표
(실천 가능한 구체적 목표 1-2개)

### 💬 격려 메시지
(따뜻한 마무리 1-2문장)

**톤**: 친근하고 격려하는 톤, 이모지 적절히 활용, 쉬운 언어 사용
  `.trim()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 1000,
  })

  return {
    report: response.choices[0].message.content || '',
    usage: response.usage
  }
}

function calculateMealCompletion(logs: LocalDailyLog[]): number {
  const total = logs.length * 3
  const completed = logs.reduce((sum, log) =>
    sum + Object.values(log.meals_completed || {}).filter(Boolean).length, 0
  )
  return Math.round((completed / total) * 100)
}

function calculateExerciseCompletion(logs: LocalDailyLog[]): number {
  const completed = logs.filter(log =>
    Object.values(log.exercises_completed || {}).some(Boolean)
  ).length
  return Math.round((completed / logs.length) * 100)
}

function calculateAvgPain(logs: LocalDailyLog[]): number {
  const validLogs = logs.filter(log => log.symptoms?.pain_level != null)
  if (validLogs.length === 0) return 0

  return validLogs.reduce((sum, log) =>
    sum + (log.symptoms?.pain_level || 0), 0
  ) / validLogs.length
}

function calculateAvgTemp(logs: LocalDailyLog[]): number {
  const validLogs = logs.filter(log => log.symptoms?.temperature != null)
  if (validLogs.length === 0) return 36.5

  return validLogs.reduce((sum, log) =>
    sum + (log.symptoms?.temperature || 36.5), 0
  ) / validLogs.length
}
```

---

## 9. 비용 최적화

### 캐싱 및 스마트 라우팅

```typescript
// /lib/ai/cost-optimization.ts
import OpenAI from 'openai'

// 응답 캐시 (간단한 FAQ)
const responseCache = new Map<string, { response: string, timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 // 1시간

export async function chatWithCaching(
  message: string,
  profile: UserProfile,
  conversationHistory: ChatMessage[]
): Promise<{ response: string, usage: any }> {
  // 컨텍스트 없는 간단한 질문은 캐시 확인
  if (conversationHistory.length === 0) {
    const cacheKey = `${profile.surgery_type}:${message.toLowerCase().trim()}`
    const cached = responseCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ Cache hit:', cacheKey)
      return {
        response: cached.response,
        usage: { prompt_tokens: 0, completion_tokens: 0 }
      }
    }
  }

  const result = await chatWithAssistant(message, profile, conversationHistory)

  // 일반적인 질문만 캐시
  if (conversationHistory.length === 0) {
    const cacheKey = `${profile.surgery_type}:${message.toLowerCase().trim()}`
    responseCache.set(cacheKey, {
      response: result.response,
      timestamp: Date.now()
    })
  }

  return result
}

// 스마트 모델 선택
export function selectModel(message: string): 'gpt-4o' | 'gpt-4o-mini' {
  // 간단한 질문 패턴
  const simplePatterns = [
    /^(오늘|내일|이번주)/,
    /먹어도\s?(되|돼)/,
    /^언제/,
    /^몇\s?(시|일|번)/,
    /^(예|아니오|네|응|ㅇㅇ)/,
  ]

  const isSimple = simplePatterns.some(pattern => pattern.test(message.trim()))

  // 간단한 질문은 저렴한 mini 모델 사용
  // gpt-4o-mini: $0.15/1M input, $0.60/1M output (gpt-4o의 1/30 가격)
  return isSimple ? 'gpt-4o-mini' : 'gpt-4o'
}

// 토큰 사용량 추적
export async function trackTokenUsage(
  userId: string,
  endpoint: string,
  usage: { prompt_tokens: number, completion_tokens: number }
) {
  const cost = calculateCost(usage)

  await supabase.from('token_usage').insert({
    user_id: userId,
    date: new Date().toISOString().split('T')[0],
    endpoint,
    input_tokens: usage.prompt_tokens,
    output_tokens: usage.completion_tokens,
    cost
  })

  // 일일 한도 체크 (무료 사용자는 $0.50/일)
  const { data: todayUsage } = await supabase
    .from('token_usage')
    .select('cost')
    .eq('user_id', userId)
    .eq('date', new Date().toISOString().split('T')[0])

  const totalCost = todayUsage?.reduce((sum, u) => sum + u.cost, 0) || 0
  const dailyLimit = parseFloat(process.env.MAX_DAILY_AI_COST_PER_USER || '0.50')

  if (totalCost > dailyLimit) {
    throw new Error('일일 AI 사용 한도를 초과했습니다. 내일 다시 이용해주세요.')
  }

  return totalCost
}

function calculateCost(usage: { prompt_tokens: number, completion_tokens: number }): number {
  // GPT-4o 가격: $5/1M input, $15/1M output
  const inputCost = (usage.prompt_tokens / 1_000_000) * 5
  const outputCost = (usage.completion_tokens / 1_000_000) * 15
  return inputCost + outputCost
}
```

---

## 10. 안전장치 및 보안

```typescript
// /lib/ai/safety-guardrails.ts

// 1. 프롬프트 인젝션 방지
export function sanitizeUserInput(input: string): string {
  // 시스템 프롬프트 조작 시도 감지
  const dangerousPatterns = [
    /ignore\s+(previous|all)\s+instructions?/i,
    /you\s+are\s+now/i,
    /system\s*:/i,
    /assistant\s*:/i,
    /<\|.*?\|>/g,  // 특수 토큰
    /\[INST\]/i,
    /\[\/INST\]/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      console.warn('⚠️  Prompt injection attempt detected:', input)
      throw new Error('부적절한 입력이 감지되었습니다.')
    }
  }

  // 길이 제한 (토큰 절약)
  if (input.length > 1000) {
    return input.slice(0, 1000)
  }

  return input
}

// 2. 응답 검증
export function validateAIResponse(response: string): boolean {
  // 의료 면책 조항 확인
  const hasDisclaimer =
    response.includes('의사') ||
    response.includes('의료진') ||
    response.includes('병원') ||
    response.includes('상담')

  if (!hasDisclaimer) {
    console.warn('⚠️  Missing medical disclaimer in response')
    // 너무 엄격하면 false positive가 많으므로 경고만
  }

  // 위험한 조언 감지
  const dangerousAdvice = [
    /약\s*을?\s*(끊|중단|안\s*먹)/i,
    /병원\s*(안?\s*가도|갈\s*필요\s*없)/i,
    /의사\s*(필요\s*없|안\s*가도)/i,
  ]

  for (const pattern of dangerousAdvice) {
    if (pattern.test(response)) {
      console.error('❌ Dangerous advice detected:', response)
      return false
    }
  }

  return true
}

// 3. Rate Limiting (Upstash Redis 사용)
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let ratelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_URL) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN!,
  })

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 h'), // 시간당 20회
    analytics: true,
  })
}

export async function checkRateLimit(userId: string): Promise<boolean> {
  if (!ratelimit) return true // Redis 없으면 제한 안 함

  const { success, limit, remaining } = await ratelimit.limit(userId)

  if (!success) {
    console.warn(`⚠️  Rate limit exceeded for user ${userId}`)
  }

  return success
}

// 4. 민감 정보 필터링
export function filterSensitiveInfo(text: string): string {
  return text
    .replace(/\d{6}-\d{7}/g, '******-*******')  // 주민번호
    .replace(/01\d-\d{4}-\d{4}/g, '***-****-****')  // 전화번호
    .replace(/\d{4}-\d{4}-\d{4}-\d{4}/g, '****-****-****-****')  // 카드번호
}
```

---

## 11. 성능 모니터링

```typescript
// /lib/ai/monitoring.ts
import { supabase } from '@/lib/supabase-client'

export interface AIMetrics {
  endpoint: string
  model: string
  latency: number
  tokenUsage: {
    input: number
    output: number
  }
  cost: number
  success: boolean
  error?: string
}

export async function logAIMetrics(metrics: AIMetrics) {
  await supabase.from('ai_metrics').insert({
    endpoint: metrics.endpoint,
    model: metrics.model,
    latency_ms: metrics.latency,
    input_tokens: metrics.tokenUsage.input,
    output_tokens: metrics.tokenUsage.output,
    cost: metrics.cost,
    success: metrics.success,
    error_message: metrics.error,
  })

  // 에러율 모니터링
  if (!metrics.success) {
    console.error('[AI Error]', {
      endpoint: metrics.endpoint,
      model: metrics.model,
      error: metrics.error
    })

    // TODO: Slack/Discord 알림 또는 Sentry 연동
  }

  // 비용 알림
  if (metrics.cost > 0.10) {
    console.warn('[High Cost]', {
      endpoint: metrics.endpoint,
      cost: metrics.cost,
      tokens: metrics.tokenUsage
    })
  }
}

// API 호출 래퍼 (메트릭 자동 수집)
export async function withMetrics<T>(
  endpoint: string,
  model: string,
  fn: () => Promise<{ result: T, usage: any }>
): Promise<T> {
  const startTime = Date.now()
  let success = true
  let error: string | undefined
  let usage = { prompt_tokens: 0, completion_tokens: 0 }

  try {
    const { result, usage: tokenUsage } = await fn()
    usage = tokenUsage
    return result
  } catch (e: any) {
    success = false
    error = e.message
    throw e
  } finally {
    await logAIMetrics({
      endpoint,
      model,
      latency: Date.now() - startTime,
      tokenUsage: {
        input: usage.prompt_tokens,
        output: usage.completion_tokens
      },
      cost: calculateCost(usage),
      success,
      error
    })
  }
}

function calculateCost(usage: { prompt_tokens: number, completion_tokens: number }): number {
  const inputCost = (usage.prompt_tokens / 1_000_000) * 5
  const outputCost = (usage.completion_tokens / 1_000_000) * 15
  return inputCost + outputCost
}
```

---

## 12. API 엔드포인트

### AI 챗봇 API

```typescript
// /app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chatWithCaching } from '@/lib/ai/cost-optimization'
import { checkRateLimit } from '@/lib/ai/safety-guardrails'
import { trackTokenUsage } from '@/lib/ai/cost-optimization'
import { withMetrics } from '@/lib/ai/monitoring'
import { supabase } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const { message, profileId, conversationHistory } = await request.json()

    // 프로파일 조회
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Rate limiting (사용자당 시간당 20회)
    const userId = profile.user_id || 'anonymous'
    const canProceed = await checkRateLimit(userId)

    if (!canProceed) {
      return NextResponse.json(
        { error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    // AI 응답 생성 (메트릭 수집)
    const { response, usage } = await withMetrics(
      'chat',
      'gpt-4o',
      () => chatWithCaching(message, profile, conversationHistory)
    )

    // 토큰 사용량 추적
    if (usage.prompt_tokens > 0) {
      await trackTokenUsage(userId, 'chat', usage)
    }

    // 대화 히스토리 저장
    await supabase.from('chat_conversations').upsert({
      profile_id: profileId,
      messages: [
        ...conversationHistory,
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: response, timestamp: new Date() }
      ],
      updated_at: new Date()
    })

    return NextResponse.json({ response })

  } catch (error: any) {
    console.error('Chat error:', error)

    if (error.message.includes('일일 AI 사용 한도')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'AI 응답 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

### AI 식단 생성 API

```typescript
// /app/api/ai/generate-meal-plan/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateAIMealPlan } from '@/lib/ai/meal-generator'
import { checkRateLimit } from '@/lib/ai/safety-guardrails'
import { trackTokenUsage } from '@/lib/ai/cost-optimization'
import { withMetrics } from '@/lib/ai/monitoring'
import { supabase } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const { profileId, preferences } = await request.json()

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const userId = profile.user_id || 'anonymous'
    const canProceed = await checkRateLimit(userId)

    if (!canProceed) {
      return NextResponse.json(
        { error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    // AI 식단 생성
    const { mealPlan, usage } = await withMetrics(
      'meal_plan',
      'gpt-4o',
      () => generateAIMealPlan(profile, preferences)
    )

    await trackTokenUsage(userId, 'meal_plan', usage)

    return NextResponse.json({ mealPlan })

  } catch (error: any) {
    console.error('Meal plan generation error:', error)
    return NextResponse.json(
      { error: 'AI 식단 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

### 증상 분석 API

```typescript
// /app/api/ai/analyze-symptoms/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { analyzeSymptoms } from '@/lib/ai/symptom-analyzer'
import { checkRateLimit } from '@/lib/ai/safety-guardrails'
import { trackTokenUsage } from '@/lib/ai/cost-optimization'
import { withMetrics } from '@/lib/ai/monitoring'
import { supabase } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const { profileId, symptoms } = await request.json()

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // 최근 7일 로그 조회
    const { data: recentLogs } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('profile_id', profileId)
      .order('log_date', { ascending: false })
      .limit(7)

    const userId = profile.user_id || 'anonymous'
    const canProceed = await checkRateLimit(userId)

    if (!canProceed) {
      return NextResponse.json(
        { error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    // AI 증상 분석
    const { analysis, usage } = await withMetrics(
      'symptom_analysis',
      'gpt-4o',
      () => analyzeSymptoms(symptoms, profile, recentLogs || [])
    )

    await trackTokenUsage(userId, 'symptom_analysis', usage)

    // High risk인 경우 알림 전송 (TODO)
    if (analysis.riskLevel === 'high') {
      console.warn('🚨 High risk detected for user:', userId)
      // TODO: 푸시 알림, 이메일 등
    }

    return NextResponse.json({ analysis })

  } catch (error: any) {
    console.error('Symptom analysis error:', error)
    return NextResponse.json(
      { error: '증상 분석에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

### 주간 리포트 API

```typescript
// /app/api/ai/weekly-report/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateWeeklyReport } from '@/lib/ai/report-generator'
import { trackTokenUsage } from '@/lib/ai/cost-optimization'
import { withMetrics } from '@/lib/ai/monitoring'
import { supabase } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const { profileId, weekStart } = await request.json()

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // 해당 주의 로그 조회
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const { data: weekLogs } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('profile_id', profileId)
      .gte('log_date', weekStart)
      .lt('log_date', weekEnd.toISOString())
      .order('log_date', { ascending: true })

    if (!weekLogs || weekLogs.length === 0) {
      return NextResponse.json(
        { error: '이번 주 기록이 없습니다.' },
        { status: 404 }
      )
    }

    // AI 리포트 생성
    const { report, usage } = await withMetrics(
      'weekly_report',
      'gpt-4o',
      () => generateWeeklyReport(profile, weekLogs)
    )

    const userId = profile.user_id || 'anonymous'
    await trackTokenUsage(userId, 'weekly_report', usage)

    return NextResponse.json({ report })

  } catch (error: any) {
    console.error('Weekly report generation error:', error)
    return NextResponse.json(
      { error: '주간 리포트 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

---

## 13. 환경 변수

```bash
# .env.local

# 기존 환경 변수
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_APP_URL=https://recovery-manager.vercel.app

# OpenAI
OPENAI_API_KEY=sk-proj-xxx...
NEXT_PUBLIC_ENABLE_AI_CHAT=true

# Rate Limiting (선택적)
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=xxx

# 비용 제한
MAX_DAILY_AI_COST_PER_USER=0.50  # USD
```

---

## 14. 업데이트된 프로젝트 구조

```
post-surgery-recovery-manager/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── chat/route.ts
│   │   │   ├── generate-meal-plan/route.ts
│   │   │   ├── analyze-symptoms/route.ts
│   │   │   └── weekly-report/route.ts
│   │   ├── meal-plan/route.ts
│   │   └── ...
│   ├── dashboard/page.tsx  (AI 챗봇 추가)
│   └── ...
├── components/
│   ├── AIChatbot.tsx
│   ├── AIMealGenerator.tsx
│   ├── FloatingChatButton.tsx
│   └── ...
├── lib/
│   ├── ai/
│   │   ├── embeddings.ts
│   │   ├── rag-search.ts
│   │   ├── chat-assistant.ts
│   │   ├── meal-generator.ts
│   │   ├── symptom-analyzer.ts
│   │   ├── report-generator.ts
│   │   ├── cost-optimization.ts
│   │   ├── safety-guardrails.ts
│   │   └── monitoring.ts
│   ├── profiling-engine.ts
│   ├── meal-planner.ts
│   └── ...
├── scripts/
│   └── index-knowledge-base.ts
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_vector_search.sql
│       └── 003_ai_tables.sql
├── data/
│   ├── protocols/surgery-protocols.ts
│   ├── meals/meal-database.json
│   └── exercises/exercise-database.json
├── docs/
│   └── plans/
│       ├── 2026-01-24-recovery-manager-design.md
│       └── 2026-01-24-llm-integration-design.md
├── .env.local
├── package.json
└── ...
```

---

## 15. 비용 분석

### 월간 비용 추정 (사용자 1,000명)

**사용 패턴 가정**
- AI 챗봇: 사용자당 평균 10회/일 × 평균 300 토큰/대화
- 식단 생성: 주 1회 × 2,000 토큰
- 증상 분석: 일 1회 × 500 토큰
- 주간 리포트: 주 1회 × 1,000 토큰

**토큰 사용량 (사용자당/월)**
- 챗봇: 10회/일 × 30일 × 300토큰 = 90,000 토큰
- 식단: 4회/월 × 2,000토큰 = 8,000 토큰
- 증상: 30회/월 × 500토큰 = 15,000 토큰
- 리포트: 4회/월 × 1,000토큰 = 4,000 토큰

**총**: ~117,000 토큰/사용자/월 (input + output 합산)

**비용 계산 (GPT-4o 기준)**
- Input 토큰 비용: 60,000 × $5/1M = $0.30
- Output 토큰 비용: 57,000 × $15/1M = $0.86
- **사용자당 월 비용**: $1.16

**1,000명 월 비용**: $1,160

**최적화 후 (캐싱 50% + mini 모델 30%)**
- 캐싱으로 중복 질문 50% 절감: -$580
- 간단한 질문 gpt-4o-mini 사용 (1/30 가격): -$200
- **최적화 월 비용**: ~$380

### Supabase 비용
- Pro 플랜: $25/월
  - 8GB 데이터베이스
  - 100K MAU
  - pgvector 포함

### 총 예상 비용
- **최적화 전**: $1,185/월
- **최적화 후**: $405/월

---

## 16. 구현 우선순위

### Phase 1: 코어 AI 기능 (2-3주)
1. ✅ 벡터 DB 설정 및 지식 베이스 인덱싱
2. ✅ RAG 검색 로직 구현
3. ✅ AI 챗봇 구현
4. ✅ 기본 안전장치 (프롬프트 인젝션, 응답 검증)

### Phase 2: 고급 기능 (2주)
5. ✅ AI 식단 생성
6. ✅ 증상 분석 및 리스크 평가
7. ✅ 주간 리포트 자동 생성

### Phase 3: 최적화 및 모니터링 (1-2주)
8. ✅ 비용 최적화 (캐싱, 스마트 라우팅)
9. ✅ 성능 모니터링 및 메트릭 수집
10. ✅ Rate limiting

### Phase 4: 프로덕션 준비 (1주)
11. 에러 핸들링 강화
12. 사용자 피드백 수집 (👍/👎 버튼)
13. A/B 테스트 (룰 기반 vs AI 기반)

---

## 17. 성공 지표 (KPI)

### AI 기능 성능
- **챗봇 응답 시간**: 평균 3초 이내
- **응답 정확도**: 사용자 만족도 80% 이상 (👍/👎 버튼)
- **일일 활성 챗봇 사용자**: 전체 사용자의 40% 이상

### 비용 효율성
- **사용자당 월 AI 비용**: $0.50 이하 유지
- **캐시 히트율**: 30% 이상
- **토큰 사용량 감소**: 최적화로 40% 절감

### 사용자 참여도
- **AI 식단 채택률**: 생성된 식단의 60% 이상 사용
- **증상 분석 사용**: 주 1회 이상
- **주간 리포트 열람률**: 80% 이상

---

**문서 끝**
