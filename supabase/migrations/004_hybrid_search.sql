-- 하이브리드 검색을 위한 Full Text Search 설정 및 함수 추가

-- 1. Full Text Search(FTS) 벡터 컬럼 추가
-- 'simple' 구성을 사용하여 한글 검색 시 형태소 분석 없이 키워드 기반 매칭 수행
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS fts tsvector 
GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED;

-- 2. FTS 컬럼에 GIN 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_kb_fts ON knowledge_base USING gin(fts);

-- 3. 하이브리드 검색 RPC 함수 구현
-- 벡터 유사도와 텍스트 랭크를 결합하여 최종 점수 계산
CREATE OR REPLACE FUNCTION hybrid_search_documents(
  query_text TEXT,
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 10,
  full_text_weight FLOAT DEFAULT 1.0,
  vector_weight FLOAT DEFAULT 1.0
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT,
  fts_rank FLOAT,
  hybrid_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_matches AS (
    -- 벡터 검색 결과 추출
    SELECT
      kb.id,
      kb.content,
      kb.metadata,
      1 - (kb.embedding <=> query_embedding) AS similarity
    FROM knowledge_base kb
    WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
  ),
  fts_matches AS (
    -- 텍스트 검색 결과 및 랭크 추출
    SELECT
      kb.id,
      ts_rank_cd(kb.fts, plainto_tsquery('simple', query_text)) AS rank
    FROM knowledge_base kb
    WHERE kb.fts @@ plainto_tsquery('simple', query_text)
  )
  SELECT
    v.id,
    v.content,
    v.metadata,
    v.similarity,
    COALESCE(f.rank, 0)::float as fts_rank,
    -- 벡터 점수와 텍스트 점수를 가중치에 따라 합산
    (v.similarity * vector_weight) + (COALESCE(f.rank, 0) * full_text_weight) AS hybrid_score
  FROM vector_matches v
  LEFT JOIN fts_matches f ON v.id = f.id
  ORDER BY hybrid_score DESC
  LIMIT match_count;
END;
$$;
