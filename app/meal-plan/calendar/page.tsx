'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronLeft, ChevronRight, FileDown, Loader2 } from 'lucide-react'
import { generateCalendarGrid, CalendarDay } from '@/lib/utils/calendar-utils'
import { cn } from '@/lib/utils'
import { fetchMonthlyMealStats } from '@/lib/services/meal-service'
import { getProfile } from '@/lib/local-storage'
import { usePdfReport } from '@/hooks/use-pdf-report'

export default function MealCalendarPage() {
    const router = useRouter()
    const [userId, setUserId] = useState<string | null>(null)
    const [currentDate, setCurrentDate] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    })
    const [mealStats, setMealStats] = useState<Record<string, { hasPlan: boolean; meals: { type: string; names: string[] }[] }>>({})
    const [monthlyCache, setMonthlyCache] = useState<Set<string>>(new Set()) // 캐시된 월 추적 (YYYY-MM)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null) // 에러 상태
    const { downloadCalendarPdf, isGenerating } = usePdfReport()

    // 사용자 ID 로드
    useEffect(() => {
        const profile = getProfile()
        if (profile?.id) {
            setUserId(profile.id)
        }
    }, [])

    // 식단 데이터 페칭 (캐싱 적용)
    useEffect(() => {
        if (!userId) return

        const cacheKey = `${currentDate.year}-${String(currentDate.month).padStart(2, '0')}`

        // 이미 캐시된 데이터가 있으면 스킵 (단, 강제 새로고침 필요 시 로직 수정 가능)
        if (monthlyCache.has(cacheKey)) return

        const loadStats = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const stats = await fetchMonthlyMealStats(userId, currentDate.year, currentDate.month)

                setMealStats(prev => {
                    const next = { ...prev }
                    stats.forEach(item => {
                        next[item.date] = {
                            hasPlan: item.hasPlan,
                            meals: item.meals
                        }
                    })
                    return next
                })

                setMonthlyCache(prev => new Set(prev).add(cacheKey))
            } catch (error) {
                console.error('식단 통계 로드 실패:', error)
                setError('데이터를 불러오는데 실패했습니다.')
            } finally {
                setIsLoading(false)
            }
        }

        loadStats()
    }, [userId, currentDate.year, currentDate.month, monthlyCache])

    const handleRetry = () => {
        // 캐시 키를 제거하여 다시 로드하도록 유도
        const cacheKey = `${currentDate.year}-${String(currentDate.month).padStart(2, '0')}`
        setMonthlyCache(prev => {
            const next = new Set(prev)
            next.delete(cacheKey)
            return next
        })
    }

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

    // 날짜 클릭 핸들러
    const handleDateClick = (date: string, hasPlan: boolean) => {
        if (hasPlan) {
            router.push(`/meal-plan?date=${date}&source=calendar`)
        } else {
            console.log(`${date}: 식단이 없습니다.`)
        }
    }

    // 캘린더 그리드 생성 (메모이제이션)
    const calendarGrid = useMemo(
        () => generateCalendarGrid(currentDate.year, currentDate.month),
        [currentDate.year, currentDate.month]
    )

    const { year, month } = currentDate;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="mr-2"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-xl font-bold text-gray-900">식단 달력</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadCalendarPdf({ year, month, calendarGrid, mealStats })}
                            disabled={isGenerating}
                            className="text-gray-600 border-gray-300 hover:bg-gray-50"
                        >
                            <FileDown className="w-4 h-4 mr-2" />
                            {isGenerating ? "생성 중..." : "PDF 저장"}
                        </Button>
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
                        disabled={isLoading}
                        aria-label="이전 달"
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
                        disabled={isLoading}
                        aria-label="다음 달"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
                        <span className="text-sm font-medium">{error}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white hover:bg-red-50 border-red-200 text-red-600 h-8"
                            onClick={handleRetry}
                        >
                            다시 시도
                        </Button>
                    </div>
                )}

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
                                            mealData={mealStats[day.date]}
                                            onDateClick={handleDateClick}
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
function CalendarCell({
    day,
    mealData,
    onDateClick
}: {
    day: CalendarDay;
    mealData?: { hasPlan: boolean; meals: { type: string; names: string[] }[] };
    onDateClick: (date: string, hasPlan: boolean) => void;
}) {
    // 식사 유형별 고정 색상 및 간식용 팔레트
    const FIXED_COLORS: Record<string, string> = {
        'breakfast': 'bg-amber-100 text-amber-700',
        'lunch': 'bg-emerald-100 text-emerald-700',
        'dinner': 'bg-blue-100 text-blue-700'
    }

    const SNACK_PALETTE = [
        'bg-purple-100 text-purple-700',
        'bg-pink-100 text-pink-700',
        'bg-indigo-100 text-indigo-700',
        'bg-orange-100 text-orange-700',
        'bg-teal-100 text-teal-700',
    ]

    // 뱃지 스타일 결정 로직
    const getBadgeStyle = (type: string, snackIndex: number) => {
        if (FIXED_COLORS[type]) {
            return FIXED_COLORS[type]
        }
        // 간식(또는 기타)인 경우 팔레트에서 순서대로 색상 선택
        return SNACK_PALETTE[snackIndex % SNACK_PALETTE.length]
    }

    // 렌더링 시 간식 인덱스 추적을 위한 변수
    let snackCounter = 0;

    return (
        <button
            type="button"
            onClick={() => onDateClick(day.date, mealData?.hasPlan ?? false)}
            aria-label={`${day.date}${mealData?.hasPlan ? ", 식단 조회하기" : ", 식단 없음"}`}
            className={cn(
                "w-full text-left min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] p-2 transition-colors relative flex flex-col gap-1 outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500",
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

            {/* 식단 정보 표시 (상세 음식명) */}
            <div className="flex flex-col gap-1 mt-1 w-full">
                {mealData?.hasPlan && mealData.meals.map((meal, idx) => {
                    const isSnack = !FIXED_COLORS[meal.type];
                    const currentSnackIndex = isSnack ? snackCounter++ : 0;

                    return (
                        <div
                            key={`${meal.type}-${idx}`}
                            className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded font-medium truncate w-full text-left",
                                getBadgeStyle(meal.type, currentSnackIndex)
                            )}
                            title={meal.names.join(', ')}
                        >
                            {meal.names.join(', ')}
                        </div>
                    )
                })}
            </div>
        </button>
    )
}
