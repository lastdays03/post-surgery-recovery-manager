import { NextRequest, NextResponse } from 'next/server'
import { generateDailyMeals, type MealGenerationRequest } from '@/lib/ai/meal-ai'

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
        const meals = await generateDailyMeals(body)

        return NextResponse.json({
            success: true,
            meals,
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
