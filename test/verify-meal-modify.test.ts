
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { modifyMealsWithChat, MealChatRequest } from '../lib/ai/meal-ai'
import { LLMService } from '../lib/ai/llm-service'

// Mock LLMService
vi.mock('../lib/ai/llm-service', () => ({
    LLMService: {
        getClient: vi.fn()
    }
}))

describe('modifyMealsWithChat JSON Parsing', () => {
    const mockChat = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        // @ts-ignore
        LLMService.getClient.mockReturnValue({ chat: mockChat })
    })

    const mockRequest: MealChatRequest = {
        userId: 'test-user',
        currentMeals: [{ id: '1', name: 'Original Meal', mealTime: 'lunch' } as any],
        message: 'Change lunch to beef',
        conversationHistory: []
    }

    it('should parse valid JSON object correctly', async () => {
        mockChat.mockResolvedValue({
            content: JSON.stringify({
                updatedMeals: [{ id: '1', name: 'Beef Meal', mealTime: 'lunch' }],
                reply: 'Changed to beef.'
            })
        })

        const result = await modifyMealsWithChat(mockRequest)

        expect(result.updatedMeals[0].name).toBe('Beef Meal')
        expect(result.reply).toBe('Changed to beef.')
    })

    it('should handle markdown code blocks', async () => {
        mockChat.mockResolvedValue({
            content: "```json\n" + JSON.stringify({
                updatedMeals: [{ id: '1', name: 'Beef Meal', mealTime: 'lunch' }],
                reply: 'Changed to beef.'
            }) + "\n```"
        })

        const result = await modifyMealsWithChat(mockRequest)
        expect(result.updatedMeals[0].name).toBe('Beef Meal')
    })
})
