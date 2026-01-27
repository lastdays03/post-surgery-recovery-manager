# 하이브리드 AI 온보딩 및 정밀 의학 프로파일링 설계

> **설계 날짜:** 2026-01-27
> **목표:** 진단서 OCR 분석과 수동 입력을 결합한 하이브리드 온보딩 시스템 구축

## 개요

진단서, 소견서 등 의료 문서를 AI로 분석하는 OCR 기술과 사용자 수동 입력을 결합하여, 사용자의 건강 상태를 정밀하게 파악하고 최적의 회복 식단을 자동화하는 시스템을 구현합니다.

### 핵심 기능

- **3가지 OCR Provider** (프로바이더 패턴): Google Document AI, Tesseract.js, OpenAI Vision
- **선택적 고급 프로파일링**: NRS-2002, 혈청 알부민, 근감소증 등 정밀 의학 지표
- **양방향 진입점**: 진단서 업로드 또는 수동 입력 선택
- **단일 확인 화면**: 추출된 데이터 검토 및 신뢰도 표시
- **공평한 UX**: 문서/수동 입력 모두 동일한 상세도의 프로파일 생성 가능

---

## 1. 아키텍처

### 1-1. 라우트 구조

```
app/
├── onboarding/
│   ├── page.tsx                    # 진입점 선택 화면 (문서 vs 수동)
│   ├── manual/
│   │   ├── page.tsx                # 기존 수동 입력 메인 (3단계)
│   │   ├── advanced-prompt/
│   │   │   └── page.tsx            # 고급 지표 입력 선택 화면
│   │   └── advanced/
│   │       └── page.tsx            # 고급 지표 입력 폼
│   └── document/
│       ├── page.tsx                # 문서 업로드 화면
│       ├── review/
│       │   └── page.tsx            # 추출 결과 확인 화면
│       └── advanced/
│           └── page.tsx            # 고급 지표 입력 폼 (OCR 미검출 시)
```

### 1-2. 코어 레이어

```
lib/
├── ocr/
│   ├── provider.interface.ts           # OCR 추상 인터페이스
│   ├── providers/
│   │   ├── google-document-ai.ts       # Google Provider
│   │   ├── tesseract.ts                # Tesseract Provider
│   │   └── openai-vision.ts            # OpenAI Provider
│   ├── factory.ts                      # Provider 팩토리
│   └── extractor.ts                    # 의료 데이터 추출 로직
├── stores/
│   └── document-onboarding-store.ts    # 문서 온보딩 전용 상태
├── schemas/
│   └── medical-profile-schema.ts       # 고급 지표 포함 스키마
└── types/
    └── medical-profile.ts              # 프로파일 타입 정의
```

---

## 2. 데이터 모델

### 2-1. 프로파일 타입

```typescript
// 기본 프로파일
interface BasicProfile {
  surgery_type: string
  surgery_date: string
  age?: number
  weight?: number
  height?: number
  digestive_capacity: 'good' | 'moderate' | 'poor'
  comorbidities: string[]
}

// 고급 의학 지표 (선택적)
interface AdvancedMedicalMetrics {
  nrs_2002_score?: number              // 0-7점
  weight_change_6m?: number            // kg (음수=감소)
  bmi?: number
  sga_grade?: 'A' | 'B' | 'C'
  serum_albumin?: number               // g/L
  oral_intake_possible?: boolean
  expected_fasting_days?: number
  intake_rate?: number                 // %
  gastric_emptying_delayed?: boolean
  has_gerd?: boolean
  has_sarcopenia?: boolean
}

// 통합 프로파일
interface UserProfile {
  basic: BasicProfile
  advanced?: AdvancedMedicalMetrics
  advanced_enabled: boolean
  data_source: 'manual' | 'document'
}
```

### 2-2. OCR 결과 구조

```typescript
interface FieldExtractionResult<T> {
  value: T | null
  confidence: number              // 0-1
  sourceText?: string            // 추출 근거 텍스트
}

interface MedicalDataExtraction {
  basic: {
    surgery_type: FieldExtractionResult<string>
    surgery_date: FieldExtractionResult<string>
    // ... 기타 기본 필드
  }
  advanced: {
    nrs_2002_score: FieldExtractionResult<number>
    serum_albumin: FieldExtractionResult<number>
    // ... 기타 고급 필드
  }
  hasAdvancedData: boolean
  rawText: string
}
```

---

## 3. OCR Provider 패턴

### 3-1. Provider 인터페이스

```typescript
interface OCRProvider {
  name: string
  isAvailable(): Promise<boolean>
  process(file: File | Buffer): Promise<OCRResult>
  estimateCost?(file: File): number
}

interface OCRResult {
  text: string
  confidence: number
  metadata: {
    provider: 'google' | 'tesseract' | 'openai'
    processingTime: number
    pageCount?: number
  }
}
```

### 3-2. Provider 선택 전략

**우선순위:** Google Document AI > OpenAI Vision > Tesseract

- **자동 선택 모드**: 사용 가능한 첫 번째 provider 선택
- **수동 선택 모드**: 사용자가 UI에서 선택 (미래 확장)

### 3-3. 데이터 추출 전략

**하이브리드 접근:**
1. **정규식 패턴 매칭** (빠르고 비용 없음) - 1차 추출
2. **LLM 구조화 추출** (정확하지만 비용 발생) - 신뢰도 낮은 필드만 2차 추출 (선택적)

---

## 4. 사용자 플로우

### 4-1. 문서 기반 온보딩

```
1. /onboarding → "진단서로 시작" 선택
   ↓
2. /onboarding/document
   - 파일 업로드 (JPG/PNG/PDF, 최대 10MB)
   - OCR 자동 처리 (provider 자동 선택)
   - 의료 데이터 추출
   ↓
3. /onboarding/document/review
   - 기본 정보 확인/수정 (신뢰도 표시)
   - 고급 지표:
     * 감지됨 → 토글로 활성화/비활성화
     * 미감지 → "직접 입력하기" 버튼 제공
   ↓
4-A. 고급 지표 입력 선택 시
     → /onboarding/document/advanced

4-B. 건너뛰기
     → 바로 저장 후 /dashboard
   ↓
5. 프로파일 저장
   - 로컬 스토리지 + Supabase
   - data_source='document'
```

### 4-2. 수동 입력 온보딩

```
1. /onboarding → "직접 입력" 선택
   ↓
2. /onboarding/manual (기존 플로우)
   - Step 1: 수술 정보
   - Step 2: 개인 정보
   - Step 3: 건강 상태
   ↓
3. /onboarding/manual/advanced-prompt
   - "추가 의학 지표를 입력하시겠습니까?" 선택 화면
   ↓
4-A. "입력하기"
     → /onboarding/manual/advanced

4-B. "건너뛰기"
     → 바로 저장 후 /dashboard
   ↓
5. 프로파일 저장
   - data_source='manual'
```

---

## 5. 핵심 컴포넌트

### 5-1. 진입점 선택 화면

**경로:** `/onboarding/page.tsx`

**기능:**
- 두 가지 옵션 제시: "진단서로 빠르게 시작" vs "직접 입력하기"
- 각 옵션의 장단점 명시
- 시각적으로 구분된 카드 레이아웃

### 5-2. 문서 업로드 화면

**경로:** `/onboarding/document/page.tsx`

**기능:**
- 파일 업로드 (드래그 앤 드롭 또는 선택)
- 파일 검증 (타입, 크기)
- 미리보기 표시
- OCR 처리 진행 상태
- 촬영 팁 안내

### 5-3. 추출 결과 확인 화면

**경로:** `/onboarding/document/review/page.tsx`

**기능:**
- 기본 필드 검토 (신뢰도 점수 표시)
- 필드별 수정 기능
- 고급 지표 섹션:
  - 케이스 A: 감지됨 → 토글 + 필드 목록
  - 케이스 B: 미감지 → 안내 메시지 + "직접 입력하기" 버튼
- 원문 텍스트 참조

### 5-4. 고급 지표 입력 폼 (공통)

**경로:**
- `/onboarding/document/advanced/page.tsx`
- `/onboarding/manual/advanced/page.tsx`

**컴포넌트:** `AdvancedMetricsForm`

**기능:**
- 카테고리별 구분:
  - 영양 위험도 평가 (NRS-2002, 알부민, 체중 변화, SGA)
  - 섭취 능력 (경구 섭취, 금식 기간, 섭취율)
  - 소화기 기능 (위배출 지연, GERD)
  - 근육 상태 (근감소증)
- 각 필드에 의학적 기준 안내
- "건너뛰기" 옵션

### 5-5. 필드 리뷰 컴포넌트

**컴포넌트:**
- `BasicFieldReview`: 기본 필드 표시/수정
- `AdvancedFieldReview`: 고급 필드 표시/수정 (경고 레벨 포함)
- `ToggleSwitch`: 고급 프로파일 활성화 토글

---

## 6. 데이터베이스 스키마

### 6-1. user_profiles 테이블 확장

```sql
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS advanced_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS advanced_metrics JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual'
    CHECK (data_source IN ('manual', 'document'));

-- 인덱스
CREATE INDEX idx_profiles_data_source ON user_profiles(data_source);
CREATE INDEX idx_profiles_advanced_enabled ON user_profiles(advanced_enabled);
CREATE INDEX idx_profiles_advanced_metrics ON user_profiles USING GIN (advanced_metrics);
```

### 6-2. advanced_metrics JSONB 구조

```json
{
  "nrs_2002_score": 4,
  "serum_albumin": 28.5,
  "weight_change_6m": -8.0,
  "sga_grade": "B",
  "has_sarcopenia": true,
  "oral_intake_possible": true,
  "expected_fasting_days": 7,
  "intake_rate": 60,
  "gastric_emptying_delayed": false,
  "has_gerd": true
}
```

---

## 7. 환경 변수

```bash
# .env.local

# 기존
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=

# OCR Providers (선택적)
GOOGLE_DOCUMENT_AI_API_KEY=
GOOGLE_DOCUMENT_AI_ENDPOINT=

# Tesseract는 클라이언트 측이므로 불필요
# OpenAI Vision은 OPENAI_API_KEY 재사용
```

---

## 8. 의존성

### 8-1. 신규 패키지

```json
{
  "dependencies": {
    "tesseract.js": "^5.0.0"
  }
}
```

### 8-2. 기존 패키지 활용

- `openai`: OpenAI Vision API
- `@supabase/supabase-js`: 데이터 저장
- `react-hook-form`: 폼 관리
- `zod`: 검증
- `zustand`: 상태 관리

---

## 9. 구현 우선순위

### Phase 1: 기반 구조 (필수)
1. 라우트 재구성 (기존 `/onboarding` → `/onboarding/manual`)
2. 진입점 선택 화면
3. OCR Provider 인터페이스 및 팩토리
4. 문서 온보딩 상태 관리 (Zustand store)
5. 데이터베이스 마이그레이션

### Phase 2: OCR 기능 (핵심)
6. Tesseract Provider 구현
7. OpenAI Vision Provider 구현
8. Google Document AI Provider 구현 (선택적)
9. 의료 데이터 Extractor (정규식 버전)
10. 문서 업로드 화면

### Phase 3: 확인 및 검토 (핵심)
11. 추출 결과 확인 화면
12. 필드 리뷰 컴포넌트 (BasicFieldReview, AdvancedFieldReview)
13. 토글 스위치 컴포넌트

### Phase 4: 고급 프로파일링 (선택적 기능)
14. 고급 지표 입력 폼 (공통 컴포넌트)
15. 수동 입력 고급 단계 추가 (Step 4)
16. 문서 입력 고급 단계
17. 프로파일 저장 로직 통합

### Phase 5: 테스트 및 개선 (반복)
18. 실제 진단서로 추출 정확도 테스트
19. Extractor 패턴 개선
20. LLM 구조화 추출 추가 (선택적)
21. UX 개선 및 에러 처리

---

## 10. 향후 확장 계획

### 10-1. 식단 생성 시 고급 지표 활용

```typescript
export function generateMealPlan(profile: UserProfile) {
  let proteinMultiplier = 1.2  // 기본값

  if (profile.advanced_enabled && profile.advanced) {
    // 고위험군 판단
    if (profile.advanced.nrs_2002_score >= 5) {
      proteinMultiplier = 1.5
    }

    // 저알부민혈증
    if (profile.advanced.serum_albumin < 30) {
      proteinMultiplier = Math.max(proteinMultiplier, 1.6)
    }

    // 근감소증
    if (profile.advanced.has_sarcopenia) {
      proteinMultiplier = Math.max(proteinMultiplier, 1.4)
    }
  }

  // 식단 생성 로직에 반영
  const dailyProtein = profile.basic.weight * proteinMultiplier
  // ...
}
```

### 10-2. 설정에서 고급 프로파일 관리

- 언제든 고급 프로파일 활성화/비활성화
- 진단서 재업로드로 고급 지표 추가
- 수동으로 고급 지표 수정

### 10-3. OCR 정확도 개선

- 사용자 피드백 수집 ("이 정보가 정확한가요?")
- 오류 패턴 분석 및 Extractor 개선
- 의료 용어 사전 구축
- Fine-tuned LLM 모델 활용

---

## 11. 성공 지표

### 11-1. 기술적 지표
- OCR 정확도: 기본 필드 >90%, 고급 필드 >80%
- 처리 속도: <10초 (평균)
- 에러율: <5%

### 11-2. UX 지표
- 온보딩 완료율: >80%
- 문서 업로드 선택 비율: >60% (목표)
- 고급 프로파일 활성화율: >40%

### 11-3. 비즈니스 지표
- 입력 시간 단축: 평균 5분 → 2분
- 사용자 만족도 향상
- 정밀 식단 추천으로 인한 회복 효과 개선

---

## 12. 리스크 및 완화 전략

### 12-1. OCR 정확도 낮음
**리스크:** 진단서 품질이 낮거나 필기체일 경우 추출 실패

**완화 전략:**
- 신뢰도 점수 명시적 표시
- 사용자가 모든 필드 수정 가능
- 촬영 가이드 제공
- 여러 Provider 폴백

### 12-2. API 비용 증가
**리스크:** OpenAI Vision 또는 Google Document AI 사용 시 비용 발생

**완화 전략:**
- Tesseract를 기본 Provider로 설정
- 유료 Provider는 선택적 활성화
- 비용 추정 기능 제공

### 12-3. 복잡도 증가
**리스크:** 기존 온보딩과 병행하며 코드 복잡도 상승

**완화 전략:**
- 독립된 라우트 및 상태 관리로 격리
- 공통 컴포넌트 재사용 (AdvancedMetricsForm)
- 단계별 구현 및 테스트

---

## 부록: 정밀 프로파일링 의학 지표 상세 기준

| 구분 | 데이터 필드 | 기준 및 의학적 의미 |
| :--- | :--- | :--- |
| **수술 정보** | 수술 종류 | GI(위·대장·췌장), 정형, 두경부, 이식, 비만수술 등 (프로토콜 결정) |
| | 수술 날짜 | D-Day 기준 회복 및 식단 단계 계산의 기점 |
| | 수술 범위/침습도 | 대수술 vs 경수술 (대사 스트레스 강도 판단) |
| **영양 위험도** | NRS-2002 점수 | ≥3점 위험, ≥5점 고위험 (영양 집중 지원 필요성 판단) |
| | 체중 변화 | 6개월 내 10~15% 감소 시 중증 위험 (영양 불량 상태) |
| | BMI | 18.5 미만 시 고위험 (영양 저장량 부족) |
| | SGA 등급 | C등급일 경우 중증 영양 불량으로 간주 |
| | 혈청 알부민 | 30 g/L 미만 시 고위험 (단백질 결핍 및 부종 위험) |
| **대사/질환** | 기저질환 | 당뇨, 고혈압, 간·신장 질환 (탄수/단백·전해질 조절의 근거) |
| | 소화기 기능 | 위배출 지연, GERD (탄수화물 음료 및 식단 종류 제한) |
| **섭취 능력** | 경구 가능 여부 | 입으로 음식 섭취가 가능한지(Yes/No) 여부 |
| | 예상 금식 기간 | >5일, >7일, >14일 (영양 공급 경로 및 강도 결정) |
| | 섭취율 | 필요량의 50% 미만 섭취 여부 (추가 보충제 필요성) |
| **연령/근감소** | 연령 | 고령자일 경우 더 높은 단백질 권장량 적용 |
| | 근실실(Sarcopenia) | 근감소증 존재 시 합병증 위험 증가 및 재활 강도 조정 |

---

**최종 업데이트:** 2026-01-27
