import { LLMService } from './llm-service'
import { getContextForQuery } from './rag-search'
import { validateInput, validateResponse, SYSTEM_PROMPT_SAFETY_INSTRUCTION } from './safety-guardrails'
import { checkDailyLimit, logAIUsage, UsageLog } from './monitoring'
import { ChatMessage, ToolCall } from './types'
import { AI_TOOLS, TOOL_EXECUTORS } from './tools'

export interface ChatRequest {
    userId: string
    message: string
    conversationHistory?: ChatMessage[]
}

export interface ChatResponse {
    message: string
    error?: string
    sources?: string[]
    safetyWarning?: string
}

export async function chatWithAssistant(request: ChatRequest): Promise<ChatResponse> {
    const { userId, message } = request
    const startTime = Date.now()
    let endpoint = 'chat_agent'

    // 1. Safety & Validation (입력 검증)
    const validation = validateInput(message)
    if (!validation.isValid) {
        return { message: '', error: validation.error || validation.warning }
    }

    // 응급 상황 감지 시 즉시 경고 반환
    if (validation.requiresEmergencyWarning) {
        return {
            message: '🚨 **응급 상황이 감지되었습니다.**\n\n즉시 119에 연락하거나 가장 가까운 응급실을 방문하세요. 출혈, 호흡곤란, 심한 통증 등은 즉각적인 의료 조치가 필요합니다.',
            safetyWarning: validation.warning
        }
    }

    // 2. Cost Limiter
    const canProceed = await checkDailyLimit(userId)
    if (!canProceed) {
        return { message: '', error: '일일 AI 사용 한도를 초과했습니다. 내일 다시 이용해주세요.' }
    }

    try {
        // 3. RAG Retrieval (Context Injection)
        const context = await getContextForQuery(message)
        const hasContext = context.length > 0

        // 4. Construct Initial Messages
        const systemMessage: ChatMessage = {
            role: 'system',
            content: `${SYSTEM_PROMPT_SAFETY_INSTRUCTION}

당신은 사용자의 수술 후 회복을 돕는 '회복 관리 메이트'입니다.
이제 '식위 세분화(Diet Graduation)' 및 '영양 관리' 전문가로서의 답변을 추가해야 합니다.

[식단 관리 지침]
1. 사용자가 먹은 음식을 기록하고 싶어하면 'analyze_meal_nutrition' 도구를 사용하세요.
2. 현재 회복 단계에 맞는 음식을 추천하려면 'get_available_meals' 도구를 사용하세요.
3. 수술 직후라면 반드시 'get_recovery_protocol'을 확인하여 허용된 음식인지 검증한 후 답변하세요.
4. 사용자의 최근 소화 상태나 통증 기록('get_user_health_data')을 식단 제안의 근거로 활용하세요.
5. 특정 식단을 추천할 때는 반드시 답변 끝에 혹은 중간에 다음 형식을 포함하세요:
   <meal_suggestion>{"id": "...", "name": "...", "phase": "...", "nutrition": {...}, "ingredients": [...], "prepTime": 10}</meal_suggestion>
   (위 JSON은 Meal 인터페이스와 완벽히 일치해야 합니다.)

[USER INFO]
User ID: ${userId}
`.trim()
        }

        let messages: ChatMessage[] = [
            systemMessage,
            ...(request.conversationHistory || []),
            { role: 'user', content: message }
        ]

        const client = LLMService.getClient()
        let retryCount = 0
        const MAX_RETRIES = 3

        while (retryCount < MAX_RETRIES) {
            // 5. LLM Inference
            const response = await client.chat({
                messages,
                temperature: 0.2,
                tools: AI_TOOLS
            })

            // 6. Handle Tool Calls
            if (response.toolCalls && response.toolCalls.length > 0) {
                messages.push({
                    role: 'assistant',
                    content: response.content || '',
                    tool_calls: response.toolCalls
                })

                for (const toolCall of response.toolCalls) {
                    const executor = TOOL_EXECUTORS[toolCall.function.name as keyof typeof TOOL_EXECUTORS]
                    if (executor) {
                        try {
                            const args = JSON.parse(toolCall.function.arguments)
                            // profileId(userId)를 자동으로 주입하거나 보정 (보안상 이유)
                            if (args.profileId && args.profileId !== userId) {
                                args.profileId = userId
                            }

                            const result = await executor(args)
                            messages.push({
                                role: 'tool',
                                tool_call_id: toolCall.id,
                                name: toolCall.function.name,
                                content: result
                            })
                        } catch (e: any) {
                            messages.push({
                                role: 'tool',
                                tool_call_id: toolCall.id,
                                name: toolCall.function.name,
                                content: JSON.stringify({ error: 'Tool execution failed', details: e.message })
                            })
                        }
                    }
                }
                retryCount++
                continue // 도구 결과와 함께 다시 LLM 호출
            }

            // 7. Safety Validation (사후 검증)
            const safetyCheck = validateResponse(response.content, message)

            if (!safetyCheck.isSafe) {
                console.warn('Safety violation detected:', safetyCheck.violations)

                // 위반 사항이 있으면 안전한 대체 메시지로 교체
                const fallbackMessage = safetyCheck.emergencyDetected
                    ? '🚨 응급 상황으로 보입니다. 즉시 119에 연락하거나 가장 가까운 응급실을 방문하세요.'
                    : '죄송합니다. 안전한 답변을 제공하기 어렵습니다. 담당 의료진과 직접 상담하시는 것을 권장드립니다.'

                await logAIUsage({
                    userId,
                    endpoint: 'chat_agent_safety_blocked',
                    model: 'llm-assistant',
                    inputTokens: response.usage.promptTokens,
                    outputTokens: response.usage.completionTokens,
                    latencyMs: Date.now() - startTime,
                    success: false,
                    errorMessage: `Safety violations: ${safetyCheck.violations.join(', ')}`
                })

                return {
                    message: fallbackMessage,
                    safetyWarning: safetyCheck.violations.join(' ')
                }
            }

            // 8. Success: Safe response
            const latency = Date.now() - startTime
            await logAIUsage({
                userId,
                endpoint: hasContext ? 'chat_rag_agent' : 'chat_agent',
                model: 'llm-assistant',
                inputTokens: response.usage.promptTokens,
                outputTokens: response.usage.completionTokens,
                latencyMs: latency,
                success: true
            })

            return {
                message: response.content
            }
        }

        throw new Error('Max retries for tool calls exceeded')

    } catch (error: any) {
        console.error('Chat Assistant Error:', error)
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
