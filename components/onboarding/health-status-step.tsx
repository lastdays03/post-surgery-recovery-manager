'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { healthStatusSchema, type HealthStatusInput } from '@/lib/schemas/onboarding-schema'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createProfile, type CreateProfileResponse } from '@/lib/actions/profile-actions'
import { saveProfile } from '@/lib/local-storage'

const DIGESTIVE_OPTIONS = [
    { value: 'good', label: '좋음', description: '소화에 큰 문제 없음' },
    { value: 'moderate', label: '보통', description: '가끔 불편함' },
    { value: 'poor', label: '나쁨', description: '자주 소화불량' }
] as const

const COMORBIDITY_OPTIONS = [
    '당뇨',
    '고혈압',
    '심장질환',
    '신장질환',
    '간질환',
    '없음'
]

export function HealthStatusStep() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { formData, updateFormData, setStep, resetOnboarding } = useOnboardingStore()

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<HealthStatusInput>({
        resolver: zodResolver(healthStatusSchema),
        defaultValues: {
            digestive_capacity: formData.digestive_capacity || 'good',
            comorbidities: formData.comorbidities || []
        }
    })

    const selectedDigestive = watch('digestive_capacity')

    const handleBack = () => {
        setStep(2)
    }

    const onSubmit = async (data: HealthStatusInput) => {
        setIsSubmitting(true)
        updateFormData(data)

        try {
            // 모든 폼 데이터 수집
            const completeData = {
                ...formData,
                ...data
            }

            // 로컬 스토리지에 저장
            const localProfile = {
                id: crypto.randomUUID(),
                surgery_type: completeData.surgery_type!,
                surgery_date: completeData.surgery_date!,
                digestive_capacity: data.digestive_capacity,
                comorbidities: data.comorbidities,
                weight: completeData.weight,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            // Supabase에 저장 시도
            const result = (await createProfile({
                surgery_type: completeData.surgery_type!,
                surgery_date: completeData.surgery_date!,
                age: completeData.age,
                weight: completeData.weight,
                height: completeData.height,
                digestive_capacity: data.digestive_capacity,
                comorbidities: data.comorbidities
            })) as CreateProfileResponse

            if (result.success && result.profile) {
                // 서버에서 생성된 실제 프로필 정보와 로컬 정보를 병합하여 저장
                const finalProfile = {
                    ...localProfile,
                    ...result.profile,
                    // 서버 데이터가 우선이지만 날짜 등은 로컬 형식이 필요할 수 있음
                    id: result.profile.id || localProfile.id
                }
                saveProfile(finalProfile as any)
            } else {
                // 실패 시 로컬에서 생성한 임시 프로필 저장
                console.error('Profile creation failed, using local fallback:', result.error)
                saveProfile(localProfile)
            }

            // 온보딩 완료 후 고급 지표 입력 페이지로 이동
            // resetOnboarding() // Store 초기화는 최종 완료 페이지나 고급 지표 페이지 진입 시 처리 고려. 
            // 여기서는 단계 유지.
            router.push('/onboarding/manual/advanced')
        } catch (error) {
            console.error('Onboarding submit error:', error)
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-center text-gray-900">건강 상태 입력</h2>

            <Card>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* 소화 능력 */}
                    <div className="mb-8">
                        <label className="block text-xl font-bold mb-4 text-gray-900">
                            현재 소화 능력은 어떠신가요?
                        </label>
                        <Controller
                            name="digestive_capacity"
                            control={control}
                            render={({ field }) => (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {DIGESTIVE_OPTIONS.map((option) => (
                                        <label
                                            key={option.value}
                                            className={`p-6 border-2 rounded-xl cursor-pointer transition-all text-center ${selectedDigestive === option.value
                                                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600'
                                                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                value={option.value}
                                                checked={field.value === option.value}
                                                onChange={() => field.onChange(option.value)}
                                                className="sr-only"
                                            />
                                            <div className="text-lg font-bold mb-2 text-gray-900">{option.label}</div>
                                            <div className="text-sm text-gray-700 font-medium">{option.description}</div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        />
                        {errors.digestive_capacity && (
                            <p className="mt-2 text-red-500 text-base">{errors.digestive_capacity.message}</p>
                        )}
                    </div>

                    {/* 기저질환 */}
                    <div className="mb-8">
                        <label className="block text-xl font-bold mb-4 text-gray-900">
                            기저질환이 있으신가요? (복수 선택 가능)
                        </label>
                        <Controller
                            name="comorbidities"
                            control={control}
                            render={({ field }) => {
                                const STANDARD_OPTIONS = ['당뇨', '고혈압', '심장질환', '신장질환', '간질환']
                                const values = field.value || []
                                const otherValues = values.filter(v => !STANDARD_OPTIONS.includes(v))
                                const isOtherChecked = otherValues.length > 0

                                // Input only shown if explicitly checked or there are values
                                const [showOtherInput, setShowOtherInput] = useState(isOtherChecked)
                                const [otherInputValue, setOtherInputValue] = useState(otherValues.join(', '))

                                // Sync local input state if form value changes externally (e.g. initial load)
                                // identifying if the change came from the input itself is tricky, 
                                // so we trust the form state for initial render.

                                return (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {/* Standard Options */}
                                            {STANDARD_OPTIONS.map((option) => {
                                                const isSelected = values.includes(option)
                                                return (
                                                    <label
                                                        key={option}
                                                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all text-center ${isSelected
                                                            ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600'
                                                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                const newValues = e.target.checked
                                                                    ? [...values, option]
                                                                    : values.filter(v => v !== option)
                                                                field.onChange(newValues)
                                                            }}
                                                            className="sr-only"
                                                        />
                                                        <span className="text-base font-bold text-gray-900">{option}</span>
                                                    </label>
                                                )
                                            })}

                                            {/* Other Option */}
                                            <label
                                                className={`p-4 border-2 rounded-xl cursor-pointer transition-all text-center ${showOtherInput
                                                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600'
                                                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={showOtherInput}
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked
                                                        setShowOtherInput(isChecked)
                                                        if (!isChecked) {
                                                            // If unchecked, remove all non-standard values
                                                            field.onChange(values.filter(v => STANDARD_OPTIONS.includes(v)))
                                                            setOtherInputValue('')
                                                        }
                                                    }}
                                                    className="sr-only"
                                                />
                                                <span className="text-base font-bold text-gray-900">기타</span>
                                            </label>
                                        </div>

                                        {/* Other Text Input */}
                                        {showOtherInput && (
                                            <div className="animate-in fade-in slide-in-from-top-2">
                                                <input
                                                    type="text"
                                                    value={otherInputValue}
                                                    placeholder="질환명을 입력해주세요 (예: 천식, 관절염)"
                                                    onChange={(e) => {
                                                        const newValue = e.target.value
                                                        setOtherInputValue(newValue)

                                                        // Update form: Keep standard ones + new custom text
                                                        const standardOnly = values.filter(v => STANDARD_OPTIONS.includes(v))
                                                        // If input is empty, just keep standard. 
                                                        // If comma separated, could split. For now treating as one string or simple split if needed.
                                                        // User request implies "text inputs". Let's handle it as a single string being added. 
                                                        // Or better, distinct item.

                                                        // Strategy: The entered text replaces any previous non-standard values
                                                        const newCustomValues = newValue.trim() ? [newValue] : []
                                                        field.onChange([...standardOnly, ...newCustomValues])
                                                    }}
                                                    className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-700"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )
                            }}
                        />
                    </div>

                    {/* 버튼 그룹 */}
                    <div className="flex justify-between mt-8">
                        <Button type="button" variant="secondary" onClick={handleBack} disabled={isSubmitting}>
                            이전
                        </Button>
                        <Button type="submit" size="lg" disabled={isSubmitting}>
                            {isSubmitting ? '저장 중...' : '완료'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
