import { SURGERY_PROTOCOLS } from '@/data/protocols/surgery-protocols'
import type { UserProfile } from '@/lib/types/user.types'
import type { RecoveryPhase, SurgeryType } from '@/lib/types/protocol.types'
import { normalizeSurgeryType } from '@/lib/utils/surgery-mapper'

export function calculateRecoveryPhase(profile: UserProfile): RecoveryPhase {
    // 한글 수술명을 영어 키로 정규화
    const normalizedType = normalizeSurgeryType(profile.surgery_type)
    let protocol = SURGERY_PROTOCOLS[normalizedType as SurgeryType]

    if (!protocol) {
        console.warn(`Unknown surgery type: ${profile.surgery_type}. Using GENERAL protocol.`)
        protocol = SURGERY_PROTOCOLS['general']
    }

    const today = new Date()
    const surgeryDate = new Date(profile.surgery_date)

    // 수술 당일을 0일차로 계산
    const diffTime = Math.abs(today.getTime() - surgeryDate.getTime())
    const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // 해당하는 Phase 찾기
    // daysRange: [start, end] (inclusive)
    const currentPhase = protocol.phases.find(phase =>
        daysElapsed >= phase.daysRange[0] && daysElapsed <= phase.daysRange[1]
    )

    // 만약 범위를 벗어났다면 마지막 단계로 간주 (또는 회복 완료 등 처리)
    if (!currentPhase) {
        // 모든 단계가 끝났으면 마지막 단계 리턴? 일단 마지막 단계 리턴
        return protocol.phases[protocol.phases.length - 1]
    }

    return currentPhase
}

export function getDaysSinceSurgery(surgeryDate: Date | string): number {
    const today = new Date()
    const date = new Date(surgeryDate)
    const diffTime = Math.abs(today.getTime() - date.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

export interface PersonalizedAdvice {
    type: 'warning' | 'info' | 'success'
    message: string
    category: 'nutrition' | 'activity' | 'symptom'
}

export function getPersonalizedAdvice(profile: UserProfile): PersonalizedAdvice[] {
    const adviceList: PersonalizedAdvice[] = []
    const metrics = profile.advanced_metrics

    if (!metrics) return adviceList

    // 1. 영양 위험도 (NRS-2002)
    if (metrics.nrs_2002_score && metrics.nrs_2002_score >= 3) {
        adviceList.push({
            type: 'warning',
            category: 'nutrition',
            message: '영양 위험군에 해당합니다. 고단백, 고열량 식단을 신경 써주세요.'
        })
    }

    // 2. 혈청 알부민 (단백질 결핍)
    if (metrics.serum_albumin && metrics.serum_albumin < 35) { // 기준 3.5g/dL = 35g/L
        adviceList.push({
            type: 'warning',
            category: 'nutrition',
            message: '단백질 수치가 낮습니다. 매끼 단백질 반찬(계란, 두부, 생선)을 챙겨 드세요.'
        })
    }

    // 3. 섭취율 저조
    if (metrics.intake_rate && metrics.intake_rate < 60) {
        adviceList.push({
            type: 'warning',
            category: 'nutrition',
            message: '섭취량이 부족합니다. 식사가 힘들다면 영양 보충 음료(뉴케어 등)를 활용하세요.'
        })
    }

    // 4. 위배출 지연
    if (metrics.gastric_emptying_delayed) {
        adviceList.push({
            type: 'info',
            category: 'nutrition',
            message: '위 배출이 느립니다. 식사를 소량씩 5-6회로 나누어 천천히 드세요.'
        })
    }

    // 5. 역류성 식도염 (GERD)
    if (metrics.has_gerd) {
        adviceList.push({
            type: 'warning',
            category: 'symptom',
            message: '역류 증상 예방을 위해 식사 후 30분 동안 눕지 말고 가볍게 산책하세요.'
        })
    }

    // 6. 근감소증
    if (metrics.has_sarcopenia) {
        adviceList.push({
            type: 'warning',
            category: 'activity',
            message: '근육량 유지가 중요합니다. 무리하지 않는 선에서 가벼운 걷기 운동을 꾸준히 하세요.'
        })
    }

    // 7. 체중 감소
    if (metrics.weight_change_6m && metrics.weight_change_6m <= -5) {
        adviceList.push({
            type: 'warning',
            category: 'nutrition',
            message: '최근 체중 감소가 큽니다. 체중 유지를 위해 간식을 하루 2회 이상 챙겨 드세요.'
        })
    }

    return adviceList
}
