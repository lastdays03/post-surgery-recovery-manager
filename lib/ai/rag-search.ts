import { supabase } from '@/lib/supabase-client'
import { generateEmbedding } from './embeddings'

export interface SearchResult {
    id: string
    content: string
    metadata: any
    similarity: number
    fts_rank?: number
    hybrid_score?: number
}

/**
 * 하이브리드 검색 (벡터 유사도 + 텍스트 매칭)을 수행합니다.
 */
export async function searchKnowledgeBase(query: string, threshold = 0.3, limit = 5): Promise<SearchResult[]> {
    try {
        // 1. 쿼리 임베딩 생성
        const embedding = await generateEmbedding(query)

        // 2. 하이브리드 검색 RPC 호출
        const { data: documents, error } = await supabase.rpc('hybrid_search_documents', {
            query_text: query,
            query_embedding: JSON.stringify(embedding),
            match_threshold: threshold,
            match_count: limit,
            full_text_weight: 1.0,  // 키워드 매칭 가중치
            vector_weight: 1.2     // 의미적 유사도 가중치 (약간 더 높게 설정)
        } as any)

        if (error) {
            console.error('Error searching knowledge base:', error)
            // 폴백: 기존 벡터 전용 검색 시도
            const { data: fallbackDocs } = await supabase.rpc('match_documents', {
                query_embedding: JSON.stringify(embedding),
                match_threshold: threshold,
                match_count: limit
            } as any)
            return (fallbackDocs as any as SearchResult[]) || []
        }

        return documents as SearchResult[]
    } catch (error) {
        console.error('Search failed:', error)
        return []
    }
}

/**
 * LLM 프롬프트에 제공할 컨텍스트를 생성합니다.
 */
export async function getContextForQuery(query: string): Promise<string> {
    const documents = await searchKnowledgeBase(query)

    if (documents.length === 0) {
        return ''
    }

    // 하이브리드 점수를 포함하여 컨텍스트 포맷팅
    return documents.map(doc => `---
[Relevant Info (Hybrid Score: ${doc.hybrid_score?.toFixed(2) || doc.similarity.toFixed(2)})]
${doc.content.trim()}
---`).join('\n\n')
}
