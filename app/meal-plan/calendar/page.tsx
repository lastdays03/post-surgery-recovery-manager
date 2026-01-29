'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { generateCalendarGrid, CalendarDay } from '@/lib/utils/calendar-utils'
import { cn } from '@/lib/utils'
import { fetchMonthlyMealStats } from '@/lib/services/meal-service'
import { getProfile } from '@/lib/local-storage'

export default function MealCalendarPage() {
    const router = useRouter()
    const [userId, setUserId] = useState<string | null>(null)
    const [currentDate, setCurrentDate] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    })
    const [mealStats, setMealStats] = useState<Record<string, boolean>>({}) // 날짜별 식단 존재 여부
    const [isLoading, setIsLoading] = useState(false)

    // 사용자 ID 로드
    useEffect(() => {
        const profile = getProfile()
        if (profile?.id) {
            setUserId(profile.id)
        }
    }, [])

    // 식단 데이터 페칭
    useEffect(() => {
        if (!userId) return

        const loadStats = async () => {
            setIsLoading(true)
            try {
                const stats = await fetchMonthlyMealStats(userId, currentDate.year, currentDate.month)
                const statsMap: Record<string, boolean> = {}
                stats.forEach(item => {
                    statsMap[item.date] = item.hasPlan
                })
                setMealStats(statsMap)
            } catch (error) {
                console.error('식단 통계 로드 실패:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadStats()
    }, [userId, currentDate.year, currentDate.month])

    // 월 이동 핸들러
    const handlePrevMonth = () => {
        setCurrentDate(prev => {
            if (prev.month === 1) {
                return { year: prev.year - 1, month: 12 }
            }
            return { ...prev, month: prev.month - 1 }
        })
    }

    const handleNextMonth = () => {
        setCurrentDate(prev => {
            if (prev.month === 12) {
                return { year: prev.year + 1, month: 1 }
            }
            return { ...prev, month: prev.month + 1 }
        })
    }

    // 캘린더 그리드 생성 (메모이제이션)
    const calendarGrid = useMemo(
        () => generateCalendarGrid(currentDate.year, currentDate.month),
        [currentDate.year, currentDate.month]
    )

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-xl font-bold text-gray-800">식단 캘린더</h1>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Month Navigation */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handlePrevMonth}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>

                    <h2 className="text-2xl font-bold text-gray-900 min-w-[200px] text-center flex items-center justify-center gap-2">
                        {currentDate.year}년 {currentDate.month}월
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                    </h2>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleNextMonth}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                        {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                            <div
                                key={day}
                                className={cn(
                                    "py-3 text-center text-xs font-bold uppercase tracking-wider",
                                    idx === 0 ? "text-red-500" : idx === 6 ? "text-blue-500" : "text-gray-500"
                                )}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="divide-y divide-gray-100">
                        {calendarGrid.map((week, weekIdx) => (
                            <div key={weekIdx} className="grid grid-cols-7 divide-x divide-gray-100">
                                {week.map((day) => (
                                    <div key={day.date} className="relative">
                                        <CalendarCell
                                            day={day}
                                            hasPlan={mealStats[day.date]}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// 캘린더 셀 컴포넌트
function CalendarCell({ day, hasPlan }: { day: CalendarDay; hasPlan?: boolean }) {
    return (
        <div
            className={cn(
                "min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] p-2 transition-colors relative",
                day.isCurrentMonth ? "bg-white hover:bg-gray-50/50" : "bg-gray-50/30",
                day.isToday && "bg-blue-50/50"
            )}
        >
            <div className="flex justify-between items-start">
                <span
                    className={cn(
                        "text-sm font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full",
                        day.isCurrentMonth ? "text-gray-900" : "text-gray-300",
                        day.isToday && "bg-blue-600 text-white shadow-sm"
                    )}
                >
                    {day.day}
                </span>
            </div>

            {/* 식단 정보 표시 (Phase 2) */}
            <div className="mt-2 flex flex-col items-center">
                {hasPlan && (
                    <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span className="text-[10px] text-gray-500 font-medium hidden sm:inline">식단 있음</span>
                    </div>
                )}
            </div>
        </div>
    )
}
