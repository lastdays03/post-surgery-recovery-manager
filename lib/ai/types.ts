export interface ChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export interface LLMRequest {
    messages: ChatMessage[]
    temperature?: number
    maxTokens?: number
    jsonMode?: boolean
}

export interface LLMResponse {
    content: string
    usage: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
}

export interface LLMClient {
    chat(request: LLMRequest): Promise<LLMResponse>
    generateEmbedding(text: string): Promise<number[]>
}

export type AIProvider = 'openai' | 'google' | 'mock'
