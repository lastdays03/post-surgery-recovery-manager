'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getProfile } from '@/lib/local-storage'
import { getWeeklyLogs } from '@/lib/services/log-service'
import { calculateWeeklyProgress } from '@/lib/utils/analytics'
import { WeeklyReport } from '@/lib/types/report.types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function WeeklyReportPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [report, setReport] = useState<WeeklyReport | null>(null)

    useEffect(() => {
        async function loadData() {
            try {
                const profile = getProfile()
                if (!profile) {
                    router.push('/')
                    return
                }

                // Calculate date range (Last 7 days)
                const end = new Date()
                const start = new Date()
                start.setDate(end.getDate() - 6)

                const endDateStr = end.toISOString().split('T')[0]
                const startDateStr = start.toISOString().split('T')[0]

                const logs = await getWeeklyLogs(profile.id, startDateStr, endDateStr)
                const weeklyReport = calculateWeeklyProgress(logs, startDateStr, endDateStr)

                setReport(weeklyReport)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [router])

    if (loading) return <div className="p-8 text-center">분석 중입니다...</div>

    if (!report) return <div className="p-8 text-center">데이터를 불러올 수 없습니다.</div>

    return (
        <div className="container max-w-2xl mx-auto p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">주간 회복 리포트</h1>
                <Button size="sm" onClick={() => router.push('/dashboard')}>
                    대시보드
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500">평균 통증</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-500">
                            {report.avgPainLevel}
                            <span className="text-sm text-gray-400 ml-1">/ 10</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            {report.symptomTrend === 'improving' && '▼ 감소 추세'}
                            {report.symptomTrend === 'worsening' && '▲ 증가 추세'}
                            {report.symptomTrend === 'stable' && '- 변화 없음'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500">평균 기력</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-500">
                            {report.avgEnergyLevel}
                            <span className="text-sm text-gray-400 ml-1">/ 10</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>회복 추이 (최근 7일)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={report.dailyScores}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => str.slice(5)}
                                    fontSize={12}
                                />
                                <YAxis domain={[0, 10]} fontSize={12} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="pain" name="통증" stroke="#ef4444" strokeWidth={2} />
                                <Line type="monotone" dataKey="energy" name="기력" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-gray-600">
                        <p>기록 충실도: <span className="font-bold text-black">{report.complianceRate}%</span></p>
                        <p className="text-sm mt-1">
                            {report.complianceRate >= 80 ? '아주 훌륭해요! 꾸준한 기록이 회복에 도움이 됩니다.' : '조금 더 자주 기록해보세요.'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
