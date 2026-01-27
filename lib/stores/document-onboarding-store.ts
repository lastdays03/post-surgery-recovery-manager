import { create } from 'zustand'
import type { MedicalDataExtraction } from '@/lib/types/medical-profile'

export type DocumentOnboardingStep = 'upload' | 'review' | 'supplement' | 'advanced'

interface DocumentOnboardingState {
    // Current Step
    currentStep: DocumentOnboardingStep

    // Uploaded File
    uploadedFile: File | null
    filePreviewUrl: string | null

    // OCR Results
    ocrResult: {
        text: string
        confidence: number
        provider: string
    } | null

    // Extracted Data
    extractedData: MedicalDataExtraction | null

    // User Reviewed/Modified Data
    reviewedData: Partial<MedicalDataExtraction> | null

    // Advanced Mode Flag
    advancedEnabled: boolean

    // Actions
    setStep: (step: DocumentOnboardingStep) => void
    setUploadedFile: (file: File, previewUrl: string) => void
    setOCRResult: (result: { text: string; confidence: number; provider: string }) => void
    setExtractedData: (data: MedicalDataExtraction) => void
    updateReviewedData: (data: Partial<MedicalDataExtraction>) => void
    setAdvancedEnabled: (enabled: boolean) => void
    reset: () => void
}

const initialState = {
    currentStep: 'upload' as DocumentOnboardingStep,
    uploadedFile: null,
    filePreviewUrl: null,
    ocrResult: null,
    extractedData: null,
    reviewedData: null,
    advancedEnabled: false
}

export const useDocumentOnboardingStore = create<DocumentOnboardingState>((set) => ({
    ...initialState,

    setStep: (step) => set({ currentStep: step }),

    setUploadedFile: (file, previewUrl) =>
        set({ uploadedFile: file, filePreviewUrl: previewUrl }),

    setOCRResult: (result) =>
        set({ ocrResult: result }),

    setExtractedData: (data) =>
        set({
            extractedData: data,
            advancedEnabled: data.hasAdvancedData
        }),

    updateReviewedData: (data) =>
        set((state) => ({
            reviewedData: { ...state.reviewedData, ...data }
        })),

    setAdvancedEnabled: (enabled) =>
        set({ advancedEnabled: enabled }),

    reset: () => set(initialState)
}))
