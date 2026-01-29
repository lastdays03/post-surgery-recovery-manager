export interface WeeklySummary {
    overallStatus: '안정' | '주의' | '관찰 필요';
    keyPoints: string[]; // 2-3줄 핵심 요약
}

export interface MealIntakeAnalysis {
    averageLevel: string; // "평균 62%"
    trendChange: string; // "전주 대비 +12%"
    interpretation: string; // 회복 관점 해석
}

export interface DigestiveAnalysis {
    commonSymptoms: string[]; // 자주 나타난 증상들
    correlationWithMeal: string; // 식사와의 연관성
    assessment: '정상 회복 범위' | '주의 필요' | '관리 조정 필요';
    details: string;
}

export interface PainRecoveryAnalysis {
    painTrend: string; // 통증 흐름
    energyTrend: string; // 기력 흐름
    topObstacle: string; // 가장 방해한 요인
    isTemporary: boolean; // 일시적 현상 여부
    recommendation: string;
}

export interface AbnormalSignals {
    hasWarning: boolean;
    signals: {
        type: string; // "변비 지속", "설사 반복", "고열"
        description: string;
        action: string; // 권장 조치
    }[];
    requiresMedicalConsultation: boolean;
    urgencyLevel: 'none' | 'monitor' | 'consult_soon' | 'urgent';
}

export interface DietEvaluation {
    appropriatenessScore: number; // 0-100
    currentStage: string;
    decision: '유지' | '조정' | '단계 변경';
    reason: string; // 환자 기준 언어로 설명
}

export interface NextWeekPlan {
    dietDirection: '유지' | '완화' | '강화';
    keyPoints: string[]; // 3가지 핵심 포인트
}

export interface WeeklyAnalysisResult {
    id?: string;
    profile_id: string;
    week_start: string; // YYYY-MM-DD
    week_end: string; // YYYY-MM-DD
    summary: WeeklySummary;
    mealIntake: MealIntakeAnalysis;
    digestive: DigestiveAnalysis;
    painRecovery: PainRecoveryAnalysis;
    abnormalSignals: AbnormalSignals;
    dietEvaluation: DietEvaluation;
    nextWeekPlan: NextWeekPlan;
    created_at?: string;
    updated_at?: string;
}
