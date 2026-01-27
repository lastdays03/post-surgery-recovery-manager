"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, UploadCloud, X, FileText, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDocumentOnboardingStore } from "@/lib/stores/document-onboarding-store"

export default function UploadPage() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const router = useRouter()

    const { uploadedFile, filePreviewUrl, setUploadedFile, setStep } = useDocumentOnboardingStore()

    const handleFile = (file: File) => {
        // 이미지 파일만 허용
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.')
            return
        }

        const previewUrl = URL.createObjectURL(file)
        setUploadedFile(file, previewUrl)
    }

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const onDragLeave = () => {
        setIsDragging(false)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const handleNext = () => {
        if (uploadedFile) {
            // 다음 단계로 이동하기 전 Review 페이지로 라우팅
            // 실제 분석 트리거는 다음 페이지나 이 버튼 클릭 시 수행할 수 있음
            // 지금은 단순히 라우팅만 처리
            router.push('/onboarding/document/review')
        }
    }

    const handleRemove = () => {
        // Store 리셋은 아니지만 파일만 제거하는 로직이 필요하다면 store에 추가하거나 
        // setUploadedFile에 null을 허용해야 함.
        // 현재 store 타입상 setUploadedFile은 File 필수지만 로직상 편의를 위해 페이지 리로드나...
        // 간단히 store reset을 호출하는게 깔끔할 수 있음.
        // 여기서는 새로고침 효과를 위해 input reset
        if (fileInputRef.current) fileInputRef.current.value = ""
        // setUploadedFile(null as any, "") // 타입 우회 혹은 store 수정 필요
        // 임시로 router refresh 사용하거나 store reset 사용
        // useDocumentOnboardingStore.getState().reset() 
        // 하지만 컴포넌트 내부이므로 훅 사용
        // const reset = useDocumentOnboardingStore(state => state.reset)
        // reset()

        // UX상 그냥 뒤로가기 처럼 동작하거나, 다시 업로드 
        // 여기서는 구현의 편의를 위해 페이지 새로고침(또는 상태 초기화)
        window.location.reload()
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
            <div className="w-full max-w-lg space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 pt-4">
                    <Link href="/onboarding" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold text-gray-900">진단서 업로드</h1>
                        <p className="text-sm text-gray-500">수술 기록이나 소견서를 촬영해 주세요.</p>
                    </div>
                </div>

                {/* Upload Area */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm p-6"
                >
                    {!uploadedFile ? (
                        <div
                            className={`
                border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center gap-4 transition-colors cursor-pointer
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
              `}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="p-4 bg-gray-100 rounded-full">
                                <Camera className="w-8 h-8 text-gray-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-gray-900">사진을 올리거나 찍어주세요</h3>
                                <p className="text-sm text-gray-500">JPG, PNG 파일 지원</p>
                            </div>
                            <Button variant="outline" className="mt-2" onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}>
                                파일 선택하기
                            </Button>
                        </div>
                    ) : (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200">
                            {/* Preview */}
                            <img src={filePreviewUrl!} alt="Preview" className="w-full h-64 object-cover" />
                            <div className="absolute top-2 right-2">
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove();
                                }} className="p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600 truncate flex-1">{uploadedFile.name}</span>
                            </div>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                </motion.div>

                {/* Action Button */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 md:static md:bg-transparent md:border-0">
                    <div className="max-w-lg mx-auto">
                        <Button
                            size="lg"
                            className="w-full text-lg h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-gray-200/50"
                            disabled={!uploadedFile}
                            onClick={handleNext}
                        >
                            분석 시작하기
                        </Button>
                    </div>
                </div>

                {/* Safe Area for mobile */}
                <div className="h-20 md:hidden" />
            </div>
        </div>
    )
}
