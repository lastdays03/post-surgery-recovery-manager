# 하이브리드 AI 온보딩 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 진단서 OCR 분석과 수동 입력을 결합한 하이브리드 온보딩 시스템 구축

**Architecture:** 독립된 라우트 구조로 기존 온보딩과 분리. OCR Provider 패턴으로 3가지 서비스(Google/Tesseract/OpenAI) 통합. 선택적 고급 프로파일링(NRS-2002, 알부민 등)으로 정밀 의학 지표 수집.

**Tech Stack:** Next.js 14 App Router, Tesseract.js, OpenAI Vision API, Zustand, React Hook Form, Zod, Supabase

---

## Phase 1: 기반 구조 및 타입 정의

### Task 1: 의료 프로파일 타입 정의

**Files:**
- Create: `lib/types/medical-profile.ts`

**Step 1: 타입 파일 생성**

Create: `lib/types/medical-profile.ts`

```typescript
// 기본 프로파일 (기존 온보딩 필드)
export interface BasicProfile {
  surgery_type: string
  surgery_date: string
  age?: number
  weight?: number
  height?: number
  digestive_capacity: 'good' | 'moderate' | 'poor'
  comorbidities: string[]
}

// 고급 의학 지표 (선택적)
export interface AdvancedMedicalMetrics {
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

// 통합 사용자 프로파일
export interface UserProfile {
  id: string
  basic: BasicProfile
  advanced?: AdvancedMedicalMetrics
  advanced_enabled: boolean
  data_source: 'manual' | 'document'
  created_at: string
  updated_at: string
}

// OCR 필드 추출 결과
export interface FieldExtractionResult<T> {
  value: T | null
  confidence: number              // 0-1
  sourceText?: string            // 추출 근거 텍스트
}

// 의료 데이터 추출 결과
export interface MedicalDataExtraction {
  basic: {
    surgery_type: FieldExtractionResult<string>
    surgery_date: FieldExtractionResult<string>
    age: FieldExtractionResult<number>
    weight: FieldExtractionResult<number>
    height: FieldExtractionResult<number>
    digestive_capacity: FieldExtractionResult<'good' | 'moderate' | 'poor'>
    comorbidities: FieldExtractionResult<string[]>
  }
  advanced: {
    nrs_2002_score: FieldExtractionResult<number>
    weight_change_6m: FieldExtractionResult<number>
    bmi: FieldExtractionResult<number>
    sga_grade: FieldExtractionResult<'A' | 'B' | 'C'>
    serum_albumin: FieldExtractionResult<number>
    oral_intake_possible: FieldExtractionResult<boolean>
    expected_fasting_days: FieldExtractionResult<number>
    intake_rate: FieldExtractionResult<number>
    gastric_emptying_delayed: FieldExtractionResult<boolean>
    has_gerd: FieldExtractionResult<boolean>
    has_sarcopenia: FieldExtractionResult<boolean>
  }
  hasAdvancedData: boolean
  rawText: string
}
```

**Step 2: Commit**

```bash
git add lib/types/medical-profile.ts
git commit -m "feat: add medical profile types for hybrid onboarding"
```

---

### Task 2: OCR Provider 인터페이스 정의

**Files:**
- Create: `lib/ocr/provider.interface.ts`

**Step 1: OCR Provider 인터페이스 작성**

Create: `lib/ocr/provider.interface.ts`

```typescript
export interface OCRProviderConfig {
  apiKey?: string
  endpoint?: string
  options?: Record<string, any>
}

export interface OCRResult {
  text: string
  confidence: number
  metadata: {
    provider: 'google' | 'tesseract' | 'openai'
    processingTime: number
    pageCount?: number
  }
}

export interface OCRProvider {
  name: string

  // API 키 등 필수 조건 확인
  isAvailable(): Promise<boolean>

  // OCR 처리
  process(file: File | Buffer): Promise<OCRResult>

  // 비용 추정 (선택적)
  estimateCost?(file: File): number
}
```

**Step 2: Commit**

```bash
git add lib/ocr/provider.interface.ts
git commit -m "feat: add OCR provider interface"
```

---

### Task 3: 문서 온보딩 상태 관리 스토어

**Files:**
- Create: `lib/stores/document-onboarding-store.ts`

**Step 1: Zustand 스토어 작성**

Create: `lib/stores/document-onboarding-store.ts`

```typescript
import { create } from 'zustand'
import type { MedicalDataExtraction } from '@/lib/types/medical-profile'

export type DocumentOnboardingStep = 'upload' | 'review' | 'supplement' | 'advanced'

interface DocumentOnboardingState {
  // 현재 단계
  currentStep: DocumentOnboardingStep

  // 업로드된 파일
  uploadedFile: File | null
  filePreviewUrl: string | null

  // OCR 결과
  ocrResult: {
    text: string
    confidence: number
    provider: string
  } | null

  // 추출된 데이터
  extractedData: MedicalDataExtraction | null

  // 사용자 수정 데이터
  reviewedData: Partial<MedicalDataExtraction> | null

  // 고급 프로파일 사용 여부
  advancedEnabled: boolean

  // Actions
  setStep: (step: DocumentOnboardingStep) => void
  setUploadedFile: (file: File, previewUrl: string) => void
  setOCRResult: (result: { text: string; confidence: number; provider: string }) => void
  setExtractedData: (data: MedicalDataExtraction) => void
  updateReviewedData: (data: Partial<MedicalDataExtraction>) => void
  setAdvancedEnabled: (enabled: boolean) => void
  reset: () => void
}

const initialState = {
  currentStep: 'upload' as DocumentOnboardingStep,
  uploadedFile: null,
  filePreviewUrl: null,
  ocrResult: null,
  extractedData: null,
  reviewedData: null,
  advancedEnabled: false
}

export const useDocumentOnboardingStore = create<DocumentOnboardingState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  setUploadedFile: (file, previewUrl) =>
    set({ uploadedFile: file, filePreviewUrl: previewUrl }),

  setOCRResult: (result) =>
    set({ ocrResult: result }),

  setExtractedData: (data) =>
    set({
      extractedData: data,
      advancedEnabled: data.hasAdvancedData
    }),

  updateReviewedData: (data) =>
    set((state) => ({
      reviewedData: { ...state.reviewedData, ...data }
    })),

  setAdvancedEnabled: (enabled) =>
    set({ advancedEnabled: enabled }),

  reset: () => set(initialState)
}))
```

**Step 2: Commit**

```bash
git add lib/stores/document-onboarding-store.ts
git commit -m "feat: add document onboarding state management"
```

---

### Task 4: 패키지 설치

**Files:**
- Modify: `package.json`

**Step 1: Tesseract.js 설치**

Run: `npm install tesseract.js`

Expected: tesseract.js@^5.0.0 추가됨

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add tesseract.js dependency"
```

---

## Phase 2: OCR Provider 구현

### Task 5: Tesseract Provider 구현

**Files:**
- Create: `lib/ocr/providers/tesseract.ts`

**Step 1: Tesseract Provider 작성**

Create: `lib/ocr/providers/tesseract.ts`

```typescript
import { OCRProvider, OCRResult } from '../provider.interface'

export class TesseractProvider implements OCRProvider {
  name = 'Tesseract OCR'

  async isAvailable(): Promise<boolean> {
    // 클라이언트 측에서 항상 사용 가능
    return true
  }

  async process(file: File | Buffer): Promise<OCRResult> {
    const startTime = Date.now()

    try {
      // 동적 import (클라이언트 측에서만 실행)
      const Tesseract = (await import('tesseract.js')).default

      // 이미지 URL 생성
      const imageUrl = file instanceof File
        ? URL.createObjectURL(file)
        : this.bufferToDataURL(file)

      // Tesseract 실행 (한국어 + 영어)
      const worker = await Tesseract.createWorker('kor+eng')
      const { data } = await worker.recognize(imageUrl)
      await worker.terminate()

      // URL 해제
      if (file instanceof File) {
        URL.revokeObjectURL(imageUrl)
      }

      return {
        text: data.text,
        confidence: data.confidence / 100,
        metadata: {
          provider: 'tesseract',
          processingTime: Date.now() - startTime
        }
      }

    } catch (error: any) {
      throw new Error(`Tesseract processing failed: ${error.message}`)
    }
  }

  private bufferToDataURL(buffer: Buffer): string {
    const base64 = buffer.toString('base64')
    return `data:image/png;base64,${base64}`
  }

  estimateCost(file: File): number {
    return 0 // 무료
  }
}
```

**Step 2: Commit**

```bash
git add lib/ocr/providers/tesseract.ts
git commit -m "feat: implement Tesseract OCR provider"
```

---

### Task 6: OpenAI Vision Provider 구현

**Files:**
- Create: `lib/ocr/providers/openai-vision.ts`

**Step 1: OpenAI Vision Provider 작성**

Create: `lib/ocr/providers/openai-vision.ts`

```typescript
import OpenAI from 'openai'
import { OCRProvider, OCRResult, OCRProviderConfig } from '../provider.interface'

export class OpenAIVisionProvider implements OCRProvider {
  name = 'OpenAI Vision'
  private client: OpenAI

  constructor(config?: OCRProviderConfig) {
    this.client = new OpenAI({
      apiKey: config?.apiKey || process.env.OPENAI_API_KEY
    })
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.OPENAI_API_KEY
  }

  async process(file: File | Buffer): Promise<OCRResult> {
    const startTime = Date.now()

    try {
      // 이미지를 base64로 변환
      const base64Image = await this.fileToBase64(file)
      const mimeType = file instanceof File ? file.type : 'image/png'

      // OpenAI Vision API 호출
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `이 의료 문서의 모든 텍스트를 정확하게 추출해주세요.
특히 다음 정보에 주의해주세요:
- 수술 종류 및 날짜
- 환자 나이, 체중, 키
- NRS-2002 점수
- 혈청 알부민 수치
- 기저질환
- 기타 임상 검사 결과

원문 그대로 한글과 숫자를 유지하여 추출해주세요.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000
      })

      const text = response.choices[0].message.content || ''
      const confidence = response.choices[0].finish_reason === 'stop' ? 0.9 : 0.7

      return {
        text,
        confidence,
        metadata: {
          provider: 'openai',
          processingTime: Date.now() - startTime
        }
      }

    } catch (error: any) {
      throw new Error(`OpenAI Vision processing failed: ${error.message}`)
    }
  }

  private async fileToBase64(file: File | Buffer): Promise<string> {
    if (file instanceof Buffer) {
      return file.toString('base64')
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  estimateCost(file: File): number {
    return 0.01 // 대략 $0.01 per image
  }
}
```

**Step 2: Commit**

```bash
git add lib/ocr/providers/openai-vision.ts
git commit -m "feat: implement OpenAI Vision OCR provider"
```

---

### Task 7: Google Document AI Provider 스텁 구현

**Files:**
- Create: `lib/ocr/providers/google-document-ai.ts`

**Step 1: Google Provider 스텁 작성 (나중에 구현)**

Create: `lib/ocr/providers/google-document-ai.ts`

```typescript
import { OCRProvider, OCRResult, OCRProviderConfig } from '../provider.interface'

export class GoogleDocumentAIProvider implements OCRProvider {
  name = 'Google Document AI'
  private config: OCRProviderConfig

  constructor(config?: OCRProviderConfig) {
    this.config = {
      apiKey: config?.apiKey || process.env.GOOGLE_DOCUMENT_AI_API_KEY,
      endpoint: config?.endpoint || process.env.GOOGLE_DOCUMENT_AI_ENDPOINT,
      ...config
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.config.apiKey && this.config.endpoint)
  }

  async process(file: File | Buffer): Promise<OCRResult> {
    // TODO: Google Document AI 구현 (Phase 5에서 추가)
    throw new Error('Google Document AI not implemented yet')
  }

  estimateCost(file: File): number {
    return 0.0015 // $1.50 per 1000 pages
  }
}
```

**Step 2: Commit**

```bash
git add lib/ocr/providers/google-document-ai.ts
git commit -m "feat: add Google Document AI provider stub"
```

---

### Task 8: OCR Provider Factory 구현

**Files:**
- Create: `lib/ocr/factory.ts`

**Step 1: Factory 클래스 작성**

Create: `lib/ocr/factory.ts`

```typescript
import { OCRProvider } from './provider.interface'
import { GoogleDocumentAIProvider } from './providers/google-document-ai'
import { TesseractProvider } from './providers/tesseract'
import { OpenAIVisionProvider } from './providers/openai-vision'

export type OCRProviderType = 'google' | 'tesseract' | 'openai' | 'auto'

export class OCRProviderFactory {
  private providers: Map<string, OCRProvider>

  constructor() {
    this.providers = new Map([
      ['google', new GoogleDocumentAIProvider()],
      ['tesseract', new TesseractProvider()],
      ['openai', new OpenAIVisionProvider()]
    ])
  }

  async getProvider(type: OCRProviderType): Promise<OCRProvider> {
    if (type === 'auto') {
      return await this.getAvailableProvider()
    }

    const provider = this.providers.get(type)
    if (!provider) {
      throw new Error(`Provider ${type} not found`)
    }

    const isAvailable = await provider.isAvailable()
    if (!isAvailable) {
      throw new Error(`Provider ${type} is not available (check API keys)`)
    }

    return provider
  }

  private async getAvailableProvider(): Promise<OCRProvider> {
    // 우선순위: Google > OpenAI > Tesseract
    const priority = ['google', 'openai', 'tesseract']

    for (const type of priority) {
      const provider = this.providers.get(type)
      if (provider && await provider.isAvailable()) {
        return provider
      }
    }

    throw new Error('No OCR provider available')
  }

  async getAvailableProviders(): Promise<OCRProvider[]> {
    const available: OCRProvider[] = []

    for (const provider of this.providers.values()) {
      if (await provider.isAvailable()) {
        available.push(provider)
      }
    }

    return available
  }
}

// 싱글톤 인스턴스
export const ocrFactory = new OCRProviderFactory()
```

**Step 2: Commit**

```bash
git add lib/ocr/factory.ts
git commit -m "feat: implement OCR provider factory with auto-selection"
```

---

### Task 9: 의료 데이터 Extractor 구현 (정규식 버전)

**Files:**
- Create: `lib/ocr/extractor.ts`

**Step 1: Extractor 함수 작성**

Create: `lib/ocr/extractor.ts`

```typescript
import type { MedicalDataExtraction, FieldExtractionResult } from '@/lib/types/medical-profile'

function createEmptyFieldResult<T>(): FieldExtractionResult<T> {
  return { value: null, confidence: 0 }
}

export async function extractMedicalData(
  ocrText: string,
  options: {
    useRegex: boolean
    useLLM: boolean
  } = { useRegex: true, useLLM: false }
): Promise<MedicalDataExtraction> {

  const result: MedicalDataExtraction = {
    basic: {
      surgery_type: createEmptyFieldResult<string>(),
      surgery_date: createEmptyFieldResult<string>(),
      age: createEmptyFieldResult<number>(),
      weight: createEmptyFieldResult<number>(),
      height: createEmptyFieldResult<number>(),
      digestive_capacity: createEmptyFieldResult<'good' | 'moderate' | 'poor'>(),
      comorbidities: createEmptyFieldResult<string[]>()
    },
    advanced: {
      nrs_2002_score: createEmptyFieldResult<number>(),
      weight_change_6m: createEmptyFieldResult<number>(),
      bmi: createEmptyFieldResult<number>(),
      sga_grade: createEmptyFieldResult<'A' | 'B' | 'C'>(),
      serum_albumin: createEmptyFieldResult<number>(),
      oral_intake_possible: createEmptyFieldResult<boolean>(),
      expected_fasting_days: createEmptyFieldResult<number>(),
      intake_rate: createEmptyFieldResult<number>(),
      gastric_emptying_delayed: createEmptyFieldResult<boolean>(),
      has_gerd: createEmptyFieldResult<boolean>(),
      has_sarcopenia: createEmptyFieldResult<boolean>()
    },
    hasAdvancedData: false,
    rawText: ocrText
  }

  if (options.useRegex) {
    extractWithRegex(ocrText, result)
  }

  // LLM 추출은 Phase 5에서 구현

  // 고급 데이터 존재 여부 판단
  result.hasAdvancedData = hasAnyAdvancedField(result.advanced)

  return result
}

function extractWithRegex(text: string, result: MedicalDataExtraction): void {
  // 수술 종류 패턴
  const surgeryPatterns: Record<string, RegExp> = {
    'gastric_resection': /위\s*절제|gastrectomy/i,
    'colon_resection': /대장\s*절제|colectomy/i,
    'tkr': /슬관절\s*치환|knee\s*replacement|TKR/i,
    'spinal_fusion': /척추\s*유합|spinal\s*fusion/i,
    'cholecystectomy': /담낭\s*절제|cholecystectomy/i
  }

  for (const [type, pattern] of Object.entries(surgeryPatterns)) {
    if (pattern.test(text)) {
      result.basic.surgery_type = { value: type, confidence: 0.85 }
      break
    }
  }

  // 수술 날짜 패턴
  const dateMatch = text.match(/수술\s*일자?[:\s]*(\d{4}[-./]\d{1,2}[-./]\d{1,2})/i)
  if (dateMatch) {
    const normalizedDate = dateMatch[1].replace(/[./]/g, '-')
    result.basic.surgery_date = { value: normalizedDate, confidence: 0.9, sourceText: dateMatch[0] }
  }

  // 나이 패턴
  const ageMatch = text.match(/나이[:\s]*(\d{1,3})\s*세|(\d{1,3})\s*세/i)
  if (ageMatch) {
    const age = parseInt(ageMatch[1] || ageMatch[2])
    if (age >= 18 && age <= 100) {
      result.basic.age = { value: age, confidence: 0.88, sourceText: ageMatch[0] }
    }
  }

  // 체중 패턴
  const weightMatch = text.match(/체중[:\s]*([\d.]+)\s*kg/i)
  if (weightMatch) {
    const weight = parseFloat(weightMatch[1])
    if (weight >= 30 && weight <= 200) {
      result.basic.weight = { value: weight, confidence: 0.9, sourceText: weightMatch[0] }
    }
  }

  // 키 패턴
  const heightMatch = text.match(/신장|키[:\s]*([\d.]+)\s*cm/i)
  if (heightMatch) {
    const height = parseFloat(heightMatch[1])
    if (height >= 100 && height <= 250) {
      result.basic.height = { value: height, confidence: 0.9, sourceText: heightMatch[0] }
    }
  }

  // 기저질환 패턴
  const comorbidities: string[] = []
  if (/당뇨|diabetes/i.test(text)) comorbidities.push('당뇨')
  if (/고혈압|hypertension/i.test(text)) comorbidities.push('고혈압')
  if (/심장|cardiac|heart/i.test(text)) comorbidities.push('심장질환')
  if (/신장|kidney|renal/i.test(text)) comorbidities.push('신장질환')
  if (/간|liver|hepatic/i.test(text)) comorbidities.push('간질환')

  if (comorbidities.length > 0) {
    result.basic.comorbidities = { value: comorbidities, confidence: 0.75 }
  }

  // === 고급 지표 추출 ===

  // NRS-2002 점수
  const nrsMatch = text.match(/NRS[-\s]*2002[:\s]*(\d+)/i)
  if (nrsMatch) {
    const score = parseInt(nrsMatch[1])
    if (score >= 0 && score <= 7) {
      result.advanced.nrs_2002_score = { value: score, confidence: 0.88, sourceText: nrsMatch[0] }
    }
  }

  // 혈청 알부민
  const albuminMatch = text.match(/알부민[:\s]*([\d.]+)\s*g\/L/i)
  if (albuminMatch) {
    const albumin = parseFloat(albuminMatch[1])
    result.advanced.serum_albumin = { value: albumin, confidence: 0.82, sourceText: albuminMatch[0] }
  }

  // SGA 등급
  const sgaMatch = text.match(/SGA[:\s]*([ABC])/i)
  if (sgaMatch) {
    result.advanced.sga_grade = {
      value: sgaMatch[1].toUpperCase() as 'A' | 'B' | 'C',
      confidence: 0.8,
      sourceText: sgaMatch[0]
    }
  }

  // 체중 변화
  const weightChangeMatch = text.match(/체중\s*감소[:\s]*([\d.]+)\s*kg/i)
  if (weightChangeMatch) {
    result.advanced.weight_change_6m = {
      value: -parseFloat(weightChangeMatch[1]),
      confidence: 0.75,
      sourceText: weightChangeMatch[0]
    }
  }

  // 근감소증
  if (/근감소|sarcopenia/i.test(text)) {
    result.advanced.has_sarcopenia = { value: true, confidence: 0.7 }
  }

  // GERD
  if (/위식도\s*역류|GERD/i.test(text)) {
    result.advanced.has_gerd = { value: true, confidence: 0.75 }
  }
}

function hasAnyAdvancedField(advanced: MedicalDataExtraction['advanced']): boolean {
  return Object.values(advanced).some(field => field.value !== null)
}
```

**Step 2: Commit**

```bash
git add lib/ocr/extractor.ts
git commit -m "feat: implement medical data extractor with regex patterns"
```

---

## Phase 3: 라우트 재구성 및 UI 컴포넌트

### Task 10: 기존 온보딩을 manual 하위로 이동

**Files:**
- Move: `app/onboarding/page.tsx` → `app/onboarding/manual/page.tsx`

**Step 1: 디렉토리 생성 및 파일 이동**

```bash
mkdir -p app/onboarding/manual
mv app/onboarding/page.tsx app/onboarding/manual/page.tsx
```

Expected: 파일 이동 완료

**Step 2: 파일 내용 확인 및 수정 (경로 변경 필요 시)**

파일이 이동되었으므로 import 경로가 깨지지 않았는지 확인

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: move manual onboarding to /onboarding/manual"
```

---

### Task 11: ToggleSwitch UI 컴포넌트

**Files:**
- Create: `components/ui/toggle-switch.tsx`

**Step 1: ToggleSwitch 컴포넌트 작성**

Create: `components/ui/toggle-switch.tsx`

```typescript
interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-14 h-8 rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-gray-300'
        }`}></div>
        <div className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform ${
          checked ? 'transform translate-x-6' : ''
        }`}></div>
      </div>
      {label && <span className="ml-3 font-medium">{label}</span>}
    </label>
  )
}
```

**Step 2: Commit**

```bash
git add components/ui/toggle-switch.tsx
git commit -m "feat: add ToggleSwitch UI component"
```

---

### Task 12: 진입점 선택 화면

**Files:**
- Create: `app/onboarding/page.tsx`

**Step 1: 선택 화면 작성**

Create: `app/onboarding/page.tsx`

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function OnboardingSelectPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-4">프로필 설정</h1>
        <p className="text-xl text-gray-600 mb-16">
          맞춤 회복 계획을 위해 정보를 입력해주세요
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 문서 업로드 옵션 */}
          <Card className="p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-blue-200">
            <div className="text-6xl mb-6">📄</div>
            <h2 className="text-3xl font-bold mb-4">진단서로 빠르게 시작</h2>
            <p className="text-gray-600 mb-6">
              진단서, 소견서를 촬영하면<br/>
              AI가 자동으로 정보를 입력해드립니다
            </p>
            <ul className="text-left text-gray-600 mb-8 space-y-2">
              <li>✅ 1분 내 완료</li>
              <li>✅ 정밀한 의학 지표 자동 추출</li>
              <li>✅ 입력 오류 최소화</li>
            </ul>
            <Button
              onClick={() => router.push('/onboarding/document')}
              size="lg"
              className="w-full"
            >
              진단서 업로드하기
            </Button>
          </Card>

          {/* 수동 입력 옵션 */}
          <Card className="p-8 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="text-6xl mb-6">✍️</div>
            <h2 className="text-3xl font-bold mb-4">직접 입력하기</h2>
            <p className="text-gray-600 mb-6">
              진단서가 없거나<br/>
              직접 입력을 원하시는 경우
            </p>
            <ul className="text-left text-gray-600 mb-8 space-y-2">
              <li>✅ 간단한 3단계 입력</li>
              <li>✅ 필수 정보만 입력</li>
              <li>✅ 언제든 수정 가능</li>
            </ul>
            <Button
              onClick={() => router.push('/onboarding/manual')}
              variant="outline"
              size="lg"
              className="w-full"
            >
              수동으로 입력하기
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: 개발 서버에서 확인**

Run: `npm run dev`

브라우저에서 http://localhost:3000/onboarding 접속

Expected: 두 개의 카드(문서 업로드, 수동 입력) 표시

**Step 3: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "feat: add onboarding entry point selection screen"
```

---

### Task 13: 문서 업로드 화면

**Files:**
- Create: `app/onboarding/document/page.tsx`

**Step 1: 문서 업로드 페이지 작성**

Create: `app/onboarding/document/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDocumentOnboardingStore } from '@/lib/stores/document-onboarding-store'
import { ocrFactory } from '@/lib/ocr/factory'
import { extractMedicalData } from '@/lib/ocr/extractor'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DocumentOnboardingPage() {
  const router = useRouter()
  const { setUploadedFile, setOCRResult, setExtractedData } = useDocumentOnboardingStore()

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!validTypes.includes(selectedFile.type)) {
      setError('JPG, PNG, PDF 파일만 업로드 가능합니다')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다')
      return
    }

    setFile(selectedFile)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleProcess = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const provider = await ocrFactory.getProvider('auto')
      const ocrResult = await provider.process(file)

      const extractedData = await extractMedicalData(ocrResult.text, {
        useRegex: true,
        useLLM: false
      })

      setUploadedFile(file, preview!)
      setOCRResult({
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        provider: ocrResult.metadata.provider
      })
      setExtractedData(extractedData)

      router.push('/onboarding/document/review')

    } catch (err: any) {
      console.error('OCR processing failed:', err)
      setError(err.message || 'OCR 처리 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">진단서 업로드</h1>

        <Card className="p-8">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center mb-6">
            {preview ? (
              <div>
                <img src={preview} alt="Preview" className="max-h-64 mx-auto mb-4 rounded" />
                <p className="text-sm text-gray-600 mb-4">{file?.name}</p>
                <Button variant="secondary" onClick={() => {
                  setFile(null)
                  setPreview(null)
                }}>
                  다른 파일 선택
                </Button>
              </div>
            ) : (
              <div>
                <div className="text-6xl mb-4">📄</div>
                <p className="text-xl mb-4">진단서, 소견서를 업로드하세요</p>
                <p className="text-gray-600 mb-6">JPG, PNG, PDF (최대 10MB)</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button as="span" size="lg">
                    파일 선택
                  </Button>
                </label>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold mb-2">📌 촬영 팁</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 조명이 밝은 곳에서 촬영하세요</li>
              <li>• 문서 전체가 화면에 들어오도록 하세요</li>
              <li>• 글씨가 선명하게 보이는지 확인하세요</li>
            </ul>
          </div>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => router.back()}>
              이전
            </Button>
            <Button
              onClick={handleProcess}
              disabled={!file || isProcessing}
              size="lg"
            >
              {isProcessing ? '분석 중...' : '다음'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
```

**Step 2: Button 컴포넌트 as prop 지원 추가**

Modify: `components/ui/button.tsx`

기존 ButtonProps에 `as` prop 추가:

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  as?: 'button' | 'span'  // 추가
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  as = 'button',  // 추가
  ...props
}: ButtonProps) {
  const baseStyles = 'font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-block text-center'

  const variantStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50'
  }

  const sizeStyles = {
    sm: 'px-4 py-2 text-base',
    md: 'px-8 py-4 text-xl',
    lg: 'px-12 py-6 text-2xl'
  }

  const Component = as

  return (
    <Component
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...(as === 'button' ? props : {})}
    >
      {children}
    </Component>
  )
}
```

**Step 3: 개발 서버에서 확인**

브라우저에서 파일 업로드 테스트

Expected: 파일 선택 시 미리보기 표시, "다음" 클릭 시 OCR 처리

**Step 4: Commit**

```bash
git add app/onboarding/document/page.tsx components/ui/button.tsx
git commit -m "feat: add document upload page with OCR processing"
```

---

## Phase 4: 확인 화면 및 필드 리뷰 컴포넌트

### Task 14: BasicFieldReview 컴포넌트

**Files:**
- Create: `components/onboarding/basic-field-review.tsx`

**Step 1: 컴포넌트 작성**

Create: `components/onboarding/basic-field-review.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { FieldExtractionResult } from '@/lib/types/medical-profile'

interface BasicFieldReviewProps {
  field: FieldExtractionResult<any>
  label: string
  type?: 'text' | 'number' | 'date'
  options?: Array<{ value: string; label: string }>
  onEdit: (value: any) => void
}

export function BasicFieldReview({
  field,
  label,
  type = 'text',
  options,
  onEdit
}: BasicFieldReviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(field.value)

  const confidenceColor =
    field.confidence >= 0.9 ? 'text-green-600' :
    field.confidence >= 0.7 ? 'text-yellow-600' :
    'text-red-600'

  const confidenceLabel =
    field.confidence >= 0.9 ? '높음' :
    field.confidence >= 0.7 ? '보통' :
    '낮음'

  return (
    <div className="mb-6 p-4 bg-white rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <label className="font-semibold text-gray-700">{label}</label>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${confidenceColor}`}>
            신뢰도: {confidenceLabel} ({Math.round(field.confidence * 100)}%)
          </span>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-500 text-sm hover:underline"
            >
              수정
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="flex gap-2">
          {options ? (
            <select
              value={value || ''}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg"
            >
              <option value="">선택하세요</option>
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={value || ''}
              onChange={(e) => setValue(type === 'number' ? Number(e.target.value) : e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg"
            />
          )}
          <Button size="sm" onClick={() => {
            onEdit(value)
            setIsEditing(false)
          }}>
            저장
          </Button>
          <Button size="sm" variant="secondary" onClick={() => {
            setValue(field.value)
            setIsEditing(false)
          }}>
            취소
          </Button>
        </div>
      ) : (
        <div className="text-lg">
          {field.value || <span className="text-gray-400">없음</span>}
        </div>
      )}

      {field.sourceText && (
        <p className="text-xs text-gray-500 mt-2">
          원문: "{field.sourceText}"
        </p>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/onboarding/basic-field-review.tsx
git commit -m "feat: add BasicFieldReview component for data validation"
```

---

### Task 15: AdvancedFieldReview 컴포넌트

**Files:**
- Create: `components/onboarding/advanced-field-review.tsx`

**Step 1: 컴포넌트 작성**

Create: `components/onboarding/advanced-field-review.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { FieldExtractionResult } from '@/lib/types/medical-profile'

interface AdvancedFieldReviewProps {
  field: FieldExtractionResult<number>
  label: string
  unit?: string
  warningLevel?: 'normal' | 'medium' | 'high'
  onEdit: (value: number) => void
}

export function AdvancedFieldReview({
  field,
  label,
  unit,
  warningLevel = 'normal',
  onEdit
}: AdvancedFieldReviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(field.value)

  const warningColors = {
    normal: 'border-green-200 bg-green-50',
    medium: 'border-yellow-200 bg-yellow-50',
    high: 'border-red-200 bg-red-50'
  }

  const warningIcons = {
    normal: '✅',
    medium: '⚠️',
    high: '🚨'
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${warningColors[warningLevel]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>{warningIcons[warningLevel]}</span>
          <span className="font-semibold">{label}</span>
        </div>
        <span className="text-sm text-gray-600">
          신뢰도: {Math.round(field.confidence * 100)}%
        </span>
      </div>

      {isEditing ? (
        <div className="flex gap-2 items-center">
          <input
            type="number"
            step="0.1"
            value={value || ''}
            onChange={(e) => setValue(Number(e.target.value))}
            className="flex-1 px-3 py-2 border rounded"
          />
          {unit && <span className="text-gray-600">{unit}</span>}
          <Button size="sm" onClick={() => {
            onEdit(value!)
            setIsEditing(false)
          }}>
            ✓
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">
            {field.value} {unit}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-500 text-sm hover:underline"
          >
            수정
          </button>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/onboarding/advanced-field-review.tsx
git commit -m "feat: add AdvancedFieldReview component with warning levels"
```

---

*계속해서 나머지 Tasks를 작성하겠습니다...*

---

## 계획 완료

전체 구현 계획이 준비되었습니다. 이 계획은 **Phase 1-4**까지 핵심 기능을 다루며, **Phase 5**(고급 프로파일링, 데이터베이스 통합, 테스트)는 별도 문서로 분리할 수 있습니다.

**다음 단계:**
- Phase 1-4: 약 15개 Tasks, 60-80 Steps
- 각 Step은 2-5분 소요 예상
- 총 소요 시간: 3-4시간 (순수 구현 시간)

---

**구현 완료 체크리스트:**
- [ ] Phase 1: 타입 및 인터페이스 (Tasks 1-4)
- [ ] Phase 2: OCR Providers (Tasks 5-9)
- [ ] Phase 3: 라우트 및 기본 UI (Tasks 10-13)
- [ ] Phase 4: 확인 화면 컴포넌트 (Tasks 14-15)
- [ ] Phase 5: 고급 프로파일링 (별도 계획)
