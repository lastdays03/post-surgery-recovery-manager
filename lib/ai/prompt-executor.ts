import { LLMService } from './llm-service'

/**
 * Executes a meal plan generation using a dynamic system prompt.
 * This is primarily used for testing and optimizing prompts.
 */
export async function executeMealPlan(systemPrompt: string, userPrompt: string, modelConfig?: any): Promise<any> {
    const llm = LLMService.getClient()

    try {
        const response = await llm.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: modelConfig?.temperature ?? 0.7,
            jsonMode: true
        })

        let content = response.content.trim()

        // Markdown Cleanup
        if (content.startsWith('```')) {
            const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
            if (match) {
                content = match[1].trim()
            }
        }

        const parsed = JSON.parse(content)
        return parsed

    } catch (error) {
        console.error('Meal Plan Execution Failed:', error)
        throw new Error('Failed to execute meal plan generation.')
    }
}
