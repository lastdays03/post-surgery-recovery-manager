'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
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

export interface CreateProfileResponse {
    success: boolean
    localStorageKey?: string
    profile?: any
    error?: string
}

export async function createProfile(input: CreateProfileInput): Promise<CreateProfileResponse> {
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
            return { success: false, localStorageKey, profile: null, error: error.message }
        }

        return { success: true, localStorageKey, profile: data }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, error: 'Failed to create profile' }
    }
}
