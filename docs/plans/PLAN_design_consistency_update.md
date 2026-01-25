# High Visibility Design Consistency Update Plan

## 1. 개요 및 목표
현재 애플리케이션의 페이지들(`symptom-check`, `reports/weekly` vs `dashboard`, `onboarding`, `meal-plan`) 간에 디자인 일관성이 부족합니다. 특히 텍스트 대비(Contrast)와 가독성 측면에서 차이가 큽니다.
본 계획의 목표는 사용자가 요청한 **"High Visibility (고대비/고가독성)"** 표준을 전사적으로 적용하여 사용자 경험을 통일하는 것입니다.

**핵심 디자인 원칙 (High Visibility Standard):**
1.  **Headings (제목)**: `text-gray-900`, `font-bold` (완전 검정, 굵게)
2.  **Body Text (본문)**: `text-gray-800` 또는 `text-gray-700`, `font-medium` (진한 회색, 중간 굵기)
3.  **Subtext (부연 설명)**: `text-gray-600` (연한 회색 사용 금지: `gray-400`, `gray-500` 지양)
4.  **Interactive Elements (입력창, 버튼)**:
    *   Input/Textarea 텍스트: `text-gray-900`, `font-medium`
    *   Placeholder: `placeholder:text-gray-500` (기존보다 진하게)
    *   Border: `border-gray-200` (유지하되 필요 시 `border-gray-300`으로 강화)

## 2. 아키텍처 결정 사항
*   **Utility Class 우선 적용**: 별도의 Theme Provider를 도입하기보다, Tailwind Utility Class를 직접 수정하여 즉각적인 가시성을 확보합니다. 이는 현재 프로젝트 규모에서 가장 빠르고 확실한 방법입니다.
*   **Component 레벨 강화**: `components/ui` 내부의 기본 컴포넌트(`Card`, `Label`, `Input` 등)에 기본 스타일을 강제할 수 있다면 적용하되, `className` 오버라이딩 유연성은 유지합니다.

## 3. 단계별 구현 계획 (Phase Breakdown)

### Phase 1: Core Design System Hardening & Onboarding
**목표**: 공용 UI 컴포넌트(`components/ui`) 및 온보딩 페이지(`onboarding`)의 가독성 표준화
*   **설명**: 가장 기본이 되는 컴포넌트와 사용자가 처음 접하는 온보딩 페이지를 고대비 스타일로 전환합니다.
*   **Tasks (TDD Cycle)**:
    1.  [ ] **RED**: `Label`, `Input`, `Button` 컴포넌트가 `text-gray-900` 등의 클래스를 포함하는지 검증하는 테스트 작성 (또는 육안 검사 기준 수립)
    2.  [ ] **GREEN**: `components/ui`의 `Label`, `CardTitle` 컴포넌트 기본값 상향 조정 (`text-gray-900` 적용)
    3.  [ ] **GREEN**: `HealthStatusStep` 등 온보딩 컴포넌트 내 `text-gray-500/gray-400` 제거 및 `gray-700/gray-900`으로 대체
    4.  [ ] **REFACTOR**: 중복되는 스타일 정의 제거
*   **품질 게이트**: 온보딩 프로세스 전체 육안 검사 (스크린샷 캡처)

### Phase 2: Dashboard & Navigation Consistency
**목표**: 메인 대시보드(`dashboard/page.tsx`) 및 네비게이션 요소 디자인 통일
*   **설명**: 사용자가 가장 많이 머무는 대시보드의 카드, 텍스트, 아이콘 색상을 고대비로 변경합니다.
*   **Tasks**:
    1.  [ ] **RED**: 대시보드 내 "회복 추이", "식단 가이드" 등의 텍스트 색상 검증 테스트/기준 수립
    2.  [ ] **GREEN**: `dashboard/page.tsx` 내 하드코딩된 `text-gray-600`, `text-gray-500`을 `text-gray-800`, `text-gray-600`(진하게)으로 일괄 상향
    3.  [ ] **GREEN**: 카드 그림자 및 테두리 가시성 강화 (선택 사항)
*   **품질 게이트**: 대시보드 렌더링 스냅샷 비교

### Phase 3: Meal Plan & Feature Pages Update
**목표**: 식단 가이드(`meal-plan`) 및 기타 서브 페이지 디자인 통일
*   **설명**: 텍스트가 많아 가독성이 중요한 식단 페이지의 가시성을 개선합니다.
*   **Tasks**:
    1.  [ ] **RED**: 식단 카드 내 영양 정보 텍스트 클래스 검증
    2.  [ ] **GREEN**: `meal-plan/page.tsx`의 영양소 수치, 재료 목록 텍스트를 `text-gray-900` 및 `font-bold`로 강화
    3.  [ ] **GREEN**: "추천 식단이 없습니다" 등 예외 케이스 텍스트(`gray-400`)를 `gray-500` 이상으로 변경
*   **품질 게이트**: 식단 페이지 브라우저 검증

## 4. 리스크 평가 (Risk Assessment)

| 리스크 | 확률 | 영향 | 완화 전략 |
| :--- | :--- | :--- | :--- |
| **디자인 부조화** | Medium | Medium | 일부 페이지가 너무 강하게(Dark) 보일 수 있음. 변경 후 즉시 브라우저 캡처로 밸런스 확인. |
| **기존 스타일 오버라이드 충돌** | Low | Low | `cn()` 유틸리티 함수가 tailwind-merge를 잘 수행하는지 확인. |
| **사용자 피로도 증가** | Low | Low | 지나친 고대비(Over-contrast)를 피하기 위해 배경색(`bg-gray-50`)은 유지하여 눈의 피로 방지. |

## 5. 롤백 전략 (Rollback Strategy)
*   **Git Revert**: 각 Phase는 독립적인 커밋으로 관리되므로, 디자인이 마음에 들지 않을 경우 해당 커밋(`style: ...`)만 Revert 합니다.
*   **Utility Class 복구**: 변경된 Tailwind 클래스를 이전 값(예: `text-gray-900` -> `text-gray-500`)으로 일괄 치환(Find & Replace)하여 복구 가능합니다.

## 6. 테스트 전략 (Test Strategy)
*   **Manual Verification (Browser)**: 디자인 변경 사항은 자동화 테스트보다 사람의 눈으로 확인하는 것이 가장 정확합니다. 각 Phase 종료 시 `browser_subagent`를 사용하여 스크린샷을 찍고 `walkthrough.md`에 기록합니다.
*   **Build Verification**: 스타일 변경이 빌드 에러를 유발하지 않는지 확인합니다 (`npm run build`).

## 7. 진행 상황 (Progress Tracking)
- [x] Phase 1: Core & Onboarding
- [x] Phase 2: Dashboard
- [x] Phase 3: Meal Plan & Features
