'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { saveSymptomLog } from '@/lib/services/log-service'
import { getProfile } from '@/lib/local-storage'

type FormData = {
    painLevel: number
    energyLevel: number
    digestiveStatus: 'good' | 'moderate' | 'bad' | 'none'
    notes: string
}

export default function SymptomCheckPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const { control, handleSubmit, register } = useForm<FormData>({
        defaultValues: {
            painLevel: 0,
            energyLevel: 5,
            digestiveStatus: 'good',
            notes: ''
        }
    })

    const onSubmit = async (data: FormData) => {
        setLoading(true)
        try {
            const profile = getProfile()
            if (!profile) {
                alert('프로필을 찾을 수 없습니다.')
                return
            }

            const today = new Date().toISOString().split('T')[0]
            await saveSymptomLog(profile.id, today, data)
            router.push('/dashboard')
        } catch (error) {
            console.error(error)
            alert('저장 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container max-w-md mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl text-gray-900 font-bold">오늘의 컨디션 체크</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <Label className="text-gray-900 text-base font-bold">통증 정도 (0-10)</Label>
                                <span className="text-sm font-bold text-blue-600">
                                    {/* We can use watch here if needed, but slider shows value relative position */}
                                </span>
                            </div>
                            <Controller
                                name="painLevel"
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <div className="space-y-2">
                                        <Slider
                                            min={0}
                                            max={10}
                                            step={1}
                                            value={value}
                                            onChange={(e) => onChange(Number(e.target.value))}
                                        />
                                        <div className="flex justify-between text-xs text-gray-700 font-medium">
                                            <span>없음</span>
                                            <span>극심함</span>
                                        </div>
                                    </div>
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-gray-900 text-base font-bold">소화 상태</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {['good', 'moderate', 'bad', 'none'].map((status) => (
                                    <label key={status} className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500">
                                        <input
                                            type="radio"
                                            value={status}
                                            {...register('digestiveStatus')}
                                            className="accent-blue-600"
                                        />
                                        <span className="text-base text-gray-700 font-medium">
                                            {status === 'good' && '편안함'}
                                            {status === 'moderate' && '약간 불편'}
                                            {status === 'bad' && '불편함/통증'}
                                            {status === 'none' && '가스/설사'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-gray-900 text-base font-bold">기력 (0-10)</Label>
                            <Controller
                                name="energyLevel"
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <div className="space-y-2">
                                        <Slider
                                            min={0}
                                            max={10}
                                            step={1}
                                            value={value}
                                            onChange={(e) => onChange(Number(e.target.value))}
                                        />
                                        <div className="flex justify-between text-xs text-gray-700 font-medium">
                                            <span>지침</span>
                                            <span>활기참</span>
                                        </div>
                                    </div>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-900 text-base font-bold">기타 메모</Label>
                            <textarea
                                {...register('notes')}
                                className="w-full p-2 border rounded-md h-24 text-base focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-500 text-gray-900 font-medium"
                                placeholder="특이사항이 있다면 기록해주세요."
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? '저장 중...' : '저장하기'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
