import { LLMClient, AIProvider } from './types'
import { OpenAIProvider } from './providers/openai-provider'
import { GeminiProvider } from './providers/gemini-provider'
import { GroqProvider } from './providers/groq-provider'
import { MockProvider } from './providers/mock-provider'
import { SmartFallbackProvider } from './providers/smart-fallback-provider'

export class LLMService {
    private static instance: LLMClient

    static getClient(): LLMClient {
        if (this.instance) {
            return this.instance
        }

        const preferredProviderName = (process.env.AI_PROVIDER || 'openai') as AIProvider

        // Handle Mock Provider specifically
        if (preferredProviderName === 'mock') {
            console.log(`🔌 Initializing AI Provider: MOCK (Testing Mode)`)
            this.instance = new MockProvider()
            return this.instance
        }

        const providers: { name: string; client: LLMClient }[] = []

        // Helper to create provider instance
        const createProvider = (name: string): LLMClient | null => {
            try {
                switch (name) {
                    case 'openai':
                        if (process.env.OPENAI_API_KEY) {
                            return new OpenAIProvider(
                                process.env.OPENAI_API_KEY,
                                process.env.OPENAI_MODEL_NAME || 'gpt-4o'
                            )
                        }
                        break
                    case 'groq':
                        if (process.env.GROQ_API_KEY) {
                            return new GroqProvider(
                                process.env.GROQ_API_KEY,
                                process.env.GROQ_MODEL_NAME || 'llama-3.3-70b-versatile'
                            )
                        }
                        break
                    case 'google':
                        if (process.env.GOOGLE_API_KEY) {
                            return new GeminiProvider(
                                process.env.GOOGLE_API_KEY,
                                process.env.GOOGLE_MODEL_NAME || 'gemini-pro'
                            )
                        }
                        break
                }
            } catch (e) {
                console.warn(`Failed to initialize provider ${name}`, e)
            }
            return null
        }

        // 1. Add preferred provider first
        const preferredClient = createProvider(preferredProviderName)
        if (preferredClient) {
            providers.push({ name: preferredProviderName, client: preferredClient })
        } else if (preferredProviderName !== 'openai' && preferredProviderName !== 'groq' && preferredProviderName !== 'google') {
            // If preferred is invalid or has no key, warning logged above? no, createProvider returns null
            // Try to find ANY available provider if preferred failed
        }

        // 2. Add backups (fallback chain)
        const candidates = ['openai', 'groq', 'google']
        for (const candidate of candidates) {
            if (candidate !== preferredProviderName) {
                const client = createProvider(candidate)
                if (client) {
                    providers.push({ name: candidate, client })
                }
            }
        }

        if (providers.length === 0) {
            throw new Error('No valid AI Providers found. Please check your API keys in .env.local')
        }

        console.log(`🔌 Initializing SmartFallbackProvider with chain: ${providers.map(p => p.name).join(' -> ')}`)

        // If only one provider, just return it to save overhead (though wrapper overhead is minimal)
        // But let's wrap it anyway for consistency if we want log/interceptor logic later
        this.instance = new SmartFallbackProvider(providers)

        return this.instance
    }
}
