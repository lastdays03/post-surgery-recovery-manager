import type { AdvancedMetrics } from '@/lib/actions/profile-actions'
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
    advancedMetrics?: AdvancedMetrics
    reasoningEffort?: 'low' | 'medium' | 'high'
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
 * LLM 응답에서 JSON 문자열만 추출 (마크다운 코드 블록 제거)
 */
function cleanJsonOutput(content: string): string {
    let jsonContent = content.trim()
    // ```json ... ``` or ``` ... ``` cleanup
    if (jsonContent.startsWith('```')) {
        const match = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (match) {
            jsonContent = match[1].trim()
        }
    }
    return jsonContent
}
// ------------------------------------------------------------------
// Helper Functions for Common Prompts
// ------------------------------------------------------------------

function getRolePrompt(): string {
    return `<role>
당신은 수술 후 회복 환자를 위한 전문 영양사 AI입니다.
환자의 회복 단계와 개인 선호도를 고려하여 하루 식단(아침, 점심, 저녁, 간식 2개)을 제안하거나 수정합니다.
</role>`
}

function getGuidelinesPrompt(phase: string, guidelines: any): string {
    return `<clinical_guidelines>
- 현재 회복 단계: ${phase} (${guidelines.description})
- 허용 음식: ${guidelines.allowed.join(', ')}
- 금기 음식: ${guidelines.forbidden.join(', ')}
- 음식 질감: ${guidelines.texture}
- 주의사항: ${guidelines.notes}
</clinical_guidelines>`
}

function getLanguageRulesPrompt(): string {
    return `<language_rules>
1. **Primary Language**: All values and descriptions MUST be in **Korean (Hangul)**.
2. **Forbidden**: Do NOT use Japanese (Hiragana, Katakana, Kanji) or Chinese characters.
3. **Consistency**: Even if the input contains other languages, translate and output in Korean.
</language_rules>`
}

/**
 * LLM을 사용하여 개인 맞춤형 식단 생성
 */
export async function generateDailyMeals(request: MealGenerationRequest): Promise<Meal[]> {
    const llm = LLMService.getClient()
    const guidelines = RECOVERY_PHASE_GUIDELINES[request.recoveryPhase]

    // 프롬프트 구성
    // 프롬프트 구성
    const espenSummary = `
<espen_summary_for_prompt>
[Global Rules]
- 가능한 한 빠르게 경구 섭취를 시작한다(특별한 금기 없으면 중단하지 않는다).
- 영양 공급을 하지 않으면 저영양 및 합병증 위험이 증가한다.
- 모든 수술 환자는 수술 전·후 영양 상태 평가가 필요하다.
- ERAS 개념에 따라 영양, 혈당 조절, 조기 활동, 근육 보존을 통합 고려한다.

[When to Start Oral Intake]
- 대부분 환자는 수술 직후 수시간 이내에 맑은 음료 섭취가 가능하다.
- 식사량/식단 형태는 수술 종류, 위장관 기능 회복, 개인 내성에 맞춰 조절한다.

[Diet Progression]
- 맑은 유동식 → 부드러운 연식 → 일반식으로 점진 전환한다.
- 위·대장 수술 환자도 조기 식사 시작이 봉합부 합병증을 증가시키지 않는다.

[Nutrition Risk Criteria (if any is true → at risk)]
- 최근 6개월 내 체중 10~15% 이상 감소
- BMI 18.5 미만
- NRS-2002 점수 3 이상(특히 5 이상은 고위험)
- 혈청 알부민 30 g/L 미만
- 근감소증 동반
→ 영양 위험군이면 더 적극적 영양 개입 및 단백질 강화 우선.

[Route Selection Logic]
- 경구 섭취 가능 + 필요 열량의 50% 이상 섭취 가능 → 일반식/고단백 식단 + 필요 시 ONS 고려
- 7일 이상 필요량의 50% 미만 섭취 예상 → 경장영양(EN) 고려
- EN 불가(장폐색/장허혈/중증 쇼크 등) → 정맥영양(PN) 즉시 고려

[Protein & Key Nutrients]
- 수술 후 단백질 요구량 증가: 고령자/암/근손실 환자는 고단백 우선.
- 암 수술 + 저영양이면 면역영양식(아르기닌, 오메가3, 뉴클레오타이드 포함) 고려(수술 전·후 연속 사용 시 효과 증가).

[Contraindications & Cautions]
- 심한 당뇨 또는 위배출 지연 환자: 탄수화물 음료 사용을 피한다.
- 심각한 저영양에서 PN 시작 시: 재급식 증후군 예방(단계적 증량, 인·칼륨·마그네슘 모니터/보충, 티아민 보충 고려).

[Monitoring Triggers]
- 섭취율(%), 체중 변화, 위장관 증상(복부 팽만/구토/설사), 감염·합병증 발생
→ 악화 시 식단 단계 또는 영양 경로를 재설정한다.
</espen_summary_for_prompt>`

    const systemPrompt = `
<role>
당신은 수술 후 회복 환자를 위한 전문 임상영양사 AI입니다.
환자의 회복 단계, 위장관 기능, 영양 위험도, 개인 선호도를 통합해 하루 식단(아침, 점심, 저녁, 간식 2개)을 제안합니다.
ERAS 관점(조기 경구섭취, 혈당 관리, 조기 활동, 근육 보존)을 반영합니다.
</role>

${espenSummary}

${getGuidelinesPrompt(request.recoveryPhase, guidelines)}

<instructions>
1. **JSON Key Constraint**: All keys in the JSON object MUST be in **ENGLISH**. NOT Korean.
2. **Value Language**: All property values MUST be in **Korean (Hangul)** only.
3. **Format**: Return ONLY a pure JSON ID Array. Do NOT wrap it in a root object.
4. **Safety**: Do not use forbidden ingredients. Ensure texture matches the current phase.
5. **Menu Practicality**: Meals must be realistic, easy to prepare, and appropriate for early post-op tolerance.
6. **Phase Compliance**: If the phase is liquid, do not include items requiring chewing or containing pulp/fibrous solids; specify straining/blending when needed.
7. **Nutrition Fields**: Provide estimated nutrition per item (calories, protein, carbs, fat). Keep estimates plausible.
8. **Notes**: Include brief tolerance/monitoring notes aligned with ESPEN triggers (섭취율, 체중, 위장관 증상) and any key cautions when relevant.
</instructions>

${getLanguageRulesPrompt()}

<output_format>
Must be a valid JSON Object with a single key "meals" containing the array.

Example:
{
  "meals": [
    {
      "id": "generated-id-1",
      "name": "소고기 야채죽",
      "mealTime": "breakfast",
      "phase": "${request.recoveryPhase}",
      "ingredients": ["다진 소고기", "당근", "쌀"],
      "instructions": ["쌀을 불린다", "소고기를 볶는다", "물 넣고 끓인다"],
      "prepTime": 20,
      "portionSize": "1그릇",
      "nutrition": {
        "calories": 300,
        "protein": 15,
        "carbs": 40,
        "fat": 5
      },
      "notes": "따뜻하게 드세요."
    }
  ]
}

Required keys per element:
- id (string)
- name (string)
- mealTime (one of: breakfast, lunch, dinner, snack1, snack2)
- phase (string, MUST be "${request.recoveryPhase}")
- ingredients (array of strings)
- instructions (array of strings)
- prepTime (number; minutes)
- portionSize (string)
- nutrition (object: calories, protein, carbs, fat as numbers)
- notes (string)
</output_format>
`

    // Advanced Metrics 포맷팅
    let advancedMetricsText = '';
    if (request.advancedMetrics) {
        const am = request.advancedMetrics;
        const parts = [];
        if (am.nrs_2002_score !== undefined) parts.push(`- NRS-2002 Score: ${am.nrs_2002_score} (3점이상은 영양불량 위험)`);
        if (am.serum_albumin !== undefined) parts.push(`- 혈청 알부민: ${am.serum_albumin} g/dL`);
        if (am.has_sarcopenia !== undefined) parts.push(`- 근감소증 여부: ${am.has_sarcopenia ? '있음' : '없음'}`);
        if (am.sga_grade) parts.push(`- SGA 등급: ${am.sga_grade}`);
        if (am.oral_intake_possible !== undefined) parts.push(`- 경구 섭취 가능: ${am.oral_intake_possible ? '예' : '아니오'}`);

        if (parts.length > 0) {
            advancedMetricsText = `\n<advanced_metrics>\n${parts.join('\n')}\n</advanced_metrics>`;
        }
    }

    const userPrompt = `
<patient_info>
- 수술 종류: ${request.surgeryType || '위 절제술'}
- 회복 단계: ${request.recoveryPhase}
${request.preferences?.favoriteFood?.length ? `- 선호 음식: ${request.preferences.favoriteFood.join(', ')}\n` : ''}${request.preferences?.avoidIngredients?.length ? `- 기피 재료: ${request.preferences.avoidIngredients.join(', ')}\n` : ''}${request.preferences?.availableIngredients?.length ? `- 보유 식재료: ${request.preferences.availableIngredients.join(', ')}\n` : ''}${request.dietaryRestrictions?.length ? `- 식이 제한: ${request.dietaryRestrictions.join(', ')}\n` : ''}${advancedMetricsText}
</patient_info>

Generate 5 meals (Breakfast, Lunch, Dinner, 2 Snacks) and wrap them in a JSON Object with a single key "meals".
Use English Keys for JSON structure.
`

    try {
        const response = await llm.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            maxTokens: 12000,
            jsonMode: true,
            responseFormat: { type: 'json_object' },
            reasoningEffort: request.reasoningEffort || 'medium'
        })

        // 🔍 디버깅: 실제 응답 로깅
        console.log('🔍 LLM 응답 원본:', response.content)

        if (!response.content || !response.content.trim()) {
            console.error('❌ LLM 응답이 비어있습니다. Usage:', response.usage)
            throw new Error('AI 모델이 응답을 생성하지 못했습니다. (빈 응답)')
        }

        // JSON 파싱 시도
        let meals: Meal[]
        try {
            const jsonContent = cleanJsonOutput(response.content)

            let parsed: any;
            try {
                parsed = JSON.parse(jsonContent)
            } catch (initialError) {
                // If simple parse fails, try to wrap if it looks like content
                if (jsonContent.trim().startsWith('{')) {
                    throw initialError;
                }
                // Fallback attempt (unlikely necessary with json_object mode but safe to keep)
                try {
                    const wrappedContent = `{ "meals": ${jsonContent} }`;
                    parsed = JSON.parse(wrappedContent);
                } catch {
                    throw initialError;
                }
            }

            let arrayData: any[] = []

            if (parsed.meals && Array.isArray(parsed.meals)) {
                arrayData = parsed.meals;
            } else if (Array.isArray(parsed)) {
                // Fallback if LLM returning array directly despite instructions
                arrayData = parsed;
            } else {
                // Try to find any array property
                const potentialKeys = ['data', 'recommendations', 'plans', 'schedule'];
                for (const key of potentialKeys) {
                    if (Array.isArray(parsed[key])) {
                        arrayData = parsed[key];
                        break;
                    }
                }
                if (arrayData.length === 0) {
                    // Last resort: invalid structure
                    console.warn('⚠️ Could not find "meals" array in response. Structure:', parsed);
                }
            }

            // 유효한 식단 객체만 필터링 (메타데이터 제거)
            meals = arrayData.filter((item: any) =>
                item &&
                typeof item === 'object' &&
                !Array.isArray(item) &&
                (item.name || item.mealTime)
            ) as Meal[]
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

            // mealTime 한글 -> 영어 매핑 정규화
            if (meal.mealTime) {
                const timeMap: Record<string, string> = {
                    '아침': 'breakfast',
                    '점심': 'lunch',
                    '저녁': 'dinner',
                    '간식': 'snack',
                    '간식1': 'snack',
                    '간식2': 'snack',
                    'snack1': 'snack',
                    'snack2': 'snack'
                };
                // 이미 영어인 경우는 그대로 두고, 한글인 경우 매핑
                if (timeMap[meal.mealTime]) {
                    meal.mealTime = timeMap[meal.mealTime] as any;
                }
            }

            // name 필드 안정화 (LLM이 다른 키를 사용할 경우 대비)
            if (!meal.name) {
                const nameCandidates = ['menu', 'title', 'dish', 'food', 'menuName', '식사명', '메뉴', '이름'];
                for (const key of nameCandidates) {
                    if ((meal as any)[key]) {
                        meal.name = (meal as any)[key];
                        break;
                    }
                }
                // 여전히 없으면 기본값
                if (!meal.name) {
                    meal.name = 'AI 추천 식단';
                }
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
export async function modifyMealsWithChat(
    request: MealChatRequest
): Promise<{
    updatedMeals: Meal[]
    reply: string
}> {
    const llm = LLMService.getClient()

    // 복구 단계 찾기 (현재 식단 중 하나에서 유추하거나, 요청에 포함되어 있다면 좋겠지만 여기선 기본 로직 사용)
    // request.currentMeals의 첫 번째 항목에서 phase를 가져오거나 없으면 기본값 liquid로 가정 (안전을 위해)
    // 하지만 generateDailyMeals에서 meal.phase가 저장되므로 그것을 참조
    const recoveryPhase = request.currentMeals[0]?.phase || 'liquid'
    // @ts-ignore - dynamic access to guidelines based on string key that usually matches
    const guidelines = RECOVERY_PHASE_GUIDELINES[recoveryPhase] || RECOVERY_PHASE_GUIDELINES['liquid']

    const systemPrompt = `
${getRolePrompt()}

<context>
환자의 요청에 따라 현재 식단을 수정하거나 질문에 답변합니다.
환자는 현재 "${recoveryPhase}" 회복 단계입니다.
</context>

${getGuidelinesPrompt(recoveryPhase, guidelines)}

<instructions>
1. Analyze the user's request: "${request.message}".
2. If the user wants to change a meal:
   - Update the "meals" array significantly if needed.
   - Ensure specific diet preferences (e.g. "no fish") are respected.
   - Keep the nutritional balance suitable for their recovery phase.
3. If the user just asks a question:
   - You may keep "updatedMeals" same as input or empty if no change needed (but better to return current).
   - Provide a helpful "reply".
4. "reply" should be polite, professionally encouraging, and explain the change/answer.
</instructions>

${getLanguageRulesPrompt()}

<current_meals>
${JSON.stringify(request.currentMeals, null, 2)}
</current_meals>

<output_format>
Must be a valid JSON Object with this schema:
{
  "updatedMeals": [ ... array of Meal objects ... ],
  "reply": "String message to the user"
}
IMPORTANT: Return ONLY JSON. No markdown fencing.
</output_format>
`

    const conversationMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...(request.conversationHistory || []),
        { role: 'user' as const, content: request.message }
    ]

    try {
        const response = await llm.chat({
            messages: conversationMessages,
            temperature: 0.7,
            maxTokens: 8192,
            jsonMode: true,
            responseFormat: { type: 'json_object' },
            reasoningEffort: 'medium'
        })

        // JSON 파싱 전처리 (Markdown 제거)
        const jsonContent = cleanJsonOutput(response.content)

        let result: any
        try {
            result = JSON.parse(jsonContent)
        } catch (initialError) {
            // If simple parse fails, try to wrap if it looks like content
            if (jsonContent.trim().startsWith('{')) {
                throw initialError;
            }
            // Fallback attempt
            try {
                // If LLM returned raw content without brackets (unlikely with json_object but possible)
                // or if it failed mid-stream? Unlikely with json_object. 
                // Just try standard fix just in case
                const wrappedContent = `{ "updatedMeals": [], "reply": "오류가 발생했습니다." }`;
                // This is not a real fix for syntax error, but let's assume valid JSON structure was intended.
                // Retrowing implies we handle it in catch block below.
                throw initialError;
            } catch {
                throw initialError;
            }
        }

        return {
            updatedMeals: Array.isArray(result.updatedMeals) ? result.updatedMeals : request.currentMeals,
            reply: result.reply || '식단을 수정했습니다.'
        }
    } catch (error) {
        console.error('❌ 식단 수정 오류:', error)
        if (error instanceof Error) {
            throw new Error(`식단 수정 실패 (JSON 파싱 등): ${error.message}`)
        }
        throw new Error('식단 수정에 실패했습니다. 다시 시도해주세요.')
    }
}
