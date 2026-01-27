import { describe, it, expect, vi } from 'vitest'
import { processOnboardingChat } from '@/lib/ai/onboarding-ai'
import { LLMService } from '@/lib/ai/llm-service'

// LLMService 모킹
vi.mock('@/lib/ai/llm-service', () => ({
    LLMService: {
        getClient: vi.fn()
    }
}))

describe('processOnboardingChat', () => {
    it('한국어 소화 상태("나쁨")를 "poor"로 올바르게 매핑해야 함', async () => {
        const mockChatResponse = {
            content: JSON.stringify({
                thought: '사용자가 소화 능력이 나쁘다고 함.',
                message: '소화가 잘 안 되시는군요. 기저질환이 있으신가요?',
                isComplete: false,
                extractedData: {
                    digestive_capacity: 'poor'
                }
            }),
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
        }

        const mockClient = {
            chat: vi.fn().mockResolvedValue(mockChatResponse)
        }

            ; (LLMService.getClient as any).mockReturnValue(mockClient)

        const result = await processOnboardingChat('소화가 좀 나빠요', [])

        expect(result.extractedData.digestive_capacity).toBe('poor')
        expect(result.message).toContain('소화가 잘 안 되시는군요')
    })

    it('모호한 입력("모르겠어")에 대해 가이드를 포함한 응답을 해야 함', async () => {
        const mockChatResponse = {
            content: JSON.stringify({
                thought: '사용자가 왜 정보를 주는지 모르겠다고 함. 이유를 설명해야 함.',
                message: '나이와 신체 정보는 수술 후 필요한 기초 대사량과 영양 섭취량을 계산하는 데 꼭 필요합니다.',
                isComplete: false,
                extractedData: {}
            }),
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
        }

        const mockClient = {
            chat: vi.fn().mockResolvedValue(mockChatResponse)
        }

            ; (LLMService.getClient as any).mockReturnValue(mockClient)

        const result = await processOnboardingChat('그걸 왜 물어봐요?', [])

        expect(result.message).toContain('필요합니다')
    })

    it('라섹 수술을 "smile_lasik"으로 올바르게 매핑해야 함', async () => {
        const mockChatResponse = {
            content: JSON.stringify({
                thought: '사용자가 라섹을 했다고 함. smile_lasik으로 분류.',
                message: '라섹 수술을 받으셨군요. 눈 회복을 돕는 영양 조절이 필요합니다.',
                isComplete: false,
                extractedData: {
                    surgery_type: 'smile_lasik'
                }
            }),
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
        }

        const mockClient = {
            chat: vi.fn().mockResolvedValue(mockChatResponse)
        }

            ; (LLMService.getClient as any).mockReturnValue(mockClient)

        const result = await processOnboardingChat('어제 라섹 했어요', [])

        expect(result.extractedData.surgery_type).toBe('smile_lasik')
    })

    it('기저질환("당뇨")을 올바르게 추출해야 함', async () => {
        const mockChatResponse = {
            content: JSON.stringify({
                thought: '사용자가 당뇨가 있다고 언급함.',
                message: '당뇨가 있으시군요. 식단 조절 시 당 수치를 고려하겠습니다.',
                isComplete: false,
                extractedData: {
                    comorbidities: ['당뇨']
                }
            }),
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
        }

        const mockClient = {
            chat: vi.fn().mockResolvedValue(mockChatResponse)
        }

            ; (LLMService.getClient as any).mockReturnValue(mockClient)

        const result = await processOnboardingChat('당뇨가 있어요', [])

        expect(result.extractedData.comorbidities).toContain('당뇨')
    })

    it('모든 정보가 수집되었을 때만 isComplete가 true여야 함', async () => {
        const mockChatResponse = {
            content: JSON.stringify({
                thought: '모든 정보 수집 완료.',
                message: '모든 정보를 확인했습니다. 회복 계획을 생성합니다.',
                isComplete: true,
                extractedData: {
                    surgery_type: 'gastric_resection',
                    surgery_date: '2023-10-01',
                    age: 45,
                    height: 175,
                    weight: 70,
                    digestive_capacity: 'moderate',
                    comorbidities: []
                }
            }),
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
        }

        const mockClient = {
            chat: vi.fn().mockResolvedValue(mockChatResponse)
        }

            ; (LLMService.getClient as any).mockReturnValue(mockClient)

        const result = await processOnboardingChat('다 말했어요', [])

        expect(result.isComplete).toBe(true)
        expect(result.extractedData.comorbidities).toBeDefined()
    })

    it('에러 발생 시 적절한 에러 메시지를 반환해야 함', async () => {
        const mockClient = {
            chat: vi.fn().mockRejectedValue(new Error('API Failure'))
        }

            ; (LLMService.getClient as any).mockReturnValue(mockClient)

        const result = await processOnboardingChat('테스트 메시지', [])

        expect(result.error).toBeDefined()
        expect(result.isComplete).toBe(false)
    })
})
