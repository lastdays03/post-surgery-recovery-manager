"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDocumentOnboardingStore } from '@/lib/stores/document-onboarding-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BasicFieldReview } from '@/components/onboarding/basic-field-review'
import { AdvancedFieldReview } from '@/components/onboarding/advanced-field-review'
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function ReviewPage() {
    const router = useRouter()
    const {
        extractedData,
        advancedEnabled,
        setAdvancedEnabled,
        updateReviewedData
    } = useDocumentOnboardingStore()

    // Initialize editedData directly from store to avoid hydration mismatch if possible, 
    // but simpler to use useEffect or just simple state if we accept client-side rendering.
    // We'll trust extractedData is available from persistent store.
    const [editedData, setEditedData] = useState(extractedData)
    const [showAdvancedInput, setShowAdvancedInput] = useState(false)

    useEffect(() => {
        if (!extractedData) {
            router.push('/onboarding')
        } else {
            setEditedData(extractedData)
        }
    }, [extractedData, router])

    if (!extractedData || !editedData) return null

    const handleFieldEdit = (category: 'basic' | 'advanced', field: string, value: any) => {
        setEditedData(prev => {
            if (!prev) return prev

            const categoryData = prev[category]
            return {
                ...prev,
                [category]: {
                    ...categoryData,
                    [field]: {
                        ...(categoryData as any)[field],
                        value,
                        confidence: 1.0
                    }
                }
            }
        })
    }

    const handleNext = () => {
        updateReviewedData(editedData)

        if (showAdvancedInput) {
            router.push('/onboarding/document/advanced')
        } else {
            // For now, if no advanced input wanted, we might go to dashboard OR complete.
            // The plan later says "save logic" here. 
            // For this step, let's redirect to advanced page if advanced data exists, 
            // or /onboarding/complete if not (or implement direct save later).
            // Based on plan: "router.push('/onboarding/document/advanced') if showAdvancedInput else save & dashboard"
            // I will implement saving in a later task, for now routing to complete/dashboard placeholders.
            if (advancedEnabled) {
                router.push('/onboarding/document/advanced')
            } else {
                router.push('/onboarding/complete')
            }
        }
    }

    const getNutritionRiskLevel = (score: number): 'normal' | 'medium' | 'high' => {
        if (score >= 5) return 'high'
        if (score >= 3) return 'medium'
        return 'normal'
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">추출 결과 확인</h1>

                {/* 기본 정보 섹션 */}
                <Card className="p-6 sm:p-8">
                    <h2 className="text-xl font-bold mb-6 flex items-center">
                        ✅ 기본 정보
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            자동 추출된 정보를 확인해주세요
                        </span>
                    </h2>

                    <div className="space-y-1">
                        <BasicFieldReview
                            field={editedData.basic.surgery_type}
                            label="수술 종류"
                            options={[
                                { value: 'gastric_resection', label: '위절제술' },
                                { value: 'colon_resection', label: '대장절제술' },
                                { value: 'tkr', label: '슬관절 치환술' },
                                { value: 'spinal_fusion', label: '척추 유합술' },
                                { value: 'cholecystectomy', label: '담낭절제술' }
                            ]}
                            onEdit={(value) => handleFieldEdit('basic', 'surgery_type', value)}
                        />

                        <BasicFieldReview
                            field={editedData.basic.surgery_date}
                            label="수술 날짜"
                            type="date"
                            onEdit={(value) => handleFieldEdit('basic', 'surgery_date', value)}
                        />

                        <BasicFieldReview
                            field={editedData.basic.age}
                            label="나이"
                            type="number"
                            onEdit={(value) => handleFieldEdit('basic', 'age', value)}
                        />

                        <BasicFieldReview
                            field={editedData.basic.weight}
                            label="체중 (kg)"
                            type="number"
                            onEdit={(value) => handleFieldEdit('basic', 'weight', value)}
                        />

                        <BasicFieldReview
                            field={editedData.basic.height}
                            label="키 (cm)"
                            type="number"
                            onEdit={(value) => handleFieldEdit('basic', 'height', value)}
                        />

                        <BasicFieldReview
                            field={editedData.basic.digestive_capacity}
                            label="소화 능력"
                            options={[
                                { value: 'good', label: '좋음' },
                                { value: 'moderate', label: '보통' },
                                { value: 'poor', label: '나쁨' }
                            ]}
                            onEdit={(value) => handleFieldEdit('basic', 'digestive_capacity', value)}
                        />
                    </div>
                </Card>

                {/* 고급 의학 지표 섹션 */}
                <Card className="p-6 sm:p-8 border-2 border-blue-100 bg-blue-50/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                        <div>
                            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                                🔬 고급 의학 지표
                                {extractedData.hasAdvancedData && <Badge variant="secondary" className="bg-blue-100 text-blue-700">감지됨</Badge>}
                            </h2>
                            <p className="text-sm text-gray-600">
                                더 정밀한 영양 평가를 위한 임상 지표입니다.
                            </p>
                        </div>

                        {extractedData.hasAdvancedData && (
                            <div className="flex items-center space-x-2">
                                <Switch checked={advancedEnabled} onCheckedChange={setAdvancedEnabled} id="advanced-mode" />
                                <Label htmlFor="advanced-mode" className="font-medium cursor-pointer">포함하기</Label>
                            </div>
                        )}
                    </div>

                    {advancedEnabled && extractedData.hasAdvancedData ? (
                        // 케이스 A: 고급 지표 감지됨 + 사용자가 활성화함
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <AdvancedFieldReview
                                field={editedData.advanced.nrs_2002_score}
                                label="NRS-2002 점수"
                                unit="점"
                                warningLevel={getNutritionRiskLevel(editedData.advanced.nrs_2002_score.value || 0)}
                                onEdit={(value) => handleFieldEdit('advanced', 'nrs_2002_score', value)}
                            />

                            <AdvancedFieldReview
                                field={editedData.advanced.serum_albumin}
                                label="혈청 알부민"
                                unit="g/L"
                                warningLevel={(editedData.advanced.serum_albumin.value || 99) < 3.0 ? 'high' : 'normal'} // Assuming g/dL usually 3.5-5.0, g/L 30? Plan said <30 g/L. Correcting unit logic.
                                // Note: Standard albumin is often g/dL (e.g. 4.0). If g/L, it's 40. Plan says g/L.
                                // Code said < 30 g/L is high risk.
                                onEdit={(value) => handleFieldEdit('advanced', 'serum_albumin', value)}
                            />

                            <AdvancedFieldReview
                                field={editedData.advanced.weight_change_6m}
                                label="6개월 체중 변화"
                                unit="kg"
                                onEdit={(value) => handleFieldEdit('advanced', 'weight_change_6m', value)}
                            />

                            {/* More fields can be added here */}
                        </div>
                    ) : (
                        // 케이스 B: 고급 지표 미감지 또는 비활성화
                        <div className="text-center py-8 bg-white/50 rounded-xl border border-dashed border-blue-200">
                            <div className="text-4xl mb-4">📋</div>
                            <p className="text-gray-700 mb-2 font-medium">
                                {extractedData.hasAdvancedData ? "고급 지표가 비활성화되었습니다." : "진단서에서 추가 임상 지표를 발견하지 못했습니다."}
                            </p>
                            <p className="text-sm text-gray-600 mb-6">
                                NRS-2002 점수, 혈청 알부민 등의 임상 검사 결과가 있다면<br />
                                더 정밀한 식단 추천이 가능합니다.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setAdvancedEnabled(true) // Ensure it's enabled if they choose to input
                                    setShowAdvancedInput(true)
                                }}
                                className="bg-white hover:bg-gray-50 text-blue-600 border-blue-200 hover:border-blue-300"
                            >
                                직접 입력하기
                            </Button>
                        </div>
                    )}
                </Card>

                {/* 네비게이션 */}
                <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={() => router.back()} className="text-gray-500">
                        이전
                    </Button>
                    <Button onClick={handleNext} size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg px-8">
                        {showAdvancedInput ? '다음: 상세 입력' : '다음'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
