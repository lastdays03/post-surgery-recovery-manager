import { LLMClient, LLMRequest, LLMResponse } from '../types'

export class MockProvider implements LLMClient {
    constructor() { }

    async chat(request: LLMRequest): Promise<LLMResponse> {
        return {
            content: `[Mock Response] I received ${request.messages.length} messages.`,
            usage: {
                promptTokens: 10,
                completionTokens: 20,
                totalTokens: 30
            }
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        // Return a random vector of dimension 1536 (OpenAI standard)
        return Array.from({ length: 1536 }, () => Math.random() - 0.5)
    }
}
