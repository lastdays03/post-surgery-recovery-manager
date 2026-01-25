export interface RecoveryPhase {
    name: string
    daysRange: [number, number]
    description: string
    forbiddenFoods: string[]
}

export interface RehabPhase {
    name: string
    weekRange: [number, number]
    description: string
    allowedExercises: string[]
    warnings?: string[]
}

export interface SurgeryProtocol {
    phases: RecoveryPhase[]
    nutritionRequirements: {
        proteinMultiplier: number
        calorieTarget: number
        maxFatPerMeal?: number
    }
    rehabPhases?: RehabPhase[]
}

export type SurgeryType =
    | 'gastric_resection'
    | 'colon_resection'
    | 'tkr'
    | 'spinal_fusion'
    | 'cholecystectomy'
