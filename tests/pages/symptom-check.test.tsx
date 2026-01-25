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
        expect(screen.getByText(/오늘의 컨디션 체크/i)).toBeDefined()
        expect(screen.getByText(/통증 정도/i)).toBeDefined()
        expect(screen.getByText(/소화 상태/i)).toBeDefined()
        expect(screen.getByText(/기력/i)).toBeDefined()
        expect(screen.getByRole('button', { name: /저장하기/i })).toBeDefined()
    })
})
