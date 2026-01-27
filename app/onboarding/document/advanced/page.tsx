"use client"

import { useRouter } from 'next/navigation'
import { useDocumentOnboardingStore } from '@/lib/stores/document-onboarding-store'
import { AdvancedMetricsForm, type AdvancedMetricsFormData } from '@/components/onboarding/advanced-metrics-form'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function DocumentAdvancedPage() {
    const router = useRouter()
    const { extractedData, reviewedData, setAdvancedEnabled, reset } = useDocumentOnboardingStore()

    useEffect(() => {
        // If no data, redirect to start
        if (!extractedData) {
            router.replace('/onboarding')
        }
    }, [extractedData, router])

    if (!extractedData) return null

    // 추출된 고급 데이터를 기본값으로 사용
    // Note: extractedData has { value, confidence } structure. 
    // reviewedData might have updated values. Prefer reviewedData if available.
    const sourceData = reviewedData?.advanced || extractedData.advanced

    const defaultValues: Partial<AdvancedMetricsFormData> = {
        nrs_2002_score: sourceData.nrs_2002_score.value ?? undefined,
        serum_albumin: sourceData.serum_albumin.value ?? undefined,
        weight_change_6m: sourceData.weight_change_6m.value ?? undefined,
        sga_grade: sourceData.sga_grade.value ?? undefined,
        has_sarcopenia: sourceData.has_sarcopenia.value ?? undefined,
        has_gerd: sourceData.has_gerd.value ?? undefined,
        gastric_emptying_delayed: sourceData.gastric_emptying_delayed.value ?? undefined,
        oral_intake_possible: sourceData.oral_intake_possible.value ?? undefined,
        expected_fasting_days: sourceData.expected_fasting_days.value ?? undefined,
        intake_rate: sourceData.intake_rate.value ?? undefined
    }

    const handleSubmit = async (data: AdvancedMetricsFormData) => {
        if (!extractedData) return

        // 기본 데이터와 고급 데이터를 합쳐서 프로필 생성
        // reviewedData가 있으면 그것을, 없으면 extractedData 사용
        const basicData = reviewedData?.basic || extractedData.basic

        try {
            const { createProfile } = await import('@/lib/actions/profile-actions')
            const { saveProfile } = await import('@/lib/local-storage')

            const result = await createProfile({
                surgery_type: basicData.surgery_type.value || 'gastric_resection', // Fallback
                surgery_date: basicData.surgery_date.value || new Date().toISOString(),
                age: basicData.age.value ?? undefined,
                weight: basicData.weight.value ?? undefined,
                height: basicData.height.value ?? undefined,
                digestive_capacity: basicData.digestive_capacity.value as any || 'moderate',
                comorbidities: [], // 추출된 데이터에 기저질환이 없다면 빈 배열
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

            router.push('/onboarding/complete')
        } catch (e) {
            console.error('Submit error:', e)
        }
    }

    const handleSkip = async () => {
        setAdvancedEnabled(false)
        // TODO: Task 20에서 저장 로직 구현
        // router.push('/dashboard') 
        // Changing to complete for consistency with current flow
        router.push('/onboarding/complete')
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
