import { NextRequest, NextResponse } from 'next/server'
import { processOnboardingChat } from '@/lib/ai/onboarding-ai'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { message, history } = body

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        const response = await processOnboardingChat(message, history || [])

        return NextResponse.json(response)
    } catch (error) {
        console.error('Onboarding API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
