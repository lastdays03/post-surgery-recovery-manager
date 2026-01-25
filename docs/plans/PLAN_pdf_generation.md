# PLAN: PDF 생성 및 최적화 (Phase 10)

사용자의 주간 회복 상태를 요약하여 의료진과 공유하거나 본인이 보관할 수 있도록 전문적인 PDF 리포트를 생성하고 최적화합니다.

## 1. 목적 및 목표
- **목적**: 주간 회복 데이터를 시각화하여 PDF 리포트로 제공.
- **목표**:
  - `@react-pdf/renderer` 기반의 고품질 PDF 생성.
  - 한글 폰트 완벽 지원 및 가독성 확보.
  - 수술 정보, 증상 추이, 식단 및 운동 달성률 포함.
  - 모바일 및 데스크탑 환경에서 안정적인 다운로드 제공.

## 2. 아키텍처 결정 (Architecture Decisions)
- **Library**: `@react-pdf/renderer` (현재 dependencies에 포함됨).
  - *이유*: React 컴포넌트 방식으로 PDF 레이아웃을 정의할 수 있어 유지보수가 용이함.
- **Font**: Google Fonts (Noto Sans KR 등)를 `@react-pdf/renderer`에 등록하여 사용.
  - *이유*: 표준 스타일 지원 및 한글 깨짐 방지.
- **Chart Handling**: Recharts로 생성된 차트를 SVG 또는 Image로 변환하여 PDF에 삽입.
  - *이유*: `@react-pdf/renderer`는 복잡한 SVG 필터나 외부 라이브러리 직접 렌더링에 제한이 있음.

## 3. 리스크 평가 (Risk Assessment)
| 리스크 | 수준 | 완화 전략 |
| :--- | :--- | :--- |
| 한글 폰트 깨짐 | 높음 | 외부 CDN 또는 로컬 폰트 파일을 `Font.register`를 통해 확실히 등록. |
| 모바일 다운로드 지연 | 중간 | 대용량 이미지 포함 지양 및 최적화된 PDF 스트리밍 방식 사용. |
| 복잡한 레이아웃 렌더링 | 중간 | `View`, `Text`, `StyleSheet` 등 전용 컴포넌트만 사용하여 단순하고 명확한 레이아웃 설계. |

## 4. 단계별 구현 계획 (Phase Breakdown)

### Phase 1: PDF 인프라 및 기반 설정
- **목표**: PDF 렌더링 환경 구축 및 폰트 설정.
- **Task**:
  - [ ] `lib/pdf/font-registry.ts` 생성: 한글 폰트 등록.
  - [ ] `components/reports/pdf/common/StandardLayout.tsx`: 공통 레이아웃 컴포넌트.
  - [ ] **RED**: 폰트 로드 실패 시 예외 처리 테스트. (Vitest 활용)
  - [ ] **GREEN**: 기본 PDF 문서 생성 및 한글 노출 확인.

### Phase 2: 리포트 템플릿 설계 및 구현
- **목표**: 주간 리포트의 시각적 요소 구현.
- **Task**:
  - [ ] `components/reports/pdf/WeeklyReportTemplate.tsx` 구현.
  - [ ] 섹션별 구현: Summary, Symptom Chart, Activity Check.
  - [ ] **RED**: 데이터가 비어있을 때 빈 화면 대응 테스트.
  - [ ] **GREEN**: 목업 데이터를 활용한 전체 레이아웃 렌더링.

### Phase 3: PDF 생성 로직 및 다운로드 연동
- **목표**: 실제 데이터를 연동하여 다운로드 기능 완성.
- **Task**:
  - [ ] `hooks/use-pdf-report.ts`: 데이터 페칭 및 PDF 변환 훅.
  - [ ] `app/reports/weekly/PDFDownloadButton.tsx`: UI 연동.
  - [ ] **RED**: 대용량 데이터 렌더링 시 타임아웃 테스트.
  - [ ] **GREEN**: 실제 DB 데이터 기반 PDF 생성 및 다운로드.

### Phase 4: 최적화 및 최종 검증
- **목표**: 품질 고도화 및 최적화.
- **Task**:
  - [ ] 이미지 압축 및 불필요한 레이아웃 중첩 제거.
  - [ ] 모바일 크롬/사파리 다운로드 테스트.
  - [ ] **REFACTOR**: PDF 컴포넌트 DRY 원칙에 따른 정리.

## 5. 롤백 전략 (Rollback Strategy)
- PDF 생성 오류 시 에러 모달 노출 및 이전 상태(웹 대시보드) 유지.
- 폰트 로드 실패 시 시스템 기본 폰트(가능한 경우) 또는 경고 메시지 표시.

## 6. 품질 게이트 (Quality Gate)
- [ ] 한글 폰트 깨짐 없음.
- [ ] PDF 용량 2MB 이하 유지.
- [ ] 모바일 브라우저 다운로드 성공.
