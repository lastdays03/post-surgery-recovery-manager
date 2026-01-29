import { DailyLogEntry } from '@/lib/types/symptom.types';

export const SYSTEM_PROMPT = `너는 수술 후 환자의 회복 데이터를 분석하는 임상 영양 기반 디지털 회복 매니저다.

너의 역할은:
- 환자의 데일리 체크 데이터를 단순 요약하지 않고
- 회복의 패턴, 위험 신호, 정상 범위를 구분하며
- 다음 주 식단 및 관리 방향을 제안하는 것이다.

의학적 진단은 하지 않되, 의학적으로 합리적인 해석과 환자·보호자가 이해할 수 있는 언어로 설명해야 한다.

분석의 기준:
- 조기 경구 섭취와 단계적 식단 진행 원칙
- 단백질 충분 공급
- 소화기 증상과 식사 섭취의 상관 관계
- 회복을 방해하는 요인 식별
- 위험 신호는 과장 없이 명확히 표현

반드시 JSON 형식으로 응답해야 하며, 다음 스키마를 정확히 따라야 한다.`;

export const JSON_SCHEMA = {
    type: "object",
    properties: {
        summary: {
            type: "object",
            properties: {
                overallStatus: {
                    type: "string",
                    enum: ["안정", "주의", "관찰 필요"]
                },
                keyPoints: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 2,
                    maxItems: 3
                }
            },
            required: ["overallStatus", "keyPoints"]
        },
        mealIntake: {
            type: "object",
            properties: {
                averageLevel: { type: "string" },
                trendChange: { type: "string" },
                interpretation: { type: "string" }
            },
            required: ["averageLevel", "trendChange", "interpretation"]
        },
        digestive: {
            type: "object",
            properties: {
                commonSymptoms: { type: "array", items: { type: "string" } },
                correlationWithMeal: { type: "string" },
                assessment: {
                    type: "string",
                    enum: ["정상 회복 범위", "주의 필요", "관리 조정 필요"]
                },
                details: { type: "string" }
            },
            required: ["commonSymptoms", "correlationWithMeal", "assessment", "details"]
        },
        painRecovery: {
            type: "object",
            properties: {
                painTrend: { type: "string" },
                energyTrend: { type: "string" },
                topObstacle: { type: "string" },
                isTemporary: { type: "boolean" },
                recommendation: { type: "string" }
            },
            required: ["painTrend", "energyTrend", "topObstacle", "isTemporary", "recommendation"]
        },
        abnormalSignals: {
            type: "object",
            properties: {
                hasWarning: { type: "boolean" },
                signals: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            type: { type: "string" },
                            description: { type: "string" },
                            action: { type: "string" }
                        },
                        required: ["type", "description", "action"]
                    }
                },
                requiresMedicalConsultation: { type: "boolean" },
                urgencyLevel: {
                    type: "string",
                    enum: ["none", "monitor", "consult_soon", "urgent"]
                }
            },
            required: ["hasWarning", "signals", "requiresMedicalConsultation", "urgencyLevel"]
        },
        dietEvaluation: {
            type: "object",
            properties: {
                appropriatenessScore: { type: "number", minimum: 0, maximum: 100 },
                currentStage: { type: "string" },
                decision: {
                    type: "string",
                    enum: ["유지", "조정", "단계 변경"]
                },
                reason: { type: "string" }
            },
            required: ["appropriatenessScore", "currentStage", "decision", "reason"]
        },
        nextWeekPlan: {
            type: "object",
            properties: {
                dietDirection: {
                    type: "string",
                    enum: ["유지", "완화", "강화"]
                },
                keyPoints: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 3,
                    maxItems: 3
                }
            },
            required: ["dietDirection", "keyPoints"]
        }
    },
    required: [
        "summary",
        "mealIntake",
        "digestive",
        "painRecovery",
        "abnormalSignals",
        "dietEvaluation",
        "nextWeekPlan"
    ]
};

export function buildUserPrompt(logs: DailyLogEntry[]): string {
    if (logs.length === 0) {
        return "주간 데이터가 없습니다.";
    }

    // 로그 데이터를 읽기 쉬운 텍스트로 변환
    const logsSummary = logs.map(log => {
        const s = log.symptoms;
        return `
날짜: ${log.log_date}
- 통증 수준: ${s.painLevel}/10
- 기력 수준: ${s.energyLevel}/10
- 식사 섭취율: ${s.mealIntake || 'N/A'}
- 식사 후 증상: ${s.postMealSymptom || 'N/A'}
- 체온 상태: ${s.bodyTemperature || 'N/A'}
- 배변 상태: ${s.bowelStatus || 'N/A'}
- 가장 힘들었던 점: ${s.mostDifficult || 'N/A'}
- 특이 증상: ${s.abnormalSymptoms?.join(', ') || '없음'}
    `.trim();
    }).join('\n\n');

    return `다음은 환자의 지난 주 (월요일~일요일) 일일 체크 데이터입니다.

${logsSummary}

위 데이터를 바탕으로 7개 섹션의 주간 분석 리포트를 JSON 형식으로 생성해주세요.`;
}
