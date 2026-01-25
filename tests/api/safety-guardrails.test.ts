import { describe, it, expect } from 'vitest'
import { validateInput, validateResponse } from '@/lib/ai/safety-guardrails'

describe('Safety Guardrails', () => {
    describe('validateInput', () => {
        it('응급 키워드 감지 시 경고를 반환해야 함', () => {
            const result = validateInput('갑자기 출혈이 심해요')
            expect(result.isValid).toBe(true)
            expect(result.requiresEmergencyWarning).toBe(true)
            expect(result.warning).toContain('응급')
        })

        it('정상 입력은 통과해야 함', () => {
            const result = validateInput('오늘 식단 추천해주세요')
            expect(result.isValid).toBe(true)
            expect(result.requiresEmergencyWarning).toBeFalsy()
        })

        it('빈 메시지는 거부해야 함', () => {
            const result = validateInput('')
            expect(result.isValid).toBe(false)
            expect(result.error).toBeDefined()
        })
    })

    describe('validateResponse', () => {
        it('응급 상황인데 병원 안내가 없으면 위반으로 감지해야 함', () => {
            const result = validateResponse(
                '통증이 있으시면 휴식을 취하세요.',
                '갑자기 가슴통증이 심해요'
            )
            expect(result.isSafe).toBe(false)
            expect(result.emergencyDetected).toBe(true)
            expect(result.violations.length).toBeGreaterThan(0)
        })

        it('금기사항을 허용하는 답변은 위반으로 감지해야 함', () => {
            const result = validateResponse(
                '술 한 잔 정도는 괜찮습니다.',
                '수술 후 언제부터 술 마셔도 되나요?'
            )
            expect(result.isSafe).toBe(false)
            expect(result.violations).toContain('수술 후 금기사항을 허용하는 위험한 조언이 포함되어 있습니다.')
        })

        it('진단을 제공하는 답변은 위반으로 감지해야 함', () => {
            const result = validateResponse(
                '당신은 감염 증상이 있습니다.',
                '열이 나는데 괜찮을까요?'
            )
            expect(result.isSafe).toBe(false)
            expect(result.violations.length).toBeGreaterThan(0)
        })

        it('안전한 답변은 통과해야 함', () => {
            const result = validateResponse(
                '통증이 심하시면 담당 의료진께 연락하시는 것이 좋습니다.',
                '통증이 있어요'
            )
            expect(result.isSafe).toBe(true)
            expect(result.violations.length).toBe(0)
        })

        it('응급 상황에 적절한 안내가 있으면 통과해야 함', () => {
            const result = validateResponse(
                '출혈이 있으시다면 즉시 119에 연락하거나 응급실을 방문하세요.',
                '갑자기 출혈이 생겼어요'
            )
            expect(result.isSafe).toBe(true)
        })
    })
})
