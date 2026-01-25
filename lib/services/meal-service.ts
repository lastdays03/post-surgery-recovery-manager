import type { Meal } from '@/lib/types/meal.types'

/**
 * 식단 계획 인터페이스
 */
export interface MealPlan {
    id: string
    user_id: string
    date: string  // YYYY-MM-DD
    recovery_phase: 'liquid' | 'soft' | 'regular'
    meals: Meal[]
    preferences?: {
        favoriteFood?: string[]
        avoidIngredients?: string[]
        dietaryRestrictions?: string[]
    }
    created_at: Date
    updated_at: Date
}

/**
 * 로컬 스토리지 키
 */
const MEAL_PLAN_STORAGE_KEY = 'meal_plan_cache'

/**
 * 오늘 날짜 (YYYY-MM-DD)
 */
function getTodayDate(): string {
    return new Date().toISOString().split('T')[0]
}

/**
 * 오늘의 식단 조회 (로컬 스토리지 기반)
 */
export function getTodayMealPlan(userId: string): MealPlan | null {
    try {
        const cached = localStorage.getItem(MEAL_PLAN_STORAGE_KEY)
        if (!cached) return null

        const plan: MealPlan = JSON.parse(cached)

        // 유효성 검증
        if (plan.user_id !== userId) return null
        if (plan.date !== getTodayDate()) return null

        return plan
    } catch (error) {
        console.error('식단 조회 오류:', error)
        return null
    }
}

/**
 * 식단 저장 (로컬 스토리지)
 */
export function saveMealPlan(plan: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>): MealPlan {
    const fullPlan: MealPlan = {
        ...plan,
        id: `${plan.user_id}-${plan.date}`,
        created_at: new Date(),
        updated_at: new Date()
    }

    localStorage.setItem(MEAL_PLAN_STORAGE_KEY, JSON.stringify(fullPlan))
    return fullPlan
}

/**
 * 식단 업데이트 (로컬 스토리지)
 */
export function updateMealPlan(userId: string, meals: Meal[]): MealPlan | null {
    const existing = getTodayMealPlan(userId)
    if (!existing) return null

    const updated: MealPlan = {
        ...existing,
        meals,
        updated_at: new Date()
    }

    localStorage.setItem(MEAL_PLAN_STORAGE_KEY, JSON.stringify(updated))
    return updated
}

/**
 * 식단 삭제 (로컬 스토리지)
 */
export function deleteMealPlan(userId: string): void {
    const existing = getTodayMealPlan(userId)
    if (existing && existing.user_id === userId) {
        localStorage.removeItem(MEAL_PLAN_STORAGE_KEY)
    }
}

/**
 * 식단 유효성 검증
 * - 날짜가 오늘인지
 * - 회복 단계가 일치하는지
 */
export function isMealPlanValid(
    plan: MealPlan | null,
    currentPhase: 'liquid' | 'soft' | 'regular'
): boolean {
    if (!plan) return false
    if (plan.date !== getTodayDate()) return false
    if (plan.recovery_phase !== currentPhase) return false
    return true
}
