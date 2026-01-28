import { vi, describe, it, expect } from 'vitest'
import { generateDailyMeals } from '@/lib/ai/meal-ai'
import { LLMService } from '@/lib/ai/llm-service'

// Mock LLMService
vi.mock('@/lib/ai/llm-service', () => ({
    LLMService: {
        getClient: vi.fn()
    }
}))

describe('generateDailyMeals', () => {
    it('should request JSON object format and parse correctly', async () => {
        const mockChat = vi.fn().mockResolvedValue({
            content: JSON.stringify({
                meals: [
                    {
                        id: 'test-1',
                        name: 'Test Meal',
                        mealTime: 'breakfast',
                        ingredients: ['ing1'],
                        instructions: ['step1'],
                        nutrition: { calories: 100, protein: 10, carbs: 10, fat: 1 },
                        prepTime: 10,
                        portionSize: '1'
                    }
                ]
            })
        })

        // @ts-ignore
        LLMService.getClient.mockReturnValue({
            chat: mockChat
        })

        const request = {
            userId: 'user1',
            recoveryPhase: 'regular' as const,
        }

        const meals = await generateDailyMeals(request)

        // Verify request format
        expect(mockChat).toHaveBeenCalledWith(expect.objectContaining({
            responseFormat: { type: 'json_object' },
            jsonMode: true
        }))

        // Verify parsing
        expect(meals).toHaveLength(1)
        expect(meals[0].name).toBe('Test Meal')
    })

    it('should handle fallback when array is returned directly', async () => {
        const mockChat = vi.fn().mockResolvedValue({
            content: JSON.stringify([
                {
                    id: 'test-2',
                    name: 'Test Meal 2',
                    mealTime: 'lunch',
                    ingredients: ['ing2'],
                    instructions: ['step2'],
                    nutrition: { calories: 200, protein: 20, carbs: 20, fat: 2 },
                }
            ])
        })

        // @ts-ignore
        LLMService.getClient.mockReturnValue({
            chat: mockChat
        })

        const request = {
            userId: 'user1',
            recoveryPhase: 'regular' as const,
        }

        const meals = await generateDailyMeals(request)

        expect(meals).toHaveLength(1)
        expect(meals[0].name).toBe('Test Meal 2')
    })
})
