'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { getProfile } from '@/lib/local-storage'
import { MealCard } from '@/components/meal-plan/meal-card'
import { getTodayMealPlan } from '@/lib/services/meal-service'
import type { Meal } from '@/lib/types/meal.types'

export default function MonthlyMealPlanPage() {
    const router = useRouter()
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [selectedDateMeals, setSelectedDateMeals] = useState<Meal[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const profile = getProfile()
        if (!profile) {
            router.replace('/onboarding')
        } else {
            // Load meals for today initially or selected date
            // In a real app, we would fetch monthly data to mark dots on calendar
            // and fetch daily data when selected.
            // For prototype, we just check if "today" has data in local cache.
            const todayPlan = getTodayMealPlan(profile.id)
            if (todayPlan) {
                setSelectedDateMeals(todayPlan.meals)
            }
        }
    }, [router])

    // Mock handler for date selection
    const handleDateSelect = (newDate: Date | undefined) => {
        if (!newDate) return
        setDate(newDate)

        // Mock data fetching for the selected date
        // In real app: fetchMealsForDate(newDate)
        // Here we just clear if it's not today (since we only have today's cache in this demo context)
        const isToday = format(newDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
        const profile = getProfile()

        if (isToday && profile) {
            const todayPlan = getTodayMealPlan(profile.id)
            if (todayPlan) setSelectedDateMeals(todayPlan.meals)
            else setSelectedDateMeals([])
        } else {
            setSelectedDateMeals([])
        }
    }

    if (!mounted) return null

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-800">월간 식단표</h1>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
                {/* Calendar Card */}
                <Card className="p-4 bg-white shadow-sm border rounded-2xl">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        className="rounded-xl border shadow-none w-full flex justify-center"
                        classNames={{
                            month: "space-y-4 w-full",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex w-full justify-between",
                            row: "flex w-full mt-2 justify-between",
                        }}
                    />
                </Card>

                {/* Selected Date Meals */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-600 rounded-full inline-block"></span>
                            {date ? format(date, 'M월 d일 EEEE', { locale: ko }) : '날짜를 선택하세요'}
                        </h2>
                        {selectedDateMeals.length > 0 && (
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                식단 생성 완료
                            </span>
                        )}
                    </div>

                    {selectedDateMeals.length > 0 ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <MealCard
                                    title="아침"
                                    meal={selectedDateMeals.find(m => m.mealTime === 'breakfast')}
                                />
                                <MealCard
                                    title="점심"
                                    meal={selectedDateMeals.find(m => m.mealTime === 'lunch')}
                                />
                                <MealCard
                                    title="저녁"
                                    meal={selectedDateMeals.find(m => m.mealTime === 'dinner')}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <CalendarIcon className="text-gray-400" size={32} />
                            </div>
                            <p className="text-gray-500 font-medium">이 날짜의 식단이 없습니다.</p>
                            <p className="text-xs text-gray-400 mt-1">상단의 "AI 맞춤 식단" 기능으로 생성해보세요.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
