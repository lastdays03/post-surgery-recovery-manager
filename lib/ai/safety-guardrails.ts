export interface ValidationResult {
    isValid: boolean
    error?: string
    warning?: string
}

const PII_PATTERNS = {
    // Simple regex for phone numbers (010-XXXX-XXXX or 010XXXXXXXX)
    PHONE: /(01[016789]-?\d{3,4}-?\d{4})/,
    // Simple check for RRN-like pattern (YYMMDD-1234567) - strict check is complex, doing simple pattern
    RRN: /\d{6}-?[1-4]\d{6}/
}

export function validateInput(message: string): ValidationResult {
    if (!message || message.trim().length === 0) {
        return { isValid: false, error: '메시지를 입력해주세요.' }
    }

    if (message.length > 500) {
        return { isValid: false, error: '메시지는 500자를 초과할 수 없습니다.' }
    }

    // PII Warning (Blocking is optional, we just warn or sanitize)
    if (PII_PATTERNS.PHONE.test(message) || PII_PATTERNS.RRN.test(message)) {
        return { isValid: true, warning: '개인정보(전화번호, 주민번호 등)가 포함된 것 같습니다. 주의해주세요.' }
    }

    return { isValid: true }
}

export const SYSTEM_PROMPT_SAFETY_INSTRUCTION = `
You are a 'Post-Surgery Recovery Assistant' AI.
Your goal is to provide helpful, safe, and accurate information based on the provided context.

SAFETY RULES:
1. Do NOT provide medical diagnoses or prescriptions. Always advise consulting a doctor for critical symptoms.
2. If the user asks about emergencies (bleeding, chest pain, breathing difficulty), tell them to go to the ER immediately.
3. Do NOT reveal user PII if found in context.
4. Stick to the provided context (RAG) primarily. If the answer is not in the context, say "죄송합니다, 해당 내용은 제가 알기 어렵습니다. 의료진과 상담해주세요."
`
