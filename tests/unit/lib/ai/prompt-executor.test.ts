import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeMealPlan } from '@/lib/ai/prompt-executor'
import { LLMService } from '@/lib/ai/llm-service'

vi.mock('@/lib/ai/llm-service', () => ({
    LLMService: {
        getClient: vi.fn()
    }
}))

describe('PromptExecutor', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('executeMealPlan should execute the provided system prompt and return parsed JSON', async () => {
        const systemPrompt = "System Prompt"
        const userPrompt = "User Info"
        const mockResponse = [{ name: "Test Meal" }]

        const mockChat = vi.fn().mockResolvedValue({
            content: JSON.stringify(mockResponse)
        })

        // @ts-ignore
        vi.mocked(LLMService.getClient).mockReturnValue({
            chat: mockChat
        } as any)

        const result = await executeMealPlan(systemPrompt, userPrompt)

        expect(result).toEqual(mockResponse)
        expect(mockChat).toHaveBeenCalledWith(expect.objectContaining({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        }))
    })
})
