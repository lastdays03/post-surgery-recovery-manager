import { describe, it, expect, vi, beforeEach } from 'vitest'
import { chatWithAssistant } from '@/lib/ai/chat-assistant'
import { LLMService } from '@/lib/ai/llm-service'

vi.mock('@/lib/ai/llm-service', () => ({
    LLMService: {
        getClient: vi.fn()
    }
}))

vi.mock('@/lib/supabase-client', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn()
    }
}))

vi.mock('@/lib/ai/tools', () => ({
    AI_TOOLS: [],
    TOOL_EXECUTORS: {}
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

describe('chatWithAssistant (Diet Suggestion)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('식단 추천 시 <meal_suggestion> 태그가 포함된 답변을 생성해야 함', async () => {
        const mockClient = {
            chat: vi.fn().mockResolvedValue({
                content: '오늘 점심으로 담백한 닭가슴살 죽을 추천합니다. <meal_suggestion>{"id":"soft-lunch-1","name":"닭가슴살 죽","phase":"soft","nutrition":{"calories":280,"protein":25,"fat":5,"carbs":35},"ingredients":["쌀","닭가슴살"],"prepTime":40}</meal_suggestion>',
                usage: { promptTokens: 10, completionTokens: 50, totalTokens: 60 }
            })
        }
            ; (LLMService.getClient as any).mockReturnValue(mockClient)

        const result = await chatWithAssistant({
            userId: 'test-user',
            message: '부드러운 점심 추천해줘'
        })

        expect(result.message).toContain('<meal_suggestion>')
        expect(result.message).toContain('닭가슴살 죽')
    })
})
