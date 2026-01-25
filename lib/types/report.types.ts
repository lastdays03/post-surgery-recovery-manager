export interface WeeklyStats {
    periodStart: string
    periodEnd: string
    avgPainLevel: number
    avgEnergyLevel: number
    symptomTrend: 'improving' | 'worsening' | 'stable'
    complianceRate: number // 0-100 percentage of logs filled
    totalLogs: number
}

export interface WeeklyReport extends WeeklyStats {
    dailyScores: { date: string; pain: number; energy: number }[]
}
