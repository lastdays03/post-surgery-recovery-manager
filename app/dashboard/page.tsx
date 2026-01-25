'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile, clearProfile } from '@/lib/local-storage'
import { calculateRecoveryPhase, getDaysSinceSurgery } from '@/lib/profiling-engine'
import type { UserProfile } from '@/lib/types/user.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, Apple, Calendar, Settings, BarChart2 } from 'lucide-react'
import { ChatInterface } from '@/components/ai/chat-interface'

export default function DashboardPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<any | null>(null)
    const [daysElapsed, setDaysElapsed] = useState(0)
    const [currentPhase, setCurrentPhase] = useState<any>(null)

    useEffect(() => {
        const savedProfile = getProfile()
        if (!savedProfile) {
            router.push('/onboarding')
            return
        }

        setProfile(savedProfile)

        // 계산 로직
        const userProfile: UserProfile = {
            ...savedProfile,
            surgery_date: new Date(savedProfile.surgery_date),
            created_at: new Date(savedProfile.created_at),
            updated_at: new Date(savedProfile.updated_at)
        }

        setDaysElapsed(getDaysSinceSurgery(userProfile.surgery_date))
        try {
            setCurrentPhase(calculateRecoveryPhase(userProfile))
        } catch (e) {
            console.error(e)
        }

    }, [router])

    const handleReset = () => {
        if (confirm('모든 데이터를 초기화하고 처음으로 돌아가시겠습니까?')) {
            clearProfile()
            router.push('/')
        }
    }

    if (!profile || !currentPhase) return null

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">회복 관리 대시보드</h1>
                        <p className="text-gray-700 font-medium">오늘도 건강한 회복을 응원합니다!</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleReset} className="flex items-center gap-2">
                        <Settings size={18} /> 초기화
                    </Button>
                </div>

                {/* Main Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card className="shadow-lg border-2 border-blue-100">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                                <Calendar size={28} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">수술 {daysElapsed}일차</h2>
                        </div>
                        <p className="text-gray-700 text-lg mb-2 font-bold">현재 진행 단계</p>
                        <p className="text-4xl font-bold mb-6 text-blue-600">{currentPhase.description}</p>
                        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                            <p className="font-bold text-blue-800 mb-2">주의사항</p>
                            <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
                                {currentPhase.forbiddenFoods.map((food: string) => (
                                    <li key={food}>{food} 섭취 주의</li>
                                ))}
                            </ul>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 gap-6">
                        <button onClick={() => router.push('/meal-plan')} className="block text-left">
                            <Card className="hover:shadow-xl transition-shadow cursor-pointer h-full border-2 border-transparent hover:border-green-500">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-green-100 rounded-full text-green-600">
                                        <Apple size={24} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">식단 가이드</h2>
                                </div>
                                <p className="text-gray-700 font-medium">
                                    현재 <strong>{currentPhase.name}</strong> 단계에 맞는<br />
                                    오늘의 추천 식단을 확인하세요.
                                </p>
                            </Card>
                        </button>

                        <button onClick={() => router.push('/symptom-check')} className="block text-left">
                            <Card className="hover:shadow-xl transition-shadow cursor-pointer h-full border-2 border-transparent hover:border-red-500">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-red-100 rounded-full text-red-600">
                                        <Activity size={24} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">오늘의 컨디션</h2>
                                </div>
                                <p className="text-gray-700 font-medium">
                                    통증과 기력을 기록하고<br />
                                    하루 하루의 회복을 추적하세요.
                                </p>
                            </Card>
                        </button>

                        <button onClick={() => router.push('/reports/weekly')} className="block text-left">
                            <Card className="hover:shadow-xl transition-shadow cursor-pointer h-full border-2 border-transparent hover:border-blue-500">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                                        <BarChart2 size={24} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">주간 리포트</h2>
                                </div>
                                <p className="text-gray-700 font-medium">
                                    지난 일주일간의 회복 추세와<br />
                                    통계 데이터를 확인하세요.
                                </p>
                            </Card>
                        </button>
                    </div>
                </div>

            </div>

            {/* Chat Widget */}
            {profile?.id && <ChatInterface userId={profile.id} />}
        </div>
    )
}
