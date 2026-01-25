import { supabase } from '@/lib/supabase-client'
import type { SymptomLog } from '@/lib/types/symptom.types'

export async function saveSymptomLog(profileId: string, date: string, symptoms: SymptomLog): Promise<boolean> {
    const { error } = await supabase
        .from('daily_logs')
        .upsert({
            profile_id: profileId,
            log_date: date,
            symptoms: symptoms as any // Json type compatibility 
        } as any, {
            onConflict: 'profile_id,log_date'
        })

    if (error) {
        console.error('Error saving symptom log:', error)
        return false
    }

    return true
}

export async function getSymptomLog(profileId: string, date: string) {
    const { data, error } = await supabase
        .from('daily_logs')
        .select('symptoms')
        .eq('profile_id', profileId)
        .eq('log_date', date)
        .single()

    if (error) return null
    return (data as any)?.symptoms
}

export async function getWeeklyLogs(profileId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('profile_id', profileId)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date', { ascending: true })

    if (error) {
        console.error('Error fetching weekly logs:', error)
        return []
    }
    return (data as any[]) || []
}
