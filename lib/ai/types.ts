export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool'
    content: string
    tool_call_id?: string
    name?: string
    tool_calls?: ToolCall[]
}

export interface ToolCall {
    id: string
    type: 'function'
    function: {
        name: string
        arguments: string
    }
}

export interface ToolDefinition {
    type: 'function'
    function: {
        name: string
        description: string
        parameters: any
    }
}

export interface LLMRequest {
    messages: ChatMessage[]
    model?: string
    reasoningEffort?: 'low' | 'medium' | 'high'
    temperature?: number
    maxTokens?: number
    jsonMode?: boolean
    responseFormat?: {
        type: 'json_object' | 'json_schema'
        schema?: any
        name?: string // description for json_schema
        strict?: boolean
    }
    tools?: ToolDefinition[]
}

export interface LLMResponse {
    content: string
    toolCalls?: ToolCall[]
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

export type AIProvider = 'openai' | 'google' | 'groq' | 'mock' | 'deepseek'
