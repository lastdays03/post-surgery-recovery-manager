import { vi, describe, it, expect, beforeEach } from 'vitest'
import { saveSymptomLog, getSymptomLog } from '@/lib/services/log-service'
import { supabase } from '@/lib/supabase-client'

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(),
            insert: vi.fn(),
            update: vi.fn(),
            upsert: vi.fn(),
            eq: vi.fn(),
            single: vi.fn(),
        }))
    }
}))

describe('Symptom Log Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should save symptom logs successfully', async () => {
        const mockData = {
            profileId: 'profile-123',
            date: '2026-05-20',
            symptoms: {
                painLevel: 5,
                digestiveStatus: 'good',
                energyLevel: 3,
                notes: 'Test note'
            } as any
        }

        // Mock implementation for chain
        const mockUpsert = vi.fn().mockResolvedValue({ data: mockData, error: null })
        const mockFrom = vi.mocked(supabase.from)
        mockFrom.mockReturnValue({
            upsert: mockUpsert,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn()
        } as any)

        const result = await saveSymptomLog(mockData.profileId, mockData.date, mockData.symptoms)

        expect(mockFrom).toHaveBeenCalledWith('daily_logs')
        expect(mockUpsert).toHaveBeenCalled()
        expect(result).toEqual(true)
    })
})
