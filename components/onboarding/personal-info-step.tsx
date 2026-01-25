'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { personalInfoSchema, type PersonalInfoInput } from '@/lib/schemas/onboarding-schema'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function PersonalInfoStep() {
    const { formData, updateFormData, setStep } = useOnboardingStore()

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<PersonalInfoInput>({
        resolver: zodResolver(personalInfoSchema),
        defaultValues: {
            age: formData.age,
            weight: formData.weight,
            height: formData.height
        }
    })

    const onSubmit = (data: PersonalInfoInput) => {
        updateFormData(data)
        setStep(3)
    }

    const handleBack = () => {
        setStep(1)
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-center text-gray-900">개인 정보 입력</h2>

            <Card>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <p className="text-lg text-gray-700 mb-6 font-medium">
                        더 정확한 영양 계산을 위해 아래 정보를 입력해주세요. (선택사항)
                    </p>

                    <Input
                        type="number"
                        label="나이"
                        placeholder="예: 45"
                        error={errors.age?.message}
                        {...register('age', { valueAsNumber: true })}
                    />

                    <Input
                        type="number"
                        label="체중 (kg)"
                        placeholder="예: 65"
                        error={errors.weight?.message}
                        {...register('weight', { valueAsNumber: true })}
                    />

                    <Input
                        type="number"
                        label="키 (cm)"
                        placeholder="예: 170"
                        error={errors.height?.message}
                        {...register('height', { valueAsNumber: true })}
                    />

                    {/* 버튼 그룹 */}
                    <div className="flex justify-between mt-8">
                        <Button type="button" variant="secondary" onClick={handleBack}>
                            이전
                        </Button>
                        <Button type="submit" size="lg">
                            다음 단계
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
