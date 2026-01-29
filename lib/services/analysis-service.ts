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
        ...(data as any).analysis_data,
        id: (data as any).id,
        profile_id: (data as any).profile_id,
        week_start: (data as any).week_start,
        week_end: (data as any).week_end,
        created_at: (data as any).created_at,
        updated_at: (data as any).updated_at,
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
        ...(data as any).analysis_data,
        id: (data as any).id,
        profile_id: (data as any).profile_id,
        week_start: (data as any).week_start,
        week_end: (data as any).week_end,
        created_at: (data as any).created_at,
        updated_at: (data as any).updated_at,
    };
}
