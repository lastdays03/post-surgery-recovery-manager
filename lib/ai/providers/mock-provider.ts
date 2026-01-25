import { LLMClient, LLMRequest, LLMResponse } from '../types'

export class MockProvider implements LLMClient {
    constructor() { }

    async chat(request: LLMRequest): Promise<LLMResponse> {
        const lastMessage = request.messages[request.messages.length - 1].content

        if (lastMessage.includes('기록') || lastMessage.includes('상태')) {
            return {
                content: '사용자 데이터를 조회하겠습니다.',
                toolCalls: [
                    {
                        id: 'call_123',
                        type: 'function',
                        function: {
                            name: 'get_user_health_data',
                            arguments: JSON.stringify({
                                profileId: 'mock-user',
                                startDate: '2023-10-01',
                                endDate: '2023-10-07'
                            })
                        }
                    }
                ],
                usage: { promptTokens: 50, completionTokens: 30, totalTokens: 80 }
            }
        }

        return {
            content: `[Mock Response] I received ${request.messages.length} messages.`,
            usage: {
                promptTokens: 10,
                completionTokens: 20,
                totalTokens: 30
            }
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        // Return a random vector of dimension 1536 (OpenAI standard)
        return Array.from({ length: 1536 }, () => Math.random() - 0.5)
    }
}
