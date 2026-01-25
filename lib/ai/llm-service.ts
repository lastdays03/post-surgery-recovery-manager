import { LLMClient, AIProvider } from './types'
import { OpenAIProvider } from './providers/openai-provider'
import { GeminiProvider } from './providers/gemini-provider'
import { MockProvider } from './providers/mock-provider'

export class LLMService {
    private static instance: LLMClient

    static getClient(): LLMClient {
        if (this.instance) {
            return this.instance
        }

        const provider = (process.env.AI_PROVIDER || 'openai') as AIProvider

        if (provider === 'mock') {
            console.log(`🔌 Initializing AI Provider: MOCK (Testing Mode)`)
            this.instance = new MockProvider()
            return this.instance
        }

        const apiKey = provider === 'google'
            ? process.env.GOOGLE_API_KEY
            : process.env.OPENAI_API_KEY

        if (!apiKey) {
            throw new Error(`Missing API Key for provider: ${provider}`)
        }

        console.log(`🔌 Initializing AI Provider: ${provider.toUpperCase()}`)

        if (provider === 'google') {
            this.instance = new GeminiProvider(apiKey, process.env.GOOGLE_MODEL_NAME || 'gemini-pro')
        } else {
            this.instance = new OpenAIProvider(apiKey, process.env.OPENAI_MODEL_NAME || 'gpt-4o')
        }

        return this.instance
    }
}
