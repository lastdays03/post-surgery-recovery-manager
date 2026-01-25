import { DailyLogEntry } from '@/lib/types/symptom.types'
import { WeeklyReport } from '@/lib/types/report.types'

export function calculateWeeklyProgress(
    logs: DailyLogEntry[],
    startDate: string,
    endDate: string
): WeeklyReport {
    // Filter logs within range
    const filteredLogs = logs.filter((log) => {
        return log.log_date >= startDate && log.log_date <= endDate
    })

    const totalLogs = filteredLogs.length

    // Calculate compliance (assuming 7 days in period)
    // Simple logic: totalLogs / 7 * 100. Or dates difference. 
    // Let's assume passed dates imply 7 days for "Weekly".
    // Actually, standard period is 7 days.
    const periodDays = 7
    const complianceRate = Math.min(100, Math.round((totalLogs / periodDays) * 100))

    if (totalLogs === 0) {
        return {
            periodStart: startDate,
            periodEnd: endDate,
            avgPainLevel: 0,
            avgEnergyLevel: 0,
            symptomTrend: 'stable',
            complianceRate: 0,
            totalLogs: 0,
            dailyScores: [],
        }
    }

    // Calculate Averages
    const totalPain = filteredLogs.reduce((sum, log) => sum + log.symptoms.painLevel, 0)
    const totalEnergy = filteredLogs.reduce((sum, log) => sum + log.symptoms.energyLevel, 0)

    const avgPainLevel = Number((totalPain / totalLogs).toFixed(1))
    const avgEnergyLevel = Number((totalEnergy / totalLogs).toFixed(1))

    // Determine Trend (comparing start of week vs end of week logs?)
    // Simple heuristic: compare first half average vs last half ? 
    // Or just slope.
    // Test expectation: 'improving' (Pain going down: 5 -> 3)
    // Let's sort logs by date
    const sortedLogs = [...filteredLogs].sort((a, b) => a.log_date.localeCompare(b.log_date))

    // Compare first log vs last log for simple trend
    const firstLog = sortedLogs[0]
    const lastLog = sortedLogs[sortedLogs.length - 1]

    let symptomTrend: 'improving' | 'worsening' | 'stable' = 'stable'

    if (firstLog && lastLog) {
        const painDiff = lastLog.symptoms.painLevel - firstLog.symptoms.painLevel
        if (painDiff < 0) symptomTrend = 'improving' // Pain decreased
        else if (painDiff > 0) symptomTrend = 'worsening'
        else symptomTrend = 'stable'
    }

    // Daily scores for chart
    const dailyScores = sortedLogs.map((log) => ({
        date: log.log_date,
        pain: log.symptoms.painLevel,
        energy: log.symptoms.energyLevel
    }))

    return {
        periodStart: startDate,
        periodEnd: endDate,
        avgPainLevel,
        avgEnergyLevel,
        symptomTrend,
        complianceRate,
        totalLogs,
        dailyScores,
    }
}
