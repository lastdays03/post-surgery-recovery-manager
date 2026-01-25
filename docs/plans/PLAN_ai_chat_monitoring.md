# Plan: AI Chat & Monitoring System (Phase 8)

> **Based on**: `/dev-feature-planner` workflow & `doc/plans/2026-01-24-llm-integration-design.md`

## 1. Overview
This plan covers the implementation of the **AI-powered Chat Assistant** and **Monitoring System**. By analyzing the current codebase, we identified that the **AI Infrastructure (Phase 5)** is missing. Therefore, this plan incorporates the necessary infrastructure setup (Embeddings, RAG) as a prerequisite phase.

### Goal
Deliver a secure, RAG-based AI Chatbot that acts as a "Virtual Nurse" for post-surgery recovery, complete with token usage monitoring.

### Architecture Decisions
- **Model**: Multi-LLM Support (Configurable via `AI_PROVIDER`)
  - Primary: GPT-4o (`openai`)
  - Secondary: Gemini Pro (`google`)
- **Abstraction**: `LLMProvider` interface to decouple business logic from specific AI vendors.
- **Embedding**: `text-embedding-3-small` (OpenAI) or `embedding-001` (Gemini) -> *Decision: Keep OpenAI for embeddings initially for consistency, but wrap in interface.*
- **Vector DB**: Supabase `pgvector`
- **Search**: Hybrid Search
- **Safety**: Logic-based guardrails (Risk Assessment)

---

## 2. Phase Breakdown

### Phase 1: AI Infrastructure & Multi-LLM Core
**Goal**: Establish the `LLMProvider` abstraction and implement adapters for OpenAI and Gemini.

- [ ] **Task 1.1**: Verify & Apply Database Migrations (002_vector/003_ai_tables)
- [ ] **Task 1.2**: Install Dependencies
    -   `npm install @google/generative-ai`
- [ ] **Task 1.3 (TDD)**: Define `LLMClient` Interface & Factory
    -   Create `lib/ai/types.ts`: Define `LLMRequest`, `LLMResponse` types.
    -   Create `lib/ai/llm-service.ts`: Factory to return `OpenAIProvider` or `GeminiProvider` based on env.
- [ ] **Task 1.4 (TDD)**: Implement Providers
    -   `lib/ai/providers/openai-provider.ts`
    -   `lib/ai/providers/gemini-provider.ts`
- [ ] **Task 1.5 (TDD)**: Embeddings abstraction
    -   Update `lib/ai/embeddings.ts` to use the selected provider or specific embedding provider.

### Phase 2: Knowledge Base & RAG Engine
**Goal**: Index content and implement search.

- [ ] **Task 2.1 (TDD)**: Implement RAG Search `lib/ai/rag-search.ts`
    -   Impl: `searchKnowledgeBase`, `hybridSearch`
- [ ] **Task 2.2**: Create/Run Indexing Script `scripts/index-knowledge-base.ts`
    -   Ensure compatibility with the new embedding abstraction.

### Phase 3: Chat Assistant Logic (Backend)
**Goal**: Implement the core `chatWithAssistant` function using the `LLMService`.

- [ ] **Task 3.1 (TDD)**: create `lib/ai/safety-guardrails.ts`
- [ ] **Task 3.2 (TDD)**: create `lib/ai/chat-assistant.ts`
    -   **Change**: Use `LLMService.chat()` instead of direct `openai.chat.completions.create()`.
    -   Test: Verify switching providers affects the mock called.
- [ ] **Task 3.3 (TDD)**: API Route `app/api/ai/chat/route.ts`

### Phase 4: Chat UI & Integration
**Goal**: A user-friendly, responsive Chat Interface in the dashboard.

- [ ] **Task 4.1**: Create `components/ai/chat-interface.tsx` (UI Shell)
- [ ] **Task 4.2**: Implement `useChat` hook
- [ ] **Task 4.3**: Integrate `MessageList` and `ChatInput` components.
- [ ] **Task 4.4**: Connect to API and handle loading/error states.

### Phase 5: Monitoring & Analytics
**Goal**: Track costs and ensure system health.

- [ ] **Task 5.1 (TDD)**: Implement `lib/ai/monitoring.ts`
- [ ] **Task 5.2**: Integrate monitoring into `LLMService`.
    -   Log tokens/cost regardless of provider.

---

## 3. Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **OpenAI API Cost Overrun** | Medium | High | Implement hard limit in `monitoring.ts` (e.g., $1.00/day/user). |
| **Hallucination (Medical)** | Medium | Critical | System Prompt MUST include strict disclaimers. Low `temperature` (0.2). |
| **Latency (>3s)** | High | Medium | Implement UI loading skeletons. Optimize RAG `match_count` (limit to 3). |
| **Missing Vector Extension** | Low | High | Pre-flight check in Phase 1 to verify `pgvector` installation. |

## 4. Rollback Strategy

- **Database**: Revert migrations `003` -> `002` using `supabase db reset` or manual drop (if needed).
- **Code**: `git revert` to the tag created before Phase 1.
- **Env**: Remove `OPENAI_API_KEY` to disable features gracefully (feature flag `NEXT_PUBLIC_ENABLE_AI_CHAT=false`).

---

## 5. Quality Gate & TDD Strategy

**Testing Standards**:
- **Unit**: Mock `openai` and `supabase` clients. Test business logic in isolation.
- **Integration**: Test API routes with `http-mocks`.
- **E2E**: Browser subagent verification of the Chat UI.

**Commands**:
- Test: `npm test` (setup Jest/Vitest first if not present, otherwise generic `tsx` test scripts)
- Lint: `npm run lint`

---

## Notes
- *Self-Correction*: Since `jest` isn't fully set up in the initial plan logs, I will use `node --test` or simple `tsx` based test scripts for rapid TDD if a full test runner is too heavy to setup now. **Decision**: I will use minimal `vitest` setup if possible, or stick to `node:test` for speed.
