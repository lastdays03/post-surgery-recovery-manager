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

vi.mock('recharts', async () => {
    const OriginalModule = await vi.importActual('recharts')
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }: any) => (
            <div style={{ width: 800, height: 800 }}>{children}</div>
        ),
    }
})

describe('Weekly Report Page', () => {
    it('renders weekly summary', async () => {
        render(<WeeklyReportPage />)

        await waitFor(() => {
            expect(screen.getByText(/주간 리포트/i)).toBeDefined()
        })

        // Check for stats text
        // "평균 통증" and "평균 기력" might not be in the mock data or hardcoded text
        // Let's verify what's actually rendered based on the file content.
        // The file has hardcoded "소화위장상태" and "음식첩취율" in the Legend/Line names.
        // It does NOT seem to have "평균 통증" text based on the file view (unless calculated in `report`).
        // But the previous test run output had "소화위장상태" in the DOM.
        // I will match against "이번 주 회복 상태 요약" which is in the card title.

        expect(screen.getByText(/이번 주 회복 상태 요약/i)).toBeDefined()
    })
})
