# 구현 계획서 (Implementation Plan): Prompt Optimization Test Page

**Status**: 🔄 In Progress
**Started**: 2026-01-28
**Last Updated**: 2026-01-28
**Estimated Completion**: 2026-01-28

---

**⚠️ CRITICAL INSTRUCTIONS**: After completing each phase:
1. ✅ Check off completed task checkboxes
2. 🧪 Run all quality gate validation commands
3. ⚠️ Verify ALL quality gate items pass
4. 📅 Update "Last Updated" date above
5. 📝 Document learnings in Notes section
6. ➡️ Only then proceed to next phase

⛔ **DO NOT skip quality gates or proceed with failing checks**

---

## 📋 개요 (Overview)

### 기능 설명 (Feature Description)
개발자가 식단 생성 프롬르트를 쉽고 빠르게 테스트하고 최적화할 수 있는 전용 테스트 페이지입니다.
기존 프롬프트를 로드하고, 수정 요청을 통해 AI가 프롬프트를 개선하며, 개선된 프롬프트로 실제 식단 생성 결과를 즉시 확인할 수 있습니다.

### 성공 기준 (Success Criteria)
- [ ] `/test/prompt-optimization` 경로에서 테스트 페이지 접근 가능
- [ ] 현재 `meal-ai.ts`의 기본 프롬프트가 자동으로 로드됨
- [ ] 사용자 요청에 따라 LLM이 프롬프트를 "메타 프롬프팅"하여 수정안 생성
- [ ] 수정된 프롬프트로 실제 식단 생성 API를 호출하고 결과를 JSON 형태로 표시
- [ ] 생성된 식단 JSON이 유효한지 검증

### 사용자 영향 (User Impact)
- **개발자 생산성 향상**: 프롬프트 수정 후 서버 재배포나 코드 수정 없이 웹 UI에서 즉시 테스트 가능
- **프롬프트 품질 개선**: 체계적인 테스트와 비교를 통해 더 나은 품질의 식단 생성 프롬프트 도출 가능

---

## 🏗️ 아키텍처 결정 (Architecture Decisions)

| Decision                                              | Rationale                                                            | Trade-offs                                                       |
| ----------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Separate Test Route** (`/test/prompt-optimization`) | 실제 서비스 로직과 분리하여 안전하게 테스트 진행                     | 배포 시 테스트 경로 제외 설정 필요 (현재는 내부 프로젝트라 무관) |
| **Server Actions for Execution**                      | Next.js 서버 액션을 사용하여 API 라우트 없이 직접 LLM 호출 로직 수행 | 클라이언트-서버 통신 오버헤드 감소, 로직 캡슐화                  |
| **State Management**                                  | React `useState`로 로컬 상태 관리 (전역 상태 불필요)                 | 페이지 벗어나면 데이터 초기화됨 (테스트 목적이라 허용)           |

---

## 🛡️ 예외 처리 전략 (Exception Handling Strategy)

| Scenario             | Unexpected Behavior            | Handling Strategy                       | User Feedback                                               |
| -------------------- | ------------------------------ | --------------------------------------- | ----------------------------------------------------------- |
| **LLM Rate Limit**   | API 호출 제한 도달             | `429` 에러 캐치 후 재시도 버튼 활성화   | "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."          |
| **Invalid JSON**     | 생성된 식단이 JSON 형식이 아님 | JSON 파싱 에러 캐치 및 원본 텍스트 표시 | "생성된 데이터가 유효한 JSON이 아닙니다. (Raw Output 표시)" |
| **Prompt Injection** | 악의적인 프롬프트 조작 시도    | (내부 도구이므로 별도 필터링 없음)      | (N/A - Trusted User Only)                                   |

---

## 📦 의존성 (Dependencies)

### 사전 요구사항 (Required Before Starting)
- [x] OpenAI API Key Configured (`.env.local`)
- [x] `lib/ai/meal-ai.ts` (Target logic existence)

### 외부 라이브러리 (External Dependencies)
- `openai`: ^4.x (Existing)
- `react-hook-form` (Optional, simpler with standard state)

---

## 🧪 테스트 전략 (Test Strategy)

### 접근 방식 (Testing Approach)
**TDD Principle**: 작성할 API 및 유틸리티 함수에 대한 테스트를 먼저 작성합니다. UI 컴포넌트는 수동 검증 및 스냅샷 테스트를 지향합니다.

### 테스트 피라미드 (Test Pyramid)
| Test Type             | Coverage Target | Purpose                                     |
| --------------------- | --------------- | ------------------------------------------- |
| **Unit Tests**        | ≥80%            | 프롬프트 생성 로직, JSON 파싱 유틸리티 검증 |
| **Integration Tests** | Critical paths  | 실제 OpenAI API 모킹하여 흐름 검증          |
| **Browser Verify**    | 100%            | UI 동작 및 상태 변화 확인                   |

### 테스트 파일 구조 (Test File Organization)
```
test/
├── unit/
│   └── lib/
│       └── ai/
│           └── prompt-optimizer.test.ts
```

### 단계별 커버리지 요구사항 (Coverage Requirements by Phase)
- **Phase 1 (Backend Logic)**: Prompt refiner logic, execution logic tests (80%+)
- **Phase 2 (Frontend UI)**: Component rendering verification

---

## 🚀 구현 단계 (Implementation Phases)

### 1단계: Backend Logic & Server Actions
**Goal**: 프롬프트를 수정하고 실행하는 핵심 로직 구현
**Estimated Time**: 2 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 1.1**: `refinePrompt` 함수 테스트 작성
  - File: `tests/unit/lib/ai/prompt-optimizer.test.ts` (Create if needed, or use inline/manual test script if jest not set up. *Note: Project seems to execute via `npm run dev`, will leverage manual verification scripts if jest is absent, but assuming standard node environment*)
  - **Plan Adjustment**: 프로젝트에 Jest 등 테스트 러너가 명시적으로 보이지 않음. `/dev-feature-planner`는 엄격한 TDD를 요구하므로, `jest`가 없다면 간단한 test runner script(`scripts/test-runner.js`)를 만들거나, `vitest`를 설치해야 함. -> **Strategy**: `vitest` 설치 및 설정 포함.

- [ ] **Test Setup**: Install `vitest`
  - Command: `npm install -D vitest`

- [ ] **Test 1.1 Implementation**:
  - `tests/lib/ai/prompt-optimizer.test.ts`
  - Input: Original Prompt, User Request
  - Expected: Modified Prompt (Simulated/Mocked LLM response)

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 1.2**: Implement `refinePrompt` in `lib/ai/prompt-optimizer.ts`
  - `RefinePromptRequest` -> LLM -> `RefinedPrompt` string
- [ ] **Task 1.3**: Implement `executeMealPlan` in `lib/ai/prompt-optimizer.ts`
  - Takes prompt -> Calls `OpenAI` -> Returns JSON Meal Plan

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 1.4**: Refactor and Optimize
  - Error handling for OpenAI calls
  - Type safety for request/response objects

#### 품질 게이트 (Quality Gate ✋)
- [ ] **TDD**: `vitest` output shows passing tests for logic
- [ ] **Lint**: `npm run lint` passes
- [ ] **Build**: `npm run build` generates no errors

---

### 2단계: Frontend UI Implementation
**Goal**: 테스트 페이지 UI 구현 및 서버 액션 연동
**Estimated Time**: 2 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 2.1**: (Frontend logic doesn't strictly need unit tests if usage is verifying via Browser tool, but pure functions in UI should be tested).
  - Will focus on **Browser Verification** for this phase due to UI heavy nature.

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 2.2**: Create Page `/app/test/prompt-optimization/page.tsx`
  - Layout: 2 Columns (Original vs Modified) + Chat Input area logic
- [ ] **Task 2.3**: Integrate `useActionState` or standard fetch to call Server Actions created in Phase 1.
- [ ] **Task 2.4**: Add "Execute" button to run the displayed prompt.

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 2.5**: UI Polish
  - Use `Textarea` with auto-resize
  - JSON Highlighting for result view through a component (e.g., `pre` tag with basic styling)

#### 품질 게이트 (Quality Gate ✋)
- [ ] **Browser Verification**: `browser_subagent` confirms page loads and buttons work
- [ ] **Integration**: End-to-end flow (Modify -> Execute -> Result) works

---

## ⚠️ 위험 평가 (Risk Assessment)

| Risk                           | Probability | Impact | Mitigation Strategy                                      |
| ------------------------------ | ----------- | ------ | -------------------------------------------------------- |
| **OpenAI Credential Exposure** | Low         | High   | 서버 사이드(`lib/`)에서만 키 사용, 클라이언트 노출 금지  |
| **Cost Overrun**               | Medium      | Low    | 테스트 페이지 접근 제어 (현재는 로컬 개발 환경이라 낮음) |

---

## 🔄 롤백 전략 (Rollback Strategy)

### If Phase 1 Fails
- Delete `lib/ai/prompt-optimizer.ts`
- Uninstall `vitest`

### If Phase 2 Fails
- Delete `app/test/prompt-optimization/` directory

---

## 📚 참고 자료 (References)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
