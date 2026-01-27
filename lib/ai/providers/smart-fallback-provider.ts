import { LLMClient, LLMRequest, LLMResponse } from '../types'

export class SmartFallbackProvider implements LLMClient {
    private providers: { name: string; client: LLMClient }[]

    constructor(providers: { name: string; client: LLMClient }[]) {
        if (providers.length === 0) {
            throw new Error('SmartFallbackProvider requires at least one provider')
        }
        this.providers = providers
    }

    async chat(request: LLMRequest): Promise<LLMResponse> {
        let lastError: any

        for (const { name, client } of this.providers) {
            try {
                // console.log(`Attempting to use AI Provider: ${name.toUpperCase()}`)
                const response = await client.chat(request)
                // console.log(`Successfully used AI Provider: ${name.toUpperCase()}`)
                return response
            } catch (error: any) {
                console.warn(`Failed to use AI Provider: ${name.toUpperCase()}`, error.message)
                lastError = error

                // If it's a rate limit or server error, try next provider
                // Otherwise (e.g. invalid request), maybe we should stop?
                // For now, let's try fallback for all errors to be safe
                continue
            }
        }

        console.error('All AI Providers failed.')
        throw lastError
    }

    async generateEmbedding(text: string): Promise<number[]> {
        let lastError: any

        for (const { name, client } of this.providers) {
            try {
                return await client.generateEmbedding(text)
            } catch (error: any) {
                console.warn(`Failed to generate embedding with: ${name.toUpperCase()}`, error.message)
                lastError = error
                continue
            }
        }

        throw lastError
    }
}
