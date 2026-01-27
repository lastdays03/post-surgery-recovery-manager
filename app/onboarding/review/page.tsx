"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Check, AlertCircle, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useDocumentOnboardingStore } from "@/lib/stores/document-onboarding-store"
import { ocrFactory } from "@/lib/ocr/factory"
import { extractMedicalData } from "@/lib/ocr/extractor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import type { MedicalDataExtraction } from "@/lib/types/medical-profile"

export default function ReviewPage() {
    const { uploadedFile, filePreviewUrl, extractedData, setStep, setOCRResult, setExtractedData, advancedEnabled, setAdvancedEnabled } = useDocumentOnboardingStore()
    const [isAnalyzing, setIsAnalyzing] = useState(true)
    const [loadingStep, setLoadingStep] = useState(0)

    // Simulation for loading steps
    const loadingMessages = [
        "문서를 스캔하고 있어요...",
        "텍스트를 읽어내는 중...",
        "의료 전문 용어를 분석 중...",
        "거의 다 됐어요!"
    ]

    useEffect(() => {
        if (!uploadedFile) return

        let stepInterval: NodeJS.Timeout

        const analyze = async () => {
            try {
                // Loading Animation Simulation
                stepInterval = setInterval(() => {
                    setLoadingStep(prev => (prev < loadingMessages.length - 1 ? prev + 1 : prev))
                }, 1500)

                // 1. OCR Processing
                const provider = await ocrFactory.getProvider('tesseract') // For now, use Tesseract
                const ocrResult = await provider.process(uploadedFile)
                setOCRResult({
                    text: ocrResult.text,
                    confidence: ocrResult.confidence,
                    provider: ocrResult.metadata.provider
                })

                // 2. Data Extraction
                const extracted = await extractMedicalData(ocrResult.text)
                setExtractedData(extracted)

            } catch (error) {
                console.error("Analysis Failed", error)
                alert("문서 분석에 실패했습니다. 다시 시도해주세요.")
            } finally {
                clearInterval(stepInterval)
                setIsAnalyzing(false)
            }
        }

        analyze()

        return () => clearInterval(stepInterval)
    }, [uploadedFile]) // Dependency on uploadedFile

    if (!uploadedFile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p>업로드된 파일이 없습니다.</p>
                <Link href="/onboarding/upload">
                    <Button className="mt-4">다시 업로드하기</Button>
                </Link>
            </div>
        )
    }

    const router = useRouter() // useRouter 추가

    const handleChange = (section: 'basic' | 'advanced', field: string, value: string) => {
        if (!extractedData) return

        // deep clone to avoid mutation issues
        const newData = JSON.parse(JSON.stringify(extractedData)) as MedicalDataExtraction

        if (section === 'basic') {
            if (field === 'age' || field === 'weight' || field === 'height') {
                // @ts-ignore
                newData.basic[field] = { value: Number(value), confidence: 1 }
            } else if (field === 'surgery_date') {
                // @ts-ignore
                newData.basic[field] = { value: value, confidence: 1 }
            } else {
                // @ts-ignore
                newData.basic[field] = { value: value, confidence: 1 }
            }
        } else {
            // @ts-ignore
            newData.advanced[field] = { value: Number(value), confidence: 1 }
        }

        setExtractedData(newData)
    }

    const handleConfirm = () => {
        if (!extractedData) return

        // 1. Check for missing critical data
        // Critical: Surgery Type, Date, Age, Weight
        const basic = extractedData.basic
        const missingFields = []
        if (!basic.surgery_type.value) missingFields.push('수술명')
        if (!basic.surgery_date.value) missingFields.push('수술 날짜')
        if (!basic.age.value === null || basic.age.value === undefined) missingFields.push('나이')
        if (!basic.weight.value === null || basic.weight.value === undefined) missingFields.push('체중')

        if (missingFields.length > 0) {
            // 2-A. If missing, redirect to Supplement Chat
            const confirmMove = confirm(`다음 정보가 누락되었습니다: ${missingFields.join(', ')}\n\n조이와 대화하며 나머지를 채워볼까요?`)
            if (confirmMove) {
                // Set flag or context for chat
                // For now, just push to chat page (which we need to implement or reuse manual)
                // We'll reuse 'manual' page but maybe with a query param or store state
                setStep('supplement')
                router.push('/onboarding/manual?mode=supplement')
            }
        } else {
            // 2-B. If complete, save and go to result/dashboard
            // In real app, call API here
            // alert("정보가 성공적으로 저장되었습니다! (대시보드로 이동)")
            router.push('/onboarding/complete')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <Link href="/onboarding/upload">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Button>
                    </Link>
                    <h1 className="font-semibold text-gray-900">분석 결과 확인</h1>
                </div>
                <div className="text-xs text-gray-400">
                    Step 2 of 3
                </div>
            </header>

            <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6">

                {/* Loading State Overlay */}
                <AnimatePresence>
                    {isAnalyzing && (
                        <motion.div
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-6 p-6 text-center"
                        >
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center animate-pulse">
                                    <Sparkles className="w-10 h-10 text-blue-500 animate-spin-slow" />
                                </div>
                                <div className="absolute inset-0 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-gray-900">AI가 문서를 분석하고 있어요</h2>
                                <motion.p
                                    key={loadingStep}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-gray-500 font-medium"
                                >
                                    {loadingMessages[loadingStep]}
                                </motion.p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                {!isAnalyzing && extractedData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6 pb-20"
                    >
                        {/* Confidence & Source Info */}
                        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Check className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">분석 완료!</p>
                                    <p className="text-xs text-gray-500">
                                        신뢰도 {(useDocumentOnboardingStore.getState().ocrResult?.confidence! * 100).toFixed(0)}% • Tesseract Engine
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">기본 정보</h3>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">수술 정보</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="surgery_name">수술명</Label>
                                        <Input
                                            id="surgery_name"
                                            defaultValue={extractedData.basic.surgery_type.value || ""}
                                            onChange={(e) => handleChange('basic', 'surgery_type', e.target.value)}
                                            placeholder="직접 입력해주세요"
                                            className={extractedData.basic.surgery_type.value ? "border-green-200 bg-green-50/30" : "border-amber-200 bg-amber-50/30"}
                                        />
                                        {extractedData.basic.surgery_type.value && (
                                            <p className="text-xs text-green-600 flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" /> 문서에서 감지됨
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="surgery_date">수술 날짜</Label>
                                        <Input
                                            id="surgery_date"
                                            type="date"
                                            defaultValue={extractedData.basic.surgery_date.value || ""}
                                            onChange={(e) => handleChange('basic', 'surgery_date', e.target.value)}
                                            className={extractedData.basic.surgery_date.value ? "border-green-200" : ""}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">신체 정보</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="age">나이</Label>
                                        <div className="relative">
                                            <Input
                                                id="age"
                                                type="number"
                                                defaultValue={extractedData.basic.age.value || ""}
                                                onChange={(e) => handleChange('basic', 'age', e.target.value)}
                                            />
                                            <span className="absolute right-3 top-2.5 text-gray-400 text-sm">세</span>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="weight">체중</Label>
                                        <div className="relative">
                                            <Input
                                                id="weight"
                                                type="number"
                                                defaultValue={extractedData.basic.weight.value || ""}
                                                onChange={(e) => handleChange('basic', 'weight', e.target.value)}
                                            />
                                            <span className="absolute right-3 top-2.5 text-gray-400 text-sm">kg</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Advanced Metrics Toggle */}
                            <div className="pt-4 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">고급 영양 지표</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setAdvancedEnabled(!advancedEnabled)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                    {advancedEnabled ? '접기' : '펼치기'}
                                </Button>
                            </div>

                            <AnimatePresence>
                                {advancedEnabled && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden space-y-4"
                                    >
                                        <Card className="border-purple-100 bg-purple-50/10">
                                            <CardContent className="pt-6 space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs text-gray-500">NRS-2002 (영양위험도)</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0-7"
                                                            defaultValue={extractedData.advanced.nrs_2002_score.value || ""}
                                                            onChange={(e) => handleChange('advanced', 'nrs_2002_score', e.target.value)}
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs text-gray-500">혈청 알부민 (g/dL)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="예: 3.5"
                                                            defaultValue={extractedData.advanced.serum_albumin.value || ""}
                                                            onChange={(e) => handleChange('advanced', 'serum_albumin', e.target.value)}
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs text-gray-500">BMI (체질량지수)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="예: 22.5"
                                                            defaultValue={extractedData.advanced.bmi.value || ""}
                                                            onChange={(e) => handleChange('advanced', 'bmi', e.target.value)}
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs text-gray-500">6개월 체중 변화 (kg)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="예: -3.0"
                                                            defaultValue={extractedData.advanced.weight_change_6m.value || ""}
                                                            onChange={(e) => handleChange('advanced', 'weight_change_6m', e.target.value)}
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label className="text-xs text-gray-500">예상 금식 기간 (일)</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="수술 후 금식 일수"
                                                        defaultValue={extractedData.advanced.expected_fasting_days.value || ""}
                                                        onChange={(e) => handleChange('advanced', 'expected_fasting_days', e.target.value)}
                                                        className="bg-white"
                                                    />
                                                </div>

                                                <p className="text-xs text-purple-600 pt-2">
                                                    * 입력하지 않은 항목은 추후 채팅을 통해서도 보완할 수 있습니다.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Floating Action Button */}
            {!isAnalyzing && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 md:static md:bg-transparent md:border-0 z-40">
                    <div className="max-w-lg mx-auto flex gap-3">
                        <Link href="/onboarding/upload" className="flex-1">
                            <Button variant="outline" className="w-full h-12 text-gray-600 border-gray-300">
                                다시 찍기
                            </Button>
                        </Link>
                        <Button
                            className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200/50"
                            onClick={handleConfirm}
                        >
                            정보가 맞아요
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
