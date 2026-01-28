'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile, clearProfile } from '@/lib/local-storage'
import { calculateRecoveryPhase, getDaysSinceSurgery, getPersonalizedAdvice, type PersonalizedAdvice } from '@/lib/profiling-engine'
import type { UserProfile } from '@/lib/types/user.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Activity, Apple, Calendar, Settings, BarChart2, AlertTriangle, CheckCircle, Info, ChevronRight } from 'lucide-react'
import { ChatInterface } from '@/components/ai/chat-interface'

export default function DashboardPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [daysElapsed, setDaysElapsed] = useState(0)
    const [currentPhase, setCurrentPhase] = useState<any>(null)
    const [adviceList, setAdviceList] = useState<PersonalizedAdvice[]>([])
    const [progressValue, setProgressValue] = useState(0)
    const [hasAdvancedMetrics, setHasAdvancedMetrics] = useState(true)

    useEffect(() => {
        const savedProfile = getProfile()
        if (!savedProfile) {
            router.push('/onboarding')
            return
        }

        // 데이터 복원 및 변환
        const userProfile: UserProfile = {
            ...savedProfile,
            surgery_date: new Date(savedProfile.surgery_date),
            created_at: new Date(savedProfile.created_at),
            updated_at: new Date(savedProfile.updated_at)
        }
        setProfile(userProfile)

        // 엔진 계산
        const days = getDaysSinceSurgery(userProfile.surgery_date)
        setDaysElapsed(days)

        try {
            const phase = calculateRecoveryPhase(userProfile)
            setCurrentPhase(phase)

            // 전체 회복 기간(예: 8주=56일) 대비 진행률 계산 (임의 기준)
            const progress = Math.min((days / 60) * 100, 100)
            setProgressValue(progress)

            // 개인화 조언 생성
            const advices = getPersonalizedAdvice(userProfile)
            setAdviceList(advices)

            // 고급 지표 유무 확인 (필드 하나라도 있으면 있는 것으로 간주)
            const metrics = userProfile.advanced_metrics
            const hasMetrics = !!(metrics && Object.values(metrics).some(v => v !== undefined && v !== null && v !== ''))
            setHasAdvancedMetrics(hasMetrics)

        } catch (e) {
            console.error(e)
        }

    }, [router])


    if (!profile || !currentPhase) return null

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header Section */}
            {/* Header Section */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-gray-800">내 회복 대시보드</h1>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                            안녕하세요, 환자분! 👋
                        </h1>
                        <p className="text-gray-600 mt-1">
                            오늘도 건강한 회복을 응원합니다.
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {!hasAdvancedMetrics && (
                            <Button
                                variant="outline"
                                onClick={() => router.push('/onboarding/document/advanced?from=dashboard')}
                                className="flex-1 sm:flex-none text-blue-600 border-blue-200 hover:bg-blue-50 whitespace-nowrap"
                            >
                                자세한 의료 정보 입력
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => router.push('/dashboard/profile')} className="flex-1 sm:flex-none text-gray-600 border-gray-300 hover:bg-gray-50 whitespace-nowrap">
                            <Settings size={16} className="mr-2" /> 내 정보 수정
                        </Button>
                    </div>
                </div>

                {/* 메인 상태 카드 (Hero Section) */}
                <Card className="p-6 sm:p-8 bg-white shadow-xl border-0 rounded-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                            <div>
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-2">
                                    수술 후 {daysElapsed}일째
                                </span>
                                <h2 className="text-3xl font-extrabold text-gray-900 mt-1">
                                    {currentPhase.description}
                                </h2>
                            </div>
                            <div className="mt-4 md:mt-0 text-right">
                                <p className="text-sm text-gray-500">다음 단계까지</p>
                                <p className="text-lg font-bold text-blue-600">아직 회복 중입니다 💪</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-500 font-medium">
                                <span>수술 직후</span>
                                <span>회복 완료 (예상)</span>
                            </div>
                            <Progress value={progressValue} className="h-3 bg-gray-100" />
                        </div>
                    </div>
                </Card>

                {/* 오늘의 집중 관리 (개인화 조언) */}
                {adviceList.length > 0 && (
                    <section>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Info size={20} className="text-blue-600" />
                            오늘의 집중 관리 포인트
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {adviceList.map((advice, index) => (
                                <Card key={index} className={`p-5 border-l-4 shadow-sm ${advice.type === 'warning' ? 'border-l-red-500 bg-red-50/50' :
                                    advice.type === 'info' ? 'border-l-blue-500 bg-blue-50/50' :
                                        'border-l-green-500 bg-green-50/50'
                                    }`}>
                                    <div className="flex items-start gap-3">
                                        {advice.type === 'warning' ? <AlertTriangle className="text-red-500 shrink-0" size={20} /> :
                                            advice.type === 'info' ? <Info className="text-blue-500 shrink-0" size={20} /> :
                                                <CheckCircle className="text-green-500 shrink-0" size={20} />}

                                        <div>
                                            <p className={`font-bold text-sm mb-1 ${advice.type === 'warning' ? 'text-red-700' :
                                                advice.type === 'info' ? 'text-blue-700' :
                                                    'text-green-700'
                                                }`}>
                                                {advice.category === 'nutrition' ? '영양 관리' :
                                                    advice.category === 'activity' ? '활동 가이드' : '증상 체크'}
                                            </p>
                                            <p className="text-gray-800 text-sm leading-relaxed">
                                                {advice.message}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* 단계별 경고 (Legacy support) - 위치 상향 조정 */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <p className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                        <AlertTriangle size={18} />
                        현재 단계 주의사항
                    </p>
                    <ul className="list-disc list-inside text-amber-700 text-sm space-y-1 ml-1">
                        {currentPhase.forbiddenFoods.map((food: string) => (
                            <li key={food}>{food} 섭취를 주의해주세요.</li>
                        ))}
                    </ul>
                </div>

                {/* 주요 기능 바로가기 (Action Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button onClick={() => router.push('/meal-plan')} className="group text-left h-full">
                        <Card className="p-6 h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-green-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Apple size={60} />
                            </div>
                            <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center text-green-600 mb-4">
                                <Apple size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">맞춤 식단 가이드</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                현재 단계({currentPhase.name})에 딱 맞는<br />오늘의 추천 식단을 확인하세요.
                            </p>
                            <span className="text-green-600 text-sm font-bold flex items-center group-hover:translate-x-1 transition-transform">
                                보러가기 <ChevronRight size={16} />
                            </span>
                        </Card>
                    </button>

                    <button onClick={() => router.push('/symptom-check')} className="group text-left h-full">
                        <Card className="p-6 h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-red-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Activity size={60} />
                            </div>
                            <div className="bg-red-100 w-12 h-12 rounded-xl flex items-center justify-center text-red-600 mb-4">
                                <Activity size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">컨디션 기록</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                통증, 체온, 기력을 기록하고<br />회복 추이를 모니터링하세요.
                            </p>
                            <span className="text-red-600 text-sm font-bold flex items-center group-hover:translate-x-1 transition-transform">
                                기록하기 <ChevronRight size={16} />
                            </span>
                        </Card>
                    </button>

                    <button onClick={() => router.push('/reports/weekly')} className="group text-left h-full">
                        <Card className="p-6 h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <BarChart2 size={60} />
                            </div>
                            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                                <BarChart2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">주간 리포트</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                지난 일주일간의 변화를<br />한눈에 파악해보세요.
                            </p>
                            <span className="text-blue-600 text-sm font-bold flex items-center group-hover:translate-x-1 transition-transform">
                                분석보기 <ChevronRight size={16} />
                            </span>
                        </Card>
                    </button>
                </div>


            </div>

            {/* Chat Widget */}
            {profile?.id && <ChatInterface userId={profile.id} />}
        </div>
    )
}
