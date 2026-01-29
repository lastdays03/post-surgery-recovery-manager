import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { OnboardingForm } from '../components/onboarding/onboarding-form'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'

// Mock useOnboardingStore
vi.mock('@/lib/stores/onboarding-store', () => ({
    useOnboardingStore: vi.fn(),
}))

// Mock createProfile action
vi.mock('@/lib/actions/profile-actions', () => ({
    createProfile: vi.fn(),
}))

describe('OnboardingForm', () => {
    const mockUpdateFormData = vi.fn()
    const mockSetStep = vi.fn()
    const mockFormData = {
        age: undefined,
        gender: undefined,
        height: undefined,
        weight: undefined,
    }

    beforeEach(() => {
        vi.clearAllMocks()
            ; (useOnboardingStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
                formData: mockFormData,
                updateFormData: mockUpdateFormData,
                setStep: mockSetStep,
            })
    })

    it('renders all form fields correctly', () => {
        render(<OnboardingForm />)
        // Use getAllByLabelText in case of duplicates, and verify at least one exists
        expect(screen.getAllByLabelText(/나이/i)[0]).toBeTruthy()
        expect(screen.getAllByLabelText(/키/i)[0]).toBeTruthy()
        expect(screen.getAllByLabelText(/몸무게/i)[0]).toBeTruthy()
        expect(screen.getAllByText('남성')[0]).toBeTruthy()
        expect(screen.getAllByText('여성')[0]).toBeTruthy()
    })

    it('shows validation error when required fields are empty', async () => {
        render(<OnboardingForm />)
        const submitButtons = screen.getAllByRole('button', { name: /완료 및 가이드 시작/i })
        fireEvent.click(submitButtons[0])

        await waitFor(() => {
            expect(screen.getAllByText('나이를 입력해주세요.').length).toBeGreaterThan(0)
            expect(screen.getAllByText('성별을 선택해주세요.').length).toBeGreaterThan(0)
            expect(screen.getAllByText('키를 입력해주세요.').length).toBeGreaterThan(0)
        })
    })

    it('updates gender when buttons are clicked', async () => {
        render(<OnboardingForm />)
        const maleBtns = screen.getAllByTestId('gender-male')
        fireEvent.click(maleBtns[0])

        await waitFor(() => {
            // Re-query to check class update
            const updatedMaleBtns = screen.getAllByTestId('gender-male')
            expect(updatedMaleBtns[0].className).toContain('bg-blue-600')
        })
    })

    it('coerces number inputs and submits correct data', async () => {
        render(<OnboardingForm />)

        const ageInputs = screen.getAllByLabelText(/나이/i)
        fireEvent.change(ageInputs[0], { target: { value: '30' } })

        const heightInputs = screen.getAllByLabelText(/키/i)
        fireEvent.change(heightInputs[0], { target: { value: '175' } })

        const weightInputs = screen.getAllByLabelText(/몸무게/i)
        fireEvent.change(weightInputs[0], { target: { value: '70' } })

        const maleBtns = screen.getAllByTestId('gender-male')
        fireEvent.click(maleBtns[0])

        // Handle Digestive Capacity (Select)
        // Note: Select trigger is a button, "선택해주세요"
        // Since we didn't specify test logic for Select in previous steps, and schema requires it defaults to 100
        // We just leave it as default.

        const submitButtons = screen.getAllByRole('button', { name: /완료 및 가이드 시작/i })
        fireEvent.click(submitButtons[0])

        await waitFor(() => {
            expect(mockUpdateFormData).toHaveBeenCalledWith(expect.objectContaining({
                age: 30, // Number type
                height: 175,
                weight: 70,
                gender: 'male',
                // digestiveCapacity default 100
            }))
        })
    })
})
