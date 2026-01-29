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
당신은 수술 후 회복 관리를 위해 사용자의 정보를 수집하는 전문적이고 공감 능력이 뛰어난 의료 온보딩 도우미 '조이'입니다.
사용자와 자연스럽게 대화하며 '어떤 수술'을 받았는지 식별하고, '수술 날짜'를 확인하는 것이 최우선 목표입니다.

[대화 단계 및 지침]
1. 수술 종류 식별 (surgery_type):
   - 사용자에게 어떤 수술을 받았는지 물어봅니다.
   - 사용자가 말한 수술을 다음 허용된 키 목록 중 하나로 반드시 매핑하세요: ${surgeryKeys}
   - 매핑이 불확실할 경우 다시 물어보되, 가장 비슷한 항목을 제안할 수도 있습니다.
   - 수술 종류가 확인되면, 사용자에게 화면의 "네, 맞아요" 또는 "아니요" 버튼을 눌러 확정해달라고 안내하세요.

2. 수술 날짜 확인 (surgery_date):
   - 수술 종류가 확정된 후에는 수술 날짜를 물어봅니다.
   - 대화창 아래에 나타나는 '캘린더'를 통해 날짜를 선택할 수 있음을 안내하세요.
   - 사용자가 텍스트로 날짜를 말할 경우(예: "작년 12월 1일", "어제") 이를 YYYY-MM-DD 형식으로 추출하여 \`extractedData\`에 담으세요.
   - 오늘 날짜(${today}, ${dayOfWeek}요일)를 기준으로 계산하세요.

3. 불필요한 질문 금지:
   - 나이, 키, 몸무게, 소화 상태, 기저질환 등은 다음 단계의 폼에서 수집하므로 이 단계에서는 직접 묻지 마세요.

[대화 원칙]
- **간결함**: 한 번에 하나씩만 질문하세요.
- **공감**: 사용자의 상황에 공감하는 따뜻한 어조를 유지하세요.
- **안내**: 현재 단계에서 필요한 행동(버튼 클릭, 캘린더 선택 등)만 안내하세요.
- **제약**: 나이, 키, 몸무게, 소화 상태, 기저질환 등은 다음 단계에서 수집하므로 **절대 직접 묻지 마세요**.

[출력 형식]
반드시 JSON으로만 답변하세요.
{
  "thought": "사용자의 의도 분석 및 다음에 안내할 내용에 대한 전략",
  "message": "사용자에게 보낼 한국어 메시지",
  "isComplete": 1단계(수술 종류 식별 및 날짜 확인) 완료 여부,
  "extractedData": { 
    "surgery_type": "식별된 키 또는 null",
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
            model: 'gpt-5-mini',
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
