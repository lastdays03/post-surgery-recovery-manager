import Groq from 'groq-sdk'
import { LLMClient, LLMRequest, LLMResponse, ToolCall } from '../types'

export class GroqProvider implements LLMClient {
    private client: Groq
    private model: string

    constructor(apiKey: string, model: string = 'llama-3.3-70b-versatile') {
        this.client = new Groq({ apiKey })
        this.model = model
    }

    async chat(request: LLMRequest): Promise<LLMResponse> {
        const messages = request.messages.map(msg => ({
            role: msg.role === 'system' ? 'system' as const :
                msg.role === 'user' ? 'user' as const :
                    msg.role === 'tool' ? 'tool' as const :
                        'assistant' as const,
            content: msg.content,
            ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
            ...(msg.name && { name: msg.name }),
            ...(msg.tool_calls && {
                tool_calls: msg.tool_calls.map(tc => ({
                    id: tc.id,
                    type: 'function' as const,
                    function: {
                        name: tc.function.name,
                        arguments: tc.function.arguments
                    }
                }))
            })
        }))

        const completion = await this.client.chat.completions.create({
            model: request.model || this.model,
            messages: messages as any, // Groq SDK 타입과 범용 인터페이스 간 불일치 해결
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 2048,
            ...(request.jsonMode && { response_format: { type: 'json_object' } }),
            ...(request.tools && {
                tools: request.tools.map(tool => ({
                    type: 'function' as const,
                    function: {
                        name: tool.function.name,
                        description: tool.function.description,
                        parameters: tool.function.parameters
                    }
                }))
            })
        })

        const choice = completion.choices[0]
        const toolCalls: ToolCall[] | undefined = choice.message.tool_calls?.map((tc: any) => ({
            id: tc.id,
            type: 'function' as const,
            function: {
                name: tc.function.name,
                arguments: tc.function.arguments
            }
        }))

        return {
            content: choice.message.content || '',
            toolCalls,
            usage: {
                promptTokens: completion.usage?.prompt_tokens || 0,
                completionTokens: completion.usage?.completion_tokens || 0,
                totalTokens: completion.usage?.total_tokens || 0
            }
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        // Groq는 현재 임베딩 API를 제공하지 않으므로 OpenAI로 폴백하거나 에러 처리
        throw new Error('Groq does not support embeddings. Please use OpenAI or Google for RAG features.')
    }
}
