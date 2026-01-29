import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { LLMClient, LLMRequest, LLMResponse } from '../types'

export class GeminiProvider implements LLMClient {
    private client: GoogleGenerativeAI
    private modelName: string

    constructor(apiKey: string, model: string = 'gemini-pro') {
        this.client = new GoogleGenerativeAI(apiKey)
        this.modelName = model
    }

    async chat(request: LLMRequest): Promise<LLMResponse> {
        const model = this.client.getGenerativeModel({
            model: request.model || this.modelName,
            generationConfig: {
                temperature: request.temperature,
                maxOutputTokens: request.maxTokens,
                responseMimeType: request.jsonMode ? "application/json" : "text/plain"
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ]
        })

        // Convert messages to Gemini format
        // Note: Gemini API treats the conversation history differently.
        // We'll use a simplified approach: combine system prompts or use startChat

        const history = request.messages.slice(0, -1).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }))

        const lastMessage = request.messages[request.messages.length - 1]
        const userMessage = lastMessage.content

        // Handle System Prompt if present (Gemini typically handles it via instruction or context in higher models, 
        // but for 'gemini-pro' regular setup:
        // If first message is system, we might need to prepend it or use system instruction if supported version.
        // For now, prepend to first user message if needed or rely on 'user' role for system prompt context injection.)
        // Let's assume standard chat structure.

        // Check if first message is system
        let validHistory = history
        if (validHistory.length > 0 && request.messages[0].role === 'system') {
            // Gemini Pro doesn't support 'system' role in history directly in older versions, 
            // effectively we can migrate it to user or use systemInstruction if using gemini-1.5-pro or flash
            // For broad compatibility, we might prepend. 
            // But assuming gemini-1.5 logic:
        }

        const chatSession = model.startChat({
            history: validHistory.filter(h => h.role === 'user' || h.role === 'model') // sanitize roles
        })

        const result = await chatSession.sendMessage(userMessage)
        const response = await result.response
        const text = response.text()

        // Usage metadata is not always detailed in Gemini standard response object same as OpenAI
        // We'll approximate or use available metadata if present

        return {
            content: text,
            usage: {
                // Gemini usage metadata might need specific handling or be absent in some SDK versions
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0
            }
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const model = this.client.getGenerativeModel({ model: "embedding-001" })
        const result = await model.embedContent(text)
        return result.embedding.values
    }
}
