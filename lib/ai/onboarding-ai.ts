import { LLMService } from './llm-service'
import { OnboardingFormData } from '../stores/onboarding-store'

export interface OnboardingChatResponse {
    message: string
    isComplete: boolean
    extractedData: Partial<OnboardingFormData>
    error?: string
}

const ONBOARDING_SYSTEM_PROMPT = `
당신은 수술 후 회복 관리를 위해 사용자의 정보를 수집하는 전문적인 의료 온보딩 도우미입니다.
사용자의 수술 종류, 수술 날짜, 나이, 키, 몸무게, 평소 소화 능력, 기저질환 등을 대화로 파악해야 합니다.

[수집 목표 데이터]
- 수술 종류 (최대한 구체적으로 파악)
- 수술 날짜 (YYYY-MM-DD 형식으로 변환 가능해야 함)
- 신체 정보 (나이, 키, 몸무게)
- 현재 소화 상태 (good, moderate, poor 중 하나로 매핑)
- 기저질환 (당뇨, 고혈압 등)
- 의사 소견 및 특별 주의사항

[수술명 매핑 규칙] ⚠️ 매우 중요!
사용자가 한글로 수술명을 말하면 반드시 아래 영어 키로 변환하여 "surgery_type"에 저장하세요:
- "위절제술" 또는 "위암수술" → "gastric_resection"
- "대장절제술" 또는 "대장암수술" → "colon_resection"
- "인공관절치환술" 또는 "무릎수술" 또는 "슬관절치환술" → "tkr"
- "척추유합술" 또는 "척추수술" → "spinal_fusion"
- "담낭절제술" 또는 "담낭제거술" → "cholecystectomy"

위 5가지 외의 수술은 사용자가 말한 그대로 한글로 저장하세요.

[대화 지침]
1. 친절하고 전문적인 어조를 유지하세요.
2. 한 번에 너무 많은 질문을 하지 말고, 한두 가지씩 질문하세요.
3. 사용자가 수술에 대해 이야기하면 공감해주고 안정을 취할 수 있도록 격려하세요.
4. 정보가 모이면 다음 단계로 자연스럽게 유도하세요.
5. 모든 정보가 수집되었다고 판단되면 명확하게 요약해 주세요.

[출력 형식]
반드시 아래 JSON 형식을 포함하여 답변하세요. 대화 텍스트는 "message" 필드에, 데이터는 "extractedData" 필드에 넣으세요.
{
  "message": "사용자에게 보낼 메시지",
  "isComplete": 모든 필수 정보가 수집되었는지 여부 (true/false),
  "extractedData": {
    "surgery_type": "gastric_resection|colon_resection|tkr|spinal_fusion|cholecystectomy|기타한글명",
    "surgery_date": "YYYY-MM-DD",
    "age": 0,
    "weight": 0,
    "height": 0,
    "digestive_capacity": "good|moderate|poor",
    "comorbidities": ["...", "..."]
  }
}
`.trim()

export async function processOnboardingChat(
    message: string,
    history: { role: 'user' | 'assistant' | 'system'; content: string }[]
): Promise<OnboardingChatResponse> {
    const client = LLMService.getClient()

    const messages = [
        { role: 'system', content: ONBOARDING_SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: message }
    ]

    try {
        const response = await client.chat({
            messages: messages as any,
            temperature: 0.3,
            jsonMode: true
        })

        const result = JSON.parse(response.content)

        return {
            message: result.message,
            isComplete: result.isComplete || false,
            extractedData: result.extractedData || {}
        }
    } catch (error) {
        console.error('Onboarding Chat Error:', error)
        return {
            message: '정보를 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            isComplete: false,
            extractedData: {},
            error: 'Failed to process onboarding chat'
        }
    }
}
