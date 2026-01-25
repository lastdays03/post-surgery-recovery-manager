import { useState, useCallback } from 'react'

export interface Message {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    createdAt: number
}

interface UseChatOptions {
    userId: string
    initialMessages?: Message[]
}

export function useChat({ userId, initialMessages = [] }: UseChatOptions) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            createdAt: Date.now()
        }

        setMessages(prev => [...prev, userMessage])
        setIsLoading(true)
        setError(null)

        try {
            // Prepare history for API (exclude local IDs if needed, but API expects {role, content})
            const history = messages.map(m => ({ role: m.role, content: m.content }))

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    message: content,
                    history
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send message')
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message,
                createdAt: Date.now()
            }

            setMessages(prev => [...prev, assistantMessage])

        } catch (err: any) {
            console.error('Chat Error:', err)
            setError(err.message || 'Something went wrong')
            // Optional: Remove user message if failed? Or keep it with error indicator.
            // Current logic: Keep user message, show error toast/state.
        } finally {
            setIsLoading(false)
        }
    }, [userId, messages])

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        setMessages // Exposed for clearing or manual updates
    }
}
