
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import { OnboardingChat } from '../components/onboarding/onboarding-chat'
import { useOnboardingStore } from '../lib/stores/onboarding-store'

// Mock fetch globally
global.fetch = vi.fn()

// Use real store instead of mock
// vi.mock('../lib/stores/onboarding-store') 

describe('OnboardingChat Redesign', () => {
    beforeEach(() => {
        cleanup() // Ensure clean DOM
        vi.clearAllMocks()
        Element.prototype.scrollIntoView = vi.fn()

        // Reset store state
        useOnboardingStore.getState().resetOnboarding()
    })

    it('renders initial message', () => {
        render(<OnboardingChat />)
        expect(screen.getByText(/수술 후 회복 관리를 도와드릴/)).toBeTruthy()
    })

    it('shows confirmation buttons after surgery type input', async () => {
        // Mock successful API response
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                message: '수술 정보를 확인했습니다.',
                extractedData: { surgery_type: '위암 수술' }
            })
        })

        render(<OnboardingChat />)
        // screen.debug() // Debug initial render

        // Simulate user typing surgery name
        const input = screen.getAllByRole('textbox')[0]
        fireEvent.change(input, { target: { value: '위암 수술' } })
        fireEvent.click(screen.getAllByRole('button')[0]) // Send button

        // Wait for AI response and confirmation state
        await waitFor(() => {
            expect(screen.getByText('수술 정보를 확인했습니다.')).toBeTruthy()
            expect(screen.getByText('"위암 수술"이(가) 맞나요?')).toBeTruthy()
            expect(screen.getByRole('button', { name: /네, 맞아요/i })).toBeTruthy()
            expect(screen.getByRole('button', { name: /아니요/i })).toBeTruthy()
        })
    })

    it('shows date picker when confirmed', async () => {
        // Mock successful API response for confirmation "Yes"
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                message: '수술 날짜를 선택해주세요.',
                extractedData: { surgery_type: '위암 수술' } // Echo back or whatever
            })
        })

        render(<OnboardingChat />)

        // Manually set store state to pending_confirmation to skip first step?
        // Or simulate full flow. Simulating full flow is safer but longer.
        // Let's rely on the store mock being flexible or just run full flow.

        const input = screen.getAllByRole('textbox')[0]
        fireEvent.change(input, { target: { value: '위암 수술' } })
        fireEvent.click(screen.getAllByRole('button')[0])

        await waitFor(() => {
            expect(screen.getByText('"위암 수술"이(가) 맞나요?')).toBeTruthy()
        })

        // Click "네, 맞아요" button
        const confirmButton = screen.getByRole('button', { name: /네, 맞아요/i })
        fireEvent.click(confirmButton)

        await waitFor(() => {
            // Expect date picker label
            expect(screen.getByText('수술일자 선택')).toBeTruthy()
        })
    })

    it('completes without final AI message when date is selected', async () => {
        // Mock API responses
        const mockFetch = vi.fn()
            .mockResolvedValueOnce({ // First call: text "위암 수술"
                ok: true,
                json: async () => ({
                    message: '수술 정보를 확인했습니다.',
                    extractedData: { surgery_type: '위암 수술' }
                })
            })
            .mockResolvedValueOnce({ // Second call: confirm "네, 맞아요"
                ok: true,
                json: async () => ({
                    message: '날짜를 알려주세요.',
                    extractedData: { surgery_type: '위암 수술' }
                })
            })
            .mockResolvedValueOnce({ // Third call: text "2024-01-01"
                ok: true,
                json: async () => ({
                    message: '이 메시지는 표시되면 안 됩니다.',
                    extractedData: { surgery_date: '2024-01-01' }
                })
            })

        global.fetch = mockFetch

        render(<OnboardingChat />)

        // 1. Enter surgery type
        const input = screen.getByPlaceholderText(/메시지를 입력해 주세요/i)
        const sendButton = screen.getByRole('button', { name: /보내기/i })

        fireEvent.change(input, { target: { value: '위암 수술' } })
        fireEvent.click(sendButton)

        await waitFor(() => {
            expect(screen.getByText('"위암 수술"이(가) 맞나요?')).toBeTruthy()
        })

        // 2. Confirm surgery
        const confirmButton = screen.getByRole('button', { name: /네, 맞아요/i })
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(screen.getByText('수술일자 선택')).toBeTruthy()
        })

        // 3. Enter date as text to test extraction-triggered completion
        fireEvent.change(input, { target: { value: '2024-01-01' } })
        fireEvent.click(screen.getByRole('button', { name: /보내기/i }))

        await waitFor(() => {
            expect(screen.getByText('정보 수집 완료!')).toBeTruthy()
            // The final AI message from the third mock response should NOT be rendered
            expect(screen.queryByText('이 메시지는 표시되면 안 됩니다.')).toBeNull()
        })
    })
})
