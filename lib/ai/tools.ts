import { ToolDefinition } from './types'
import { getWeeklyLogs } from '../services/log-service'
import { SURGERY_PROTOCOLS } from '../../data/protocols/surgery-protocols'

export const AI_TOOLS: ToolDefinition[] = [
    {
        type: 'function',
        function: {
            name: 'get_user_health_data',
            description: '사용자의 최근 건강 기록(통증, 소화 등 상관관계)을 조회합니다.',
            parameters: {
                type: 'object',
                properties: {
                    profileId: { type: 'string', description: '사용자 프로필 ID' },
                    startDate: { type: 'string', description: '시작 날짜 (YYYY-MM-DD)' },
                    endDate: { type: 'string', description: '종료 날짜 (YYYY-MM-DD)' }
                },
                required: ['profileId', 'startDate', 'endDate']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_recovery_protocol',
            description: '특정 수술에 대한 표준 회복 프로토콜 및 가이드라인을 조회합니다.',
            parameters: {
                type: 'object',
                properties: {
                    surgeryType: {
                        type: 'string',
                        description: '수술 종류',
                        enum: ['gastric_resection', 'colon_resection', 'tkr', 'spinal_fusion', 'cholecystectomy']
                    }
                },
                required: ['surgeryType']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_available_meals',
            description: '현재 회복 단계(phase)와 시간대(mealTime)에 적합한 추천 식단 목록을 조회합니다.',
            parameters: {
                type: 'object',
                properties: {
                    phase: {
                        type: 'string',
                        description: '회복 단계',
                        enum: ['liquid', 'pureed', 'soft', 'regular']
                    },
                    mealTime: {
                        type: 'string',
                        description: '식사 시간',
                        enum: ['breakfast', 'lunch', 'dinner', 'snack']
                    }
                },
                required: ['phase']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'analyze_meal_nutrition',
            description: '사용자가 먹은 음식의 설명이나 사진 묘사를 바탕으로 영양 성분(칼로리, 단백질 등)을 분석합니다.',
            parameters: {
                type: 'object',
                properties: {
                    description: { type: 'string', description: '음식에 대한 상세 설명 또는 묘사' }
                },
                required: ['description']
            }
        }
    }
]

export const TOOL_EXECUTORS = {
    get_user_health_data: async (args: any) => {
        const { profileId, startDate, endDate } = args
        const logs = await getWeeklyLogs(profileId, startDate, endDate)
        return JSON.stringify(logs)
    },
    get_recovery_protocol: async (args: any) => {
        const { surgeryType } = args
        const protocol = SURGERY_PROTOCOLS[surgeryType as keyof typeof SURGERY_PROTOCOLS]
        return JSON.stringify(protocol || { error: 'Protocol not found' })
    },
    get_available_meals: async (args: any) => {
        const { phase, mealTime } = args
        const { SAMPLE_MEALS } = await import('../../data/meals/sample-meals')
        const filtered = SAMPLE_MEALS.filter(m =>
            m.phase === phase && (!mealTime || m.mealTime === mealTime)
        )
        return JSON.stringify(filtered)
    },
    analyze_meal_nutrition: async (args: any) => {
        const { description } = args
        const { LLMService } = await import('./llm-service')

        // 영양 분석을 위해 별도의 LLM 호출 수행 (JSON 모드)
        const client = LLMService.getClient()
        const response = await client.chat({
            messages: [
                { role: 'system', content: '입력된 음식 설명을 바탕으로 영양 성분을 JSON 형식으로 추정하여 반환하세요. (calories, protein, fat, carbs)' },
                { role: 'user', content: description }
            ],
            jsonMode: true
        })
        return response.content
    }
}
