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
    tha: {
        phases: [
            {
                name: 'recovery_early',
                daysRange: [0, 7],
                description: '초기 회복 및 통증 관리',
                forbiddenFoods: [],
                guidelines: ['탈수 방지', '변비 예방을 위한 섬유질 섭취']
            },
            {
                name: 'mobility',
                daysRange: [14, 42],
                description: '이동성 향상 및 일상 복귀',
                forbiddenFoods: []
            }
        ],
        nutritionRequirements: {
            proteinMultiplier: 1.2,
            calorieTarget: 2000
        },
        rehabPhases: [
            {
                name: 'immediate',
                weekRange: [0, 2],
                description: '수술 직후 - 혈전 예방',
                allowedExercises: ['ankle_pump', 'walking_with_walker'],
                warnings: ['다리 꼬기 금지', '90도 이상 굽히기 금지']
            },
            {
                name: 'strengthening',
                weekRange: [2, 12],
                description: '보행 및 가동범위 향상',
                allowedExercises: ['walking', 'stationary_bike']
            }
        ]
    },
    acl_reconstruction: {
        phases: [
            {
                name: 'normal',
                daysRange: [0, 180],
                description: '근손실 방지 고단백 식단',
                forbiddenFoods: []
            }
        ],
        nutritionRequirements: {
            proteinMultiplier: 1.5,
            calorieTarget: 2200
        },
        rehabPhases: [
            {
                name: 'immediate',
                weekRange: [0, 2],
                description: '보호기 - 부종 감소 및 신전 확보',
                allowedExercises: ['ankle_pump', 'quad_setting', 'patellar_mobilization'],
                warnings: ['무릎 아래 수건 받치기 금지(신전 방해)', '능동적 펴기 주의']
            },
            {
                name: 'intermediate',
                weekRange: [3, 5],
                description: '회복기 - 정상 보행',
                allowedExercises: ['stationary_bicycle', 'wall_slide', 'mini_squat', 'step_up']
            },
            {
                name: 'late',
                weekRange: [6, 24],
                description: '강화기 - 근력 강화',
                allowedExercises: ['elliptical', 'leg_press', 'squat_to_chair']
            }
        ]
    },
    esophagectomy: {
        phases: [
            {
                name: 'npo_to_liquid',
                daysRange: [0, 7],
                description: '금식 후 신중한 수분 섭취',
                forbiddenFoods: ['고형식', '자극성']
            },
            {
                name: 'soft_small',
                daysRange: [8, 30],
                description: '소량씩 자주 섭취 (덤핑 예방)',
                forbiddenFoods: ['고당분', '탄산', '질긴고기'],
                guidelines: ['식사 중 물 섭취 제한', '하루 6회 식사']
            },
            {
                name: 'recovery',
                daysRange: [31, 90],
                description: '체중 감소 방지 고열량식',
                forbiddenFoods: ['가스유발식품']
            }
        ],
        nutritionRequirements: {
            proteinMultiplier: 1.5,
            calorieTarget: 2500,
            supplements: ['enteral_nutrition_drink']
        }
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
    spinal_surgery: {
        phases: [
            {
                name: 'normal',
                daysRange: [0, 90],
                description: '칼슘 및 단백질 강화 식단',
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
                weekRange: [0, 4],
                description: '보호기 - 상처 치유 및 유착 방지',
                allowedExercises: ['walking_30min', 'light_stretching'],
                warnings: ['허리 구부리기 금지', '비틀기 금지', '보조기 착용']
            },
            {
                name: 'recovery',
                weekRange: [4, 8],
                description: '회복기 - 가동범위 회복',
                allowedExercises: ['stair_climbing', 'core_breathing']
            },
            {
                name: 'resistance',
                weekRange: [8, 24],
                description: '저항운동기 - 코어 강화',
                allowedExercises: ['plank', 'bridge', 'crunch'],
                warnings: ['골프/테니스 등 비트는 운동은 3개월 후부터']
            }
        ]
    },
    smile_lasik: {
        phases: [
            {
                name: 'normal',
                daysRange: [0, 30],
                description: '눈 건강 비타민A/C 섭취',
                forbiddenFoods: ['음주']
            }
        ],
        nutritionRequirements: {
            proteinMultiplier: 1.0,
            calorieTarget: 2000
        },
        rehabPhases: [
            {
                name: 'rest',
                weekRange: [0, 1],
                description: '안정기 - 땀나는 운동 금지',
                allowedExercises: ['walking_light'],
                warnings: ['눈 비비기 금지', '격렬한 운동 금지']
            },
            {
                name: 'recovery',
                weekRange: [1, 4],
                description: '회복기 - 가벼운 운동 가능',
                allowedExercises: ['jogging', 'gym_light'],
                warnings: ['수영은 1개월 후부터']
            }
        ]
    },
    rotator_cuff: {
        phases: [
            {
                name: 'normal',
                daysRange: [0, 90],
                description: '일반식',
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
                description: '보호기 - 보조기 착용',
                allowedExercises: ['pendulum', 'elbow_rom'],
                warnings: ['어깨 능동적 사용 금지']
            },
            {
                name: 'active_motion',
                weekRange: [6, 12],
                description: '능동적 관절 운동',
                allowedExercises: ['active_assistance_rom']
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
