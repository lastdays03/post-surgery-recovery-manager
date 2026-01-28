'use server'

import { refinePrompt } from '@/lib/ai/prompt-optimizer'
import { executeMealPlan } from '@/lib/ai/prompt-executor'

export type PromptOptimizationState = {
    refinedPrompt?: string
    executionResult?: any
    error?: string
}

export async function refinePromptAction(currentPrompt: string, userRequest: string): Promise<{ success: boolean, refinedPrompt?: string, error?: string }> {
    try {
        const refinedPrompt = await refinePrompt(currentPrompt, userRequest)
        return { success: true, refinedPrompt }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Refinement failed' }
    }
}

export async function executePromptAction(
    systemPrompt: string,
    userPrompt: string,
    modelConfig?: any
): Promise<{ success: boolean, result?: any, error?: string }> {
    try {
        const result = await executeMealPlan(systemPrompt, userPrompt, modelConfig)
        return { success: true, result }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Execution failed' }
    }
}
