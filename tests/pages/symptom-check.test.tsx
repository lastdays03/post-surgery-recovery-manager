import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SymptomCheckPage from '@/app/symptom-check/page'

// Mock useRouter
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: vi.fn(),
        back: vi.fn(),
    }),
}))

// Mock saveSymptomLog service
vi.mock('@/lib/services/log-service', () => ({
    saveSymptomLog: vi.fn().mockResolvedValue(true)
}))

// Mock profile
vi.mock('@/lib/local-storage', () => ({
    getProfile: () => ({
        id: 'profile-123',
        user_id: 'user-123',
        surgery_date: '2026-05-01'
    })
}))

describe('Symptom Check Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders symptom check form', () => {
        render(<SymptomCheckPage />)
        expect(screen.getByText(/컨디션 기록/i)).toBeDefined()
        expect(screen.getByText(/통증 정도 \(0-10\)/i)).toBeDefined()
        expect(screen.getByText(/식사 섭취율/i)).toBeDefined()
        expect(screen.getByText(/식사 후 증상/i)).toBeDefined()
        expect(screen.getByText(/체온 이상 여부/i)).toBeDefined()
        expect(screen.getByText(/배변 상태/i)).toBeDefined()
        expect(screen.getByText(/가장 힘들었던 점/i)).toBeDefined()
        expect(screen.getByText(/특이 증상 체크 \(복수 선택\)/i)).toBeDefined()
        expect(screen.getByText(/기력 \(0-10\)/i)).toBeDefined()
        expect(screen.getByRole('button', { name: /저장하기/i })).toBeDefined()
    })
})
