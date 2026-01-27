'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { Loader2, Save, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateProfile, mapSurgeryTypeAction } from '@/lib/actions/profile-actions'
import { UserProfile } from '@/lib/types/user.types'
import { AdvancedMedicalMetrics } from '@/lib/types/medical-profile'
import { saveProfile } from '@/lib/local-storage'

// Validation Schema
const profileSchema = z.object({
    // Basic Info
    surgery_type: z.string().min(1, '수술 종류를 입력해주세요.'),
    surgery_date: z.string().min(1, '수술 날짜를 선택해주세요.'),

    // Physical Info
    age: z.coerce.number().min(0, '나이를 입력해주세요.').optional(),
    height: z.coerce.number().min(0, '키를 입력해주세요.').optional(),
    weight: z.coerce.number().min(0, '몸무게를 입력해주세요.').optional(),
    gender: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : val),
        z.enum(['male', 'female']).optional()
    ),

    // Medical Status
    digestive_capacity: z.enum(['good', 'moderate', 'poor']),

    // Advanced Metrics
    nrs_2002_score: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number().min(0, '0 이상의 값을 입력해주세요.').max(7, '7 이하의 값을 입력해주세요.').optional()
    ),
    serum_albumin: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number().min(0, '0 이상의 값을 입력해주세요.').max(100, '100 이하의 값을 입력해주세요.').optional()
    ),
    weight_change_6m: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number().min(-100).max(100).optional()
    ),

    // Intake Capability
    oral_intake_possible: z.boolean().default(true),
    expected_fasting_days: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number().min(0).optional()
    ),
    intake_rate: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number().min(0).max(100).optional()
    ),

    // Boolean Flags
    has_gerd: z.boolean().default(false),
    gastric_emptying_delayed: z.boolean().default(false),
    has_sarcopenia: z.boolean().default(false),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileEditFormProps {
    profile: UserProfile
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [isMapping, setIsMapping] = useState(false)
    const [mappingError, setMappingError] = useState<string | null>(null)

    // Initial values from profile
    const defaultValues: Partial<ProfileFormValues> = {
        surgery_type: profile.surgery_type,
        surgery_date: profile.surgery_date ? format(new Date(profile.surgery_date), 'yyyy-MM-dd') : '',
        age: (profile as any).age, // Types might need aligning
        weight: profile.weight,
        height: (profile as any).height,
        gender: (profile as any).gender,
        digestive_capacity: profile.digestive_capacity,
        nrs_2002_score: profile.advanced_metrics?.nrs_2002_score ?? ('' as any),
        serum_albumin: profile.advanced_metrics?.serum_albumin ?? ('' as any),
        weight_change_6m: profile.advanced_metrics?.weight_change_6m ?? ('' as any),
        // Intake Capability
        oral_intake_possible: profile.advanced_metrics?.oral_intake_possible ?? true,
        expected_fasting_days: profile.advanced_metrics?.expected_fasting_days ?? ('' as any),
        intake_rate: profile.advanced_metrics?.intake_rate ?? ('' as any),

        has_gerd: profile.advanced_metrics?.has_gerd || false,
        gastric_emptying_delayed: profile.advanced_metrics?.gastric_emptying_delayed || false,
        has_sarcopenia: profile.advanced_metrics?.has_sarcopenia || false,
    }

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema) as any,
        defaultValues,
    })

    async function onSubmit(data: ProfileFormValues) {
        setIsSubmitting(true)
        setSubmitError(null)
        setSubmitSuccess(false)

        try {
            // Construct payload
            const advanced_metrics: AdvancedMedicalMetrics = {
                ...profile.advanced_metrics, // preserve existing
                nrs_2002_score: data.nrs_2002_score,
                serum_albumin: data.serum_albumin,
                weight_change_6m: data.weight_change_6m,
                oral_intake_possible: data.oral_intake_possible,
                expected_fasting_days: data.expected_fasting_days,
                intake_rate: data.intake_rate,
                has_gerd: data.has_gerd,
                gastric_emptying_delayed: data.gastric_emptying_delayed,
                has_sarcopenia: data.has_sarcopenia,
            }

            const result = await updateProfile(profile.id, {
                surgery_type: data.surgery_type,
                surgery_date: data.surgery_date,
                age: data.age,
                weight: data.weight,
                height: data.height,
                gender: data.gender,
                digestive_capacity: data.digestive_capacity,
                advanced_metrics,
            })

            if (!result.success) {
                // Determine if this is a "Supabase not configured" error or valid error.
                // For now we assume typical error. But if we want offline-first, we might want to save to local storage anyway if the only error is network/server.
                // However, let's stick to the existing pattern: Server Action First.
                throw new Error(result.error || '프로필 수정에 실패했습니다.')
            }

            // Sync with Local Storage
            if (result.profile) {
                saveProfile(result.profile)
            } else {
                // Fallback if profile is missing in result but success is true (unlikely but safe)
                // We construct a local profile object merging existing profile with new data
                const updatedProfile: any = {
                    ...profile,
                    ...data,
                    advanced_metrics,
                    updated_at: new Date().toISOString()
                }
                // Fix date objects back to strings for storage if needed, but saveProfile handles the object.
                // Actually profile has Dates, localStorage expects strings.
                // Be careful. profile (prop) comes from page.tsx where it converted strings to Dates.
                // result.profile comes from API (JSON), so it has strings.
                // So using result.profile is safer.
            }

            setSubmitSuccess(true)
            // Refresh dashboard data
            router.refresh()
            // Optional: Redirect after delay
            setTimeout(() => {
                router.push('/dashboard')
            }, 1000)

        } catch (error: any) {
            setSubmitError(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleMapSurgeryType = async () => {
        const currentType = form.getValues('surgery_type');
        if (!currentType) return;

        setIsMapping(true);
        setMappingError(null);

        try {
            const result = await mapSurgeryTypeAction(currentType);
            if (result.success && result.mappedType) {
                form.setValue('surgery_type', result.mappedType);
                // 필드 포커스 아웃 효과를 주어 값이 변경되었음을 알림
                form.trigger('surgery_type');
            } else {
                setMappingError(result.error || '매핑을 실패했습니다.');
            }
        } catch (error) {
            setMappingError('AI 연결 중 오류가 발생했습니다.');
        } finally {
            setIsMapping(false);
        }
    };

    return (
        <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.log('Form validation errors:', errors);
                // toast.error("입력 내용을 확인해주세요."); // If you have toast
            })}
            className="space-y-6"
        >
            {/* 기본 수술 정보 */}
            <Card>
                <CardHeader>
                    <CardTitle>기본 수술 정보</CardTitle>
                    <CardDescription>수술 내용과 날짜를 수정할 수 있습니다.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="surgery_type">수술 종류</Label>
                        <div className="flex gap-2">
                            <Input
                                id="surgery_type"
                                {...form.register('surgery_type')}
                                placeholder="예: 위 절제술, 라섹, 무릎 수술"
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleMapSurgeryType}
                                disabled={isMapping || !form.watch('surgery_type')}
                                title="AI 수술명 표준화"
                                className="shrink-0 h-[58px] w-[58px] rounded-xl border-2"
                            >
                                {isMapping ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                ) : (
                                    <Sparkles className="h-4 w-4 text-blue-600" />
                                )}
                            </Button>
                        </div>
                        {mappingError && (
                            <p className="text-xs text-orange-500 font-medium">참고: {mappingError}</p>
                        )}
                        {form.formState.errors.surgery_type && (
                            <p className="text-sm text-red-500">{form.formState.errors.surgery_type.message}</p>
                        )}
                        <p className="text-xs text-gray-500">
                            한글로 입력 후 ✨ 버튼을 누르면 시스템 표준 키로 자동 변환됩니다.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="surgery_date">수술 날짜</Label>
                        <Input type="date" id="surgery_date" {...form.register('surgery_date')} />
                        {form.formState.errors.surgery_date && (
                            <p className="text-sm text-red-500">{form.formState.errors.surgery_date.message}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 신체 정보 */}
            <Card>
                <CardHeader>
                    <CardTitle>현재 신체 상태</CardTitle>
                    <CardDescription>현재의 체중과 소화 능력을 업데이트해주세요.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="weight">현재 체중 (kg)</Label>
                        <Input type="number" step="0.1" id="weight" {...form.register('weight')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="digestive_capacity">소화 능력</Label>
                        <Select
                            onValueChange={(value) => form.setValue('digestive_capacity', value as any)}
                            defaultValue={form.getValues('digestive_capacity')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="소화 능력을 선택해주세요" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="good">양호 (거의 일반식 가능)</SelectItem>
                                <SelectItem value="moderate">보통 (죽/부드러운 음식 위주)</SelectItem>
                                <SelectItem value="poor">나쁨 (소화 불량 잦음)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* 섭취 능력 */}
            < Card >
                <CardHeader>
                    <CardTitle>섭취 능력 (선택)</CardTitle>
                    <CardDescription>현재 식사 가능 여부와 섭취량을 기록해주세요.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 pb-2">
                        <input
                            type="checkbox"
                            id="oral_intake_possible"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            {...form.register('oral_intake_possible')}
                        />
                        <Label htmlFor="oral_intake_possible" className="font-normal cursor-pointer">
                            경구 섭취 가능 (일반 식사 가능)
                        </Label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="expected_fasting_days">예상 금식 기간 (일)</Label>
                            <Input type="number" id="expected_fasting_days" placeholder="0" {...form.register('expected_fasting_days')} />
                            <p className="text-xs text-gray-600 mt-1">5일 이상 시 영양 공급 경로 고려 필요</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="intake_rate">현재 섭취율 (%)</Label>
                            <Input type="number" id="intake_rate" placeholder="0~100" {...form.register('intake_rate')} />
                            <p className="text-xs text-gray-600 mt-1">필요량 대비 섭취 비율</p>
                        </div>
                    </div>
                </CardContent>
            </Card >

            {/* 고급 의학 정보 */}
            < Card >
                <CardHeader>
                    <CardTitle>상세 의학 지표 (선택)</CardTitle>
                    <CardDescription>병원 검사 결과나 상세 증상이 있다면 입력해주세요. 더 정확한 조언을 해드릴 수 있습니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="nrs_2002_score">NRS-2002 (영양위험도)</Label>
                            <Input type="number" id="nrs_2002_score" placeholder="0~7점" {...form.register('nrs_2002_score')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="serum_albumin">혈청 알부민 (g/L)</Label>
                            <Input type="number" step="0.1" id="serum_albumin" {...form.register('serum_albumin')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="weight_change_6m">6개월 체중 변화 (%)</Label>
                            <Input type="number" step="0.1" id="weight_change_6m" {...form.register('weight_change_6m')} />
                            <p className="text-xs text-gray-600 font-medium mt-1">감소는 음수(-), 증가는 양수(+)</p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Label>보유 증상 및 진단</Label>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="has_gerd"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    {...form.register('has_gerd')}
                                />
                                <Label htmlFor="has_gerd" className="font-normal cursor-pointer">
                                    위식도역류질환 (GERD) 진단 받음
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="gastric_emptying_delayed"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    {...form.register('gastric_emptying_delayed')}
                                />
                                <Label htmlFor="gastric_emptying_delayed" className="font-normal cursor-pointer">
                                    위 배출 지연 증상 있음
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="has_sarcopenia"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    {...form.register('has_sarcopenia')}
                                />
                                <Label htmlFor="has_sarcopenia" className="font-normal cursor-pointer">
                                    근감소증 진단 받음
                                </Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card >

            {submitError && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                    {submitError}
                </div>
            )
            }

            {
                submitSuccess && (
                    <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md text-center font-medium">
                        프로필이 성공적으로 수정되었습니다! 대시보드로 이동합니다...
                    </div>
                )
            }

            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    취소
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            저장 중...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            저장하기
                        </>
                    )}
                </Button>
            </div>
        </form >
    )
}
