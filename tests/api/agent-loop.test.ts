import { describe, it, expect, vi, beforeEach } from 'vitest'
import { chatWithAssistant } from '@/lib/ai/chat-assistant'
import { LLMService } from '@/lib/ai/llm-service'
import { TOOL_EXECUTORS } from '@/lib/ai/tools'

// 모킹
vi.mock('@/lib/ai/llm-service', () => ({
    LLMService: {
        getClient: vi.fn()
    }
}))

vi.mock('@/lib/ai/monitoring', () => ({
    checkDailyLimit: vi.fn().mockResolvedValue(true),
    logAIUsage: vi.fn().mockResolvedValue(null)
}))

vi.mock('@/lib/ai/safety-guardrails', () => ({
    validateInput: vi.fn().mockReturnValue({ isValid: true }),
    validateResponse: vi.fn().mockReturnValue({ isSafe: true, violations: [], emergencyDetected: false }),
    SYSTEM_PROMPT_SAFETY_INSTRUCTION: 'Safety'
}))

vi.mock('@/lib/ai/rag-search', () => ({
    getContextForQuery: vi.fn().mockResolvedValue('')
}))

vi.mock('@/lib/ai/tools', () => ({
    AI_TOOLS: [],
    TOOL_EXECUTORS: {
        get_user_health_data: vi.fn().mockResolvedValue(JSON.stringify([{ date: '2023-10-01', pain: 3 }]))
    }
}))

describe('chatWithAssistant (Agentic Loop)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('LLM이 도구 호출을 요청하면 도구를 실행하고 다시 LLM을 호출해야 함', async () => {
        const mockClient = {
            chat: vi.fn()
        }

        // 1. 첫 번째 호출: 도구 호출 요청
        mockClient.chat.mockResolvedValueOnce({
            content: '데이터를 조회합니다.',
            toolCalls: [
                {
                    id: 'call_1',
                    type: 'function',
                    function: {
                        name: 'get_user_health_data',
                        arguments: JSON.stringify({ profileId: 'test-user', startDate: '2023-01-01', endDate: '2023-01-07' })
                    }
                }
            ],
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
        })

        // 2. 두 번째 호출: 도구 결과와 함께 최종 답변
        mockClient.chat.mockResolvedValueOnce({
            content: '조회 결과, 통증 수치가 낮아지고 있습니다.',
            usage: { promptTokens: 40, completionTokens: 20, totalTokens: 60 }
        })

            ; (LLMService.getClient as any).mockReturnValue(mockClient)

        const result = await chatWithAssistant({
            userId: 'test-user',
            message: '내 건강 상태 어때?'
        })

        expect(mockClient.chat).toHaveBeenCalledTimes(2)
        expect(TOOL_EXECUTORS.get_user_health_data).toHaveBeenCalled()
        expect(result.message).toContain('통증 수치가 낮아지고 있습니다')
    })
})
