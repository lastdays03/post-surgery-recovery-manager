import { describe, it, expect, vi } from 'vitest'
import { searchKnowledgeBase } from '@/lib/ai/rag-search'
import { supabase } from '@/lib/supabase-client'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { beforeEach } from 'vitest'

// 모킹 설정
vi.mock('@/lib/supabase-client', () => ({
    supabase: {
        rpc: vi.fn()
    }
}))

vi.mock('@/lib/ai/embeddings', () => ({
    generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3])
}))

describe('searchKnowledgeBase (Hybrid Search)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('성공 시 hybrid_search_documents RPC를 호출하고 결과를 반환해야 함', async () => {
        const mockDocs = [
            { id: '1', content: '위절제술 후 식이 가이드', similarity: 0.8, hybrid_score: 1.8 }
        ]
            ; (supabase.rpc as any).mockResolvedValue({ data: mockDocs, error: null })

        const results = await searchKnowledgeBase('위절제술 식사')

        expect(supabase.rpc).toHaveBeenCalledWith('hybrid_search_documents', expect.objectContaining({
            query_text: '위절제술 식사'
        }))
        expect(results).toHaveLength(1)
        expect(results[0].hybrid_score).toBe(1.8)
    })

    it('hybrid_search 에러 시 match_documents(벡터 전용)로 폴백해야 함', async () => {
        const mockError = { message: 'Function not found' }
        const mockFallbackDocs = [
            { id: '2', content: '벡터 검색 결과', similarity: 0.7 }
        ]

            // 첫 번째 호출(hybrid_search)은 에러, 두 번째 호출(match_documents)은 성공하도록 설정
            ; (supabase.rpc as any)
                .mockResolvedValueOnce({ data: null, error: mockError })
                .mockResolvedValueOnce({ data: mockFallbackDocs, error: null })

        const results = await searchKnowledgeBase('위절제술 식사')

        expect(supabase.rpc).toHaveBeenCalledTimes(2)
        expect(supabase.rpc).toHaveBeenLastCalledWith('match_documents', expect.any(Object))
        expect(results).toHaveLength(1)
        expect(results[0].content).toBe('벡터 검색 결과')
    })
})
