import { describe, it, expect, vi, beforeEach } from 'vitest'
import { refinePrompt } from '@/lib/ai/prompt-optimizer'
import { LLMService } from '@/lib/ai/llm-service'

// Mock LLMService
vi.mock('@/lib/ai/llm-service', () => ({
    LLMService: {
        getClient: vi.fn()
    }
}))

describe('PromptOptimizer', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('refinePrompt should return a modified prompt string', async () => {
        // Arrange
        const originalPrompt = "Test prompt"
        const userRequest = "Make it better"
        const refinedPrompt = "Improved Test Prompt"

        const mockChat = vi.fn().mockResolvedValue({
            content: JSON.stringify({ refinedPrompt })
        })

        // Setup mock return
        vi.mocked(LLMService.getClient).mockReturnValue({
            chat: mockChat
        } as any)

        // Act
        const result = await refinePrompt(originalPrompt, userRequest)

        // Assert
        expect(LLMService.getClient).toHaveBeenCalled()
        expect(mockChat).toHaveBeenCalledTimes(1)
        expect(result).toBe(refinedPrompt)
    })

    it('should throw error on invalid JSON', async () => {
        const mockChat = vi.fn().mockResolvedValue({
            content: "Invalid JSON"
        })
        vi.mocked(LLMService.getClient).mockReturnValue({ chat: mockChat } as any)

        await expect(refinePrompt("a", "b")).rejects.toThrow()
    })
})
