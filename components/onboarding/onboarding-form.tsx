'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createProfile } from '@/lib/actions/profile-actions'
import { saveProfile } from '@/lib/local-storage'
import { cn } from '@/lib/utils'

// Define Schema
const onboardingFormSchema = z.object({
    // Basic Info
    age: z.coerce.number().min(1, '나이를 입력해주세요.'),
    gender: z.enum(['male', 'female'], { message: '성별을 선택해주세요.' }),
    height: z.coerce.number().min(1, '키를 입력해주세요.'),
    weight: z.coerce.number().min(1, '몸무게를 입력해주세요.'),

    // Health Info
    digestiveCapacity: z.string().min(1, '소화 기능을 선택해주세요.'),
    comorbidities: z.array(z.string()).default([]),
    otherComorbidity: z.string().optional(),
})

type OnboardingFormData = z.infer<typeof onboardingFormSchema>

const COMORBIDITIES_OPTIONS = [
    '당뇨', '고혈압', '심장질환', '신장질환', '간질환'
]

export function OnboardingForm() {
    const router = useRouter()
    const { formData, updateFormData, setStep } = useOnboardingStore()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<any>({
        resolver: zodResolver(onboardingFormSchema),
        defaultValues: {
            age: formData.age ? String(formData.age) : '', // Back to String() to match input type
            gender: formData.gender,
            height: formData.height ? String(formData.height) : '', // Back to String()
            weight: formData.weight ? String(formData.weight) : '', // Back to String()
            digestiveCapacity: '100',
            comorbidities: [],
            otherComorbidity: '',
        }
    })

    const toggleComorbidity = (value: string) => {
        const current = (form.getValues('comorbidities') || []) as string[]
        let updated: string[] = []

        if (value === 'none') {
            updated = current.includes('none') ? [] : ['none']
            if (updated.includes('none')) {
                form.setValue('otherComorbidity', '') // Clear other input if 'none' is selected
            }
        } else {
            if (current.includes('none')) {
                updated = [value]
            } else {
                updated = current.includes(value)
                    ? current.filter((item: string) => item !== value)
                    : [...current, value]
            }
        }
        form.setValue('comorbidities', updated, { shouldDirty: true, shouldValidate: true }) // Force validation update
    }

    const onSubmit = async (data: OnboardingFormData) => {
        setIsSubmitting(true)
        try {
            updateFormData({
                age: Number(data.age),
                gender: data.gender,
                height: Number(data.height),
                weight: Number(data.weight),
                // digestiveCapacity and comorbidities are not in OnboardingState yet, 
                // assuming we might add them or use 'healthStatus' field later.
                // For now, only updating what's in schema.
            })

            const digestive_capacity_map: Record<string, 'good' | 'moderate' | 'poor'> = {
                '100': 'good',
                '80': 'moderate',
                '50': 'poor'
            }

            // Construct final comorbidities list
            let finalComorbidities = data.comorbidities.filter(c => c !== 'none' && c !== 'other')
            if (data.comorbidities.includes('other') && data.otherComorbidity) {
                finalComorbidities.push(data.otherComorbidity.trim())
            }

            const profileData = {
                surgery_type: formData.surgery_type || 'etc',
                surgery_date: formData.surgery_date || new Date().toISOString(),
                age: Number(data.age),
                gender: data.gender,
                height: Number(data.height),
                weight: Number(data.weight),
                digestive_capacity: digestive_capacity_map[data.digestiveCapacity] || 'moderate',
                comorbidities: finalComorbidities,
            }

            console.log('Submitting profile:', profileData)
            const result = await createProfile(profileData)

            if (result.success && result.profile) {
                // local storage에 저장
                saveProfile(result.profile)
                setStep(3)
                router.push('/onboarding/complete')
            } else {
                console.error('Profile creation failed:', result.error)
                alert('프로필 저장에 실패했습니다. 다시 시도해주세요.')
            }

        } catch (error) {
            console.error('Failed to submit onboarding:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Prepare default values for age/height/weight inputs as strings to avoid uncontrolled/controlled warnings if needed,
    // but react-hook-form handles number inputs well with coerce.
    // However, keeping standard input props.

    return (
        <Card className="max-w-xl mx-auto shadow-lg">
            <CardHeader>
                <CardTitle>기본 정보 및 건강 상태</CardTitle>
                <CardDescription>정확한 영양 가이드를 위해 정보를 입력해주세요.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700">기본 정보</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="age">나이</Label>
                                <Input id="age" type="number" placeholder="예: 45" {...form.register('age')} />
                                {form.formState.errors.age && <p className="text-red-500 text-xs">{String(form.formState.errors.age.message)}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>성별</Label>
                                <div className="flex gap-4 mt-0">
                                    <button
                                        type="button"
                                        data-testid="gender-male"
                                        onClick={() => form.setValue('gender', 'male')}
                                        className={cn(
                                            "flex-1 py-4 px-6 rounded-xl border-2 text-lg font-medium transition-colors",
                                            form.watch('gender') === 'male'
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                        )}
                                    >
                                        남성
                                    </button>
                                    <button
                                        type="button"
                                        data-testid="gender-female"
                                        onClick={() => form.setValue('gender', 'female')}
                                        className={cn(
                                            "flex-1 py-4 px-6 rounded-xl border-2 text-lg font-medium transition-colors",
                                            form.watch('gender') === 'female'
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                        )}
                                    >
                                        여성
                                    </button>
                                </div>
                                {form.formState.errors.gender && <p className="text-red-500 text-xs">{String(form.formState.errors.gender.message)}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="height">키 (cm)</Label>
                                <Input id="height" type="number" placeholder="예: 170" {...form.register('height')} />
                                {form.formState.errors.height && <p className="text-red-500 text-xs">{String(form.formState.errors.height.message)}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="weight">몸무게 (kg)</Label>
                                <Input id="weight" type="number" placeholder="예: 65" {...form.register('weight')} />
                                {form.formState.errors.weight && <p className="text-red-500 text-xs">{String(form.formState.errors.weight.message)}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="border-t my-4" />

                    {/* Health Status Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700">건강 상태</h3>

                        <div className="space-y-2">
                            <Label>현재 소화 기능 상태</Label>
                            <Select onValueChange={(val) => form.setValue('digestiveCapacity', val)} defaultValue={form.getValues('digestiveCapacity')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="선택해주세요" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="100">문제 없음 (일반식 가능)</SelectItem>
                                    <SelectItem value="80">약간 불편함 (부드러운 음식 위주)</SelectItem>
                                    <SelectItem value="50">소화 힘듦 (죽/유동식 필요)</SelectItem>
                                </SelectContent>
                            </Select>
                            {form.formState.errors.digestiveCapacity && <p className="text-red-500 text-xs">{String(form.formState.errors.digestiveCapacity.message)}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>기저 질환 (복수 선택 가능)</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {COMORBIDITIES_OPTIONS.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => toggleComorbidity(option)}
                                        className={cn(
                                            "py-3 px-2 rounded-lg border text-sm font-medium transition-all break-keep",
                                            form.watch('comorbidities').includes(option)
                                                ? "bg-blue-50 border-blue-600 text-blue-700 font-semibold"
                                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                                        )}
                                    >
                                        {option}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => toggleComorbidity('none')}
                                    className={cn(
                                        "py-3 px-2 rounded-lg border text-sm font-medium transition-all",
                                        form.watch('comorbidities').includes('none')
                                            ? "bg-gray-100 border-gray-500 text-gray-900 font-semibold"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                                    )}
                                >
                                    없음
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggleComorbidity('other')}
                                    className={cn(
                                        "py-3 px-2 rounded-lg border text-sm font-medium transition-all",
                                        form.watch('comorbidities').includes('other')
                                            ? "bg-blue-50 border-blue-600 text-blue-700 font-semibold"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                                    )}
                                >
                                    기타
                                </button>
                            </div>

                            {/* Other Input Field */}
                            {form.watch('comorbidities').includes('other') && (
                                <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-300">
                                    <Input
                                        placeholder="기저질환을 직접 입력해주세요"
                                        {...form.register('otherComorbidity')}
                                        className="bg-gray-50"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg rounded-xl" disabled={isSubmitting}>
                        {isSubmitting ? '저장 중...' : '완료 및 가이드 시작'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
