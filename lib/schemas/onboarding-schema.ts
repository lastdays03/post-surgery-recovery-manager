import { z } from 'zod'

// Step 1: 수술 정보 스키마
export const surgeryInfoSchema = z.object({
    surgery_type: z.enum([
        'gastric_resection',
        'colon_resection',
        'tkr',
        'spinal_fusion',
        'cholecystectomy'
    ] as const, '수술 종류를 선택해주세요'),
    surgery_date: z.string().min(1, '수술 날짜를 입력해주세요')
        .refine((date) => {
            const surgeryDate = new Date(date)
            const today = new Date()
            return surgeryDate <= today
        }, {
            message: '미래의 날짜는 선택할 수 없습니다'
        })
        .refine((date) => {
            const surgeryDate = new Date(date)
            const today = new Date()
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(today.getMonth() - 36)
            return surgeryDate >= sixMonthsAgo
        }, {
            message: '최근 3년 이내의 수술만 관리 가능합니다'
        })
})

// Step 2: 개인 정보 스키마
export const personalInfoSchema = z.object({
    age: z.number({ message: '올바른 숫자를 입력해주세요' })
        .min(18, '만 18세 이상만 사용 가능합니다')
        .max(100, '올바른 나이를 입력해주세요')
        .optional(),
    weight: z.number({ message: '올바른 숫자를 입력해주세요' })
        .min(30, '올바른 체중을 입력해주세요')
        .max(200, '올바른 체중을 입력해주세요')
        .optional(),
    height: z.number({ message: '올바른 숫자를 입력해주세요' })
        .min(100, '올바른 키를 입력해주세요')
        .max(250, '올바른 키를 입력해주세요')
        .optional()
})

// Step 3: 건강 상태 스키마
export const healthStatusSchema = z.object({
    digestive_capacity: z.enum(['good', 'moderate', 'poor'] as const, '현재 소화 상태를 선택해주세요'),
    comorbidities: z.array(z.string())
})

export type SurgeryInfoInput = z.infer<typeof surgeryInfoSchema>
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>
export type HealthStatusInput = z.infer<typeof healthStatusSchema>
