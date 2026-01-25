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
    it('AI로부터의 JSON 응답을 올바르게 파싱해야 함', async () => {
        const mockChatResponse = {
            content: JSON.stringify({
                message: '수술 정보를 확인했습니다.',
                isComplete: true,
                extractedData: {
                    surgery_type: '위절제술',
                    surgery_date: '2023-10-01'
                }
            }),
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
        }

        const mockClient = {
            chat: vi.fn().mockResolvedValue(mockChatResponse)
        }

            ; (LLMService.getClient as any).mockReturnValue(mockClient)

        const result = await processOnboardingChat('어제 위절제술 받았어', [])

        expect(result.message).toBe('수술 정보를 확인했습니다.')
        expect(result.isComplete).toBe(true)
        expect(result.extractedData.surgery_type).toBe('위절제술')
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
