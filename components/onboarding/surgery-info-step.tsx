'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { surgeryInfoSchema, type SurgeryInfoInput } from '@/lib/schemas/onboarding-schema'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const SURGERY_OPTIONS = [
    { value: 'gastric_resection', label: '위절제술', emoji: '🏥' },
    { value: 'colon_resection', label: '대장절제술', emoji: '🏥' },
    { value: 'tkr', label: '슬관절 치환술', emoji: '🦵' },
    { value: 'spinal_fusion', label: '척추 유합술', emoji: '🦴' },
    { value: 'cholecystectomy', label: '담낭절제술', emoji: '🏥' }
]

export function SurgeryInfoStep() {
    const { formData, updateFormData, setStep } = useOnboardingStore()

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<SurgeryInfoInput>({
        resolver: zodResolver(surgeryInfoSchema),
        defaultValues: {
            surgery_type: (formData.surgery_type as any) || '', // Type casting for ease
            surgery_date: formData.surgery_date || ''
        }
    })

    const selectedSurgery = watch('surgery_type')

    const onSubmit = (data: SurgeryInfoInput) => {
        updateFormData(data)
        setStep(2)
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-center text-gray-900">수술 정보 입력</h2>

            <Card>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* 수술 종류 선택 */}
                    <div className="mb-8">
                        <label className="block text-xl font-bold mb-4 text-gray-900">
                            수술 종류를 선택해주세요
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {SURGERY_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-center p-6 border-2 rounded-xl cursor-pointer transition-all ${selectedSurgery === option.value
                                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600'
                                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        value={option.value}
                                        {...register('surgery_type')}
                                        className="sr-only"
                                    />
                                    <span className="text-3xl mr-4">{option.emoji}</span>
                                    <span className="text-xl font-bold text-gray-900">{option.label}</span>
                                </label>
                            ))}
                        </div>
                        {errors.surgery_type && (
                            <p className="mt-2 text-red-500 text-base">{errors.surgery_type.message}</p>
                        )}
                    </div>

                    {/* 수술 날짜 입력 */}
                    <Input
                        type="date"
                        label="수술 날짜"
                        error={errors.surgery_date?.message}
                        {...register('surgery_date')}
                    />

                    {/* 다음 버튼 */}
                    <div className="flex justify-end mt-8">
                        <Button type="submit" size="lg">
                            다음 단계
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
