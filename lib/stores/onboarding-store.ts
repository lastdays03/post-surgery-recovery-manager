import { create } from 'zustand'

export type OnboardingStep = 1 | 2 | 3

export interface OnboardingFormData {
    // Step 1: 수술 정보
    surgery_type: string
    surgery_date: string

    // Step 2: 개인 정보
    age?: number
    weight?: number
    height?: number

    // Step 3: 건강 상태
    digestive_capacity: 'good' | 'moderate' | 'poor'
    comorbidities: string[]
}

interface OnboardingState {
    currentStep: OnboardingStep
    formData: Partial<OnboardingFormData>
    setStep: (step: OnboardingStep) => void
    updateFormData: (data: Partial<OnboardingFormData>) => void
    resetOnboarding: () => void
}

const initialFormData: Partial<OnboardingFormData> = {}

export const useOnboardingStore = create<OnboardingState>((set) => ({
    currentStep: 1,
    formData: initialFormData,
    setStep: (step) => set({ currentStep: step }),
    updateFormData: (data) =>
        set((state) => ({
            formData: { ...state.formData, ...data }
        })),
    resetOnboarding: () => set({ currentStep: 1, formData: initialFormData })
}))
