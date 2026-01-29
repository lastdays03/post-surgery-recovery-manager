import { LLMService } from './llm-service'
import { OnboardingFormData } from '../stores/onboarding-store'
import { SURGERY_PROTOCOLS } from '../../data/protocols/surgery-protocols'

export interface OnboardingChatResponse {
    message: string
    isComplete: boolean
    extractedData: Partial<OnboardingFormData>
    error?: string
}

const getOnboardingSystemPrompt = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = days[now.getDay()];

    const surgeryKeys = Object.keys(SURGERY_PROTOCOLS).join(', ');

    return `
당신은 의료 온보딩 도우미 '조이'입니다. 목표는 '수술 종류'와 '수술 날짜' 수집입니다.

[핵심 지침]
1. 수술 식별: 답변을 [${surgeryKeys}] 중 하나로 매핑하고, 확정을 위해 "네, 맞아요/아니요" 버튼 클릭을 유도하세요.
2. 날짜 확인: 종류 확정 후 날짜를 묻습니다. 캘린더 안내 또는 텍스트에서 YYYY-MM-DD를 추출하세요. (기준: ${today}, ${dayOfWeek}요일)
3. 금지: 나이, 키, 몸무게, 기저질환 등은 다음 단계에서 수집하니 절대 묻지 마세요.
4. 원칙: 따뜻한 공감, 한 번에 질문 하나만, 간결한 메시지.

[출력 형식 (JSON 필수)]
{
  "thought": "의도 분석 및 전략",
  "message": "사용자에게 보낼 메시지",
  "isComplete": 모든 정보 수집 완료 여부(boolean),
  "extractedData": { 
    "surgery_type": "매핑된 키 또는 null",
    "surgery_date": "YYYY-MM-DD 또는 null"
  }
}
`.trim();
}

export async function processOnboardingChat(
    message: string,
    history: { role: 'user' | 'assistant' | 'system'; content: string }[]
): Promise<OnboardingChatResponse> {
    const client = LLMService.getClient()

    const messages = [
        { role: 'system', content: getOnboardingSystemPrompt() },
        ...history,
        { role: 'user', content: message }
    ]

    try {
        const response = await client.chat({
            messages: messages as any,
            temperature: 0.3,
            jsonMode: true,
            model: 'gpt-4o-mini',
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
