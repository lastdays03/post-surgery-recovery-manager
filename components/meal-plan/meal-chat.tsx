'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

import { Bot, User, Loader2, Send } from 'lucide-react'
import type { Meal } from '@/lib/types/meal.types'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface MealChatProps {
    userId: string
    currentMeals: Meal[]
    onMealsUpdated: (meals: Meal[]) => void
}

export function MealChat({ userId, currentMeals, onMealsUpdated }: MealChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '안녕하세요! 식단에 대해 궁금하신 점이나 수정하고 싶은 부분이 있으신가요? 예를 들어 "계란 빼줘", "더 부드러운 음식으로 바꿔줘" 같은 요청을 해주세요.'
        }
    ])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const chatContainerRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            const { scrollHeight, clientHeight } = chatContainerRef.current
            chatContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: 'smooth'
            })
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async (inputMessage?: string) => {
        const messageToSend = inputMessage || inputValue
        if (!messageToSend.trim() || isLoading) return

        const userMessage = messageToSend.trim()
        setInputValue('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setIsLoading(true)

        try {
            const response = await fetch('/api/ai/meal-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    currentMeals,
                    message: userMessage,
                    conversationHistory: messages
                })
            })

            const data = await response.json()

            if (data.error) {
                setMessages(prev => [
                    ...prev,
                    { role: 'assistant', content: `오류: ${data.error}` }
                ])
            } else {
                setMessages(prev => [
                    ...prev,
                    { role: 'assistant', content: data.reply }
                ])
                // 식단 업데이트
                if (data.updatedMeals) {
                    onMealsUpdated(data.updatedMeals)
                }
            }
        } catch (error) {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: '서버 연결에 실패했습니다. 다시 시도해주세요.' }
            ])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="shadow-xl border-t-4 border-t-green-500">
            <CardHeader className="bg-white border-b">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Bot className="text-green-600" size={24} />
                    식단 AI 어시스턴트
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {/* Chat Area */}
                <div
                    ref={chatContainerRef}
                    className="h-[400px] overflow-y-auto p-6 space-y-4 bg-gray-50"
                >
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
                                    className={`p-2 rounded-full ${message.role === 'user' ? 'bg-green-100' : 'bg-white border shadow-sm'
                                        }`}
                                >
                                    {message.role === 'user' ? (
                                        <User size={20} className="text-green-600" />
                                    ) : (
                                        <Bot size={20} className="text-gray-600" />
                                    )}
                                </div>
                                <div
                                    className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${message.role === 'user'
                                        ? 'bg-green-600 text-white rounded-tr-none'
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
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white border-t">
                    <div className="flex gap-3">
                        <input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="메시지를 입력해 주세요..."
                            disabled={isLoading}
                            className="flex-1 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder:text-gray-400 text-gray-700 text-base"
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={isLoading || !inputValue.trim()}
                            className="bg-[#8ba4ff] hover:bg-[#7a93ee] disabled:bg-blue-200 text-white w-[60px] h-[60px] rounded-xl transition-colors flex items-center justify-center shadow-sm"
                        >
                            <Send size={24} className="ml-0.5 mt-0.5" />
                        </button>
                    </div>
                    <div className="bg-white pt-4">
                        <p className="text-[10px] text-gray-400 text-center">
                            💡 예: "계란 빼줘" 또는 "부드러운 음식으로 변경"
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
