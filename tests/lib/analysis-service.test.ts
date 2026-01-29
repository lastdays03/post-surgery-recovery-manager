import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWeeklyAnalysis, fetchLatestAnalysis } from '@/lib/services/analysis-service';

// Mock supabase
vi.mock('@/lib/supabase-client', () => {
    const chainable = {
        eq: vi.fn(() => chainable),
        order: vi.fn(() => chainable),
        limit: vi.fn(() => chainable),
        single: vi.fn(() => ({
            data: {
                id: 'test-id',
                profile_id: 'profile-1',
                week_start: '2026-01-20',
                week_end: '2026-01-26',
                analysis_data: {
                    summary: { overallStatus: '안정', keyPoints: ['test'] }
                },
                created_at: '2026-01-27T00:00:00Z'
            },
            error: null
        }))
    };

    // Override single for the failing test case if needed, but for now let's keep it simple.
    // Actually, the test expects null for the second case. 
    // We need dynamic return values based on input or just different mocks per test.
    // But let's try a simpler approach where we just mock the chain properly.

    return {
        supabase: {
            from: vi.fn(() => ({
                select: vi.fn(() => ({
                    eq: vi.fn((field, value) => {
                        // If profile-999 is passed, return a chain that eventually returns null data
                        if (value === 'profile-999') {
                            return {
                                eq: vi.fn(() => chainable), // Should not happen in fetchLatestAnalysis
                                order: vi.fn(() => ({
                                    limit: vi.fn(() => ({
                                        single: vi.fn(() => ({ data: null, error: null }))
                                    }))
                                }))
                            }
                        }
                        return chainable;
                    }),
                    order: vi.fn(() => chainable)
                }))
            }))
        }
    };
});

describe('Analysis Service', () => {
    it('fetches weekly analysis successfully', async () => {
        const result = await fetchWeeklyAnalysis('profile-1', '2026-01-20', '2026-01-26');
        expect(result).not.toBeNull();
        expect(result?.profile_id).toBe('profile-1');
    });

    it('returns null when no analysis found', async () => {
        // Mock will return null
        const result = await fetchLatestAnalysis('profile-999');
        expect(result).toBeNull();
    });
});
