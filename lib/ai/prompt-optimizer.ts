import { LLMService } from './llm-service'

/**
 * Uses LLM to refine a given prompt based on user instructions.
 * (Meta-Prompting)
 */
export async function refinePrompt(currentPrompt: string, userRequest: string): Promise<string> {
    const llm = LLMService.getClient()

    const systemPrompt = `You are an expert Prompt Engineer.
Your goal is to optimize the given "Current Prompt" based on the "User Request".
Analyze the user's intent and modify the prompt to be more effective, precise, or aligned with the request.
Maintain the original structure if it is good, but improve the clarity and instructions.

OUTPUT FORMAT:
Return a JSON object with a single key "refinedPrompt" containing the string of the new prompt.
Example:
{
  "refinedPrompt": "Your improved prompt text..."
}
`

    const userMessage = `
[Current Prompt]
${currentPrompt}

[User Request]
${userRequest}

Refine the prompt now.
`

    try {
        const response = await llm.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            jsonMode: true
        })

        let content = response.content.trim()

        // Basic Markdown cleanup if needed
        if (content.startsWith('```')) {
            const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
            if (match) {
                content = match[1].trim()
            }
        }

        const parsed = JSON.parse(content)

        if (typeof parsed.refinedPrompt === 'string') {
            return parsed.refinedPrompt
        }

        throw new Error('Invalid JSON response: missing "refinedPrompt" key')

    } catch (error) {
        console.error('Prompt Refinement Failed:', error)
        throw new Error('Failed to refine prompt.')
    }
}
