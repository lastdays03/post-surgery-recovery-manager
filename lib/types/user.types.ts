export interface UserProfile {
    id: string
    surgery_type: string
    surgery_date: Date
    digestive_capacity: 'good' | 'moderate' | 'poor'
    comorbidities: string[]
    weight?: number
    created_at: Date
    updated_at: Date
}
