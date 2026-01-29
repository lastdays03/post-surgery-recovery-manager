import { describe, it, expect } from 'vitest'
import { calculateWeeklyProgress } from '@/lib/utils/analytics'
import { DailyLogEntry } from '@/lib/types/symptom.types'

describe('Weekly Analytics', () => {
    it('should calculate stats correctly for a given week', () => {
        const mockLogs: DailyLogEntry[] = [
            {
                profile_id: '1', log_date: '2026-05-01',
                symptoms: {
                    painLevel: 5,
                    energyLevel: 5,
                    mealIntake: 'moderate',
                    postMealSymptom: 'none',
                    bodyTemperature: 'normal',
                    bowelStatus: 'normal',
                    mostDifficult: 'none',
                    abnormalSymptoms: ['none']
                }
            },
            {
                profile_id: '1', log_date: '2026-05-02',
                symptoms: {
                    painLevel: 4,
                    energyLevel: 6,
                    mealIntake: 'good',
                    postMealSymptom: 'none',
                    bodyTemperature: 'normal',
                    bowelStatus: 'normal',
                    mostDifficult: 'none',
                    abnormalSymptoms: ['none']
                }
            },
            {
                profile_id: '1', log_date: '2026-05-03',
                symptoms: {
                    painLevel: 3,
                    energyLevel: 7,
                    mealIntake: 'good',
                    postMealSymptom: 'none',
                    bodyTemperature: 'normal',
                    bowelStatus: 'normal',
                    mostDifficult: 'none',
                    abnormalSymptoms: ['none']
                }
            }
        ]

        const report = calculateWeeklyProgress(mockLogs, '2026-05-01', '2026-05-07')

        expect(report.totalLogs).toBe(3)
        expect(report.avgPainLevel).toBe(4) // (5+4+3)/3
        expect(report.avgEnergyLevel).toBe(6) // (5+6+7)/3
        expect(report.symptomTrend).toBe('improving') // Pain going down
    })

    it('should handle empty logs', () => {
        const report = calculateWeeklyProgress([], '2026-05-01', '2026-05-07')
        expect(report.totalLogs).toBe(0)
        expect(report.avgPainLevel).toBe(0)
        expect(report.complianceRate).toBe(0)
    })
})
