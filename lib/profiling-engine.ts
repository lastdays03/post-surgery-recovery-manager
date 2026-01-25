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
