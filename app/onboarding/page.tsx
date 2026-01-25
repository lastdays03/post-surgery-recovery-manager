'use client'

import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { SurgeryInfoStep } from '@/components/onboarding/surgery-info-step'
import { PersonalInfoStep } from '@/components/onboarding/personal-info-step'
import { HealthStatusStep } from '@/components/onboarding/health-status-step'

export default function OnboardingPage() {
    const { currentStep } = useOnboardingStore()

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6">
            {/* Progress Bar */}
            <div className="max-w-3xl mx-auto mb-12">
                <div className="flex justify-between mb-4">
                    <span className={`text-sm font-bold ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>01 수술 정보</span>
                    <span className={`text-sm font-bold ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>02 개인 정보</span>
                    <span className={`text-sm font-bold ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>03 건강 상태</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                        style={{ width: `${(currentStep / 3) * 100}%` }}
                    />
                </div>
            </div>

            {/* Steps */}
            {currentStep === 1 && <SurgeryInfoStep />}
            {currentStep === 2 && <PersonalInfoStep />}
            {currentStep === 3 && <HealthStatusStep />}
        </div>
    )
}
