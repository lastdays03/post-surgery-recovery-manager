'use client'

import { useState } from 'react'
import { useChat } from '@/hooks/use-chat'
import { ChatInput } from './chat-input'
import { MessageList } from './message-list'
import { MessageCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInterfaceProps {
    userId: string // Need to pass authenticated user ID
}

export function ChatInterface({ userId }: ChatInterfaceProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    const { messages, isLoading, sendMessage } = useChat({ userId })

    if (!userId) return null // Hide if no user

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
                {/* Tooltip/Label on hover */}
                <div
                    className={cn(
                        "bg-black text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 transform origin-right shadow-lg mb-2",
                        !isOpen && isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
                    )}
                >
                    AI 회복 도우미와 대화하기
                </div>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "h-14 w-14 rounded-full shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center cursor-pointer",
                        isOpen ? "bg-gray-800 hover:bg-gray-700" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    )}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {isOpen ? (
                        <X className="w-6 h-6 text-white" />
                    ) : (
                        <MessageCircle className="w-7 h-7 text-white" />
                    )}
                </button>
            </div>

            {/* Chat Window */}
            <div
                className={cn(
                    "fixed bottom-24 right-6 z-40 w-[calc(100vw-3rem)] sm:w-[380px] h-[70vh] sm:h-[600px] max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 origin-bottom-right",
                    isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-10 pointer-events-none"
                )}
            >
                {/* Header */}
                <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="font-semibold text-gray-800">AI 회복 파트너</span>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                        GPT-4o / RAG v1.0
                    </div>
                </div>

                {/* Messages */}
                <MessageList messages={messages} isLoading={isLoading} />

                {/* Input */}
                <ChatInput onSend={sendMessage} isLoading={isLoading} />
            </div>
        </>
    )
}
