'use client'

import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { OnboardingChat } from '@/components/onboarding/onboarding-chat'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'

export default function OnboardingPage() {
    const { currentStep } = useOnboardingStore()

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6">
            {/* Progress Bar */}
            <div className="max-w-3xl mx-auto mb-12">
                <div className="flex justify-between mb-4">
                    <span className={`text-sm font-bold ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-600'}`}>01 AI 상담</span>
                    <span className={`text-sm font-bold ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-600'}`}>02 건강 정보</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                        style={{ width: `${(currentStep / 2) * 100}%` }}
                    />
                </div>
            </div>

            {/* Steps */}
            {currentStep === 1 && <OnboardingChat />}
            {currentStep === 2 && <OnboardingForm />}
        </div>
    )
}
