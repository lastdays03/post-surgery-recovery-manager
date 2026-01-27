import { LLMService } from './llm-service';
import { SURGERY_PROTOCOLS } from '../../data/protocols/surgery-protocols';
import { SurgeryType } from '@/lib/types/protocol.types';

/**
 * 사용자의 자유 형식 수술 명칭을 시스템 표준 SurgeryType으로 매핑합니다.
 */
export async function mapSurgeryTypeWithAI(input: string): Promise<SurgeryType | null> {
    const client = LLMService.getClient();

    // 수술 목록 구성
    const surgeryOptions = Object.entries(SURGERY_PROTOCOLS).map(([key, protocol]) => {
        // 프로토콜의 첫 번째 단계 설명을 힌트로 사용하거나, 키 자체를 설명으로 활용
        const description = protocol.phases[0]?.description || key;
        return `- ${key}: ${description}`;
    }).join('\n');

    const prompt = `
당신은 의료 수술 명칭 매핑 전문가입니다.
사용자가 입력한 수술 명칭(한글 또는 영어)을 시스템에서 정의된 표준 수술 키(SurgeryType) 중 가장 적절한 것으로 매핑해야 합니다.

[표준 수술 키 목록]
${surgeryOptions}

[매핑 규칙]
1. 사용자의 입력과 가장 유사하거나 의학적으로 동일한 수술을 목록에서 찾으세요.
2. 매핑할 항목이 확실하지 않거나 목록에 전혀 없는 경우 "UNKNOWN"이라고 답변하세요.
3. 답변은 반드시 JSON 형식으로만 하세요.

[출력 형식]
{
  "suggested_type": "표준_키_이름 또는 UNKNOWN",
  "reason": "매핑 근거 (한국어)"
}

사용자 입력: "${input}"
`.trim();

    try {
        const response = await client.chat({
            messages: [
                { role: 'system', content: '당신은 의료 매핑 도우미입니다.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1, // 정확성을 위해 낮은 온도로 설정
            jsonMode: true
        });

        const result = JSON.parse(response.content);

        if (result.suggested_type === 'UNKNOWN') {
            return null;
        }

        // 결과가 실제 존재하는 키인지 확인
        if (Object.keys(SURGERY_PROTOCOLS).includes(result.suggested_type)) {
            return result.suggested_type as SurgeryType;
        }

        return null;
    } catch (error) {
        console.error('Surgery Type Mapping AI Error:', error);
        return null;
    }
}
