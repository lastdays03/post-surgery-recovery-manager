export type DIGESTIVE_STATUS = 'good' | 'moderate' | 'bad' | 'none'

export interface SymptomLog {
    painLevel: number
    digestiveStatus: DIGESTIVE_STATUS
    energyLevel: number
    notes?: string
    // Additional dynamic fields can be stored in metadata or extended types
    customSymptoms?: Record<string, any>
}

export interface DailyLogEntry {
    profile_id: string
    log_date: string
    symptoms: SymptomLog
}
