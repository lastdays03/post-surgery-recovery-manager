import { NextRequest, NextResponse } from 'next/server'
import { generateDailyMeals, type MealGenerationRequest } from '@/lib/ai/meal-ai'
import { saveMealPlan } from '@/lib/services/meal-service'
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

        const meals = await generateDailyMeals(body)

        // 로컬 스토리지에 저장 (클라이언트에서 처리)
        // 서버에서는 생성된 식단만 반환
        const today = new Date().toISOString().split('T')[0]

        return NextResponse.json({
            success: true,
            meals,
            mealPlan: {
                user_id: body.userId,
                date: today,
                recovery_phase: body.recoveryPhase,
                meals,
                preferences: body.preferences
            },
            message: '식단이 성공적으로 생성되었습니다.'
        })
    } catch (error) {
        console.error('식단 생성 API 오류:', error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : '식단 생성에 실패했습니다.',
                success: false
            },
            { status: 500 }
        )
    }
}
