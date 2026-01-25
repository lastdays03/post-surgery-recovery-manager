import type { Meal, MealPhase, MealTime, NutritionInfo } from '@/lib/types/meal.types'

/**
 * Filters meals by recovery phase
 * @param meals - Array of meals to filter
 * @param phase - Recovery phase to filter by
 * @returns Filtered array of meals matching the phase
 */
export function filterMealsByPhase(meals: Meal[], phase: string): Meal[] {
    // 간단한 매핑: 프로토콜 상의 phase 이름과 식단 데이터의 phase 이름이 다를 수 있음
    // 여기서는 일치한다고 가정하거나 매핑 로직 추가
    return meals.filter(meal => meal.phase === phase)
}

/**
 * Filters meals by meal time
 * @param meals - Array of meals to filter
 * @param mealTime - Meal time to filter by
 * @returns Filtered array of meals matching the meal time
 */
export function getMealsByTime(meals: Meal[], mealTime: MealTime): Meal[] {
    return meals.filter(meal => meal.mealTime === mealTime)
}

/**
 * Calculates total daily nutrition from a list of meals
 * @param meals - Array of meals to calculate nutrition for
 * @returns Total nutrition information
 */
export function calculateDailyNutrition(meals: Meal[]): NutritionInfo {
    return meals.reduce(
        (total, meal) => ({
            calories: total.calories + meal.nutrition.calories,
            protein: total.protein + meal.nutrition.protein,
            fat: total.fat + meal.nutrition.fat,
            carbs: total.carbs + meal.nutrition.carbs,
            fiber: (total.fiber || 0) + (meal.nutrition.fiber || 0)
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }
    )
}

/**
 * Gets random meal from filtered list
 * @param meals - Array of meals to choose from
 * @param phase - Recovery phase to filter by
 * @param mealTime - Meal time to filter by
 * @returns Random meal matching criteria or undefined
 */
export function getRandomMeal(
    meals: Meal[],
    phase: string,
    mealTime: MealTime
): Meal | undefined {
    const filtered = meals.filter(m => m.phase === phase && m.mealTime === mealTime)
    if (filtered.length === 0) return undefined
    const randomIndex = Math.floor(Math.random() * filtered.length)
    return filtered[randomIndex]
}
