# Phase 9: 증상 분석 및 주간 리포트 구현 계획

## Overview
사용자가 매일 회복 상태(증상)를 기록하고, 이 데이터를 바탕으로 주간 회복 리포트를 제공하는 기능을 구현합니다.
AI 분석보다는 우선 규칙 기반(Rule-based) 분석과 시각화를 중심으로 구현하며, 향후 AI 분석을 위한 데이터 구조를 마련합니다.

## Architecture Decisions
- **상태 관리**: `React Hook Form`으로 증상 체크 폼 관리.
- **데이터 시각화**: `Recharts` 라이브러리를 사용하여 주간 리포트 차트 구현 (가볍고 Next.js 호환성 좋음).
- **데이터 흐름**: Client -> API Route (or Server Action) -> Supabase `daily_logs` -> Analysis Logic -> UI

## User Review Required
> [!IMPORTANT]
> **증상 데이터 구조**: 각 수술별로 체크해야 할 증상이 다르므로, 동적인 폼 구조가 필요합니다. 우선 공통 증상(통증, 소화, 기력) 위주로 구현하고 수술별 특이 증상은 확장 가능하도록 JSONB에 저장합니다.

## Phase Breakdown

### Phase 9.1: 증상 로깅 시스템 구축 (Symptom Logging System)
**Goal**: 사용자가 매일 증상을 기록하고 저장할 수 있다.
- **Test Strategy**:
    - Unit Tests: 증상 점수 계산 로직, 데이터 유효성 검사
    - Integration Tests: API 엔드포인트 저장/조회 테스트
- **Tasks**:
    - [ ] [RED] 증상 로그 저장/조회 API 테스트 코드 작성 (`tests/api/symptoms.test.ts`)
    - [ ] [GREEN] 증상 데이터 타입 정의 (`lib/types/symptom.types.ts`)
    - [ ] [GREEN] Supabase `daily_logs` 업데이트 함수 구현 (`lib/services/log-service.ts`)
    - [ ] [REFACTOR] 로깅 에러 처리 강화

### Phase 9.2: 증상 체크 UI 구현 (Symptom Check UI)
**Goal**: 사용자 친화적인 증상 입력 폼을 제공한다.
- **Test Strategy**:
    - Agent Browser Test: 폼 입력 및 제출 플로우 검증
- **Tasks**:
    - [ ] [RED] 증상 체크 페이지 렌더링 테스트 (`tests/pages/symptom-check.test.tsx`)
    - [ ] [GREEN] 슬라이더/체크박스 기반 입력 컴포넌트 구현
    - [ ] [GREEN] `app/symptom-check/page.tsx` 구현
    - [ ] [REFACTOR] 컴포넌트 분리 및 스타일 개선

### Phase 9.3: 주간 리포트 로직 구현 (Weekly Report Logic)
**Goal**: 지난 7일간의 데이터를 집계하여 분석 결과를 생성한다.
- **Test Strategy**:
    - Unit Tests: 날짜별 데이터 집계, 평균 점수 계산, 추세 분석 로직
- **Tasks**:
    - [ ] [RED] 주간 데이터 집계 유틸리티 테스트 (`tests/utils/analytics.test.ts`)
    - [ ] [GREEN] `calculateWeeklyProgress` 함수 구현
    - [ ] [GREEN] 리포트 데이터 생성 API 구현
    - [ ] [REFACTOR] 대용량 데이터 처리 고려 (페이지네이션/기간 제한)

### Phase 9.4: 주간 리포트 UI (Weekly Report UI)
**Goal**: 그래프와 요약 텍스트로 한 주간의 회복 흐름을 시각화한다.
- **Test Strategy**:
    - Manual/Browser Verification: 차트 렌더링 확인
- **Tasks**:
    - [ ] [RED] 리포트 페이지 구조 테스트
    - [ ] [GREEN] `recharts` 설치 및 차트 컴포넌트 구현
    - [ ] [GREEN] `app/reports/weekly/page.tsx` 구현
    - [ ] [REFACTOR] 모바일 반응형 차트 최적화

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| 데이터 누락 | High | 날짜별 빈 데이터 기본값(0 or null) 처리 로직 필수 |
| 복잡한 쿼리 성능 | Medium | 초기에는 클라이언트 집계, 데이터 양 증가 시 Supabase View 또는 RPC 전환 |
| 차트 라이브러리 용량 | Low | `Recharts` 사용하여 트리쉐이킹 활용 |

## Rollback Strategy
- DB: `daily_logs` 테이블 구조 변경 없음 (JSONB 활용)
- Code: 문제 발생 시 이전 커밋으로 Revert. 기능 플래그 도입 고려 (선택 사항).

## Quality Gate Standards
- [ ] `npm run build` 성공
- [ ] `npm run lint` 통과
- [ ] 핵심 비즈니스 로직(집계, 점수 계산) 테스트 커버리지 80% 이상
