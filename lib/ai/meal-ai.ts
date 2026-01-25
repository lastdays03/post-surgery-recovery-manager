import { LLMService } from './llm-service'
import type { Meal } from '@/lib/types/meal.types'

/**
 * 식단 생성 요청 인터페이스
 */
export interface MealGenerationRequest {
    userId: string
    recoveryPhase: 'liquid' | 'soft' | 'regular'
    preferences?: {
        favoriteFood?: string[]
        avoidIngredients?: string[]
        availableIngredients?: string[]
    }
    dietaryRestrictions?: string[]
    surgeryType?: string
}

/**
 * 대화형 식단 수정 요청 인터페이스
 */
export interface MealChatRequest {
    userId: string
    currentMeals: Meal[]
    message: string
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

/**
 * 회복 단계별 임상 가이드라인
 */
const RECOVERY_PHASE_GUIDELINES = {
    liquid: {
        description: '유동식 단계 (수술 후 초기)',
        allowed: ['맑은 국물', '미음', '주스(과육 제거)', '젤리', '아이스크림(부드러운 것)', '물', '차'],
        forbidden: ['고형식', '딱딱한 음식', '섬유질 많은 채소', '견과류', '질긴 고기'],
        texture: '완전히 액체 상태이거나 매우 부드러운 반고체',
        notes: '씹지 않고 삼킬 수 있어야 함. 소화가 쉬워야 함.'
    },
    soft: {
        description: '연식 단계 (회복 중기)',
        allowed: ['죽', '으깬 감자', '두부', '계란찜', '부드러운 생선', '잘 익힌 채소(으깬 것)', '요거트', '푸딩'],
        forbidden: ['딱딱한 음식', '튀긴 음식', '질긴 고기', '생채소', '견과류', '거친 곡물'],
        texture: '포크로 쉽게 으깨지는 정도',
        notes: '최소한의 씹기만 필요. 부드럽고 소화가 잘 되어야 함.'
    },
    regular: {
        description: '일반식 단계 (회복 후기)',
        allowed: ['대부분의 음식', '부드러운 고기', '익힌 채소', '과일', '곡물', '유제품'],
        forbidden: ['매운 음식(초기)', '기름진 음식(초기)', '알코올', '카페인(과다)'],
        texture: '정상적인 질감',
        notes: '점진적으로 정상 식단으로 전환. 개인 소화 능력에 따라 조절.'
    }
}

/**
 * LLM을 사용하여 개인 맞춤형 식단 생성
 */
export async function generateDailyMeals(request: MealGenerationRequest): Promise<Meal[]> {
    const llm = LLMService.getClient()
    const guidelines = RECOVERY_PHASE_GUIDELINES[request.recoveryPhase]

    // 프롬프트 구성
    const systemPrompt = `당신은 수술 후 회복 환자를 위한 전문 영양사입니다.
환자의 회복 단계와 개인 선호도를 고려하여 하루 식단(아침, 점심, 저녁, 간식 2개)을 제안합니다.

**중요 규칙**:
1. 반드시 회복 단계별 임상 가이드라인을 준수해야 합니다.
2. 환자가 기피하는 재료는 절대 사용하지 않습니다.
3. 영양 균형을 고려하되, 소화가 쉬워야 합니다.
4. 각 식사는 현실적이고 실제로 만들 수 있는 메뉴여야 합니다.
5. **언어**: 모든 응답(음식명, 설명, 조리법 등)은 반드시 **한국어(Korean)**로 작성해야 합니다.

**현재 회복 단계**: ${request.recoveryPhase} (${guidelines.description})
**허용 음식**: ${guidelines.allowed.join(', ')}
**금기 음식**: ${guidelines.forbidden.join(', ')}
**음식 질감**: ${guidelines.texture}
**주의사항**: ${guidelines.notes}

**중요**: 응답은 반드시 JSON 배열 형식이어야 합니다. 객체가 아닌 배열로 반환해주세요!

응답 형식 (배열):
[
  {
    "id": "unique-id",
    "name": "식사 이름",
    "mealTime": "breakfast" | "lunch" | "dinner" | "snack",
    "phase": "${request.recoveryPhase}",
    "ingredients": ["재료1", "재료2"],
    "instructions": ["조리 단계1", "조리 단계2"],
    "prepTime": 조리시간(분),
    "portionSize": "1인분",
    "nutrition": {
      "calories": 숫자,
      "protein": 숫자,
      "carbs": 숫자,
      "fat": 숫자
    },
    "notes": "조리 팁 또는 주의사항"
  }
]`

    const userPrompt = `다음 정보를 바탕으로 오늘의 식단을 생성해주세요:

**환자 정보**:
- 수술 종류: ${request.surgeryType || '일반 수술'}
- 회복 단계: ${request.recoveryPhase}

${request.preferences?.favoriteFood?.length ? `**선호 음식**: ${request.preferences.favoriteFood.join(', ')}` : ''}
${request.preferences?.avoidIngredients?.length ? `**기피 재료**: ${request.preferences.avoidIngredients.join(', ')}` : ''}
${request.preferences?.availableIngredients?.length ? `**보유 식재료**: ${request.preferences.availableIngredients.join(', ')}` : ''}
${request.dietaryRestrictions?.length ? `**식이 제한**: ${request.dietaryRestrictions.join(', ')}` : ''}

아침, 점심, 저녁, 간식 2개를 포함한 총 5개의 식사를 JSON 배열로 생성해주세요.
반드시 배열 형식 [...] 으로 반환해야 합니다!
모든 텍스트는 **한국어**로 작성해주세요.
`

    try {
        const response = await llm.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            maxTokens: 2048,
            jsonMode: true
        })

        // 🔍 디버깅: 실제 응답 로깅
        console.log('🔍 LLM 응답 원본:', response.content)

        // JSON 파싱 시도
        let meals: Meal[]
        try {
            // 응답이 마크다운 코드 블록으로 감싸져 있을 수 있음
            let jsonContent = response.content.trim()

            // ```json ... ``` 형식 제거
            if (jsonContent.startsWith('```')) {
                const match = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
                if (match) {
                    jsonContent = match[1].trim()
                }
            }

            const parsed = JSON.parse(jsonContent)

            // 🔥 객체 형식인 경우 배열로 변환
            if (!Array.isArray(parsed)) {
                console.warn('⚠️ LLM이 객체 형식으로 반환했습니다. 배열로 변환합니다.')
                meals = Object.values(parsed) as Meal[]
            } else {
                meals = parsed as Meal[]
            }
        } catch (parseError) {
            console.error('❌ JSON 파싱 실패:', parseError)
            console.error('응답 내용:', response.content)
            throw new Error(`JSON 파싱 실패: ${parseError instanceof Error ? parseError.message : '알 수 없는 오류'}`)
        }

        // 기본 검증
        if (!Array.isArray(meals) || meals.length === 0) {
            console.error('❌ 생성된 데이터가 배열이 아니거나 비어있음:', meals)
            throw new Error('생성된 식단이 올바른 형식이 아닙니다.')
        }

        // 각 식사에 고유 ID 및 필수 필드 부여
        meals.forEach((meal, index) => {
            if (!meal.id) {
                meal.id = `${request.userId}-${Date.now()}-${index}`
            }

            // 필수 필드 기본값 설정
            if (!meal.nutrition) {
                meal.nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 }
                console.warn(`⚠️ ${meal.name}: nutrition 필드 누락, 기본값 설정`)
            }
            if (!meal.ingredients) {
                meal.ingredients = []
                console.warn(`⚠️ ${meal.name}: ingredients 필드 누락, 빈 배열 설정`)
            }
            if (!meal.instructions) {
                meal.instructions = []
                console.warn(`⚠️ ${meal.name}: instructions 필드 누락, 빈 배열 설정`)
            }
            if (!meal.prepTime) {
                meal.prepTime = 15
            }
            if (!meal.portionSize) {
                meal.portionSize = '1인분'
            }
        })

        // 금기 재료 검증
        const forbiddenIngredients = guidelines.forbidden
        meals.forEach(meal => {
            const hasForbidden = meal.ingredients?.some(ingredient =>
                forbiddenIngredients.some(forbidden =>
                    ingredient.toLowerCase().includes(forbidden.toLowerCase())
                )
            )
            if (hasForbidden) {
                console.warn(`⚠️ 경고: ${meal.name}에 금기 재료가 포함되어 있을 수 있습니다.`)
            }
        })

        console.log(`✅ 식단 생성 성공: ${meals.length}개 식사`)
        return meals
    } catch (error) {
        console.error('❌ 식단 생성 오류:', error)

        // 더 자세한 에러 메시지
        if (error instanceof Error) {
            throw new Error(`식단 생성 실패: ${error.message}`)
        }
        throw new Error('식단 생성에 실패했습니다. 다시 시도해주세요.')
    }
}

/**
 * 대화를 통한 식단 수정
 */
export async function modifyMealsWithChat(request: MealChatRequest): Promise<{
    updatedMeals: Meal[]
    reply: string
}> {
    const llm = LLMService.getClient()

    const systemPrompt = `당신은 수술 후 회복 환자의 식단을 관리하는 AI 영양사입니다.
환자의 요청에 따라 현재 식단을 수정합니다.

**수정 규칙**:
1. 환자의 요청을 정확히 이해하고 반영합니다.
2. 회복 단계에 맞는 음식으로만 대체합니다.
3. 영양 균형을 유지합니다.
4. 수정 이유를 친절하게 설명합니다.
5. 모든 응답은 **한국어**로 작성합니다.

**현재 식단**:
${JSON.stringify(request.currentMeals, null, 2)}

응답은 다음 JSON 형식을 따라야 합니다:
{
  "updatedMeals": [...수정된 식단 배열...],
  "reply": "수정 내용에 대한 설명"
}`

    const conversationMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...(request.conversationHistory || []),
        { role: 'user' as const, content: request.message }
    ]

    try {
        const response = await llm.chat({
            messages: conversationMessages,
            temperature: 0.7,
            maxTokens: 2048,
            jsonMode: true
        })

        const result = JSON.parse(response.content)

        return {
            updatedMeals: result.updatedMeals || request.currentMeals,
            reply: result.reply || '식단을 수정했습니다.'
        }
    } catch (error) {
        console.error('식단 수정 오류:', error)
        throw new Error('식단 수정에 실패했습니다. 다시 시도해주세요.')
    }
}
