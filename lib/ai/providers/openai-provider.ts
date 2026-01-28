import OpenAI from 'openai'
import { LLMClient, LLMRequest, LLMResponse } from '../types'

export class OpenAIProvider implements LLMClient {
    private client: OpenAI
    private model: string

    constructor(apiKey: string, model: string = 'gpt-4o') {
        this.client = new OpenAI({ apiKey })
        this.model = model
    }

    async chat(request: LLMRequest): Promise<LLMResponse> {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = request.messages.map(msg => ({
            role: msg.role as any,
            content: msg.role === 'tool' ? msg.content : msg.content,
            tool_call_id: msg.tool_call_id,
            name: msg.name,
            tool_calls: msg.tool_calls as any
        }))

        // Reasoning models (e.g. o1, gpt-5-nano) do not support custom temperature
        const REASONING_MODELS = ['gpt-5-nano', 'o1-preview', 'o1-mini', 'o3-mini'];
        const isReasoningModel = REASONING_MODELS.some(m => this.model.includes(m));

        const baseParams: any = {
            model: this.model,
            messages,
            max_tokens: request.maxTokens,
            tools: request.tools as any,
            response_format: request.jsonMode ? { type: 'json_object' } : undefined
        }

        // Only add temperature if it's NOT a reasoning model
        // reasoning models compel fixed temperature (usually 1)
        if (!isReasoningModel) {
            baseParams.temperature = request.temperature
        }

        const response = await this.client.chat.completions.create(baseParams)

        const choice = response.choices[0]

        return {
            content: choice.message.content || '',
            toolCalls: choice.message.tool_calls?.map((tc: any) => ({
                id: tc.id,
                type: 'function',
                function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments
                }
            })),
            usage: {
                promptTokens: response.usage?.prompt_tokens || 0,
                completionTokens: response.usage?.completion_tokens || 0,
                totalTokens: response.usage?.total_tokens || 0
            }
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const response = await this.client.embeddings.create({
            model: 'text-embedding-3-small',
            input: text.replace(/\n/g, ' ').trim(),
        })

        return response.data[0].embedding
    }
}
