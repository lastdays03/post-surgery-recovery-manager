import type { Meal } from '@/lib/types/meal.types'
import { supabase } from '@/lib/supabase-client'

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
    return new Date().toISOString().split('T')[0]
}

/**
 * [DB] 오늘의 식단 조회
 */
export async function fetchTodayMealPlan(userId: string): Promise<MealPlan | null> {
    try {
        const today = getTodayDate()
        const { data: dbData, error } = await (supabase as any)
            .from('meal_plans')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single()

        const data = dbData as any

        if (error) {
            if (error.code === 'PGRST116') {
                // 데이터 없음 (정상)
                return null
            }
            console.error('DB 식단 조회 오류:', error)
            return null
        }

        if (data) {
            // DB 데이터를 MealPlan 형식으로 변환
            // Supabase에서 JSONB는 자동으로 파싱되어 객체/배열로 반환될 수 있음
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

            // 🚨 방어 로직: 만약 파싱된 결과가 [[{...}, {...}]] 형태의 이중 배열이라면 평탄화 수행
            if (parsedMeals.length === 1 && Array.isArray(parsedMeals[0])) {
                console.log('⚠️ 이중 배열(Nested Array) 데이터 감지됨 - 평탄화 수행')
                parsedMeals = (parsedMeals[0] as unknown) as Meal[]
            }

            console.log(`[DB Load] ID: ${data.id}, Date: ${data.date}, Meals Count: ${parsedMeals?.length || 0}`)

            const plan: MealPlan = {
                ...data,
                meals: parsedMeals,
                preferences: typeof data.preferences === 'string' ? JSON.parse(data.preferences) : (data.preferences as any),
                created_at: new Date(data.created_at),
                updated_at: new Date(data.updated_at)
            }

            // 로컬 스토리지 캐시 업데이트 (타임스탬프 포함)
            saveToLocalStorage(plan)
            return plan
        }
        return null

    } catch (error) {
        console.error('식단 조회 예외:', error)
        return null
    }
}

/**
 * [Deprecated] 오늘의 식단 조회 (로컬 스토리지 기반 - 동기)
 * 하위 호환성을 위해 유지하되, 가능한 fetchTodayMealPlan 사용 권장
 */
export function getTodayMealPlan(userId: string): MealPlan | null {
    try {
        const cached = localStorage.getItem(MEAL_PLAN_STORAGE_KEY)
        if (!cached) return null

        const plan: MealPlan = JSON.parse(cached)

        if (plan.user_id !== userId) return null
        if (plan.date !== getTodayDate()) return null

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
export async function updateMealPlanInDB(userId: string, meals: Meal[]): Promise<MealPlan | null> {
    const today = getTodayDate()
    try {
        const { data: dbData, error } = await (supabase as any)
            .from('meal_plans')
            .update({
                meals: meals,
                updated_at: new Date().toISOString()
            } as any)
            .eq('user_id', userId)
            .eq('date', today)
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
export function isMealPlanValid(
    plan: MealPlan | null,
    currentPhase: 'liquid' | 'soft' | 'regular'
): boolean {
    if (!plan) return false
    if (plan.date !== getTodayDate()) return false
    // 로컬 스토리지 데이터일 경우 phase 검증이 필요할 수 있으나, 
    // DB 데이터는 이미 date+userId로 유니크하므로 phase가 달라도 보여줄지 말지 결정해야 함.
    // 일단 엄격하게 체크
    if (plan.recovery_phase !== currentPhase) return false

    // 식단 데이터가 비어있으면 무효
    if (!plan.meals || plan.meals.length === 0) return false

    return true
}
