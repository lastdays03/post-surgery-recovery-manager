'use client'

import { useForm } from 'react-hook-form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdvancedMedicalMetrics } from '@/lib/types/medical-profile'

export type AdvancedMetricsFormData = AdvancedMedicalMetrics

interface AdvancedMetricsFormProps {
    defaultValues?: Partial<AdvancedMetricsFormData>
    onSubmit: (data: AdvancedMetricsFormData) => void
    onSkip?: () => void
    showSkipButton?: boolean
}

export function AdvancedMetricsForm({
    defaultValues,
    onSubmit,
    onSkip,
    showSkipButton = true
}: AdvancedMetricsFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<AdvancedMetricsFormData>({
        defaultValues
    })

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 영양 위험도 평가 */}
            <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">📊 영양 위험도 평가</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-900">
                            NRS-2002 점수 (0-7점)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="7"
                            step="1"
                            placeholder="예: 4"
                            {...register('nrs_2002_score', {
                                valueAsNumber: true,
                                min: 0,
                                max: 7
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                            ≥3점: 영양 위험, ≥5점: 고위험
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-900">
                            혈청 알부민 (g/L)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            placeholder="예: 35.5"
                            {...register('serum_albumin', { valueAsNumber: true })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                            {'<'}30 g/L: 고위험 (단백질 결핍)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-900">
                            6개월 체중 변화 (kg)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            placeholder="예: -8 (감소), +3 (증가)"
                            {...register('weight_change_6m', { valueAsNumber: true })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                            10-15% 감소 시 중증 위험
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-900">
                            SGA 등급 (Subjective Global Assessment)
                        </label>
                        <select
                            {...register('sga_grade')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">선택 안함</option>
                            <option value="A">A - 양호</option>
                            <option value="B">B - 경증/중등도 영양불량</option>
                            <option value="C">C - 중증 영양불량</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* 섭취 능력 */}
            <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">🍽️ 섭취 능력</h3>

                <div className="space-y-4">
                    <div>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                {...register('oral_intake_possible')}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="font-medium text-gray-900">경구 섭취 가능</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-900">
                            예상 금식 기간 (일)
                        </label>
                        <input
                            type="number"
                            min="0"
                            placeholder="예: 7"
                            {...register('expected_fasting_days', { valueAsNumber: true })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                            {'>'}5일: 영양 공급 경로 고려, {'>'}14일: 고위험
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-900">
                            현재 섭취율 (%)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="예: 60"
                            {...register('intake_rate', { valueAsNumber: true })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                            필요량 대비 섭취 비율, {'<'}50%: 추가 보충 필요
                        </p>
                    </div>
                </div>
            </Card>

            {/* 소화기 기능 */}
            <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">🫀 소화기 및 대사</h3>

                <div className="space-y-3">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            {...register('gastric_emptying_delayed')}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-900">위배출 지연</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            {...register('has_gerd')}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-900">위식도역류질환 (GERD)</span>
                    </label>
                </div>
            </Card>

            {/* 근육/체력 */}
            <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">💪 근육 상태</h3>

                <div className="space-y-3">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            {...register('has_sarcopenia')}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-900">근감소증 (Sarcopenia)</span>
                    </label>
                    <p className="text-xs text-gray-600">
                        근감소증이 있으면 합병증 위험 증가 및 단백질 요구량 상승
                    </p>
                </div>
            </Card>

            {/* 안내 메시지 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                    💡 이 정보는 더 정밀한 영양 계산과 식단 추천에 활용됩니다.
                    검사 결과가 없는 항목은 비워두셔도 됩니다.
                </p>
            </div>

            {/* 버튼 */}
            <div className="flex justify-between items-center pt-4">
                {showSkipButton && onSkip && (
                    <Button type="button" variant="ghost" onClick={onSkip} className="text-gray-500 hover:text-gray-700">
                        건너뛰기
                    </Button>
                )}
                <Button type="submit" size="lg" className="ml-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                    완료 및 저장
                </Button>
            </div>
        </form>
    )
}
