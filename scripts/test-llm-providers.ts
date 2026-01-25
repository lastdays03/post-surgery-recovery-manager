import dotenv from 'dotenv'
import { LLMService } from '../lib/ai/llm-service'
import { OpenAIProvider } from '../lib/ai/providers/openai-provider'
import { GeminiProvider } from '../lib/ai/providers/gemini-provider'

dotenv.config({ path: '.env.local' })

async function main() {
    console.log('🧪 Testing LLM Provider Factory...\n')

    // Test 1: Default (OpenAI)
    process.env.AI_PROVIDER = 'openai'
    // Mock API key if missing locally just for instantiation test
    if (!process.env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = 'mock-sk-...'

    const client1 = LLMService.getClient()
    console.log(`Test 1 (OpenAI): ${client1 instanceof OpenAIProvider ? '✅ Passed' : '❌ Failed'}`)

    // Reset instance to test switching (Note: LLMService is Singleton, so this is tricky without reset logic)
    // For this test script, we might need to modify LLMService to allow reset, or just invoke constructor directly to verify logic if factory is simple.
    // Actually, Singleton prevents re-instantiation. 
    // Let's modify LLMService to allow forced reset for testing or just test one configuration.

    // Since I cannot change the singleton instance easily without adding "reset" method (which is bad for prod),
    // I will just check what is currently active based on the real .env.local

    console.log('\nCannot test dynamic switching strictly due to Singleton pattern in same process.')
    console.log(`Current Provider Instance: ${client1.constructor.name}`)
}

main()
