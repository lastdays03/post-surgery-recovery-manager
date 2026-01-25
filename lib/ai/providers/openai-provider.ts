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
            role: msg.role,
            content: msg.content
        }))

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages,
            temperature: request.temperature,
            max_tokens: request.maxTokens,
            response_format: request.jsonMode ? { type: 'json_object' } : undefined
        })

        const choice = response.choices[0]

        return {
            content: choice.message.content || '',
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
