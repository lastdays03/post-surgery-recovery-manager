'use client'

import { useState, useTransition } from 'react'
import { refinePromptAction, executePromptAction } from '@/lib/actions/prompt-actions'

export default function PromptOptimizationPage() {
    const defaultSystemPrompt = `
<role>
당신은 수술 후 회복 환자를 위한 전문 영양사 AI입니다.
환자의 회복 단계와 개인 선호도를 고려하여 하루 식단(아침, 점심, 저녁, 간식 2개)을 제안합니다.
</role>

<clinical_guidelines>
- 현재 회복 단계: liquid (유동식 단계 (수술 후 초기))
- 허용 음식: 맑은 국물, 미음, 주스(과육 제거), 젤리, 아이스크림(부드러운 것), 물, 차
- 금기 음식: 고형식, 딱딱한 음식, 섬유질 많은 채소, 견과류, 질긴 고기
- 음식 질감: 완전히 액체 상태이거나 매우 부드러운 반고체
- 주의사항: 씹지 않고 삼킬 수 있어야 함. 소화가 쉬워야 함.
</clinical_guidelines>

<instructions>
1. **JSON Key Constraint**: All keys in the JSON object MUST be in **ENGLISH**. (e.g., "name", "mealTime", "ingredients"). NOT Korean.
2. **Value Language**: properties values MUST be in **Korean**. (e.g., "name": "계란죽").
3. **Format**: Return ONLY a pure JSON ID Array. Do NOT wrap it in a root object like {"data": ...}.
4. **Safety**: Do not use forbidden ingredients.
5. **Menu**: Ensure meals are realistic and easy to prepare.
</instructions>

<language_rules>
1. **Primary Language**: All values and descriptions MUST be in **Korean (Hangul)**.
2. **Forbidden**: Do NOT use Japanese (Hiragana, Katakana, Kanji) or Chinese characters.
3. **Consistency**: Even if the input contains other languages, translate and output in Korean.
</language_rules>

<output_format>
Must be a valid JSON Array starting with '[' and ending with ']'.

Example:
[
  {
    "id": "generated-id-1",
    "name": "소고기 야채죽",
    "mealTime": "breakfast",
    "phase": "liquid",
    "ingredients": ["다진 소고기", "당근", "쌀"],
    "instructions": ["쌀을 불린다", "소고기를 볶는다", "물 넣고 끓인다"],
    "prepTime": 20,
    "portionSize": "1그릇",
    "nutrition": {
      "calories": 300,
      "protein": 15,
      "carbs": 40,
      "fat": 5
    },
    "notes": "따뜻하게 드세요."
  }
]
</output_format>
`

    const defaultUserPrompt = `
<patient_info>
- 수술 종류: 위 절제술
- 회복 단계: liquid
- 선호 음식: 단호박죽, 이온음료
- 기피 재료: 우유
</patient_info>

Generate 5 meals (Breakfast, Lunch, Dinner, 2 Snacks) as a strict JSON Array.
Use English Keys for JSON structure.
`

    const [currentPrompt, setCurrentPrompt] = useState(defaultSystemPrompt)
    const [userRequest, setUserRequest] = useState('')
    const [refinedPrompt, setRefinedPrompt] = useState('')
    const [testUserPrompt, setTestUserPrompt] = useState(defaultUserPrompt) // Patient Info
    const [executionResult, setExecutionResult] = useState<any>(null)

    const [isRefining, startRefining] = useTransition()
    const [isExecuting, startExecuting] = useTransition()

    const handleRefine = () => {
        if (!currentPrompt || !userRequest) return
        startRefining(async () => {
            const result = await refinePromptAction(currentPrompt, userRequest)
            if (result.success && result.refinedPrompt) {
                setRefinedPrompt(result.refinedPrompt)
            } else {
                alert('Refinement Failed: ' + result.error)
                alert('프롬프트 최적화에 실패했습니다: ' + result.error)
            }
        })
    }

    const handleExecute = (promptToExecute: string) => {
        if (!promptToExecute || !testUserPrompt) {
            alert('실행하려면 프롬프트와 사용자 데이터가 필요합니다')
            return
        }
        startExecuting(async () => {
            const result = await executePromptAction(promptToExecute, testUserPrompt)
            if (result.success) {
                setExecutionResult(result.result)
            } else {
                alert('실행에 실패했습니다: ' + result.error)
            }
        })
    }

    return (
        <div className="container mx-auto p-4 space-y-8">
            <h1 className="text-2xl font-bold mb-4">프롬프트 최적화 실험실 (Prompt Optimization Lab)</h1>

            {/* Optimization Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="font-semibold">현재 시스템 프롬프트 (Current System Prompt)</label>
                    <textarea
                        className="w-full h-64 p-2 border rounded font-mono text-sm"
                        value={currentPrompt}
                        onChange={(e) => setCurrentPrompt(e.target.value)}
                        placeholder="원본 프롬프트를 여기에 붙여넣으세요..."
                    />
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="font-semibold">개선 요청사항 (User Request)</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={userRequest}
                            onChange={(e) => setUserRequest(e.target.value)}
                            placeholder="예: JSON 형식만 출력하고 설명은 제거해줘 (Make it strictly output JSON...)"
                        />
                        <button
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            onClick={handleRefine}
                            disabled={isRefining || !currentPrompt || !userRequest}
                        >
                            {isRefining ? '최적화 중...' : '프롬프트 최적화 실행'}
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="font-semibold text-green-700">최적화된 시스템 프롬프트 (Refined)</label>
                        <textarea
                            className="w-full h-40 p-2 border rounded font-mono text-sm border-green-200 bg-green-50"
                            value={refinedPrompt}
                            onChange={(e) => setRefinedPrompt(e.target.value)}
                            placeholder="최적화된 프롬프트가 여기에 표시됩니다..."
                        />
                    </div>
                </div>
            </div>

            <hr className="border-t-2" />

            {/* Execution Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold">실행 테스트 (Test Execution)</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="font-semibold">테스트 사용자 데이터 (Patient Info)</label>
                        <textarea
                            className="w-full h-40 p-2 border rounded font-mono text-sm"
                            value={testUserPrompt}
                            onChange={(e) => setTestUserPrompt(e.target.value)}
                            placeholder="사용자 컨텍스트/데이터 프롬프트를 입력하세요..."
                        />
                        <div className="flex gap-2">
                            <button
                                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
                                onClick={() => handleExecute(currentPrompt)}
                                disabled={isExecuting || !currentPrompt}
                            >
                                원본 실행
                            </button>
                            <button
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                                onClick={() => handleExecute(refinedPrompt)}
                                disabled={isExecuting || !refinedPrompt}
                            >
                                최적화본 실행
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="font-semibold">실행 결과 (Execution Result)</label>
                        <div className="w-full h-96 p-2 border rounded font-mono text-xs bg-gray-50 overflow-auto whitespace-pre-wrap">
                            {executionResult ? JSON.stringify(executionResult, null, 2) : '결과가 여기에 표시됩니다...'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
