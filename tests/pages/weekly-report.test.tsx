import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import WeeklyReportPage from '@/app/reports/weekly/page'

// Mock mocks
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
    }),
}))

vi.mock('@/lib/local-storage', () => ({
    getProfile: () => ({ id: 'p-1', user_id: 'u-1', surgery_date: '2026-05-01' })
}))

// Mock logs fetch
vi.mock('@/lib/services/log-service', () => ({
    getWeeklyLogs: vi.fn().mockResolvedValue([
        {
            profile_id: 'p-1',
            log_date: '2026-05-01',
            symptoms: { painLevel: 5, energyLevel: 5 }
        },
        {
            profile_id: 'p-1',
            log_date: '2026-05-02',
            symptoms: { painLevel: 3, energyLevel: 6 }
        }
    ])
}))

// Mock ResizeObserver for Recharts
class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}
global.ResizeObserver = ResizeObserver

describe('Weekly Report Page', () => {
    it('renders weekly summary', async () => {
        render(<WeeklyReportPage />)

        await waitFor(() => {
            expect(screen.getByText(/주간 회복 리포트/i)).toBeDefined()
        })

        // Check for stats text
        expect(screen.getByText(/평균 통증/i)).toBeDefined()
        expect(screen.getByText(/평균 기력/i)).toBeDefined()
    })
})
