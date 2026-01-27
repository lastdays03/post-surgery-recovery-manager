'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { v4 as uuidv4 } from 'uuid'

export interface AdvancedMetrics {
    nrs_2002_score?: number
    serum_albumin?: number
    weight_change_6m?: number
    sga_grade?: 'A' | 'B' | 'C'
    has_sarcopenia?: boolean
    has_gerd?: boolean
    gastric_emptying_delayed?: boolean
    oral_intake_possible?: boolean
    expected_fasting_days?: number
    intake_rate?: number
    [key: string]: any
}

export interface CreateProfileInput {
    surgery_type: string
    surgery_date: string
    age?: number
    weight?: number
    height?: number
    gender?: 'male' | 'female'
    digestive_capacity: 'good' | 'moderate' | 'poor'
    comorbidities: string[]
    advanced_metrics?: AdvancedMetrics
}

export interface CreateProfileResponse {
    success: boolean
    localStorageKey?: string
    profile?: any
    error?: string
}

export async function createProfile(input: CreateProfileInput): Promise<CreateProfileResponse> {
    try {
        const localStorageKey = uuidv4()

        const { data, error } = await (supabaseAdmin
            .from('user_profiles') as any)
            .insert({
                surgery_type: input.surgery_type,
                surgery_date: input.surgery_date,
                age: input.age,
                weight: input.weight,
                height: input.height,
                gender: input.gender,
                digestive_capacity: input.digestive_capacity,
                comorbidities: input.comorbidities,
                advanced_metrics: input.advanced_metrics || {},
                local_storage_key: localStorageKey
            })
            .select()
            .single()

        if (error) {
            console.error('Profile creation error:', error)
            return { success: false, localStorageKey, profile: null, error: error.message }
        }

        return { success: true, localStorageKey, profile: data }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, error: 'Failed to create profile' }
    }
}

export async function updateProfile(id: string, updates: Partial<CreateProfileInput>): Promise<CreateProfileResponse> {
    try {
        const { data, error } = await (supabaseAdmin
            .from('user_profiles') as any)
            .update(updates as any)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Profile update error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, profile: data }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, error: 'Failed to update profile' }
    }
}

/**
 * 사용자가 입력한 수술 명칭을 분석하여 표준 키로 매핑하는 서버 액션
 */
export async function mapSurgeryTypeAction(input: string) {
    if (!input.trim()) return { success: false, error: '입력값이 없습니다.' };

    try {
        const { mapSurgeryTypeWithAI } = await import('@/lib/ai/surgery-ai');
        const mappedType = await mapSurgeryTypeWithAI(input);

        if (mappedType) {
            return { success: true, mappedType };
        } else {
            return { success: false, error: '적절한 수술 종류를 찾지 못했습니다.' };
        }
    } catch (error) {
        console.error('Map Surgery Type Action Error:', error);
        return { success: false, error: 'AI 매핑 중 오류가 발생했습니다.' };
    }
}
