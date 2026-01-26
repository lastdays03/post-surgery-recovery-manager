export interface RecoveryPhase {
    name: string
    daysRange: [number, number]
    description: string
    forbiddenFoods: string[]
    guidelines?: string[]
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
        supplements?: string[]
    }
    rehabPhases?: RehabPhase[]
}

export type SurgeryType =
    | 'gastric_resection'
    | 'colon_resection'
    | 'tkr'
    | 'spinal_fusion'
    | 'spinal_surgery'
    | 'cholecystectomy'
    | 'tha'
    | 'acl_reconstruction'
    | 'esophagectomy'
    | 'smile_lasik'
    | 'rotator_cuff'
    | 'general'
