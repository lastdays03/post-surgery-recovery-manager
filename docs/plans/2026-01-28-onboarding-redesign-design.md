# 온보딩 플로우 재설계 상세 디자인

**작성일**: 2026-01-28
**상태**: 구현 준비 완료
**기반 문서**: PLAN_onboarding_redesign.md

## 개요

수술 후 회복 관리 앱의 온보딩 프로세스를 사용자 친화적인 대화형 인터페이스로 재설계합니다. 2단계로 구성되며, 첫 단계는 AI 채팅을 통한 수술 정보 수집, 두 번째 단계는 건강 설문 폼입니다.

## 목표

- 사용자 경험 개선: 대화형 UI로 진입 장벽 낮추기
- 데이터 정확성: 확인 단계를 통한 입력 검증
- 디자인 일관성: 제공된 UI 목업에 맞춘 구현
- 유지보수성: 명확한 상태 관리와 컴포넌트 구조

## 아키텍처 결정사항

### 상태 관리
- **도구**: Zustand (`useOnboardingStore`)
- **상태 구조**:
  ```typescript
  {
    currentStep: 1 | 2,
    formData: {
      surgery_type: string,
      surgery_date: string,
      age: number,
      weight: number,
      height: number,
      digestive_capacity: string,
      comorbidities: string
    },
    confirmationStatus: 'idle' | 'pending_confirmation' | 'confirmed',
    isDatePickerOpen: boolean
  }
  ```

### 채팅 로직
- **메시지 타입**: `text`, `confirm_surgery`, `date_picker`
- **흐름 제어**: `confirmationStatus`를 통한 단계별 UI 렌더링
- **AI 통합**: `/api/ai/onboarding` 엔드포인트로 대화 처리

### UI 라이브러리
- **날짜 선택**: `react-day-picker` (커스터마이징 용이)
- **폼 검증**: Zod + react-hook-form
- **컴포넌트**: shadcn/ui 기반

---

## 1단계: 채팅 UI 개선 및 날짜 선택기 통합

### 현재 상태
- 기본 HTML `<input type="date">` 사용
- 수술명 확인 버튼은 구현됨
- 완료 후 Step 2로 전환 가능

### 개선사항

#### 1.1 react-day-picker 통합
**목적**: 디자인 목업과 일치하는 커스텀 달력 UI 구현

**구현 세부사항**:
- `npm install react-day-picker date-fns` 설치
- 채팅 메시지 형태로 달력 렌더링 (흰색 카드, 둥근 모서리)
- 선택된 날짜 강조 표시 (파란색 원형 배경)
- 월 전환 화살표 버튼 (<, >)

**코드 구조**:
```typescript
// 날짜 임시 상태
const [selectedDate, setSelectedDate] = useState<Date | undefined>()

// 달력 표시 조건
{confirmationStatus === 'confirmed' && !isComplete && (
  <div className="날짜선택기_컨테이너">
    <DayPicker
      mode="single"
      selected={selectedDate}
      onSelect={setSelectedDate}
      // 스타일링
    />
    <Button onClick={handleDateConfirm}>날짜 선택 완료하기</Button>
  </div>
)}
```

#### 1.2 완료 버튼 및 확인 메시지
**흐름**:
1. 사용자가 달력에서 날짜 클릭 → `selectedDate` 상태 업데이트
2. "날짜 선택 완료하기" 버튼 클릭 → `handleDateConfirm()` 호출
3. 확인 메시지 전송: "2026년 1월 27일 선택됐어요" (파란색 말풍선)
4. `isComplete` 상태를 `true`로 변경 → "다음 단계로 이동" 버튼 표시

**완료 버튼 스타일**:
- 배경: 검은색 (`bg-black`)
- 텍스트: 흰색
- 전체 너비, 둥근 모서리
- 달력 카드 하단에 배치

#### 1.3 메시지 타입 확장
현재는 모든 메시지가 `text` 타입입니다. 향후 확장을 위해 타입 시스템 도입:

```typescript
interface Message {
  role: 'user' | 'assistant'
  content: string
  type?: 'text' | 'confirm_surgery' | 'date_picker' // 향후 확장용
}
```

---

## 2단계: 건강 설문 폼 단순화

### 현재 상태
- 수집 필드: 나이, 성별, 키, 몸무게, 소화 기능, 기저질환
- 2열 그리드 레이아웃
- Zod 검증 적용됨

### 변경사항

#### 2.1 성별 필드 제거
**이유**: 디자인 목업에 성별 입력이 없음

**수정 파일**:
- `lib/stores/onboarding-store.ts`: `gender` 필드 제거 또는 optional로 변경
- `components/onboarding/onboarding-form.tsx`: 성별 입력 UI 제거
- Zod 스키마에서 `gender` 제거

#### 2.2 레이아웃 조정
**기존**: 2열 그리드 (나이/성별, 키/몸무게)
**변경**: 3열 그리드 (나이, 몸무게, 키)

```tsx
<div className="grid grid-cols-3 gap-4">
  <div>
    <Label>나이</Label>
    <Input type="number" placeholder="예: 30" {...register('age')} />
  </div>
  <div>
    <Label>몸무게 (kg)</Label>
    <Input type="number" placeholder="예: 65" {...register('weight')} />
  </div>
  <div>
    <Label>키 (cm)</Label>
    <Input type="number" placeholder="예: 170" {...register('height')} />
  </div>
</div>
```

#### 2.3 최종 데이터 구조
```typescript
{
  // Step 1에서 수집
  surgery_type: "맹장 수술",
  surgery_date: "2026-01-27",

  // Step 2에서 수집
  age: 30,
  weight: 65,
  height: 170,
  digestive_capacity: "100", // "100" | "80" | "50"
  comorbidities: "고혈압, 당뇨" // optional
}
```

#### 2.4 Zod 스키마 업데이트
```typescript
const onboardingFormSchema = z.object({
  age: z.coerce.number().min(1, '나이를 입력해주세요.'),
  height: z.coerce.number().min(1, '키를 입력해주세요.'),
  weight: z.coerce.number().min(1, '몸무게를 입력해주세요.'),
  digestiveCapacity: z.string().min(1, '소화 기능을 선택해주세요.'),
  comorbidities: z.string().optional(),
})
```

---

## 3단계: 완료 화면 및 데이터 흐름

### 데이터 흐름 전체 맵

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: AI 채팅 (onboarding-chat.tsx)                      │
├─────────────────────────────────────────────────────────────┤
│ 1. 수술명 입력                                              │
│    ↓                                                        │
│ 2. AI가 수술명 추출 → confirmationStatus = 'pending'       │
│    ↓                                                        │
│ 3. "맹장 수술이 맞나요?" 확인 버튼 표시                     │
│    ↓                                                        │
│ 4. "네, 맞아요" 클릭 → confirmationStatus = 'confirmed'    │
│    ↓                                                        │
│ 5. AI가 날짜 질문 → 달력 UI 표시                           │
│    ↓                                                        │
│ 6. 날짜 선택 + "날짜 선택 완료하기" 버튼 클릭              │
│    ↓                                                        │
│ 7. 확인 메시지 표시 → isComplete = true                    │
│    ↓                                                        │
│ 8. "다음 단계로 이동" 버튼 → setStep(2)                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: 건강 설문 폼 (onboarding-form.tsx)                 │
├─────────────────────────────────────────────────────────────┤
│ 1. 나이, 몸무게, 키 입력 (3열 그리드)                      │
│ 2. 소화 기능 선택 (드롭다운)                                │
│ 3. 기저질환 입력 (optional)                                 │
│    ↓                                                        │
│ 4. "완료 및 가이드 시작" 버튼 클릭                         │
│    ↓                                                        │
│ 5. Zod 검증                                                 │
│    ↓                                                        │
│ 6. createProfile(formData) 호출 → 서버 저장                │
│    ↓                                                        │
│ 7. 완료 화면 표시 또는 대시보드 리다이렉트                 │
└─────────────────────────────────────────────────────────────┘
```

### 완료 화면 구성

#### 옵션 A: 폼 내 완료 메시지 (간단한 접근)
```tsx
{isSubmitted && (
  <div className="text-center p-8 bg-green-50 rounded-lg">
    <CheckCircle2 className="mx-auto text-green-500" size={64} />
    <h3 className="text-xl font-bold mt-4">온보딩 완료!</h3>
    <p className="text-gray-600 mt-2">회복 가이드를 시작할 준비가 되었습니다.</p>
    <Button onClick={() => router.push('/dashboard')} className="mt-6">
      회복 가이드 시작하기
    </Button>
  </div>
)}
```

#### 옵션 B: 별도 완료 페이지 (권장)
- 경로: `/onboarding/complete`
- 수집된 정보 요약 표시
- 다음 단계 안내
- 대시보드로 이동 버튼

### 에러 처리

**네트워크 오류**:
```typescript
try {
  await createProfile(profileData)
  setIsSubmitted(true)
} catch (error) {
  toast.error('프로필 저장에 실패했습니다. 다시 시도해주세요.')
  console.error('Profile creation failed:', error)
}
```

**검증 오류**:
- Zod 에러 메시지를 각 필드 아래 표시
- 빨간색 텍스트, 작은 폰트 크기

---

## 4단계: 테스트 전략 및 품질 보증

### 단위 테스트

#### 채팅 컴포넌트 테스트
**파일**: `test/verify-onboarding-chat.test.tsx`

**테스트 케이스**:
1. 초기 메시지 렌더링 확인
2. 수술명 입력 후 확인 버튼 표시 확인
3. "네, 맞아요" 클릭 시 `confirmationStatus` 변경 확인
4. 날짜 선택기 렌더링 확인
5. 날짜 선택 후 확인 메시지 표시 확인
6. "다음 단계로 이동" 클릭 시 Step 2 전환 확인

#### 폼 컴포넌트 테스트
**파일**: `test/verify-onboarding-form.test.tsx`

**테스트 케이스**:
1. 빈 폼 제출 시 검증 에러 표시
2. 유효한 데이터 입력 후 제출 성공
3. 숫자 필드에 음수 입력 시 에러
4. 기저질환 optional 필드 동작 확인
5. 성별 필드가 제거되었는지 확인

### 통합 테스트

**전체 온보딩 플로우**:
```typescript
describe('Onboarding flow', () => {
  it('completes full onboarding process', async () => {
    // 1. Step 1 시작
    // 2. 수술명 입력 및 확인
    // 3. 날짜 선택
    // 4. Step 2로 전환
    // 5. 폼 작성 및 제출
    // 6. 완료 화면 확인
  })
})
```

### 품질 체크리스트

#### 빌드 및 타입 체크
- [ ] `npm run build` 성공
- [ ] `npx tsc --noEmit` 타입 오류 없음
- [ ] `npm run lint` 린팅 통과
- [ ] `npm run test` 모든 테스트 통과

#### UI/UX 검증
- [ ] 디자인 목업과 일치 (색상, 간격, 폰트)
- [ ] 반응형 디자인 (모바일 375px, 태블릿 768px, 데스크톱 1280px)
- [ ] 다크모드 지원 (필요 시)
- [ ] 로딩 상태 표시 (스피너, 버튼 비활성화)
- [ ] 에러 메시지 가독성

#### 접근성
- [ ] 키보드 네비게이션 (Tab, Enter, Escape)
- [ ] 포커스 표시 명확
- [ ] 스크린 리더 테스트 (aria-label, role)
- [ ] 색상 대비 WCAG AA 기준 충족

#### 성능
- [ ] 첫 렌더링 시간 < 1초
- [ ] AI 응답 대기 시 로딩 인디케이터
- [ ] 불필요한 리렌더링 방지 (React.memo, useMemo)

### 수동 테스트 시나리오

1. **해피 패스**: 정상적인 입력으로 온보딩 완료
2. **재입력 플로우**: 수술명 틀리게 입력 → "아니요" 클릭 → 재입력
3. **날짜 변경**: 날짜 선택 후 다시 변경
4. **뒤로 가기**: Step 2에서 브라우저 뒤로 가기 → 데이터 유지 확인
5. **네트워크 오류**: 인터넷 끊고 제출 → 에러 메시지 확인
6. **느린 네트워크**: 3G 시뮬레이션 → 로딩 상태 확인

---

## 구현 순서

### Phase 1: 날짜 선택기 개선 (우선순위: 높음)
1. `react-day-picker` 설치 및 설정
2. 커스텀 달력 UI 구현
3. "날짜 선택 완료하기" 버튼 추가
4. 확인 메시지 로직 구현
5. 테스트 작성 및 검증

**예상 산출물**:
- `onboarding-chat.tsx` 업데이트
- 달력 스타일링 CSS
- 업데이트된 테스트 파일

### Phase 2: 폼 단순화 (우선순위: 중간)
1. 성별 필드 제거
2. 레이아웃 3열로 변경
3. Zod 스키마 업데이트
4. 스토어 타입 정리
5. 테스트 업데이트

**예상 산출물**:
- `onboarding-form.tsx` 업데이트
- `onboarding-store.ts` 타입 정리
- 업데이트된 테스트 파일

### Phase 3: 완료 화면 및 통합 (우선순위: 중간)
1. 완료 화면 컴포넌트 구현
2. `createProfile` 액션 연동
3. 에러 처리 강화
4. 전체 플로우 통합 테스트

**예상 산출물**:
- 완료 화면 컴포넌트
- 통합 테스트
- 에러 핸들링 개선

### Phase 4: 품질 보증 (우선순위: 높음)
1. 전체 테스트 실행 및 수정
2. 접근성 검증
3. 반응형 디자인 확인
4. 성능 최적화

**예상 산출물**:
- 테스트 커버리지 리포트
- 접근성 감사 결과
- 성능 프로파일링 리포트

---

## 기술적 고려사항

### react-day-picker 스타일링
```css
/* 커스텀 CSS 필요 */
.rdp {
  --rdp-cell-size: 40px;
  --rdp-accent-color: #3b82f6; /* blue-600 */
}

.rdp-day_selected {
  background-color: var(--rdp-accent-color);
  color: white;
  border-radius: 50%;
}
```

### 상태 관리 최적화
- 불필요한 리렌더링 방지: `confirmationStatus` 변경 시 전체 채팅 리렌더링 방지
- `useShallow` 훅 사용 (Zustand v4+)

### AI 응답 타임아웃
```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 10000) // 10초

try {
  const response = await fetch('/api/ai/onboarding', {
    signal: controller.signal,
    // ...
  })
} finally {
  clearTimeout(timeoutId)
}
```

---

## 성공 지표

1. **기능 완성도**: 모든 단계를 오류 없이 완료 가능
2. **디자인 일치도**: 제공된 목업과 95% 이상 일치
3. **테스트 커버리지**: 핵심 로직 80% 이상
4. **성능**: 첫 렌더링 < 1초, AI 응답 평균 < 3초
5. **접근성**: WCAG AA 기준 충족

---

## 다음 단계

1. **구현 계획 수립**: Phase별 상세 작업 목록 작성
2. **git worktree 생성**: 격리된 환경에서 작업
3. **TDD 적용**: 테스트 먼저 작성 후 구현
4. **코드 리뷰**: 각 Phase 완료 후 검토
5. **배포**: 스테이징 환경 테스트 → 프로덕션 배포

---

**문서 버전**: 1.0
**최종 업데이트**: 2026-01-28
**작성자**: Claude Code Agent
