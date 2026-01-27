export interface BasicProfile {
    surgery_type: string
    surgery_date: string
    age?: number
    weight?: number
    height?: number
    digestive_capacity: 'good' | 'moderate' | 'poor'
    comorbidities: string[]
    allergies: string[] // Added allergies based on design decision
}

export interface AdvancedMedicalMetrics {
    nrs_2002_score?: number
    weight_change_6m?: number // kg (negative for loss)
    bmi?: number
    sga_grade?: 'A' | 'B' | 'C'
    serum_albumin?: number // g/L
    oral_intake_possible?: boolean
    expected_fasting_days?: number
    intake_rate?: number // %
    gastric_emptying_delayed?: boolean
    has_gerd?: boolean
    has_sarcopenia?: boolean
}

export interface UserProfile {
    id: string
    basic: BasicProfile
    advanced?: AdvancedMedicalMetrics
    advanced_enabled: boolean
    data_source: 'manual' | 'document'
    created_at: string
    updated_at: string
}

export interface FieldExtractionResult<T> {
    value: T | null
    confidence: number // 0-1
    sourceText?: string
}

export interface MedicalDataExtraction {
    basic: {
        surgery_type: FieldExtractionResult<string>
        surgery_date: FieldExtractionResult<string>
        age: FieldExtractionResult<number>
        weight: FieldExtractionResult<number>
        height: FieldExtractionResult<number>
        digestive_capacity: FieldExtractionResult<'good' | 'moderate' | 'poor'>
        comorbidities: FieldExtractionResult<string[]>
        allergies: FieldExtractionResult<string[]>
    }
    advanced: {
        nrs_2002_score: FieldExtractionResult<number>
        weight_change_6m: FieldExtractionResult<number>
        bmi: FieldExtractionResult<number>
        sga_grade: FieldExtractionResult<'A' | 'B' | 'C'>
        serum_albumin: FieldExtractionResult<number>
        oral_intake_possible: FieldExtractionResult<boolean>
        expected_fasting_days: FieldExtractionResult<number>
        intake_rate: FieldExtractionResult<number>
        gastric_emptying_delayed: FieldExtractionResult<boolean>
        has_gerd: FieldExtractionResult<boolean>
        has_sarcopenia: FieldExtractionResult<boolean>
    }
    hasAdvancedData: boolean
    rawText: string
}
