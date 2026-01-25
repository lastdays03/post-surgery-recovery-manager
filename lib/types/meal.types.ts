/**
 * Meal categories based on recovery phase
 */
export type MealPhase = 'liquid' | 'pureed' | 'soft' | 'regular'

/**
 * Meal time of day
 */
export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'snack'

/**
 * Nutritional information for a meal
 */
export interface NutritionInfo {
    /** Calories in kcal */
    calories: number
    /** Protein in grams */
    protein: number
    /** Fat in grams */
    fat: number
    /** Carbohydrates in grams */
    carbs: number
    /** Fiber in grams (optional) */
    fiber?: number
}

/**
 * Individual meal item
 */
export interface Meal {
    /** Unique identifier */
    id: string
    /** Meal name in Korean */
    name: string
    /** Recovery phase this meal is suitable for */
    phase: MealPhase
    /** Meal time */
    mealTime: MealTime
    /** Nutritional information */
    nutrition: NutritionInfo
    /** Ingredients list */
    ingredients: string[]
    /** Preparation instructions */
    instructions: string[]
    /** Preparation time in minutes */
    prepTime: number
    /** Portion size description */
    portionSize: string
    /** Additional notes or warnings */
    notes?: string
}

/**
 * Daily meal plan
 */
export interface DailyMealPlan {
    breakfast: Meal
    lunch: Meal
    dinner: Meal
    snacks: Meal[]
}
