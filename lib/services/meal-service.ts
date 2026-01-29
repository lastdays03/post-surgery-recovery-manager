import type { Meal } from '@/lib/types/meal.types'
import { supabase } from '@/lib/supabase-client'
import { format } from 'date-fns'

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
/**
 * 로컬 스토리지 키
 */
const MEAL_PLAN_STORAGE_KEY = 'meal_plan_cache'
const CACHE_TIMESTAMP_KEY = 'meal_plan_cache_timestamp'
const CACHE_TTL_MS = 10 * 60 * 1000 // 10분

/**
 * 로컬 스토리지 저장 헬퍼 (데이터 + 타임스탬프)
 */
function saveToLocalStorage(plan: MealPlan) {
    localStorage.setItem(MEAL_PLAN_STORAGE_KEY, JSON.stringify(plan))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
}

/**
 * 오늘 날짜 (YYYY-MM-DD)
 */
export function getTodayDate(): string {
    return format(new Date(), 'yyyy-MM-dd')
}

/**
 * [DB] 오늘의 식단 조회
 */
/**
 * [DB] 특정 날짜의 식단 조회 (기본값: 오늘)
 */
export async function fetchMealPlan(userId: string, date?: string): Promise<MealPlan | null> {
    try {
        const targetDate = date || getTodayDate()
        console.log(`[MealService] Fetching meal plan for User: ${userId}, Date: ${targetDate}`)

        const { data: dbData, error } = await (supabase as any)
            .from('meal_plans')
            .select('*')
            .eq('user_id', userId)
            .eq('date', targetDate)
            .single()

        if (dbData) {
            console.log(`[MealService] Found plan via DB. ID: ${dbData.id}, Phase: ${dbData.recovery_phase}`)
        } else {
            console.log(`[MealService] No plan found via DB. Error:`, error)
        }

        const data = dbData as any

        if (error) {
            if (error.code === 'PGRST116') {
                return null
            }
            console.error('DB 식단 조회 오류:', error)
            return null
        }

        if (data) {
            let parsedMeals: Meal[] = []
            if (typeof data.meals === 'string') {
                try {
                    parsedMeals = JSON.parse(data.meals)
                } catch (e) {
                    console.error('JSON Parse Error (meals):', e)
                    parsedMeals = []
                }
            } else if (Array.isArray(data.meals)) {
                parsedMeals = data.meals as Meal[]
            }

            if (parsedMeals.length === 1 && Array.isArray(parsedMeals[0])) {
                parsedMeals = (parsedMeals[0] as unknown) as Meal[]
            }

            const plan: MealPlan = {
                ...data,
                meals: parsedMeals,
                preferences: typeof data.preferences === 'string' ? JSON.parse(data.preferences) : (data.preferences as any),
                created_at: new Date(data.created_at),
                updated_at: new Date(data.updated_at)
            }

            return plan
        }
        return null

    } catch (error) {
        console.error('식단 조회 예외:', error)
        return null
    }
}



/**
 * [Deprecated] 오늘의 식단 조회 (로컬 스토리지 기반 - 하위 호환)
 * fetchMealPlan 사용 권장
 */
export async function fetchTodayMealPlan(userId: string): Promise<MealPlan | null> {
    return fetchMealPlan(userId)
}

/**
 * [Deprecated] 오늘의 식단 조회 (로컬 스토리지 기반 - 동기)
 * 하위 호환성을 위해 유지하되, 가능한 fetchTodayMealPlan 사용 권장
 */
export function getTodayMealPlan(userId: string): MealPlan | null {
    try {
        const cached = localStorage.getItem(MEAL_PLAN_STORAGE_KEY)
        if (!cached) {
            console.log('[MealService] No local cache found.')
            return null
        }

        const plan: MealPlan = JSON.parse(cached)
        const today = getTodayDate()

        if (plan.user_id !== userId) {
            console.log(`[MealService] Cache ignored: User ID mismatch. (Cache: ${plan.user_id} vs Current: ${userId})`)
            return null
        }
        if (plan.date !== today) {
            console.log(`[MealService] Cache ignored: Date mismatch. (Cache: ${plan.date} vs Today: ${today})`)
            return null
        }

        console.log('[MealService] Local cache hit!')
        return plan
    } catch (error) {
        console.error('로컬 식단 조회 오류:', error)
        return null
    }
}

/**
 * 캐시 유효성 검사 (TTL 기반)
 * @returns true: 캐시 유효함 (DB 조회 스킵 가능), false: 만료됨 (DB 조회 필요)
 */
export function isCacheValid(): boolean {
    const timestampStr = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    if (!timestampStr) return false

    const timestamp = parseInt(timestampStr, 10)
    const now = Date.now()

    // 유효 기간(10분) 이내인지 확인
    return (now - timestamp) < CACHE_TTL_MS
}

/**
 * [DB] 식단 저장 (Insert/Upsert)
 */
export async function saveMealPlanToDB(plan: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>): Promise<MealPlan | null> {
    try {
        // 1. DB 저장
        const { data: dbData, error } = await (supabase as any)
            .from('meal_plans')
            .upsert({
                user_id: plan.user_id,
                date: plan.date,
                recovery_phase: plan.recovery_phase,
                meals: plan.meals, // JSONB 타입이므로 객체 배열 그대로 전달
                preferences: plan.preferences
            } as any, { onConflict: 'user_id, date' }) // 유니크 키 충돌 시 업데이트하도록 명시
            .select()
            .single()

        const data = dbData as any

        if (error) {
            console.error('DB 식단 저장 오류:', error)
            throw error
        }

        // 2. 반환된 데이터로 객체 생성
        const savedPlan: MealPlan = {
            ...data,
            id: data.id,
            meals: typeof data.meals === 'string' ? JSON.parse(data.meals) : (data.meals as Meal[]),
            preferences: typeof data.preferences === 'string' ? JSON.parse(data.preferences) : (data.preferences as any),
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at)
        }

        // 3. 로컬 스토리지 백업
        saveToLocalStorage(savedPlan)

        return savedPlan
    } catch (e) {
        console.error('식단 저장 실패:', e)
        // 실패 시 로컬 스토리지라도 저장 (임시)
        return saveMealPlan(plan)
    }
}

/**
 * [Deprecated] 식단 저장 (로컬 스토리지)
 */
export function saveMealPlan(plan: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>): MealPlan {
    const fullPlan: MealPlan = {
        ...plan,
        id: `${plan.user_id}-${plan.date}`,
        created_at: new Date(),
        updated_at: new Date()
    }

    saveToLocalStorage(fullPlan)
    return fullPlan
}

/**
 * [DB] 식단 업데이트
 */
/**
 * [DB] 식단 업데이트
 */
export async function updateMealPlanInDB(userId: string, meals: Meal[]): Promise<MealPlan | null> {
    try {
        const { data: dbData, error } = await (supabase as any)
            .from('meal_plans')
            .update({
                meals: meals,
                updated_at: new Date().toISOString()
            } as any)
            .eq('user_id', userId)
            .eq('date', getTodayDate())
            .select()
            .single()

        const data = dbData as any

        if (error) throw error

        if (data) {
            const updatedPlan: MealPlan = {
                ...data,
                meals: typeof data.meals === 'string' ? JSON.parse(data.meals) : (data.meals as Meal[]),
                preferences: typeof data.preferences === 'string' ? JSON.parse(data.preferences) : (data.preferences as any),
                created_at: new Date(data.created_at),
                updated_at: new Date(data.updated_at)
            }
            // 로컬 스토리지 업데이트
            saveToLocalStorage(updatedPlan)
            return updatedPlan
        }
        return null
    } catch (e) {
        console.error('DB 식단 업데이트 실패:', e)
        // 실패 시 로컬 스토리지 업데이트 시도
        return updateMealPlan(userId, meals)
    }
}

/**
 * [Deprecated] 식단 업데이트 (로컬 스토리지)
 */
export function updateMealPlan(userId: string, meals: Meal[]): MealPlan | null {
    const existing = getTodayMealPlan(userId)
    if (!existing) return null

    const updated: MealPlan = {
        ...existing,
        meals,
        updated_at: new Date()
    }

    saveToLocalStorage(updated)
    return updated
}

/**
 * 식단 유효성 검증
 */
/**
 * 식단 유효성 검증
 */
export function isMealPlanValid(
    plan: MealPlan | null,
    currentPhase: 'liquid' | 'soft' | 'regular',
    expectedDate?: string
): boolean {
    if (!plan) return false

    const targetDate = expectedDate || getTodayDate()
    if (plan.date !== targetDate) return false

    if (plan.recovery_phase !== currentPhase) return false

    // 식단 데이터가 비어있으면 무효
    if (!plan.meals || plan.meals.length === 0) return false

    return true
}

/**
 * [DB] 월간 식단 통계 조회 (캘린더용)
 * 특정 월의 식단 존재 여부만 조회
 */
export async function fetchMonthlyMealStats(
    userId: string,
    year: number,
    month: number
): Promise<{ date: string; hasPlan: boolean; meals: { type: string; names: string[] }[] }[]> {
    try {
        // 해당 월의 1일과 마지막 날 계산
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`
        // 다음 달 1일에서 하루 빼서 마지막 날 구하기 (간단하게 해당 월의 말일 계산)
        const lastDay = new Date(year, month, 0).getDate()
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

        const { data, error } = await (supabase as any)
            .from('meal_plans')
            .select('date, meals')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)

        if (error) {
            console.error('월간 식단 통계 조회 오류:', error)
            return []
        }

        if (!data) return []

        const result = (data as { date: string, meals: any }[]).map(item => {
            let meals: Meal[] = []
            if (typeof item.meals === 'string') {
                try {
                    meals = JSON.parse(item.meals)
                } catch (e) {
                    meals = []
                }
            } else if (Array.isArray(item.meals)) {
                meals = item.meals
            } else if (item.meals && Array.isArray((item.meals as any)[0])) {
                // Handle double nested array case if it exists in DB due to previous bugs
                meals = (item.meals as any)[0]
            }

            // Group by mealTime to combine multiple items for the same slot (e.g. snacks)
            const grouped = meals.reduce((acc, m) => {
                const key = m.mealTime
                if (!acc[key]) acc[key] = []
                acc[key].push(m.name)
                return acc
            }, {} as Record<string, string[]>)

            // Sort order: breakfast -> lunch -> dinner -> snack -> others
            const order = ['breakfast', 'lunch', 'dinner', 'snack']

            const mealDetails = Object.entries(grouped)
                .map(([type, names]) => ({
                    type,
                    names
                }))
                .sort((a, b) => {
                    const idxA = order.indexOf(a.type)
                    const idxB = order.indexOf(b.type)
                    const valA = idxA === -1 ? 99 : idxA
                    const valB = idxB === -1 ? 99 : idxB
                    if (valA === valB) return a.type.localeCompare(b.type)
                    return valA - valB
                })

            return {
                date: item.date,
                hasPlan: true,
                meals: mealDetails
            }
        })

        return result
    } catch (error) {
        console.error('월간 식단 통계 조회 예외:', error)
        return []
    }
}
