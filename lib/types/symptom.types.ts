export type MealIntakeStatus = 'none' | 'bad' | 'moderate' | 'good'
export type PostMealSymptom = 'bloating' | 'distension' | 'heartburn' | 'nausea' | 'none'
export type BodyTemperatureStatus = 'normal' | 'mild_fever' | 'high_fever'
export type BowelStatus = 'normal' | 'constipation' | 'diarrhea' | 'none'
export type MostDifficultAspect = 'meal' | 'pain' | 'sleep' | 'activity' | 'none'
export type AbnormalSymptom = 'wound_pain_increase' | 'wound_redness' | 'severe_abdominal_pain' | 'vomiting' | 'none'

export interface SymptomLog {
    painLevel: number              // 0-10
    energyLevel: number            // 0-10
    mealIntake: MealIntakeStatus   // 식사 섭취율
    postMealSymptom: PostMealSymptom  // 식사 후 증상
    bodyTemperature: BodyTemperatureStatus  // 체온 이상 여부
    bowelStatus: BowelStatus       // 배변 상태
    mostDifficult: MostDifficultAspect  // 오늘 가장 힘들었던 점
    abnormalSymptoms: AbnormalSymptom[]  // 특이 증상 체크 (복수 선택)
}

export interface DailyLogEntry {
    profile_id: string
    log_date: string
    symptoms: SymptomLog
}
