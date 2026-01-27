"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useDocumentOnboardingStore } from "@/lib/stores/document-onboarding-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, PartyPopper } from "lucide-react"

export default function OnboardingCompletePage() {
    const router = useRouter()
    const { extractedData, reset } = useDocumentOnboardingStore()
    const [profileData, setProfileData] = useState<any>(null)

    useEffect(() => {
        // 1. Try to get data from store
        if (extractedData) {
            setProfileData(extractedData)
            return
        }

        // 2. Try to get data from local storage (Manual flow)
        const loadLocalProfile = async () => {
            const { getProfile } = await import('@/lib/local-storage')
            const local = getProfile()
            if (local) {
                // Adapt local profile to match the structure needed for display if necessary
                // Or just use a simplified display for manual flow
                setProfileData({
                    basic: {
                        surgery_type: { value: local.surgery_type },
                        surgery_date: { value: local.surgery_date },
                        age: { value: local.age ?? '-' }, // age might not be in older local profile
                        weight: { value: local.weight ?? '-' }
                    },
                    hasAdvancedData: !!local.advanced_metrics,
                    advanced: {
                        nrs_2002_score: { value: local.advanced_metrics?.nrs_2002_score }
                    }
                })
            } else {
                // No data found anywhere
                router.replace('/onboarding')
            }
        }

        loadLocalProfile()
    }, [extractedData, router])

    if (!profileData) return null

    const handleGoHome = () => {
        reset()
        router.push('/')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center space-y-8">
            <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                    모든 설정이 완료되었어요!
                    <span className="inline-block ml-2"><PartyPopper className="w-6 h-6 text-yellow-500" /></span>
                </h1>
                <p className="text-gray-500 max-w-md mx-auto">
                    입력해주신 {profileData.basic.surgery_type.value || '수술'} 정보를 바탕으로<br />
                    최적의 회복 가이드를 준비했습니다.
                </p>
            </div>

            <Card className="w-full max-w-md text-left bg-white/80 backdrop-blur">
                <CardHeader>
                    <CardTitle className="text-base text-gray-500">생성된 프로필 요약</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 block text-xs mb-1">수술명</span>
                            <span className="font-medium text-gray-900">{profileData.basic.surgery_type.value}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-xs mb-1">수술일</span>
                            <span className="font-medium text-gray-900">{profileData.basic.surgery_date.value}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-xs mb-1">나이/체중</span>
                            <span className="font-medium text-gray-900">
                                {profileData.basic.age.value}세 / {profileData.basic.weight.value}kg
                            </span>
                        </div>
                        {profileData.hasAdvancedData && (
                            <div>
                                <span className="text-gray-500 block text-xs mb-1">추가 지표</span>
                                <span className="font-medium text-purple-600">
                                    NRS {profileData.advanced?.nrs_2002_score?.value || '-'}점 등
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Button
                onClick={handleGoHome}
                className="w-full max-w-md h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200/50"
            >
                관리 시작하기
            </Button>
        </div>
    )
}
