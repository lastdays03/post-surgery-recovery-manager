import { describe, it, expect } from 'vitest'
import { normalizeSurgeryType } from '@/lib/utils/surgery-mapper'

describe('Surgery Name Mapper', () => {
    it('한글 수술명을 영어 키로 변환해야 함', () => {
        expect(normalizeSurgeryType('대장절제술')).toBe('colon_resection')
        expect(normalizeSurgeryType('위절제술')).toBe('gastric_resection')
        expect(normalizeSurgeryType('무릎수술')).toBe('tkr')
        expect(normalizeSurgeryType('척추유합술')).toBe('spinal_fusion')
        expect(normalizeSurgeryType('담낭절제술')).toBe('cholecystectomy')
    })

    it('이미 영어 키인 경우 그대로 반환해야 함', () => {
        expect(normalizeSurgeryType('colon_resection')).toBe('colon_resection')
        expect(normalizeSurgeryType('gastric_resection')).toBe('gastric_resection')
    })

    it('매핑되지 않은 수술명은 원본 그대로 반환해야 함', () => {
        expect(normalizeSurgeryType('심장수술')).toBe('심장수술')
        expect(normalizeSurgeryType('간이식')).toBe('간이식')
    })
})
