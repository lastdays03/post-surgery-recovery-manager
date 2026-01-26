export interface ValidationResult {
    isValid: boolean
    error?: string
    warning?: string
    requiresEmergencyWarning?: boolean
}

export interface SafetyCheckResult {
    isSafe: boolean
    violations: string[]
    emergencyDetected: boolean
    recommendation?: string
}

const PII_PATTERNS = {
    PHONE: /(01[016789]-?\d{3,4}-?\d{4})/,
    RRN: /\d{6}-?[1-4]\d{6}/
}

// 응급 상황 키워드 (Emergency Keywords)
const EMERGENCY_KEYWORDS = [
    '출혈', '피가', '호흡곤란', '숨', '가슴통증', '흉통',
    '의식', '어지러움', '실신', '고열', '39도', '40도',
    '심한통증', '극심한', '참을수없', '응급'
]

// 수술 후 절대 금기사항 키워드 (Contraindications)
const CONTRAINDICATION_KEYWORDS = [
    '음주', '술', '담배', '흡연', '격렬한운동', '무거운것',
    '사우나', '찜질방', '수영', '목욕'
]

export function validateInput(message: string): ValidationResult {
    if (!message || message.trim().length === 0) {
        return { isValid: false, error: '메시지를 입력해주세요.' }
    }

    if (message.length > 500) {
        return { isValid: false, error: '메시지는 500자를 초과할 수 없습니다.' }
    }

    // PII Warning
    if (PII_PATTERNS.PHONE.test(message) || PII_PATTERNS.RRN.test(message)) {
        return { isValid: true, warning: '개인정보(전화번호, 주민번호 등)가 포함된 것 같습니다. 주의해주세요.' }
    }

    // Emergency Detection
    const hasEmergency = EMERGENCY_KEYWORDS.some(keyword =>
        message.includes(keyword)
    )

    if (hasEmergency) {
        return {
            isValid: true,
            requiresEmergencyWarning: true,
            warning: '응급 상황으로 보입니다. 즉시 119에 연락하거나 가까운 응급실을 방문하세요.'
        }
    }

    return { isValid: true }
}

/**
 * AI 답변에 대한 사후 안전성 검증
 * @param response - AI가 생성한 답변
 * @param userQuery - 사용자 질문
 */
export function validateResponse(response: string, userQuery: string): SafetyCheckResult {
    const violations: string[] = []
    let emergencyDetected = false

    // 1. 응급 상황인데 병원 방문을 권장하지 않은 경우
    const hasEmergencyInQuery = EMERGENCY_KEYWORDS.some(k => userQuery.includes(k))
    const hasEmergencyGuidance = response.includes('응급실') || response.includes('119') || response.includes('병원')

    if (hasEmergencyInQuery && !hasEmergencyGuidance) {
        violations.push('응급 상황에 대한 적절한 대응 지침이 누락되었습니다.')
        emergencyDetected = true
    }

    // 2. 금기사항을 허용하는 답변 감지
    const hasDangerousAdvice = CONTRAINDICATION_KEYWORDS.some(keyword => {
        const pattern = new RegExp(`${keyword}.*?(괜찮|가능|해도|좋|권장)`, 'i')
        return pattern.test(response)
    })

    if (hasDangerousAdvice) {
        violations.push('수술 후 금기사항을 허용하는 위험한 조언이 포함되어 있습니다.')
    }

    // 3. 진단이나 처방을 제공하는 경우
    const diagnosisPatterns = [
        /당신은.*?(병|질환|증상).*?입니다/,
        /(병|질환|증상).*?있습니다/,
        /이.*?약.*?(복용|드세요|먹으세요)/,
        /처방.*?(드리|해드)/
    ]

    const hasDiagnosis = diagnosisPatterns.some(pattern => pattern.test(response))
    if (hasDiagnosis) {
        violations.push('의학적 진단이나 처방을 제공하려는 시도가 감지되었습니다.')
    }

    const isSafe = violations.length === 0

    return {
        isSafe,
        violations,
        emergencyDetected,
        recommendation: !isSafe
            ? '안전하지 않은 답변이 감지되었습니다. 의료진과 상담하세요.'
            : undefined
    }
}

export const SYSTEM_PROMPT_SAFETY_INSTRUCTION = `
You are a 'Post-Surgery Recovery Assistant' AI specialized in Korean healthcare context.
Your goal is to provide helpful, safe, and accurate information based on the provided context.

🚨 CRITICAL LANGUAGE RULES (언어 규칙):
1. **KOREAN ONLY**: All responses MUST be in **Korean (한글)**.
2. **NO JAPANESE/CHINESE**: 절대로 일본어(히라가나, 가타카나, 한자)나 중국어를 사용하지 마세요.
3. **Terminology**: Medical terms can be in English if necessary, but explanations must be in Korean.

🚨 CRITICAL SAFETY RULES (절대 준수):
1. **NO DIAGNOSIS OR PRESCRIPTION**: 절대로 진단하거나 약을 처방하지 마세요. 항상 "의료진과 상담하세요"라고 안내하세요.
2. **EMERGENCY PROTOCOL**: 출혈, 호흡곤란, 흉통, 고열(39도 이상) 등 응급 증상이 언급되면 반드시 "즉시 119에 연락하거나 응급실을 방문하세요"라고 답변하세요.
3. **CONTRAINDICATIONS**: 수술 후 금기사항(음주, 흡연, 격렬한 운동, 사우나 등)을 절대 허용하지 마세요.
4. **CONTEXT ADHERENCE**: 제공된 컨텍스트(RAG)에 없는 내용은 "죄송합니다, 해당 내용은 제가 알기 어렵습니다. 의료진과 상담해주세요"라고 답변하세요.
5. **NO PII EXPOSURE**: 사용자 개인정보가 컨텍스트에 있어도 절대 노출하지 마세요.
`
