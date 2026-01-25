# 환경 변수 설정 가이드

## AI 프로바이더 설정

이 프로젝트는 다음 LLM 프로바이더를 지원합니다:

### 1. OpenAI (기본값)
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL_NAME=gpt-4o  # 선택사항, 기본값: gpt-4o
```

### 2. Google Gemini
```bash
AI_PROVIDER=google
GOOGLE_API_KEY=AIza...
GOOGLE_MODEL_NAME=gemini-pro  # 선택사항, 기본값: gemini-pro
```

### 3. Groq (초고속 추론)
```bash
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL_NAME=llama-3.3-70b-versatile  # 선택사항, 기본값: llama-3.3-70b-versatile
```

**사용 가능한 Groq 모델**:
- `llama-3.3-70b-versatile` (추천, 균형잡힌 성능)
- `llama-3.1-8b-instant` (초고속, 간단한 작업용)
- `mixtral-8x7b-32768` (긴 컨텍스트 지원)

**⚠️ 주의**: Groq는 임베딩 API를 제공하지 않으므로, RAG 기능(하이브리드 검색)을 사용하려면 OpenAI 또는 Google을 사용해야 합니다.

### 4. Mock (테스트용)
```bash
AI_PROVIDER=mock
```

## Supabase 설정
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 전체 .env.local 예시
```bash
# AI Provider
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_groq_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: 다른 프로바이더 키 (필요시)
# OPENAI_API_KEY=sk-...
# GOOGLE_API_KEY=AIza...
```
