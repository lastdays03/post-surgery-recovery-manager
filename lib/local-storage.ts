export interface LocalProfile {
    id: string
    surgery_type: string
    surgery_date: string
    digestive_capacity: 'good' | 'moderate' | 'poor'
    comorbidities: string[]
    weight?: number
    created_at: string
    updated_at: string
}

const STORAGE_KEY = 'user_profile'

export function saveProfile(profile: LocalProfile): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch (error) {
        console.error('Failed to save profile to local storage:', error)
    }
}

export function getProfile(): LocalProfile | null {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : null
    } catch (error) {
        console.error('Failed to load profile from local storage:', error)
        return null
    }
}

export function clearProfile(): void {
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
        console.error('Failed to clear profile from local storage:', error)
    }
}
