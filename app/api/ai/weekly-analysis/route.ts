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
                // created_at이 string | undefined 이므로 string으로 단언하거나 체크 필요.
                // 여기서는 간단히 기존 분석이 있으면 그냥 반환하는 정책(캐싱)을 우선 적용할 수도 있지만,
                // 계획에 따르면 "새 로그 체크" 로직이 있음.
                // getLogsAfterDate 함수는 log-service에 아직 없으므로, 일단 "기존 분석 있으면 반환"으로 단순화하거나,
                // log-service에 해당 함수를 추가해야 함.
                // 현재 계획서에는 log-service 수정이 명시되지 않았음. (Task 6에서 getLogsAfterDate 사용한다고 써있지만 Task 5에는 없음)
                // 안전하게 getLogsAfterDate 없이 "이미 존재하면 반환"으로 구현하고 주석 처리.
                console.log('Existing analysis found, returning cached result.');
                return NextResponse.json(existing);
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
        const { data: savedData, error: saveError } = await supabase
            .from('weekly_analysis')
            .upsert({
                profile_id,
                week_start,
                week_end,
                analysis_data: analysisData,
                updated_at: new Date().toISOString(),
            } as any, {
                onConflict: 'profile_id,week_start'
            })
            .select()
            .single();

        if (saveError) {
            console.error('DB save error:', saveError);
            throw saveError;
        }

        // 6. 결과 반환
        return NextResponse.json({
            ...analysisData,
            id: (savedData as any).id,
            profile_id: (savedData as any).profile_id,
            week_start: (savedData as any).week_start,
            week_end: (savedData as any).week_end,
            created_at: (savedData as any).created_at,
            updated_at: (savedData as any).updated_at,
            // Supabase returns string for timestamptz
        });

    } catch (error: any) {
        console.error('Weekly analysis error:', error);
        return NextResponse.json(
            { error: '분석 생성 중 오류가 발생했습니다.', details: error.message },
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
        ...(data as any).analysis_data,
        id: (data as any).id,
        profile_id: (data as any).profile_id,
        week_start: (data as any).week_start,
        week_end: (data as any).week_end,
        created_at: (data as any).created_at,
        updated_at: (data as any).updated_at,
    };
}
