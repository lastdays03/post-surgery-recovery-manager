import { NextRequest, NextResponse } from 'next/server'
import { generateDailyMeals, generateMultiDayMeals, type MealGenerationRequest } from '@/lib/ai/meal-ai'
import { saveMealPlan, getTodayDate } from '@/lib/services/meal-service'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as MealGenerationRequest

        // 필수 필드 검증
        if (!body.userId || !body.recoveryPhase) {
            return NextResponse.json(
                { error: '필수 정보가 누락되었습니다.' },
                { status: 400 }
            )
        }

        // 식단 생성
        // DB에서 사용자 프로필 조회 (advanced_metrics 포함)
        const { data: userProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', body.userId)
            .single()

        const profileData = userProfile as any;

        if (profileData && profileData.advanced_metrics) {
            body.advancedMetrics = profileData.advanced_metrics
        }

        let results: Record<string, any[]> = {}
        const today = getTodayDate()

        if (body.dateRange) {
            results = await generateMultiDayMeals(body)
        } else {
            const meals = await generateDailyMeals(body)
            results[today] = meals
        }

        // DB에 저장
        const savePromises = Object.entries(results).map(async ([date, meals]) => {
            const { error } = await (supabaseAdmin as any)
                .from('meal_plans')
                .upsert({
                    user_id: body.userId,
                    date,
                    recovery_phase: body.recoveryPhase,
                    meals,
                    preferences: body.preferences
                }, { onConflict: 'user_id, date' })

            if (error) {
                console.error(`Error saving meal plan for ${date}:`, error)
            }
        })

        await Promise.all(savePromises)

        return NextResponse.json({
            success: true,
            meals: results[today] || Object.values(results)[0] || [], // 오늘 식단 우선, 없으면 첫 번째 날짜
            allPlans: results,
            message: '식단이 성공적으로 생성되고 저장되었습니다.'
        })
    } catch (error) {
        console.error('식단 생성 API 오류:', error)
        const errorMessage = error instanceof Error ? error.message : '식단 생성에 실패했습니다.'

        return NextResponse.json(
            {
                error: errorMessage,
                details: error instanceof Error ? error.stack : undefined,
                success: false
            },
            { status: 500 }
        )
    }
}
