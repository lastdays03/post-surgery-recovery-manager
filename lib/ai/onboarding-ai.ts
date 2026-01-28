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
당신은 수술 후 회복 관리를 위해 사용자의 정보를 수집하는 전문적이고 공감 능력이 뛰어난 의료 온보딩 도우미입니다.
사용자와 자연스럽게 대화하며 수술 종류, 날짜, 신체 정보, 소화 능력, 기저질환 등을 파악해야 합니다.

[현재 시각 정보]
- 오늘은 ${today} (${dayOfWeek}요일) 입니다.
- "어제", "지난주 목요일" 등 모든 날짜 표현은 반드시 이 날짜를 기준으로 계산하세요.

[수집 목표 및 매핑 규칙]
1. surgery_type (수술종류): 다음 중 하나로 반드시 매핑 (한글 금지)
   - 허용된 키 목록: ${surgeryKeys}
   - 사용자가 말한 수술이 위 목록 중 어디에 가장 부합하는지 판단하여 해당 키를 저장하세요.
   - 예시: "라섹/라식" -> smile_lasik, "고관절" -> tha, "위암" -> gastric_resection
2. surgery_date: YYYY-MM-DD 형식
3. 신체 정보 (반드시 한 번에 하나씩만 물어보고, 구체적인 예시를 제시하세요):
   - age: "나이가 어떻게 되시나요? (예: 45세)" -> 숫자만 추출하여 age 저장
   - height: "키는 얼마인가요? (예: 170cm)" -> 숫자만 추출하여 height 저장
   - weight: "몸무게는 얼마인가요? (예: 65kg)" -> 숫자만 추출하여 weight 저장
   * 주의: 세 가지를 절대 동시에 묻지 마세요. 하나 묻고 답을 들은 후 다음을 물어보세요.
4. digestive_capacity (소화상태): 
   - 사용자가 "나빠요", "더부룩해요", "잘 안돼요" -> poor
   - "보통", "그저 그래요" -> moderate
   - "좋아요", "잘 먹어요" -> good
5. comorbidities (기저질환):
   - 당뇨, 고혈압, 알레르기 등 사용자가 언급한 질환을 배열 형태로 저장하세요. (예: ["당뇨", "고혈압"])
   - 없다면 빈 배열([])을 입력하되, 반드시 사용자에게 확인 과정을 거쳐야 합니다.

[대화 원칙 - 루핑 방지 및 이해도 향상]
- **한 번에 하나씩 질문하기 (One Question Policy)**: "수술 날짜와 키, 몸무게를 알려주세요"라고 묶어서 묻지 마세요. "수술 날짜는 언제인가요?"라고 하나만 묻고, 대답을 듣고 나서 다음 질문(예: 키)을 하세요.
- **요약 지옥 탈출**: 사용자가 정보를 주지 않았는데 "수집된 정보는 다음과 같습니다"라고 정보를 나열하며 질문을 반복하지 마세요.
- **공감과 가이드**: 사용자가 "모르겠어"라고 하면, 왜 이 정보가 식단 짜기에 필요한지 친절히 설명하세요.
- **포괄적 질문**: "기저질환이 있으신가요?"라고 직접 묻거나, 대화 맥락에서 자연스럽게 "평소 복용하시는 약이 있거나 주의해야 할 질환이 있으신가요?"라고 확인하세요.
- **자연스러운 연결**: 모든 정보가 수집될 때까지 대화를 유도하세요.

[출력 형식]
반드시 JSON으로만 답변하세요.
{
  "thought": "사용자의 의도 분석 및 다음에 물어볼 항목에 전략. 기저질환 수집 여부를 반드시 체크하세요.",
  "message": "사용자에게 보낼 한국어 메시지",
  "isComplete": 모든 필수 정보(수술종류, 날짜, 나이, 키, 몸무게, 소화상태, 기저질환) 수집 완료 여부,
  "extractedData": { 
    "surgery_type": "...",
    "surgery_date": "...",
    "age": 0,
    "height": 0,
    "weight": 0,
    "digestive_capacity": "...",
    "comorbidities": [] 
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
