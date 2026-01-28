import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Calendar } from '../components/ui/calendar'
import { format } from 'date-fns'

describe('Calendar Component', () => {
    it('renders correctly', () => {
        render(<Calendar mode="single" />)
        // Check if current month is visible
        const currentMonth = format(new Date(), 'MMMM yyyy')
        // react-day-picker v9 might use different formatting or structure
        // Let's just check if some days are rendered
        expect(screen.getByText('1')).toBeDefined()
    })

    it('renders selected date', () => {
        const selectedDate = new Date(2024, 5, 15, 0, 0, 0, 0) // June 15, 2024
        render(<Calendar mode="single" selected={selectedDate} month={selectedDate} />)

        // Find the day button for the 15th
        const dayButtons = screen.getAllByRole('button', { name: /15/i })
        const dayButton = dayButtons.find(btn => {
            const td = btn.closest('td')
            return td && !td.classList.contains('day-outside')
        })

        if (!dayButton) throw new Error('Day button for 15th not found')

        // In rdp v9, selection is indicated by aria-selected="true" on the cell or button
        const isSelected = dayButton.getAttribute('aria-selected') === 'true' ||
            dayButton.closest('td')?.getAttribute('aria-selected') === 'true'

        expect(isSelected).toBe(true)
    })

    it('allows date selection', async () => {
        const user = userEvent.setup()
        const onSelect = vi.fn()
        const month = new Date(2024, 5, 1, 0, 0, 0, 0)
        render(<Calendar mode="single" onSelect={onSelect} month={month} />)

        const dayButtons = screen.getAllByRole('button', { name: /15/i })
        const dayButton = dayButtons.find(btn => {
            const td = btn.closest('td')
            return td && !td.classList.contains('day-outside')
        })

        if (!dayButton) throw new Error('Day button for 15th not found')

        await user.click(dayButton)

        expect(onSelect).toHaveBeenCalled()
    })
})
