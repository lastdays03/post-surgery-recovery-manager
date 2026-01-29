# 주간 리포트 AI 분석 기능 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 매주 월요일 자동으로 지난주 데이터를 AI로 분석하여 구조화된 주간 리포트를 생성하고 사용자에게 제공

**Architecture:** 타입 정의 → DB 마이그레이션 → 유틸리티 함수 → AI 프롬프트 → API 엔드포인트 → Cron Job → 서비스 레이어 → UI 업데이트 순으로 구현. TDD 방식으로 각 컴포넌트를 테스트하며 진행.

**Tech Stack:** TypeScript, Next.js 16, OpenAI GPT-4, Supabase, Vercel Cron, Vitest

---

## Task 1: 타입 정의 생성

**Files:**
- Create: `lib/types/weekly-analysis.types.ts`

**Step 1: 타입 파일 생성**

```typescript
// lib/types/weekly-analysis.types.ts

export interface WeeklySummary {
  overallStatus: '안정' | '주의' | '관찰 필요';
  keyPoints: string[]; // 2-3줄 핵심 요약
}

export interface MealIntakeAnalysis {
  averageLevel: string; // "평균 62%"
  trendChange: string; // "전주 대비 +12%"
  interpretation: string; // 회복 관점 해석
}

export interface DigestiveAnalysis {
  commonSymptoms: string[]; // 자주 나타난 증상들
  correlationWithMeal: string; // 식사와의 연관성
  assessment: '정상 회복 범위' | '주의 필요' | '관리 조정 필요';
  details: string;
}

export interface PainRecoveryAnalysis {
  painTrend: string; // 통증 흐름
  energyTrend: string; // 기력 흐름
  topObstacle: string; // 가장 방해한 요인
  isTemporary: boolean; // 일시적 현상 여부
  recommendation: string;
}

export interface AbnormalSignals {
  hasWarning: boolean;
  signals: {
    type: string; // "변비 지속", "설사 반복", "고열"
    description: string;
    action: string; // 권장 조치
  }[];
  requiresMedicalConsultation: boolean;
  urgencyLevel: 'none' | 'monitor' | 'consult_soon' | 'urgent';
}

export interface DietEvaluation {
  appropriatenessScore: number; // 0-100
  currentStage: string;
  decision: '유지' | '조정' | '단계 변경';
  reason: string; // 환자 기준 언어로 설명
}

export interface NextWeekPlan {
  dietDirection: '유지' | '완화' | '강화';
  keyPoints: string[]; // 3가지 핵심 포인트
}

export interface WeeklyAnalysisResult {
  id?: string;
  profile_id: string;
  week_start: string; // YYYY-MM-DD
  week_end: string; // YYYY-MM-DD
  summary: WeeklySummary;
  mealIntake: MealIntakeAnalysis;
  digestive: DigestiveAnalysis;
  painRecovery: PainRecoveryAnalysis;
  abnormalSignals: AbnormalSignals;
  dietEvaluation: DietEvaluation;
  nextWeekPlan: NextWeekPlan;
  created_at?: string;
  updated_at?: string;
}
```

**Step 2: 타입스크립트 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 3: 커밋**

```bash
git add lib/types/weekly-analysis.types.ts
git commit -m "feat: 주간 분석 결과를 위한 타입 정의 추가

7개 섹션 구조화된 인터페이스 정의:
- WeeklySummary: 전반적 회복 상태
- MealIntakeAnalysis: 식사 섭취 분석
- DigestiveAnalysis: 소화 상태 분석
- PainRecoveryAnalysis: 통증/회복 부담
- AbnormalSignals: 이상 신호 점검
- DietEvaluation: 식단 적합성 평가
- NextWeekPlan: 다음 주 계획

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: DB 마이그레이션 생성 및 실행

**Files:**
- Create: `supabase/migrations/009_weekly_analysis.sql`

**Step 1: 마이그레이션 스크립트 작성**

```sql
-- 주간 분석 결과 저장 테이블
CREATE TABLE weekly_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, week_start)
);

-- 인덱스
CREATE INDEX idx_weekly_analysis_profile ON weekly_analysis(profile_id);
CREATE INDEX idx_weekly_analysis_week ON weekly_analysis(week_start DESC);

-- RLS 정책
ALTER TABLE weekly_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly analysis" ON weekly_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = weekly_analysis.profile_id
      AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

-- 주석
COMMENT ON TABLE weekly_analysis IS '주간 AI 분석 결과 저장';
COMMENT ON COLUMN weekly_analysis.analysis_data IS '구조화된 분석 결과 (WeeklyAnalysisResult)';
```

**Step 2: 마이그레이션 실행 (로컬)**

Run: `npx supabase db reset`
Expected: 성공 메시지 또는 "Applied migration 009_weekly_analysis"

**Step 3: 테이블 확인**

Run: `npx supabase db diff`
Expected: 변경사항 없음 (이미 적용됨)

**Step 4: 커밋**

```bash
git add supabase/migrations/009_weekly_analysis.sql
git commit -m "chore: 주간 분석 결과 저장을 위한 DB 테이블 추가

- weekly_analysis 테이블 생성
- profile_id별, week_start별 인덱스
- RLS 정책 설정
- JSONB로 분석 데이터 저장

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: 날짜 유틸리티 함수 구현

**Files:**
- Create: `lib/utils/date-helpers.ts`
- Create: `tests/utils/date-helpers.test.ts`

**Step 1: 실패하는 테스트 작성**

```typescript
// tests/utils/date-helpers.test.ts

import { describe, it, expect } from 'vitest';
import { getLastMonday, getLastSunday, getThisMonday } from '@/lib/utils/date-helpers';

describe('Date Helpers', () => {
  it('getLastMonday returns a Monday', () => {
    const lastMonday = getLastMonday();
    const date = new Date(lastMonday);
    expect(date.getDay()).toBe(1); // 1 = Monday
  });

  it('getLastSunday returns a Sunday', () => {
    const lastSunday = getLastSunday();
    const date = new Date(lastSunday);
    expect(date.getDay()).toBe(0); // 0 = Sunday
  });

  it('getLastSunday is 6 days after getLastMonday', () => {
    const lastMonday = getLastMonday();
    const lastSunday = getLastSunday();

    const mondayDate = new Date(lastMonday);
    const sundayDate = new Date(lastSunday);

    const diffDays = (sundayDate.getTime() - mondayDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(6);
  });

  it('getThisMonday returns current week Monday', () => {
    const thisMonday = getThisMonday();
    const date = new Date(thisMonday);
    expect(date.getDay()).toBe(1);
  });
});
```

**Step 2: 테스트 실행하여 실패 확인**

Run: `npm test tests/utils/date-helpers.test.ts`
Expected: FAIL - "Module not found"

**Step 3: 날짜 유틸리티 구현**

```typescript
// lib/utils/date-helpers.ts

/**
 * 지난주 월요일 날짜 반환 (YYYY-MM-DD)
 */
export function getLastMonday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0(일) ~ 6(토)

  // 지난주 월요일까지의 일수 계산
  const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek + 6;

  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysToLastMonday);

  return lastMonday.toISOString().split('T')[0];
}

/**
 * 지난주 일요일 날짜 반환 (YYYY-MM-DD)
 */
export function getLastSunday(): string {
  const lastMonday = getLastMonday();
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastSunday.getDate() + 6);

  return lastSunday.toISOString().split('T')[0];
}

/**
 * 이번 주 월요일 날짜 반환 (YYYY-MM-DD)
 */
export function getThisMonday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();

  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysFromMonday);

  return thisMonday.toISOString().split('T')[0];
}
```

**Step 4: 테스트 실행하여 통과 확인**

Run: `npm test tests/utils/date-helpers.test.ts`
Expected: PASS - all tests pass

**Step 5: 커밋**

```bash
git add lib/utils/date-helpers.ts tests/utils/date-helpers.test.ts
git commit -m "feat: 주간 날짜 계산 유틸리티 함수 추가

- getLastMonday: 지난주 월요일
- getLastSunday: 지난주 일요일
- getThisMonday: 이번주 월요일
- 테스트 포함

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: AI 프롬프트 및 스키마 정의

**Files:**
- Create: `lib/prompts/weekly-analysis-prompt.ts`

**Step 1: 프롬프트 파일 생성**

```typescript
// lib/prompts/weekly-analysis-prompt.ts

import { DailyLogEntry } from '@/lib/types/symptom.types';

export const SYSTEM_PROMPT = `너는 수술 후 환자의 회복 데이터를 분석하는 임상 영양 기반 디지털 회복 매니저다.

너의 역할은:
- 환자의 데일리 체크 데이터를 단순 요약하지 않고
- 회복의 패턴, 위험 신호, 정상 범위를 구분하며
- 다음 주 식단 및 관리 방향을 제안하는 것이다.

의학적 진단은 하지 않되, 의학적으로 합리적인 해석과 환자·보호자가 이해할 수 있는 언어로 설명해야 한다.

분석의 기준:
- 조기 경구 섭취와 단계적 식단 진행 원칙
- 단백질 충분 공급
- 소화기 증상과 식사 섭취의 상관 관계
- 회복을 방해하는 요인 식별
- 위험 신호는 과장 없이 명확히 표현

반드시 JSON 형식으로 응답해야 하며, 다음 스키마를 정확히 따라야 한다.`;

export const JSON_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "object",
      properties: {
        overallStatus: {
          type: "string",
          enum: ["안정", "주의", "관찰 필요"]
        },
        keyPoints: {
          type: "array",
          items: { type: "string" },
          minItems: 2,
          maxItems: 3
        }
      },
      required: ["overallStatus", "keyPoints"]
    },
    mealIntake: {
      type: "object",
      properties: {
        averageLevel: { type: "string" },
        trendChange: { type: "string" },
        interpretation: { type: "string" }
      },
      required: ["averageLevel", "trendChange", "interpretation"]
    },
    digestive: {
      type: "object",
      properties: {
        commonSymptoms: { type: "array", items: { type: "string" } },
        correlationWithMeal: { type: "string" },
        assessment: {
          type: "string",
          enum: ["정상 회복 범위", "주의 필요", "관리 조정 필요"]
        },
        details: { type: "string" }
      },
      required: ["commonSymptoms", "correlationWithMeal", "assessment", "details"]
    },
    painRecovery: {
      type: "object",
      properties: {
        painTrend: { type: "string" },
        energyTrend: { type: "string" },
        topObstacle: { type: "string" },
        isTemporary: { type: "boolean" },
        recommendation: { type: "string" }
      },
      required: ["painTrend", "energyTrend", "topObstacle", "isTemporary", "recommendation"]
    },
    abnormalSignals: {
      type: "object",
      properties: {
        hasWarning: { type: "boolean" },
        signals: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              description: { type: "string" },
              action: { type: "string" }
            },
            required: ["type", "description", "action"]
          }
        },
        requiresMedicalConsultation: { type: "boolean" },
        urgencyLevel: {
          type: "string",
          enum: ["none", "monitor", "consult_soon", "urgent"]
        }
      },
      required: ["hasWarning", "signals", "requiresMedicalConsultation", "urgencyLevel"]
    },
    dietEvaluation: {
      type: "object",
      properties: {
        appropriatenessScore: { type: "number", minimum: 0, maximum: 100 },
        currentStage: { type: "string" },
        decision: {
          type: "string",
          enum: ["유지", "조정", "단계 변경"]
        },
        reason: { type: "string" }
      },
      required: ["appropriatenessScore", "currentStage", "decision", "reason"]
    },
    nextWeekPlan: {
      type: "object",
      properties: {
        dietDirection: {
          type: "string",
          enum: ["유지", "완화", "강화"]
        },
        keyPoints: {
          type: "array",
          items: { type: "string" },
          minItems: 3,
          maxItems: 3
        }
      },
      required: ["dietDirection", "keyPoints"]
    }
  },
  required: [
    "summary",
    "mealIntake",
    "digestive",
    "painRecovery",
    "abnormalSignals",
    "dietEvaluation",
    "nextWeekPlan"
  ]
};

export function buildUserPrompt(logs: DailyLogEntry[]): string {
  if (logs.length === 0) {
    return "주간 데이터가 없습니다.";
  }

  // 로그 데이터를 읽기 쉬운 텍스트로 변환
  const logsSummary = logs.map(log => {
    const s = log.symptoms;
    return `
날짜: ${log.log_date}
- 통증 수준: ${s.painLevel}/10
- 기력 수준: ${s.energyLevel}/10
- 식사 섭취율: ${s.mealIntake || 'N/A'}
- 식사 후 증상: ${s.postMealSymptom || 'N/A'}
- 체온 상태: ${s.bodyTemperature || 'N/A'}
- 배변 상태: ${s.bowelStatus || 'N/A'}
- 가장 힘들었던 점: ${s.mostDifficult || 'N/A'}
- 특이 증상: ${s.abnormalSymptoms?.join(', ') || '없음'}
    `.trim();
  }).join('\n\n');

  return `다음은 환자의 지난 주 (월요일~일요일) 일일 체크 데이터입니다.

${logsSummary}

위 데이터를 바탕으로 7개 섹션의 주간 분석 리포트를 JSON 형식으로 생성해주세요.`;
}
```

**Step 2: 타입스크립트 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 3: 커밋**

```bash
git add lib/prompts/weekly-analysis-prompt.ts
git commit -m "feat: AI 주간 분석을 위한 프롬프트 및 JSON 스키마 추가

- SYSTEM_PROMPT: 임상 영양 기반 분석 가이드라인
- JSON_SCHEMA: 7개 섹션 구조 정의
- buildUserPrompt: 로그 데이터를 프롬프트용 텍스트로 변환

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: 분석 서비스 레이어 구현

**Files:**
- Create: `lib/services/analysis-service.ts`
- Create: `tests/lib/analysis-service.test.ts`

**Step 1: 실패하는 테스트 작성**

```typescript
// tests/lib/analysis-service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWeeklyAnalysis, fetchLatestAnalysis } from '@/lib/services/analysis-service';

// Mock supabase
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'test-id',
                  profile_id: 'profile-1',
                  week_start: '2026-01-20',
                  week_end: '2026-01-26',
                  analysis_data: {
                    summary: { overallStatus: '안정', keyPoints: ['test'] }
                  },
                  created_at: '2026-01-27T00:00:00Z'
                },
                error: null
              }))
            }))
          }))
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null
            }))
          }))
        }))
      }))
    }))
  }
}));

describe('Analysis Service', () => {
  it('fetches weekly analysis successfully', async () => {
    const result = await fetchWeeklyAnalysis('profile-1', '2026-01-20', '2026-01-26');
    expect(result).not.toBeNull();
    expect(result?.profile_id).toBe('profile-1');
  });

  it('returns null when no analysis found', async () => {
    // Mock will return null
    const result = await fetchLatestAnalysis('profile-999');
    expect(result).toBeNull();
  });
});
```

**Step 2: 테스트 실행하여 실패 확인**

Run: `npm test tests/lib/analysis-service.test.ts`
Expected: FAIL - "Module not found"

**Step 3: 분석 서비스 구현**

```typescript
// lib/services/analysis-service.ts

import { supabase } from '@/lib/supabase-client';
import { WeeklyAnalysisResult } from '@/lib/types/weekly-analysis.types';

/**
 * 특정 주의 분석 결과 조회
 */
export async function fetchWeeklyAnalysis(
  profileId: string,
  weekStart: string,
  weekEnd: string
): Promise<WeeklyAnalysisResult | null> {
  const { data, error } = await supabase
    .from('weekly_analysis')
    .select('*')
    .eq('profile_id', profileId)
    .eq('week_start', weekStart)
    .eq('week_end', weekEnd)
    .single();

  if (error || !data) return null;

  return {
    ...data.analysis_data,
    id: data.id,
    profile_id: data.profile_id,
    week_start: data.week_start,
    week_end: data.week_end,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * 프로필의 가장 최근 분석 결과 조회
 */
export async function fetchLatestAnalysis(
  profileId: string
): Promise<WeeklyAnalysisResult | null> {
  const { data, error } = await supabase
    .from('weekly_analysis')
    .select('*')
    .eq('profile_id', profileId)
    .order('week_start', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    ...data.analysis_data,
    id: data.id,
    profile_id: data.profile_id,
    week_start: data.week_start,
    week_end: data.week_end,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}
```

**Step 4: 테스트 실행하여 통과 확인**

Run: `npm test tests/lib/analysis-service.test.ts`
Expected: PASS

**Step 5: 커밋**

```bash
git add lib/services/analysis-service.ts tests/lib/analysis-service.test.ts
git commit -m "feat: 주간 분석 결과 조회 서비스 레이어 추가

- fetchWeeklyAnalysis: 특정 주 분석 조회
- fetchLatestAnalysis: 최근 분석 조회
- 테스트 포함

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: AI 분석 API 엔드포인트 구현

**Files:**
- Create: `app/api/ai/weekly-analysis/route.ts`

**Step 1: API 엔드포인트 구현**

```typescript
// app/api/ai/weekly-analysis/route.ts

import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getWeeklyLogs } from '@/lib/services/log-service';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/prompts/weekly-analysis-prompt';
import { WeeklyAnalysisResult } from '@/lib/types/weekly-analysis.types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { profile_id, week_start, week_end, force = false } = await request.json();

    if (!profile_id || !week_start || !week_end) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 1. 기존 분석 확인 (조건부 재생성)
    if (!force) {
      const existing = await getExistingAnalysis(profile_id, week_start);
      if (existing) {
        // 마지막 분석 이후 새 로그 체크
        const newLogs = await getLogsAfterDate(
          profile_id,
          week_start,
          week_end,
          existing.created_at!
        );

        if (newLogs.length === 0) {
          // 새 로그 없음 - 캐시 반환
          return NextResponse.json(existing);
        }
      }
    }

    // 2. 주간 로그 데이터 조회
    const logs = await getWeeklyLogs(profile_id, week_start, week_end);

    if (logs.length === 0) {
      return NextResponse.json(
        { error: '분석할 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // 3. OpenAI GPT-4 호출
    const userPrompt = buildUserPrompt(logs);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('AI 응답이 비어있습니다.');
    }

    // 4. 응답 파싱 및 검증
    const analysisData = JSON.parse(responseContent) as Omit<WeeklyAnalysisResult, 'id' | 'profile_id' | 'week_start' | 'week_end' | 'created_at' | 'updated_at'>;

    // 간단한 스키마 검증
    if (!analysisData.summary || !analysisData.mealIntake) {
      throw new Error('AI 응답 형식이 올바르지 않습니다.');
    }

    // 5. DB에 저장
    const { data, error } = await supabase
      .from('weekly_analysis')
      .upsert({
        profile_id,
        week_start,
        week_end,
        analysis_data: analysisData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,week_start'
      })
      .select()
      .single();

    if (error) {
      console.error('DB save error:', error);
      throw error;
    }

    // 6. 결과 반환
    return NextResponse.json({
      ...analysisData,
      id: data.id,
      profile_id: data.profile_id,
      week_start: data.week_start,
      week_end: data.week_end,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });

  } catch (error) {
    console.error('Weekly analysis error:', error);
    return NextResponse.json(
      { error: '분석 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

async function getExistingAnalysis(profileId: string, weekStart: string): Promise<WeeklyAnalysisResult | null> {
  const { data, error } = await supabase
    .from('weekly_analysis')
    .select('*')
    .eq('profile_id', profileId)
    .eq('week_start', weekStart)
    .single();

  if (error || !data) return null;

  return {
    ...data.analysis_data,
    id: data.id,
    profile_id: data.profile_id,
    week_start: data.week_start,
    week_end: data.week_end,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

async function getLogsAfterDate(
  profileId: string,
  weekStart: string,
  weekEnd: string,
  afterDate: string
) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('profile_id', profileId)
    .gte('log_date', weekStart)
    .lte('log_date', weekEnd)
    .gt('created_at', afterDate);

  if (error) return [];
  return data || [];
}
```

**Step 2: 환경 변수 확인**

Run: `echo $OPENAI_API_KEY`
Expected: API 키가 설정되어 있어야 함

**Step 3: 타입스크립트 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 4: 커밋**

```bash
git add app/api/ai/weekly-analysis/route.ts
git commit -m "feat: AI 주간 분석 API 엔드포인트 구현

- POST /api/ai/weekly-analysis
- OpenAI GPT-4 통합
- 조건부 재생성 로직 (새 로그 없으면 캐시 반환)
- DB 저장 및 결과 반환

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Cron Job 핸들러 구현

**Files:**
- Create: `app/api/cron/weekly-analysis/route.ts`
- Create: `vercel.json` (또는 기존 파일 수정)

**Step 1: Cron 핸들러 구현**

```typescript
// app/api/cron/weekly-analysis/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getLastMonday, getLastSunday } from '@/lib/utils/date-helpers';

export async function GET(request: Request) {
  try {
    // 1. Vercel Cron Secret 검증
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. 지난주 날짜 계산
    const lastMonday = getLastMonday();
    const lastSunday = getLastSunday();

    console.log(`[Cron] Generating weekly analysis for ${lastMonday} ~ ${lastSunday}`);

    // 3. 모든 활성 프로필 조회
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, user_id');

    if (profileError) {
      throw profileError;
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No profiles to process',
        processed: 0,
      });
    }

    // 4. 각 프로필별로 분석 생성
    const results = [];
    for (const profile of profiles) {
      try {
        // 내부 API 엔드포인트 호출
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const response = await fetch(
          `${appUrl}/api/ai/weekly-analysis`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profile_id: profile.id,
              week_start: lastMonday,
              week_end: lastSunday,
              force: false, // 조건부 재생성
            }),
          }
        );

        if (response.ok) {
          results.push({
            profile_id: profile.id,
            status: 'success'
          });
        } else {
          const errorData = await response.json();
          results.push({
            profile_id: profile.id,
            status: 'failed',
            error: errorData.error
          });
        }
      } catch (error: any) {
        results.push({
          profile_id: profile.id,
          status: 'failed',
          error: error.message
        });
      }
    }

    // 5. 결과 반환
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    console.log(`[Cron] Completed: ${successCount} succeeded, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      week: `${lastMonday} ~ ${lastSunday}`,
      processed: results.length,
      succeeded: successCount,
      failed: failedCount,
      results,
    });

  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { error: 'Cron job 실행 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
```

**Step 2: vercel.json 설정**

기존 `vercel.json`이 있다면 crons 추가, 없다면 새로 생성:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-analysis",
      "schedule": "0 0 * * 1"
    }
  ]
}
```

**Step 3: 타입스크립트 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 4: 커밋**

```bash
git add app/api/cron/weekly-analysis/route.ts vercel.json
git commit -m "feat: 매주 월요일 자동 분석 생성 Cron Job 추가

- GET /api/cron/weekly-analysis
- 매주 월요일 00:00 UTC 실행
- 모든 프로필에 대해 지난주 분석 생성
- vercel.json에 Cron 설정 추가

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: UI 페이지 업데이트

**Files:**
- Modify: `app/reports/weekly/page.tsx`

**Step 1: 기존 페이지 백업 확인**

Run: `git diff app/reports/weekly/page.tsx`
Expected: 현재 하드코딩된 버전 확인

**Step 2: 페이지 로직 업데이트**

기존 파일을 다음 내용으로 교체 (중요 부분만 표시):

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown } from "lucide-react";
import { getProfile } from "@/lib/local-storage";
import { fetchWeeklyAnalysis } from "@/lib/services/analysis-service";
import { getLastMonday, getLastSunday } from "@/lib/utils/date-helpers";
import { WeeklyAnalysisResult } from "@/lib/types/weekly-analysis.types";
import { usePdfReport } from "@/hooks/use-pdf-report";

export default function WeeklyReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<WeeklyAnalysisResult | null>(null);
  const [weekRange, setWeekRange] = useState({ start: '', end: '' });
  const { downloadWeeklyReport, isGenerating } = usePdfReport();

  useEffect(() => {
    async function loadAnalysis() {
      try {
        const profile = getProfile();
        if (!profile) {
          router.push("/");
          return;
        }

        // 지난주 날짜 계산
        const lastMonday = getLastMonday();
        const lastSunday = getLastSunday();
        setWeekRange({ start: lastMonday, end: lastSunday });

        // DB에서 분석 결과 조회
        const result = await fetchWeeklyAnalysis(profile.id, lastMonday, lastSunday);
        setAnalysis(result);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadAnalysis();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">분석 결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 pb-10">
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="container max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-gray-800">주간 리포트</h1>
            </div>
          </div>
        </header>

        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600 mb-2">
                {weekRange.start} ~ {weekRange.end} 주간 분석이 아직 생성되지 않았습니다.
              </p>
              <p className="text-sm text-gray-500">
                매주 월요일 오전 자동으로 생성됩니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">주간 리포트</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => analysis && downloadWeeklyReport(analysis)}
              disabled={isGenerating || !analysis}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {isGenerating ? "생성 중..." : "PDF 저장"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 1. 이번 주 회복 요약 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-900 font-extrabold">
              이번 주 회복 상태 요약
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {weekRange.start} ~ {weekRange.end}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-lg text-gray-800 font-medium">
              전반적 회복 상태: <span className="font-bold">{analysis.summary.overallStatus}</span>
            </div>
            {analysis.summary.keyPoints.map((point, idx) => (
              <div key={idx} className="text-lg text-gray-800 font-medium">
                • {point}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 나머지 섹션들... (설계 문서의 UI 코드 참조) */}
        {/* 식사 섭취, 소화 상태, 통증 회복, 이상 신호, 식단 평가, 다음주 계획 */}
      </div>
    </div>
  );
}
```

**주의**: 전체 UI 코드는 설계 문서 (`docs/plans/2026-01-29-weekly-report-ai-analysis-design.md`)의 섹션 5를 참조하여 작성

**Step 3: 타입스크립트 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 4: 개발 서버 테스트**

Run: `npm run dev`
Navigate to: `http://localhost:3000/reports/weekly`
Expected: 페이지가 로드되고 "분석이 아직 생성되지 않았습니다" 메시지 표시 (첫 실행 시)

**Step 5: 커밋**

```bash
git add app/reports/weekly/page.tsx
git commit -m "feat: 주간 리포트 페이지를 AI 분석 결과로 업데이트

- 하드코딩된 데이터를 DB 조회로 변경
- fetchWeeklyAnalysis 서비스 사용
- 로딩 상태 및 빈 상태 처리
- 7개 섹션 실제 데이터 렌더링

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: 환경 변수 및 배포 준비

**Files:**
- Modify: `.env.local` (또는 `.env.example`)

**Step 1: 환경 변수 추가**

`.env.local` 파일에 다음 추가:

```bash
# OpenAI API
OPENAI_API_KEY=sk-...your-key-here...

# Vercel Cron
CRON_SECRET=your-random-secret-here

# App URL (프로덕션에서는 실제 URL)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 2: .env.example 업데이트**

```.env.example
# (기존 환경 변수들...)

# OpenAI API for Weekly Analysis
OPENAI_API_KEY=

# Vercel Cron Secret
CRON_SECRET=

# Application URL
NEXT_PUBLIC_APP_URL=
```

**Step 3: 빌드 테스트**

Run: `npm run build`
Expected: 빌드 성공

**Step 4: 커밋**

```bash
git add .env.example
git commit -m "chore: AI 분석 기능을 위한 환경 변수 추가

- OPENAI_API_KEY
- CRON_SECRET
- NEXT_PUBLIC_APP_URL

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: 통합 테스트 및 수동 검증

**Files:**
- N/A (수동 테스트)

**Step 1: 전체 테스트 실행**

Run: `npm test`
Expected: 모든 테스트 통과

**Step 2: 타입스크립트 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 3: Lint 검증**

Run: `npm run lint`
Expected: 에러 없음

**Step 4: API 수동 테스트 (선택적)**

Supabase에 테스트 로그 데이터가 있다면:

```bash
curl -X POST http://localhost:3000/api/ai/weekly-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "your-test-profile-id",
    "week_start": "2026-01-20",
    "week_end": "2026-01-26",
    "force": true
  }'
```

Expected: JSON 응답with 분석 결과

**Step 5: Cron 핸들러 수동 테스트 (선택적)**

```bash
curl -X GET http://localhost:3000/api/cron/weekly-analysis \
  -H "Authorization: Bearer your-cron-secret"
```

Expected: 성공 응답 (또는 "No profiles to process")

**Step 6: 최종 커밋**

```bash
git add -A
git commit -m "chore: 주간 리포트 AI 분석 기능 통합 테스트 완료

모든 컴포넌트 검증:
- 타입 정의 및 DB 스키마
- 유틸리티 및 서비스 레이어
- AI 프롬프트 및 API 엔드포인트
- Cron Job 및 UI 업데이트
- 환경 변수 설정

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 배포 체크리스트

### Vercel 환경 변수 설정
- [ ] `OPENAI_API_KEY` 설정
- [ ] `CRON_SECRET` 설정 (랜덤 문자열)
- [ ] `NEXT_PUBLIC_APP_URL` 설정 (프로덕션 URL)
- [ ] Supabase 환경 변수 확인

### 데이터베이스
- [ ] 프로덕션 DB에 `009_weekly_analysis.sql` 마이그레이션 실행
- [ ] RLS 정책 확인
- [ ] 인덱스 생성 확인

### Vercel 설정
- [ ] `vercel.json` 배포 확인
- [ ] Vercel 대시보드에서 Cron Jobs 활성화 확인
- [ ] Cron 첫 실행 시간 확인 (월요일 00:00 UTC = 한국 09:00)

### 모니터링
- [ ] Vercel Logs에서 Cron 실행 확인
- [ ] OpenAI API 사용량 모니터링
- [ ] 에러 로그 추적

---

## 예상 소요 시간

- Task 1-2: 타입 및 DB (30분)
- Task 3-4: 유틸리티 및 프롬프트 (40분)
- Task 5-6: 서비스 및 API (1시간 30분)
- Task 7: Cron Job (30분)
- Task 8: UI 업데이트 (1시간)
- Task 9-10: 환경 설정 및 테스트 (30분)

**총 예상 시간**: 약 5시간

---

## 문제 해결 가이드

**문제 1: OpenAI API 호출 실패**
- API 키 확인: `echo $OPENAI_API_KEY`
- 크레딧 잔액 확인
- Rate limit 확인 (분당 3회 제한 등)

**문제 2: Cron이 실행되지 않음**
- Vercel 대시보드에서 Cron 활성화 확인
- `vercel.json` 문법 확인
- Authorization 헤더 확인

**문제 3: AI 응답 파싱 실패**
- GPT-4가 정확한 JSON을 생성하지 않을 수 있음
- 로그에서 실제 응답 확인
- 프롬프트 조정 필요

**문제 4: DB 저장 실패**
- 마이그레이션 실행 확인
- RLS 정책 확인
- JSONB 형식 검증

**문제 5: UI에 데이터가 표시되지 않음**
- 브라우저 콘솔에서 API 호출 확인
- Network 탭에서 응답 확인
- DB에 데이터가 실제로 저장되었는지 확인

---

## 후속 작업 (선택적)

1. **실시간 분석 생성 버튼**: 사용자가 수동으로 분석 요청
2. **분석 히스토리**: 과거 주간 리포트 조회
3. **비교 분석**: 주간 비교 차트 추가
4. **알림 기능**: 위험 신호 발견 시 알림
5. **PDF 개선**: AI 분석을 포함한 PDF
