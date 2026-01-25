import { NextRequest, NextResponse } from 'next/server'
import { modifyMealsWithChat, type MealChatRequest } from '@/lib/ai/meal-ai'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as MealChatRequest

        // 필수 필드 검증
        if (!body.userId || !body.currentMeals || !body.message) {
            return NextResponse.json(
                { error: '필수 정보가 누락되었습니다.' },
                { status: 400 }
            )
        }

        // 대화 횟수 제한 (최대 5회)
        if (body.conversationHistory && body.conversationHistory.length > 10) {
            return NextResponse.json(
                { error: '대화 횟수가 초과되었습니다. 새로운 식단을 생성해주세요.' },
                { status: 400 }
            )
        }

        // 식단 수정
        const result = await modifyMealsWithChat(body)

        return NextResponse.json({
            success: true,
            ...result
        })
    } catch (error) {
        console.error('식단 수정 API 오류:', error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : '식단 수정에 실패했습니다.',
                success: false
            },
            { status: 500 }
        )
    }
}
