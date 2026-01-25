'use server'

import { supabaseAdmin } from '@/lib/supabase-client'
import { v4 as uuidv4 } from 'uuid'

export interface CreateProfileInput {
    surgery_type: string
    surgery_date: string
    age?: number
    weight?: number
    height?: number
    digestive_capacity: 'good' | 'moderate' | 'poor'
    comorbidities: string[]
}

export async function createProfile(input: CreateProfileInput) {
    try {
        const localStorageKey = uuidv4()

        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .insert({
                surgery_type: input.surgery_type,
                surgery_date: input.surgery_date,
                digestive_capacity: input.digestive_capacity,
                comorbidities: input.comorbidities,
                local_storage_key: localStorageKey
            } as any)
            .select()
            .single()

        if (error) {
            console.error('Profile creation error:', error)
            // Supabase 에러 시에도 로컬 저장은 진행 (클라이언트에서 처리하도록 성공으로 간주하되 프로필 없음)
            return { success: true, localStorageKey, profile: null, error: error.message }
        }

        return { success: true, localStorageKey, profile: data }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, error: 'Failed to create profile' }
    }
}
