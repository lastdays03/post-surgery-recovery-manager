export interface UserProfile {
    id: string
    surgery_type: string
    surgery_date: Date
    digestive_capacity: 'good' | 'moderate' | 'poor'
    comorbidities: string[]
    weight?: number
    meal_preferences?: {
        favoriteFood?: string[]
        avoidIngredients?: string[]
        dietaryRestrictions?: string[]
    }
    created_at: Date
    updated_at: Date
}
