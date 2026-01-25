import type { SurgeryProtocol, SurgeryType } from '@/lib/types/protocol.types'

export const SURGERY_PROTOCOLS: Record<SurgeryType, SurgeryProtocol> = {
    gastric_resection: {
        phases: [
            {
                name: 'liquid',
                daysRange: [0, 3],
                description: '미음/맑은 유동식',
                forbiddenFoods: ['고섬유질', '고지방', '자극성']
            },
            {
                name: 'soft',
                daysRange: [4, 14],
                description: '죽/부드러운 연식',
                forbiddenFoods: ['고섬유질', '고지방']
            },
            {
                name: 'normal',
                daysRange: [15, 60],
                description: '일반식 점진 전환',
                forbiddenFoods: ['고지방', '매운음식']
            }
        ],
        nutritionRequirements: {
            proteinMultiplier: 1.2,
            calorieTarget: 1800
        }
    },
    colon_resection: {
        phases: [
            {
                name: 'liquid',
                daysRange: [0, 5],
                description: '맑은 유동식',
                forbiddenFoods: ['고섬유질', '유제품', '자극성']
            },
            {
                name: 'soft',
                daysRange: [6, 21],
                description: '저잔사 연식',
                forbiddenFoods: ['고섬유질', '씨앗류']
            },
            {
                name: 'normal',
                daysRange: [22, 90],
                description: '정상식 복귀',
                forbiddenFoods: []
            }
        ],
        nutritionRequirements: {
            proteinMultiplier: 1.0,
            calorieTarget: 2000
        }
    },
    tkr: {
        phases: [
            {
                name: 'normal',
                daysRange: [0, 90],
                description: '정상 식단 + 고단백',
                forbiddenFoods: []
            }
        ],
        nutritionRequirements: {
            proteinMultiplier: 1.5,
            calorieTarget: 2200
        },
        rehabPhases: [
            {
                name: 'protection',
                weekRange: [0, 2],
                description: '보호기 - 침상 운동',
                allowedExercises: ['ankle_pump', 'quad_setting', 'heel_slide']
            },
            {
                name: 'recovery',
                weekRange: [2, 6],
                description: '회복기 - 보행 및 가동범위',
                allowedExercises: ['ankle_pump', 'quad_setting', 'heel_slide', 'slr', 'standing', 'walking']
            },
            {
                name: 'strengthening',
                weekRange: [6, 12],
                description: '강화기 - 근력 강화',
                allowedExercises: ['all_previous', 'stairs', 'mini_squat', 'resistance_band']
            }
        ]
    },
    spinal_fusion: {
        phases: [
            {
                name: 'normal',
                daysRange: [0, 90],
                description: '정상 식단',
                forbiddenFoods: []
            }
        ],
        nutritionRequirements: {
            proteinMultiplier: 1.2,
            calorieTarget: 2000
        },
        rehabPhases: [
            {
                name: 'protection',
                weekRange: [0, 6],
                description: '보호기 - 안정',
                allowedExercises: ['walking', 'ankle_pump'],
                warnings: ['허리 비틀기 금지', '무거운 물건 들기 금지']
            },
            {
                name: 'recovery',
                weekRange: [6, 12],
                description: '회복기 - 경미한 활동',
                allowedExercises: ['walking', 'core_stabilization', 'stretching']
            }
        ]
    },
    cholecystectomy: {
        phases: [
            {
                name: 'liquid',
                daysRange: [0, 1],
                description: '맑은 유동식',
                forbiddenFoods: ['지방', '기름진음식']
            },
            {
                name: 'soft',
                daysRange: [2, 7],
                description: '저지방 연식',
                forbiddenFoods: ['고지방', '튀김', '기름진음식']
            },
            {
                name: 'normal',
                daysRange: [8, 30],
                description: '저지방 일반식',
                forbiddenFoods: ['고지방']
            }
        ],
        nutritionRequirements: {
            proteinMultiplier: 1.0,
            calorieTarget: 1800,
            maxFatPerMeal: 10
        }
    },
    general: {
        phases: [
            {
                name: 'recovery',
                daysRange: [0, 14],
                description: '회복기 - 고단백 및 소화가 잘 되는 식단',
                forbiddenFoods: ['자극성', '기름진음식']
            },
            {
                name: 'normal',
                daysRange: [15, 60],
                description: '일반식 - 균형 잡힌 영양 섭취',
                forbiddenFoods: []
            }
        ],
        nutritionRequirements: {
            proteinMultiplier: 1.2,
            calorieTarget: 2000
        }
    }
}
