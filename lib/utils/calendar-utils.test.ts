import { describe, it, expect } from 'vitest'
import { generateCalendarGrid, CalendarDay } from './calendar-utils'

describe('generateCalendarGrid', () => {
    it('should generate correct grid for January 2026', () => {
        const grid = generateCalendarGrid(2026, 1)

        // 2026년 1월 1일은 목요일 (일=0, 월=1, 화=2, 수=3, 목=4)
        // 따라서 첫 주는 일(28), 월(29), 화(30), 수(31), 목(1), 금(2), 토(3)

        expect(grid.length).toBeGreaterThan(0) // 최소 1주 이상
        expect(grid[0].length).toBe(7) // 각 주는 7일

        // 첫 주의 목요일(인덱스 4)이 1월 1일이어야 함
        const firstWeek = grid[0]
        const jan1st = firstWeek.find((day: CalendarDay) => day.day === 1 && day.isCurrentMonth)
        expect(jan1st).toBeDefined()
        expect(jan1st?.date).toBe('2026-01-01')
    })

    it('should include previous month days for padding', () => {
        const grid = generateCalendarGrid(2026, 1)
        const firstWeek = grid[0]

        // 1월 1일이 목요일이므로 앞에 일(28), 월(29), 화(30), 수(31)가 있어야 함
        const prevMonthDays = firstWeek.filter((day: CalendarDay) => !day.isCurrentMonth && day.day > 20)
        expect(prevMonthDays.length).toBe(4)
    })

    it('should mark today correctly', () => {
        const today = new Date()
        const year = today.getFullYear()
        const month = today.getMonth() + 1

        const grid = generateCalendarGrid(year, month)
        const todayStr = today.toISOString().split('T')[0]

        let foundToday = false
        for (const week of grid) {
            for (const day of week) {
                if (day.date === todayStr) {
                    expect(day.isToday).toBe(true)
                    foundToday = true
                }
            }
        }

        expect(foundToday).toBe(true)
    })

    it('should handle February in leap year (2024)', () => {
        const grid = generateCalendarGrid(2024, 2)

        // 2024년 2월은 윤년이므로 29일까지
        let maxDay = 0
        for (const week of grid) {
            for (const day of week) {
                if (day.isCurrentMonth && day.day > maxDay) {
                    maxDay = day.day
                }
            }
        }

        expect(maxDay).toBe(29)
    })

    it('should handle December to January transition', () => {
        const grid = generateCalendarGrid(2025, 12)

        // 12월의 마지막 날짜들 확인
        let hasDecember31 = false
        for (const week of grid) {
            for (const day of week) {
                if (day.isCurrentMonth && day.day === 31) {
                    hasDecember31 = true
                    expect(day.date).toBe('2025-12-31')
                }
            }
        }

        expect(hasDecember31).toBe(true)
    })
})
