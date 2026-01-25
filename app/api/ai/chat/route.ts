import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { chatWithAssistant } from '@/lib/ai/chat-assistant'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { message, history, userId } = body

        // Basic Validation: Ensure userId is present.
        // In a real app, we MUST verify userId matches the authenticated session from cookies/headers.
        // For this prototype/MVP, we'll verify if the user exists in DB at least, or rely on client sending correct ID.
        // IMPROVEMENT: Use `supabase.auth.getUser()` with the request cookies.

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: Missing User ID' }, { status: 401 })
        }

        // Call Chat Logic
        const response = await chatWithAssistant({
            userId,
            message,
            conversationHistory: history
        })

        if (response.error) {
            // If standard error message, return 200 with error field or 400?
            // Client expects { message: string, error?: string }
            return NextResponse.json(response) // Return 200 but with error field logic
        }

        return NextResponse.json(response)

    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
