'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/local-storage'
import { calculateRecoveryPhase, getDaysSinceSurgery, getPersonalizedAdvice, type PersonalizedAdvice } from '@/lib/profiling-engine'
import type { UserProfile } from '@/lib/types/user.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { Pencil, BarChart3 } from 'lucide-react'
import { ChatInterface } from '@/components/ai/chat-interface'
import { TodayMealSection } from '@/components/dashboard/today-meal-section'

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
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            안녕하세요!
                        </h1>
                        <p className="text-gray-600 mt-1">
                            오늘도 건강한 회복을 응원해요
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {!hasAdvancedMetrics && (
                            <Button
                                variant="outline"
                                onClick={() => router.push('/onboarding/document/advanced?from=dashboard')}
                                className="flex-1 sm:flex-none bg-white hover:bg-gray-50 border-gray-300"
                            >
                                자세한 의료 정보 입력
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard/profile')}
                            className="flex-1 sm:flex-none bg-white hover:bg-gray-50 border-gray-300"
                        >
                            내 정보 수정
                        </Button>
                    </div>
                </div>

                {/* Main Grid: Progress Card + Warning Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Main Progress Card (2/3 width) */}
                    <Card className="lg:col-span-2 p-8 bg-white shadow-sm border border-gray-200 rounded-2xl">
                        <div className="space-y-6">
                            <div>
                                <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-3">
                                    수술 후 {daysElapsed}일째
                                </span>
                                <h2 className="text-4xl font-bold text-gray-900 mb-1">
                                    {currentPhase.description}
                                </h2>
                                <p className="text-gray-500 text-sm">수술 직후</p>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <Progress value={progressValue} className="h-2 bg-gray-200" />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>수술 직후</span>
                                    <span>회복 완료 (예상)</span>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-sm text-gray-500">다음 단계까지</p>
                                <p className="text-lg font-semibold text-blue-600">아직 회복 중입니다</p>
                            </div>
                        </div>
                    </Card>

                    {/* Right: Warning Card (1/3 width) */}
                    <Card className="p-6 bg-pink-50 border-pink-200 border-2 rounded-2xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">현재 단계 주의사항</h3>
                        <ol className="space-y-2 text-sm text-gray-700">
                            {currentPhase.forbiddenFoods.slice(0, 2).map((food: string, index: number) => (
                                <li key={food} className="flex">
                                    <span className="font-medium mr-2">{index + 1}.</span>
                                    <span>{food} 섭취를 주의해주세요.</span>
                                </li>
                            ))}
                        </ol>
                    </Card>
                </div>

                {/* Today's Meal Section */}
                {profile?.id && <TodayMealSection userId={profile.id} />}

                {/* 오늘의 집중 관리 (개인화 조언) */}
                {adviceList.length > 0 && (
                    <section className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-900">오늘의 집중 관리</h3>
                        <Carousel
                            opts={{
                                align: "start",
                                loop: false,
                            }}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-4">
                                {adviceList.map((advice, index) => (
                                    <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                        <Card className={`p-5 border-l-4 shadow-sm rounded-xl h-full ${advice.type === 'warning' ? 'border-l-red-500 bg-red-50/50' :
                                                advice.type === 'info' ? 'border-l-blue-500 bg-blue-50/50' :
                                                    'border-l-green-500 bg-green-50/50'
                                            }`}>
                                            <p className={`font-bold text-sm mb-2 ${advice.type === 'warning' ? 'text-red-700' :
                                                    advice.type === 'info' ? 'text-blue-700' :
                                                        'text-green-700'
                                                }`}>
                                                {advice.category === 'nutrition' ? '영양 관리' :
                                                    advice.category === 'activity' ? '활동 가이드' : '증상 체크'}
                                            </p>
                                            <p className="text-gray-800 text-sm leading-relaxed">
                                                {advice.message}
                                            </p>
                                        </Card>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    </section>
                )}

                {/* Bottom Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button onClick={() => router.push('/symptom-check')} className="text-left">
                        <Card className="p-6 bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center shrink-0">
                                    <Pencil className="text-yellow-600" size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">컨디션 기록</h3>
                                    <p className="text-sm text-gray-600">
                                        통증, 체온, 기력을 기록해보세요
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </button>

                    <button onClick={() => router.push('/reports/weekly')} className="text-left">
                        <Card className="p-6 bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 via-green-400 to-purple-400 flex items-center justify-center shrink-0">
                                    <BarChart3 className="text-white" size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">주간 리포트</h3>
                                    <p className="text-sm text-gray-600">
                                        지난 일주일간의 변화를 파악해보세요
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </button>
                </div>
            </div>

            {/* Chat Widget */}
            {profile?.id && <ChatInterface userId={profile.id} />}
        </div>
    )
}
