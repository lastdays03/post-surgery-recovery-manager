import { useEffect, useRef } from 'react'
import { Message } from '@/hooks/use-chat'
import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MealSuggestionCard } from './meal-suggestion-card'

interface MessageListProps {
    messages: Message[]
    isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    // 식단 제안 태그 파싱 헬퍼
    const renderMessageContent = (content: string) => {
        const mealRegex = /<meal_suggestion>([\s\S]*?)<\/meal_suggestion>/
        const match = content.match(mealRegex)

        if (match) {
            try {
                const mealData = JSON.parse(match[1])
                const textPart = content.replace(mealRegex, '').trim()

                return (
                    <div className="space-y-3">
                        {textPart && <p>{textPart}</p>}
                        <MealSuggestionCard
                            meal={mealData}
                            onSelect={(meal) => alert(`${meal.name}이(가) 식단에 추가되었습니다!`)}
                        />
                    </div>
                )
            } catch (e) {
                console.error('Failed to parse meal suggestion JSON', e)
                return <p>{content}</p>
            }
        }

        return <p>{content}</p>
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bot className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-800">회복 도우미 AI</h3>
                        <p className="text-sm mt-1">수술 회복, 식단, 운동에 대해 무엇이든 물어보세요.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-xs w-full max-w-xs">
                        <div className="bg-white p-2 rounded-lg border shadow-sm">"오늘 어떤 운동을 하면 좋을까?"</div>
                        <div className="bg-white p-2 rounded-lg border shadow-sm">"소화 잘 되는 음식 추천해줘"</div>
                    </div>
                </div>
            )}

            {messages.map((message) => (
                <div
                    key={message.id}
                    className={cn(
                        "flex gap-3 max-w-[85%] w-fit",
                        message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                >
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        message.role === 'user' ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                    )}>
                        {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>

                    <div className={cn(
                        "rounded-2xl px-4 py-3 text-base shadow-sm whitespace-pre-wrap leading-relaxed break-words",
                        message.role === 'user'
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                    )}>
                        {message.role === 'assistant'
                            ? renderMessageContent(message.content)
                            : message.content}
                    </div>
                </div>
            ))}

            {isLoading && (
                <div className="flex gap-3 max-w-[85%] mr-auto">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-600 text-white">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                </div>
            )}

            <div ref={bottomRef} className="pb-2" />
        </div>
    )
}
