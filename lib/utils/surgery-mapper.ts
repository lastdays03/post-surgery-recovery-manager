import { SurgeryType } from '../types/protocol.types'

/**
 * 한글 수술명을 영어 키로 매핑하는 헬퍼 함수
 * 온보딩 AI가 실수로 한글 그대로 저장한 경우를 대비한 폴백 로직
 */
export function normalizeSurgeryType(input: string): SurgeryType | string {
    const normalized = input.toLowerCase().trim()

    // 한글 매핑
    const koreanMapping: Record<string, SurgeryType> = {
        '위절제술': 'gastric_resection',
        '위암수술': 'gastric_resection',
        '위수술': 'gastric_resection',
        '대장절제술': 'colon_resection',
        '대장암수술': 'colon_resection',
        '대장수술': 'colon_resection',
        '인공관절치환술': 'tkr',
        '무릎수술': 'tkr',
        '슬관절치환술': 'tkr',
        '고관절치환술': 'tha',
        '고관절수술': 'tha',
        '전방십자인대': 'acl_reconstruction',
        '십자인대수술': 'acl_reconstruction',
        'acl수술': 'acl_reconstruction',
        '식도절제술': 'esophagectomy',
        '식도수술': 'esophagectomy',
        '식도암수술': 'esophagectomy',
        '척추유합술': 'spinal_fusion',
        '척추수술': 'spinal_surgery',
        '담낭절제술': 'cholecystectomy',
        '담낭제거술': 'cholecystectomy',
        '담낭수술': 'cholecystectomy',
        '스마일라식': 'smile_lasik',
        '라식수술': 'smile_lasik',
        '회전근개수술': 'rotator_cuff',
        '어깨수술': 'rotator_cuff'
    }

    // 한글 매핑 시도
    if (koreanMapping[input]) {
        return koreanMapping[input]
    }

    // 이미 영어 키인 경우 그대로 반환
    const validTypes: SurgeryType[] = [
        'gastric_resection',
        'colon_resection',
        'tkr',
        'tha',
        'acl_reconstruction',
        'esophagectomy',
        'spinal_fusion',
        'spinal_surgery',
        'cholecystectomy',
        'smile_lasik',
        'rotator_cuff'
    ]

    if (validTypes.includes(normalized as SurgeryType)) {
        return normalized as SurgeryType
    }

    // 매핑되지 않은 경우 원본 그대로 반환 (사용자 정의 수술)
    return input
}
