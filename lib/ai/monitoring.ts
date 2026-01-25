import { supabaseAdmin } from '@/lib/supabase-client'

export interface UsageLog {
    userId: string
    endpoint: string
    model: string
    inputTokens: number
    outputTokens: number
    latencyMs: number
    success: boolean
    errorMessage?: string
}

// Cost estimation (Approximate rates as of late 2024/2025)
// GPT-4o: Input $2.5/1M, Output $10/1M (Example rates, adjust as needed)
const RATES: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
    'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
    'gemini-pro': { input: 0.1 / 1_000_000, output: 0.4 / 1_000_000 },
    'mock-model': { input: 0, output: 0 }
}

export async function logAIUsage(log: UsageLog) {
    const rate = RATES[log.model] || RATES['gpt-4o'] // Default to GPT-4o if unknown
    const cost = (log.inputTokens * rate.input) + (log.outputTokens * rate.output)

    // 1. Log to token_usage (User facing or billing)
    const { error: usageError } = await supabaseAdmin.from('token_usage').insert({
        user_id: log.userId,
        date: new Date().toISOString().split('T')[0],
        endpoint: log.endpoint,
        input_tokens: log.inputTokens,
        output_tokens: log.outputTokens,
        cost: cost
    } as any)

    if (usageError) console.error('Error logging token usage:', usageError)

    // 2. Log to ai_metrics (System analytics)
    const { error: metricError } = await supabaseAdmin.from('ai_metrics').insert({
        endpoint: log.endpoint,
        model: log.model,
        latency_ms: log.latencyMs,
        input_tokens: log.inputTokens,
        output_tokens: log.outputTokens,
        cost: cost,
        success: log.success,
        error_message: log.errorMessage
    } as any)

    if (metricError) console.error('Error logging metrics:', metricError)
}

export async function checkDailyLimit(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]
    const limitStr = process.env.MAX_DAILY_AI_COST_PER_USER || '0.50'
    const limit = parseFloat(limitStr)

    const { data, error } = await supabaseAdmin
        .from('token_usage')
        .select('cost')
        .eq('user_id', userId)
        .eq('date', today)

    if (error || !data) return true // Fail open safely or log error

    const totalCost = (data as any[]).reduce((sum, row) => sum + Number(row.cost), 0)

    return totalCost < limit
}
