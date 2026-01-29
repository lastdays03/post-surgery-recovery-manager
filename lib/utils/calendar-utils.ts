export interface CalendarDay {
    date: string        // YYYY-MM-DD
    day: number         // 1-31
    isCurrentMonth: boolean
    isToday: boolean
}

/**
 * 특정 월의 캘린더 그리드 생성
 * @param year 년도
 * @param month 월 (1-12)
 * @returns 주차별로 그룹화된 날짜 배열 (각 주는 일요일부터 시작)
 */
export function generateCalendarGrid(year: number, month: number): CalendarDay[][] {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)

    const firstDayOfWeek = firstDay.getDay() // 0 (일) ~ 6 (토)
    const daysInMonth = lastDay.getDate()

    const weeks: CalendarDay[][] = []
    let currentWeek: CalendarDay[] = []

    // 이전 달 날짜로 빈 칸 채우기
    const prevDate = new Date(year, month - 1, 0)
    const daysInPrevMonth = prevDate.getDate()
    const prevMonth = prevDate.getMonth() + 1
    const prevYear = prevDate.getFullYear()

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i
        currentWeek.push({
            date: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            day: day,
            isCurrentMonth: false,
            isToday: false
        })
    }

    // 현재 달 날짜 채우기
    const today = new Date().toISOString().split('T')[0]

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

        currentWeek.push({
            date: dateStr,
            day,
            isCurrentMonth: true,
            isToday: dateStr === today
        })

        if (currentWeek.length === 7) {
            weeks.push(currentWeek)
            currentWeek = []
        }
    }

    // 다음 달 날짜로 마지막 주 채우기
    if (currentWeek.length > 0) {
        const nextDate = new Date(year, month, 1)
        const nextMonth = nextDate.getMonth() + 1
        const nextYear = nextDate.getFullYear()

        let day = 1
        while (currentWeek.length < 7) {
            currentWeek.push({
                date: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                day,
                isCurrentMonth: false,
                isToday: false
            })
            day++
        }
        weeks.push(currentWeek)
    }

    return weeks
}
