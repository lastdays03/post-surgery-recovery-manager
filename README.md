# 수술 후 통합 회복 관리 매니저 (Post-Surgery Recovery Manager)

사용자의 수술 종류와 회복 경과일(D-Day)에 맞춰 최적화된 회복 가이드를 제공하는 디지털 헬스케어 플랫폼입니다. 임상 프로토콜에 기반한 식단 추천, 재활 운동 스케줄링, 그리고 AI 기반의 상태 모니터링을 통해 안전하고 체계적인 회복을 돕습니다.

## 🚀 주요 기능

- **맞춤형 온보딩 및 프로파일링**: 5가지 주요 수술(위절제, 대장절제, 인공관절, 척추유합, 담낭제거)에 따른 개인별 회복 로드맵 생성.
- **회복 단계별 가이드**: 수술 후 경과 일수에 따라 유동식-연식-일반식으로 이어지는 단계별 영양 가이드 및 금기 음식 자동 필터링.
- **재활 운동 스케줄러**: 정형외과 수술 등을 위한 주차별 재활 운동(GIF/이미지 포함) 및 달성도 관리.
- **AI 증상 분석 및 챗봇**: 증상 기록을 분석하여 위험 징후를 감지하고 가이드를 제공하는 지능형 모니터링.
- **전문 PDF 리포트**: 주간 회복 통계(통증, 기력, 달성률)를 시각화하여 의료진 상담 시 활용 가능한 고품질 PDF 생성.

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, Lucide React
- **State Management**: Zustand
- **Form Handling**: React Hook Form, Zod

### Backend & Infrastructure
- **Serverless/DB**: Supabase (Auth, PostgreSQL, Storage, Functions)
- **AI Engine**: Google Generative AI (Gemini), OpenAI SDK
- **Reporting**: @react-pdf/renderer (PDF Generation)
- **Testing**: Vitest, JSDom

## 📦 설치 및 실행

### 사전 요구 사항
- Node.js 20+
- Supabase 프로젝트 및 API Key
- `.env.local` 파일 (`.env.local.example` 참고)

### 환경 변수 설정
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### 설치 및 시작
```bash
# 의존성 설치
npm install

# 로컬 개발 서버 실행
npm run dev
```

## 🏗 프로젝트 구조

- `/app`: 페이지 라우팅 및 레이아웃 (Dashboard, Onboarding, Reports 등)
- `/components`: 재사용 가능한 UI 컴포넌트 및 기능별 컴포넌트 (AI Chat, PDF Template 등)
- `/lib`: 공통 유틸리티, 서비스 로직, API 액션 및 타입 정의
- `/hooks`: 리포트 생성, 채팅 연동 등을 위한 커스텀 훅
- `/data`: 수술별 프로토콜, 식단 및 운동 데이터베이스 (JSON/TS)
- `/supabase`: 데이터베이스 마이그레이션 및 설정

## ✅ 테스트 실행

```bash
# 단위 테스트 실행
npm test
```

## 📄 라이선스
본 프로젝트는 개인 및 학습 목적으로 개발되었습니다.
