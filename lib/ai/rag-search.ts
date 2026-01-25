import { supabase } from '@/lib/supabase-client'
import { generateEmbedding } from './embeddings'

export interface SearchResult {
    id: string
    content: string
    metadata: any
    similarity: number
}

export async function searchKnowledgeBase(query: string, threshold = 0.5, limit = 5): Promise<SearchResult[]> {
    try {
        // 1. Generate query embedding (using the active AI provider)
        const embedding = await generateEmbedding(query)

        // 2. Call RPC to match documents
        const { data: documents, error } = await supabase.rpc('match_documents', {
            query_embedding: JSON.stringify(embedding),
            match_threshold: threshold,
            match_count: limit
        } as any)

        if (error) {
            console.error('Error searching knowledge base:', error)
            return []
        }

        return documents as SearchResult[]
    } catch (error) {
        console.error('Search failed:', error)
        return []
    }
}

export async function getContextForQuery(query: string): Promise<string> {
    const documents = await searchKnowledgeBase(query)

    if (documents.length === 0) {
        return ''
    }

    // Format context for LLM
    return documents.map(doc => `---
[Relevant Info (Similarity: ${doc.similarity.toFixed(2)})]
${doc.content.trim()}
---`).join('\n\n')
}
