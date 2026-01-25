'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Bot, User, Loader2 } from 'lucide-react'
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
                <div className="h-[400px] overflow-y-auto p-6 space-y-4 bg-gray-50">
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
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSendMessage()
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="식단 수정 요청을 입력하세요..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isLoading}
                            className="flex-1 focus-visible:ring-green-500"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !inputValue.trim()}
                            className="bg-green-600 hover:bg-green-700 px-4"
                        >
                            <Send size={20} />
                        </Button>
                    </form>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                        💡 예: "계란 알레르기가 있어요", "더 부드러운 음식으로 바꿔주세요"
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
