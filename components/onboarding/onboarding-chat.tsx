'use client'

import { useState, useEffect, useRef } from 'react'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, User, Bot, Loader2, CheckCircle2 } from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export function OnboardingChat() {
    const { updateFormData, setStep } = useOnboardingStore()
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '안녕하세요! 수술 후 회복 관리를 도와드릴 AI 가이드입니다. 먼저 어떤 수술을 받으셨는지, 그리고 언제 받으셨는지 말씀해 주시겠어요?'
        }
    ])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return

        const userMessage = inputValue.trim()
        setInputValue('')
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
        setIsLoading(true)

        try {
            const response = await fetch('/api/ai/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages.map((m) => ({ role: m.role, content: m.content }))
                })
            })

            const data = await response.json()

            if (data.error) {
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: '죄송합니다. 처리 중 오류가 발생했습니다. 다시 시도해 주세요.' }
                ])
            } else {
                setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])

                // 데이터 업데이트
                if (data.extractedData) {
                    updateFormData(data.extractedData)
                }

                // 완료 확인
                if (data.isComplete) {
                    setIsComplete(true)
                }
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: '서버 연결에 실패했습니다. 네트워크 상태를 확인해 주세요.' }
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const handleFinalize = () => {
        // 모든 정보 수집 완료 후 다음 단계(대시보드 또는 추가 입력)로 이동
        setStep(2) // 기존 순서대로라면 다음은 개인정보 입력
    }

    return (
        <Card className="max-w-3xl mx-auto flex flex-col h-[600px] shadow-xl border-t-4 border-t-blue-500 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b p-4 text-center">
                <h3 className="text-xl font-bold text-gray-800">회복 가이드 AI 상담</h3>
                <p className="text-sm text-gray-500">대화를 통해 맞춤형 회복 계획을 세워보세요</p>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`flex max-w-[80%] items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''
                                }`}
                        >
                            <div
                                className={`p-2 rounded-full ${message.role === 'user' ? 'bg-blue-100' : 'bg-white border shadow-sm'
                                    }`}
                            >
                                {message.role === 'user' ? (
                                    <User size={20} className="text-blue-600" />
                                ) : (
                                    <Bot size={20} className="text-gray-600" />
                                )}
                            </div>
                            <div
                                className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${message.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white text-gray-800 rounded-tl-none border'
                                    }`}
                            >
                                {message.content}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl rounded-tl-none border shadow-sm">
                            <Loader2 className="animate-spin text-gray-400" size={16} />
                            <span className="text-xs text-gray-400 font-medium">AI 분석 중...</span>
                        </div>
                    </div>
                )}
                {isComplete && (
                    <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-2xl border border-green-200 mt-4 animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 size={48} className="text-green-500 mb-3" />
                        <h4 className="text-lg font-bold text-green-800 mb-1">정보 수집 완료!</h4>
                        <p className="text-sm text-green-600 text-center mb-4">
                            회복에 필요한 모든 기본 정보가 수집되었습니다.<br />
                            이제 대시보드에서 맞춤형 관리를 시작해보세요.
                        </p>
                        <Button onClick={handleFinalize} className="bg-green-600 hover:bg-green-700">
                            시작하기
                        </Button>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            {!isComplete && (
                <div className="p-4 bg-white border-t">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSendMessage()
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="메시지를 입력해 주세요..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isLoading}
                            className="flex-1 focus-visible:ring-blue-500"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !inputValue.trim()}
                            className="bg-blue-600 hover:bg-blue-700 px-4"
                        >
                            <Send size={20} />
                        </Button>
                    </form>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                        의료 전문 AI 상담은 정확한 회복 프로토콜에 기반하지만, 비상시에는 반드시 병원을 방문하세요.
                    </p>
                </div>
            )}
        </Card>
    )
}
