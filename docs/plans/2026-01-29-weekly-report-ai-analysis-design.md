# 주간 리포트 AI 분석 기능 구현 설계

**작성일**: 2026-01-29
**상태**: 승인됨

## 개요

### 목표
현재 하드코딩된 주간 리포트 페이지를 실제 AI 분석 기능으로 전환합니다. 매주 월요일 자정에 자동으로 지난주(월~일) 데이터를 분석하여 구조화된 리포트를 생성하고, 사용자는 언제든지 저장된 리포트를 조회할 수 있습니다.

### 아키텍처 흐름
1. **스케줄러**: 매주 월요일 00:00에 Vercel Cron Job 실행
2. **분석 엔드포인트**: `/api/ai/weekly-analysis` - 지난주 로그 수집 → GPT-4 분석 요청 → 구조화된 JSON 응답 파싱 → DB 저장
3. **UI 페이지**: 저장된 분석 결과 조회 및 렌더링

### 핵심 설계 원칙
- **타입 안전성**: 모든 분석 결과를 TypeScript 인터페이스로 정의
- **비용 효율성**: 조건부 재생성 - 마지막 분석 이후 새 로그가 없으면 스킵
- **사용자 경험**: 페이지는 항상 빠르게 로드 (저장된 데이터만 표시)
- **의료적 신뢰성**: AI 프롬프트에 명확한 가이드라인 제공

### 주요 컴포넌트
- 타입 정의 (`lib/types/weekly-analysis.types.ts`)
- API 엔드포인트 (`app/api/ai/weekly-analysis/route.ts`)
- Cron Job 핸들러 (`app/api/cron/weekly-analysis/route.ts`)
- DB 마이그레이션 (weekly_analysis 테이블)
- 데이터 조회 서비스 (`lib/services/analysis-service.ts`)
- 날짜 유틸리티 (`lib/utils/date-helpers.ts`)
- UI 업데이트 (`app/reports/weekly/page.tsx`)

---

## 데이터 구조 및 타입 정의

### WeeklyAnalysis 타입

7개 섹션에 해당하는 구조화된 인터페이스:

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

### DB 스키마

**파일**: `supabase/migrations/009_weekly_analysis.sql`

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

---

## AI 프롬프트 및 API 엔드포인트

### GPT-4 시스템 프롬프트

```typescript
// lib/prompts/weekly-analysis-prompt.ts

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
  // 로그 데이터를 읽기 쉬운 텍스트로 변환
  const logsSummary = logs.map(log => {
    const s = log.symptoms;
    return `
날짜: ${log.log_date}
- 통증 수준: ${s.painLevel}/10
- 기력 수준: ${s.energyLevel}/10
- 식사 섭취율: ${s.mealIntake}
- 식사 후 증상: ${s.postMealSymptom}
- 체온 상태: ${s.bodyTemperature}
- 배변 상태: ${s.bowelStatus}
- 가장 힘들었던 점: ${s.mostDifficult}
- 특이 증상: ${s.abnormalSymptoms.join(', ') || '없음'}
    `.trim();
  }).join('\n\n');

  return `다음은 환자의 지난 주 (월요일~일요일) 일일 체크 데이터입니다.

${logsSummary}

위 데이터를 바탕으로 7개 섹션의 주간 분석 리포트를 JSON 형식으로 생성해주세요.`;
}
```

### API 엔드포인트 구조

**파일**: `app/api/ai/weekly-analysis/route.ts`

```typescript
import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getWeeklyLogs } from '@/lib/services/log-service';
import { SYSTEM_PROMPT, JSON_SCHEMA, buildUserPrompt } from '@/lib/prompts/weekly-analysis-prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { profile_id, week_start, week_end, force = false } = await request.json();

    // 1. 기존 분석 확인 (조건부 재생성)
    if (!force) {
      const existing = await getExistingAnalysis(profile_id, week_start);
      if (existing) {
        // 마지막 분석 이후 새 로그 체크
        const newLogs = await getLogsAfterDate(
          profile_id,
          week_start,
          week_end,
          existing.created_at
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
    const analysisData = JSON.parse(responseContent);

    // 간단한 스키마 검증 (실제로는 zod 등 사용 권장)
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
      throw error;
    }

    // 6. 결과 반환
    return NextResponse.json({
      ...analysisData,
      id: data.id,
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

async function getExistingAnalysis(profileId: string, weekStart: string) {
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

---

## Cron Job 및 스케줄링

### Vercel Cron Job 설정

**파일**: `vercel.json`

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

- `0 0 * * 1`: 매주 월요일 00:00 (UTC 기준)
- 한국 시간 기준으로는 월요일 오전 9시

### Cron 핸들러 구현

**파일**: `app/api/cron/weekly-analysis/route.ts`

```typescript
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

    console.log(`Generating weekly analysis for ${lastMonday} ~ ${lastSunday}`);

    // 3. 모든 활성 프로필 조회
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, user_id');

    if (profileError) {
      throw profileError;
    }

    // 4. 각 프로필별로 분석 생성
    const results = [];
    for (const profile of profiles) {
      try {
        // API 엔드포인트 호출 (내부)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/ai/weekly-analysis`,
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
      } catch (error) {
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

    return NextResponse.json({
      success: true,
      week: `${lastMonday} ~ ${lastSunday}`,
      processed: results.length,
      succeeded: successCount,
      failed: failedCount,
      results,
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job 실행 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
```

### 날짜 계산 유틸리티

**파일**: `lib/utils/date-helpers.ts`

```typescript
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

---

## UI 컴포넌트 업데이트

### 데이터 조회 서비스

**파일**: `lib/services/analysis-service.ts`

```typescript
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

### 페이지 로직 변경

**파일**: `app/reports/weekly/page.tsx`

주요 변경사항:

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

        {/* 2. 식사 섭취 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 font-bold">
              식사 섭취 분석
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-gray-800">
              <span className="font-semibold">평균 섭취 수준:</span> {analysis.mealIntake.averageLevel}
            </p>
            <p className="text-gray-800">
              <span className="font-semibold">섭취 패턴 변화:</span> {analysis.mealIntake.trendChange}
            </p>
            <p className="text-gray-800">
              <span className="font-semibold">회복 관점 해석:</span> {analysis.mealIntake.interpretation}
            </p>
          </CardContent>
        </Card>

        {/* 3. 소화 및 위장 상태 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 font-bold">
              소화 및 위장 상태 분석
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-gray-800 mb-1">가장 자주 나타난 증상:</p>
              <ul className="list-disc list-inside text-gray-700">
                {analysis.digestive.commonSymptoms.map((symptom, idx) => (
                  <li key={idx}>{symptom}</li>
                ))}
              </ul>
            </div>
            <p className="text-gray-800">
              <span className="font-semibold">식사와의 연관성:</span> {analysis.digestive.correlationWithMeal}
            </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-semibold text-gray-800">평가: {analysis.digestive.assessment}</p>
              <p className="text-gray-700 mt-1">{analysis.digestive.details}</p>
            </div>
          </CardContent>
        </Card>

        {/* 4. 통증·회복 부담 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">
              통증·회복 부담 분석
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-gray-800">
              <span className="font-semibold">통증 흐름:</span> {analysis.painRecovery.painTrend}
            </p>
            <p className="text-gray-800">
              <span className="font-semibold">기력 흐름:</span> {analysis.painRecovery.energyTrend}
            </p>
            <p className="text-gray-800">
              <span className="font-semibold">회복 방해 요인:</span> {analysis.painRecovery.topObstacle}
            </p>
            <p className="text-gray-800">
              <span className="font-semibold">일시적 현상 여부:</span>{" "}
              {analysis.painRecovery.isTemporary ? "예" : "아니오"}
            </p>
            <div className="bg-blue-50 p-3 rounded-lg mt-2">
              <p className="text-gray-800">{analysis.painRecovery.recommendation}</p>
            </div>
          </CardContent>
        </Card>

        {/* 5. 배변·체온 기반 이상 신호 점검 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">
              배변·체온 기반 이상 신호 점검
              <p className="text-sm text-gray-400 font-medium pt-2">
                (해당 항목은 의료 개입 필요 여부 판단에 활용됩니다)
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.abnormalSignals.hasWarning ? (
              <>
                {analysis.abnormalSignals.signals.map((signal, idx) => (
                  <div key={idx} className="border-l-4 border-yellow-500 pl-3">
                    <p className="font-semibold text-gray-800">{signal.type}</p>
                    <p className="text-gray-700">{signal.description}</p>
                    <p className="text-sm text-blue-600 mt-1">→ {signal.action}</p>
                  </div>
                ))}
                {analysis.abnormalSignals.requiresMedicalConsultation && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg mt-3">
                    <p className="font-bold text-red-700">
                      ⚠️ 의료 상담이 필요할 수 있습니다
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      긴급도: {analysis.abnormalSignals.urgencyLevel}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-700">특이 이상 신호가 관찰되지 않았습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* 6. 식단 적합성 평가 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">
              식단 적합성 평가
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-gray-800">
              <span className="font-semibold">적합도 점수:</span>{" "}
              <span className="text-2xl font-bold text-blue-600">
                {analysis.dietEvaluation.appropriatenessScore}점
              </span>
            </p>
            <p className="text-gray-800">
              <span className="font-semibold">현재 식단 단계:</span> {analysis.dietEvaluation.currentStage}
            </p>
            <p className="text-gray-800">
              <span className="font-semibold">결정:</span>{" "}
              <span className="font-bold">{analysis.dietEvaluation.decision}</span>
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mt-2">
              <p className="text-gray-700">{analysis.dietEvaluation.reason}</p>
            </div>
          </CardContent>
        </Card>

        {/* 7. 다음 주 관리 및 식단 제안 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">
              다음 주 관리 및 식단 제안
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-800">
              <span className="font-semibold">식단 방향:</span>{" "}
              <span className="font-bold text-blue-600">{analysis.nextWeekPlan.dietDirection}</span>
            </p>
            <div>
              <p className="font-semibold text-gray-800 mb-2">핵심 포인트:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {analysis.nextWeekPlan.keyPoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 테스트 전략 및 배포 고려사항

### 테스트 계획

**1. 타입 검증 테스트**

**파일**: `tests/types/weekly-analysis.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { WeeklyAnalysisResult } from '@/lib/types/weekly-analysis.types';

describe('WeeklyAnalysis Types', () => {
  it('validates correct analysis structure', () => {
    const mockAnalysis: WeeklyAnalysisResult = {
      profile_id: 'test-id',
      week_start: '2026-01-20',
      week_end: '2026-01-26',
      summary: {
        overallStatus: '안정',
        keyPoints: ['테스트 포인트 1', '테스트 포인트 2']
      },
      // ... 나머지 필드들
    };

    expect(mockAnalysis.summary.overallStatus).toMatch(/^(안정|주의|관찰 필요)$/);
  });
});
```

**2. API 엔드포인트 테스트**

**파일**: `tests/api/weekly-analysis.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Weekly Analysis API', () => {
  it('generates analysis for valid logs', async () => {
    // 테스트 구현
  });

  it('returns cached analysis when no new logs', async () => {
    // 조건부 재생성 테스트
  });

  it('handles empty log data', async () => {
    // 빈 데이터 처리 테스트
  });
});
```

**3. Cron Job 테스트**

**파일**: `tests/api/cron/weekly-analysis.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getLastMonday, getLastSunday } from '@/lib/utils/date-helpers';

describe('Date Helpers', () => {
  it('calculates last Monday correctly', () => {
    const lastMonday = getLastMonday();
    const date = new Date(lastMonday);
    expect(date.getDay()).toBe(1); // Monday
  });

  it('calculates last Sunday correctly', () => {
    const lastSunday = getLastSunday();
    const date = new Date(lastSunday);
    expect(date.getDay()).toBe(0); // Sunday
  });
});
```

**4. UI 컴포넌트 테스트**

**파일**: `tests/pages/weekly-report.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import WeeklyReportPage from '@/app/reports/weekly/page';

vi.mock('@/lib/services/analysis-service', () => ({
  fetchWeeklyAnalysis: vi.fn().mockResolvedValue({
    summary: {
      overallStatus: '안정',
      keyPoints: ['테스트 포인트']
    },
    // ... 나머지 mock 데이터
  })
}));

describe('Weekly Report Page', () => {
  it('renders analysis results', async () => {
    render(<WeeklyReportPage />);

    await waitFor(() => {
      expect(screen.getByText(/이번 주 회복 상태 요약/i)).toBeDefined();
      expect(screen.getByText(/안정/i)).toBeDefined();
    });
  });

  it('shows empty state when no analysis', async () => {
    // 빈 상태 테스트
  });
});
```

### 배포 전 체크리스트

#### 환경 변수 설정
- [ ] `OPENAI_API_KEY`: OpenAI API 키
- [ ] `CRON_SECRET`: Vercel Cron 인증용 시크릿
- [ ] `NEXT_PUBLIC_APP_URL`: 애플리케이션 URL
- [ ] Supabase 환경 변수 확인

#### 데이터베이스
- [ ] `009_weekly_analysis.sql` 마이그레이션 실행
- [ ] RLS 정책 확인
- [ ] 인덱스 생성 확인

#### Vercel 설정
- [ ] `vercel.json`에 Cron 설정 추가
- [ ] Vercel 프로젝트에서 Cron Jobs 활성화 확인
- [ ] 타임존 설정 확인 (UTC vs KST)

#### 코드 검증
- [ ] TypeScript 컴파일 에러 없음
- [ ] 테스트 실행 및 통과
- [ ] Lint 체크 통과

### 비용 관리

**예상 비용 (GPT-4 기준)**
- **토큰 사용량**:
  - 입력: 주간 로그 7개 × 200 토큰 = ~1,400 토큰
  - 출력: JSON 응답 = ~800 토큰
  - 총: ~2,200 토큰/회
- **비용**: $0.03/1K 입력 토큰, $0.06/1K 출력 토큰
  - 회당 비용: ~$0.09
- **월간 예상**:
  - 사용자 100명 × 주 1회 × 4주 = 400회/월
  - 월 비용: ~$36

**최적화 방안**
1. 조건부 재생성으로 불필요한 호출 방지
2. 로그 개수 1-2개일 때 분석 스킵 (데이터 부족)
3. 필요시 GPT-3.5-turbo 고려 (품질 vs 비용)

### 모니터링

**추적 항목**
- Cron 실행 성공률
- AI 응답 파싱 실패율
- 평균 응답 시간
- 사용자별 분석 조회 빈도
- OpenAI API 비용

**로깅**
- Cron 실행 결과 로그
- AI 호출 실패 로그
- 파싱 에러 로그

### 점진적 롤아웃 전략

**Phase 1: 베타 테스트 (1-2주)**
- 소수 사용자(10-20명) 대상
- 수동으로 분석 품질 검증
- 사용자 피드백 수집

**Phase 2: 품질 검증 (1주)**
- 의료 전문가/영양사 리뷰
- AI 프롬프트 개선
- 에지 케이스 처리

**Phase 3: 전체 배포 (1주)**
- 모든 사용자에게 Cron 활성화
- 모니터링 강화
- 사용자 피드백 지속 수집

**Phase 4: 개선 (지속)**
- 프롬프트 최적화
- 새로운 분석 항목 추가 고려
- 비용 최적화

---

## 구현 순서

1. **타입 정의 및 DB 마이그레이션** (30분)
   - `lib/types/weekly-analysis.types.ts` 작성
   - `supabase/migrations/009_weekly_analysis.sql` 작성 및 실행

2. **AI 프롬프트 및 유틸리티** (30분)
   - `lib/prompts/weekly-analysis-prompt.ts` 작성
   - `lib/utils/date-helpers.ts` 작성

3. **API 엔드포인트 구현** (1시간)
   - `app/api/ai/weekly-analysis/route.ts` 구현
   - OpenAI 통합 및 조건부 재생성 로직

4. **Cron Job 구현** (30분)
   - `app/api/cron/weekly-analysis/route.ts` 구현
   - `vercel.json` 설정

5. **데이터 서비스 및 UI 업데이트** (1시간)
   - `lib/services/analysis-service.ts` 작성
   - `app/reports/weekly/page.tsx` 업데이트

6. **테스트 작성** (1시간)
   - 타입, API, Cron, UI 테스트 작성

7. **통합 테스트 및 배포** (30분)
   - 환경 변수 설정
   - Vercel 배포 및 Cron 활성화

**총 예상 시간**: 약 5시간

---

## 리스크 및 고려사항

1. **AI 응답 품질**: GPT-4가 항상 정확한 JSON을 생성하지 않을 수 있음
   - 대응: 재시도 로직, 응답 검증, 폴백 메시지

2. **비용 증가**: 사용자 증가 시 API 비용 급증 가능
   - 대응: 조건부 재생성, 사용량 모니터링, 알림 설정

3. **Cron 실행 실패**: Vercel Cron이 실패할 수 있음
   - 대응: 재시도 로직, 실패 알림, 수동 실행 API 제공

4. **의료적 신뢰성**: AI 분석의 정확성 보장 어려움
   - 대응: 면책 조항 추가, 의료 전문가 검증, 사용자 교육

5. **타임존 이슈**: UTC와 KST 차이로 인한 날짜 계산 오류
   - 대응: 명확한 타임존 설정, 테스트 강화

---

## 후속 작업 (선택적)

1. **실시간 분석 생성**: 사용자가 버튼을 눌러 즉시 분석 생성
2. **분석 히스토리**: 과거 주간 리포트 조회 기능
3. **비교 분석**: 주간 비교 차트 추가
4. **알림 기능**: 위험 신호 발견 시 푸시 알림
5. **PDF 개선**: AI 분석 결과를 포함한 PDF 생성
