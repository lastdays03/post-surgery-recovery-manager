import { useState, KeyboardEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
    onSend: (message: string) => void
    isLoading: boolean
    disabled?: boolean
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
    const [input, setInput] = useState('')

    const handleSubmit = () => {
        if (!input.trim() || isLoading || disabled) return
        onSend(input)
        setInput('')
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="궁금한 점을 물어보세요..."
                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder:text-gray-500 text-gray-700 text-sm"
                    disabled={isLoading || disabled}
                />
                <button
                    onClick={handleSubmit}
                    disabled={!input.trim() || isLoading || disabled}
                    className="bg-[#8ba4ff] hover:bg-[#7a93ee] disabled:bg-blue-200 text-white w-[48px] h-[48px] rounded-xl transition-colors flex items-center justify-center shadow-sm flex-shrink-0"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={20} className="ml-0.5 mt-0.5" />}
                </button>
            </div>
        </div>
    )
}
