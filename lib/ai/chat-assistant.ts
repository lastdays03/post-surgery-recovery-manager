import { LLMService } from './llm-service'
import { getContextForQuery } from './rag-search'
import { validateInput, SYSTEM_PROMPT_SAFETY_INSTRUCTION } from './safety-guardrails'
import { checkDailyLimit, logAIUsage, UsageLog } from './monitoring'
import { ChatMessage } from './types'

export interface ChatRequest {
    userId: string
    message: string
    conversationHistory?: ChatMessage[] // Optional logic for history (simplified for now)
}

export interface ChatResponse {
    message: string
    error?: string
    sources?: string[] // Debug info about RAG use
}

export async function chatWithAssistant(request: ChatRequest): Promise<ChatResponse> {
    const { userId, message } = request
    const startTime = Date.now()
    let endpoint = 'chat'

    // 1. Safety & Validation
    const validation = validateInput(message)
    if (!validation.isValid) {
        return { message: '', error: validation.error || validation.warning }
    }

    // 2. Cost Limiter
    const canProceed = await checkDailyLimit(userId)
    if (!canProceed) {
        return { message: '', error: '일일 AI 사용 한도를 초과했습니다. 내일 다시 이용해주세요.' }
    }

    try {
        // 3. RAG Retrieval
        const context = await getContextForQuery(message)
        const hasContext = context.length > 0
        endpoint = hasContext ? 'chat_rag' : 'chat_basic'

        // 4. Construct System Prompt
        const systemMessage: ChatMessage = {
            role: 'system',
            content: `${SYSTEM_PROMPT_SAFETY_INSTRUCTION}
      
${hasContext ? `CONTEXT FROM KNOWLEDGE BASE:\n${context}` : 'No specific context found. Answer generically if safe.'}
      `.trim()
        }

        const messages: ChatMessage[] = [
            systemMessage,
            ...(request.conversationHistory || []),
            { role: 'user', content: message }
        ]

        // 5. LLM Inference
        const client = LLMService.getClient()
        // For logging, we assume mock or active provider model name
        // Ideally LLMClient should expose current model name, but keeping it simple.

        // NOTE: If using Google, system prompt goes into history or special field. 
        // The GeminiProvider implementation handles generic message structure implicitly.

        const response = await client.chat({
            messages,
            temperature: 0.2, // Low temp for medical accuracy
            maxTokens: 1000
        })

        // 6. Logging
        const latency = Date.now() - startTime

        const log: UsageLog = {
            userId,
            endpoint,
            model: process.env.AI_PROVIDER === 'google' ? 'gemini-pro' : (process.env.AI_PROVIDER === 'mock' ? 'mock-model' : 'gpt-4o'),
            inputTokens: response.usage.promptTokens,
            outputTokens: response.usage.completionTokens,
            latencyMs: latency,
            success: true
        }

        await logAIUsage(log)

        return {
            message: response.content
        }

    } catch (error: any) {
        console.error('Chat Assistant Error:', error)

        // Log failure
        await logAIUsage({
            userId,
            endpoint,
            model: 'unknown',
            inputTokens: 0,
            outputTokens: 0,
            latencyMs: Date.now() - startTime,
            success: false,
            errorMessage: error.message
        })

        return { message: '', error: 'AI 서비스 처리 중 오류가 발생했습니다.' }
    }
}
