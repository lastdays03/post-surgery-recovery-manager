"use client"

import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { AdvancedMetricsForm, type AdvancedMetricsFormData } from '@/components/onboarding/advanced-metrics-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'

export default function ManualAdvancedPage() {
    const router = useRouter()
    // Store might need updates to hold advanced data, or we just submit directly here.
    // For now, let's assume we submit and go to complete.
    // Ideally, manual onboarding store should also have advanced metrics field.
    const { currentStep } = useOnboardingStore()

    useEffect(() => {
        // If user accessed directly without going through steps, maybe redirect?
        // But manual flow state persistence is simple. Let's strict it a bit.
        if (currentStep < 3) {
            router.replace('/onboarding/manual')
        }
    }, [currentStep, router])

    const handleSubmit = async (data: AdvancedMetricsFormData) => {
        try {
            const { updateProfile } = await import('@/lib/actions/profile-actions')
            const { getProfile, saveProfile } = await import('@/lib/local-storage')

            const currentProfile = getProfile()
            if (currentProfile && currentProfile.id) {
                // 서버 업데이트
                const result = await updateProfile(currentProfile.id, {
                    advanced_metrics: data
                })

                if (result.success) {
                    // 로컬 스토리지 업데이트
                    saveProfile({
                        ...currentProfile,
                        advanced_metrics: data
                    })
                } else {
                    console.error('Server update failed:', result.error)
                    // 서버 실패해도 로컬은 업데이트 (오프라인 대응 등)
                    saveProfile({
                        ...currentProfile,
                        advanced_metrics: data
                    })
                }
            } else {
                // 프로필이 없는 경우 (매우 드묾), 로컬에라도 저장
                console.warn('No profile found to update')
            }

            router.push('/onboarding/complete')
        } catch (e) {
            console.error('Manual advanced submit error:', e)
        }
    }

    const handleSkip = async () => {
        // 스킵 시 바로 완료 페이지로
        router.push('/onboarding/complete')
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    {/* 뒤로 가기는 브라우저 히스토리 또는 manual 메인으로? 
                 여기서는 manual flow의 마지막 단계이므로 router.back()하면 보건 상태 단계로 갈 것임.
             */}
                    <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 pl-0 hover:pl-0 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        이전 단계를 수정할래요
                    </Button>
                </div>

                <h1 className="text-3xl font-bold mb-4 text-center text-gray-900">고급 의학 지표 입력</h1>
                <p className="text-center text-gray-600 mb-8 max-w-lg mx-auto">
                    임상 검사 결과를 입력하면 더 정밀한 식단 추천이 가능합니다.<br />
                    확인하기 어려운 항목은 비워두셔도 됩니다.
                </p>

                <AdvancedMetricsForm
                    onSubmit={handleSubmit}
                    onSkip={handleSkip}
                    showSkipButton={true}
                />
            </div>
        </div>
    )
}
