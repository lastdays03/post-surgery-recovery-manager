"use client"

import { Card } from "@/components/ui/card"
import { ScanText, MessageSquareQuote, Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function OnboardingEntryPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-3">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-bold text-gray-900"
                    >
                        회복 관리를 시작해볼까요?
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-lg"
                    >
                        가장 편한 방법으로 수술 정보를 입력해주세요.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <Link href="/onboarding/upload" className="block group">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="h-full p-6 hover:shadow-lg transition-all border-2 border-transparent hover:border-black/5 relative overflow-hidden bg-white">
                                <div className="absolute top-0 right-0 p-3">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                        추천
                                    </span>
                                </div>
                                <div className="flex flex-col h-full space-y-4">
                                    <div className="p-3 bg-blue-50 w-fit rounded-xl group-hover:bg-blue-100 transition-colors">
                                        <ScanText className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            진단서/소견서 촬영
                                        </h2>
                                        <p className="text-gray-500 text-sm leading-relaxed">
                                            복잡한 수술 정보를 AI가 자동으로 분석해 입력해드려요. 사진만 찍으면 끝!
                                        </p>
                                    </div>
                                    <div className="pt-4 border-t border-gray-100">
                                        <ul className="space-y-2 text-sm text-gray-600">
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-500" />
                                                <span>수술명 자동 분류</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-500" />
                                                <span>고급 영양 지표 감지</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="flex items-center text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                                        시작하기 <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </Link>

                    <Link href="/onboarding/manual" className="block group">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="h-full p-6 hover:shadow-lg transition-all border-2 border-transparent hover:border-black/5 bg-white">
                                <div className="flex flex-col h-full space-y-4">
                                    <div className="p-3 bg-gray-100 w-fit rounded-xl group-hover:bg-gray-200 transition-colors">
                                        <MessageSquareQuote className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            직접 입력하기
                                        </h2>
                                        <p className="text-gray-500 text-sm leading-relaxed">
                                            챗봇 조이와 대화하며 차근차근 정보를 입력해요.
                                        </p>
                                    </div>
                                    <div className="pt-4 border-t border-gray-100">
                                        <ul className="space-y-2 text-sm text-gray-600">
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-gray-400" />
                                                <span>친절한 단계별 질문</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-gray-400" />
                                                <span>언제든 수정 가능</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="flex items-center text-gray-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                                        대화 시작하기 <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </Link>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center text-xs text-gray-400"
                >
                    수집된 모든 의료 정보는 안전하게 암호화되어 관리됩니다.
                </motion.p>
            </div>
        </div>
    )
}
