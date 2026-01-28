"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useDocumentOnboardingStore } from '@/lib/stores/document-onboarding-store'
import { AdvancedMetricsForm, type AdvancedMetricsFormData } from '@/components/onboarding/advanced-metrics-form'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getProfile } from '@/lib/local-storage'

export default function DocumentAdvancedPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isFromDashboard = searchParams.get('from') === 'dashboard'
    const { extractedData, reviewedData, setAdvancedEnabled, reset } = useDocumentOnboardingStore()
    const [localProfile, setLocalProfile] = useState<any>(null)

    useEffect(() => {
        const profile = getProfile()
        setLocalProfile(profile)

        // If no data and not from dashboard, redirect to start
        if (!extractedData && !profile && !isFromDashboard) {
            router.replace('/onboarding')
        }
    }, [extractedData, router, isFromDashboard])

    if (!extractedData && !localProfile && !isFromDashboard) return null

    // 추출된 고급 데이터를 기본값으로 사용
    // Note: extractedData has { value, confidence } structure. 
    // reviewedData might have updated values. Prefer reviewedData if available.
    // If coming from dashboard, use existing profile data.
    const sourceData = reviewedData?.advanced || extractedData?.advanced
    const existingMetrics = localProfile?.advanced_metrics

    const defaultValues: Partial<AdvancedMetricsFormData> = {
        nrs_2002_score: sourceData?.nrs_2002_score.value ?? existingMetrics?.nrs_2002_score ?? undefined,
        serum_albumin: sourceData?.serum_albumin.value ?? existingMetrics?.serum_albumin ?? undefined,
        weight_change_6m: sourceData?.weight_change_6m.value ?? existingMetrics?.weight_change_6m ?? undefined,
        sga_grade: sourceData?.sga_grade.value ?? existingMetrics?.sga_grade ?? undefined,
        has_sarcopenia: sourceData?.has_sarcopenia.value ?? existingMetrics?.has_sarcopenia ?? undefined,
        has_gerd: sourceData?.has_gerd.value ?? existingMetrics?.has_gerd ?? undefined,
        gastric_emptying_delayed: sourceData?.gastric_emptying_delayed.value ?? existingMetrics?.gastric_emptying_delayed ?? undefined,
        oral_intake_possible: sourceData?.oral_intake_possible.value ?? existingMetrics?.oral_intake_possible ?? undefined,
        expected_fasting_days: sourceData?.expected_fasting_days.value ?? existingMetrics?.expected_fasting_days ?? undefined,
        intake_rate: sourceData?.intake_rate.value ?? existingMetrics?.intake_rate ?? undefined
    }

    const handleSubmit = async (data: AdvancedMetricsFormData) => {
        // 기본 데이터와 고급 데이터를 합쳐서 프로필 생성
        // reviewedData가 있으면 그것을, 없으면 extractedData 사용. 
        // 대시보드에서 왔다면 기존 로컬 프로필 정보를 기반으로 업데이트
        const basicData = reviewedData?.basic || extractedData?.basic

        try {
            const { createProfile } = await import('@/lib/actions/profile-actions')
            const { saveProfile } = await import('@/lib/local-storage')

            const result = await createProfile({
                surgery_type: basicData?.surgery_type.value || localProfile?.surgery_type || 'gastric_resection',
                surgery_date: basicData?.surgery_date.value || localProfile?.surgery_date || new Date().toISOString(),
                age: basicData?.age.value ?? localProfile?.age ?? undefined,
                weight: basicData?.weight.value ?? localProfile?.weight ?? undefined,
                height: basicData?.height.value ?? localProfile?.height ?? undefined,
                digestive_capacity: (basicData?.digestive_capacity.value as any) || localProfile?.digestive_capacity || 'moderate',
                comorbidities: localProfile?.comorbidities || [],
                advanced_metrics: data
            })

            if (result.success && result.profile) {
                const localProfile = {
                    ...result.profile,
                    advanced_metrics: data
                }
                saveProfile(localProfile)
            } else {
                console.error('Profile creation failed:', result.error)
                // Fallback: save to local storage anyway
                saveProfile({
                    id: crypto.randomUUID(),
                    surgery_type: basicData.surgery_type.value,
                    advanced_metrics: data,
                    created_at: new Date().toISOString()
                } as any)
            }

            if (isFromDashboard) {
                router.push('/dashboard')
            } else {
                router.push('/onboarding/complete')
            }
        } catch (e) {
            console.error('Submit error:', e)
        }
    }

    const handleSkip = async () => {
        setAdvancedEnabled(false)
        if (isFromDashboard) {
            router.push('/dashboard')
        } else {
            router.push('/onboarding/complete')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 pl-0 hover:pl-0 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        이전으로
                    </Button>
                </div>

                <h1 className="text-3xl font-bold mb-4 text-center text-gray-900">고급 의학 지표 입력</h1>
                <p className="text-center text-gray-600 mb-8 max-w-lg mx-auto">
                    임상 검사 결과를 입력하면 더 정밀한 식단 추천이 가능합니다.
                    <br className="hidden sm:inline" /> 확인하기 어려운 항목은 비워두셔도 됩니다.
                </p>

                <AdvancedMetricsForm
                    defaultValues={defaultValues}
                    onSubmit={handleSubmit}
                    onSkip={handleSkip}
                    showSkipButton={true}
                />
            </div>
        </div>
    )
}
