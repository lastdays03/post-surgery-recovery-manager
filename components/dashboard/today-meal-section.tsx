'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Plus, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { MealGenerationModal } from './meal-generation-modal'
import { MealCard } from '@/components/meal-plan/meal-card'
import { MealDetailModal } from '@/components/meal-plan/meal-detail-modal'
import type { Meal } from '@/lib/types/meal.types'
import { getTodayMealPlan, type MealPlan } from '@/lib/services/meal-service'
import { DateRange } from 'react-day-picker'
import Link from 'next/link'

interface TodayMealSectionProps {
    userId: string
}

export function TodayMealSection({ userId }: TodayMealSectionProps) {
    const router = useRouter()
    const [meals, setMeals] = useState<Meal[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [justGenerated, setJustGenerated] = useState(false) // For animation trigger
    const [selectedMeal, setSelectedMeal] = useState<{ meal: Meal; mealTime: string } | null>(null)

    useEffect(() => {
        loadMeals()
    }, [])

    const loadMeals = () => {
        const cachedPlan = getTodayMealPlan(userId)
        if (cachedPlan) {
            setMeals(cachedPlan.meals)
        }
        setIsLoading(false)
    }

    const handleGenerate = async (range: DateRange) => {
        try {
            const response = await fetch('/api/ai/meal-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    recoveryPhase: 'soft', // Default for now
                    dateRange: {
                        from: range.from,
                        to: range.to
                    }
                })
            })

            const data = await response.json()
            if (data.success && data.meals) {
                setMeals(data.meals)
                setJustGenerated(true)
                setIsModalOpen(false)

                // Navigate to monthly view after short delay
                setTimeout(() => {
                    // router.push('/meal-plan/monthly') // Removed automatic navigation to show the button per new design
                }, 1500)
            }
        } catch (e) {
            console.error(e)
            alert('식단 생성 실패')
        }
    }

    // Find snack (assuming the first snack found)
    const snackMeal = meals.find(m => m.mealTime === 'snack')
    const hasSnack = !!snackMeal

    const formattedDate = format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })

    if (isLoading) return null

    const hasMeals = meals.length > 0
    const showContent = hasMeals || justGenerated

    return (
        <section className="space-y-4">
            <div className="flex justify-between items-end">
                <h3 className="text-xl font-bold text-gray-900">
                    오늘의 식단 <span className="text-gray-500 text-base font-normal">({formattedDate})</span>
                </h3>
                {showContent && (
                    <Link href="/meal-plan" className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center">
                        자세히 보기 <ChevronRight size={16} />
                    </Link>
                )}
            </div>

            <div className="relative overflow-hidden min-h-[200px] rounded-2xl">
                {/* Empty State: Only shown if NO meals and NOT just generated */}
                {!showContent && (
                    <div className="transition-transform duration-500 ease-in-out translate-x-0">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-12 hover:border-blue-400 hover:bg-blue-50/50 transition-all group bg-white"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <Plus className="text-gray-500 group-hover:text-blue-600" size={24} />
                                </div>
                                <p className="text-gray-600 font-medium group-hover:text-blue-600 transition-colors">AI 맞춤 식단 추가</p>
                            </div>
                        </button>
                    </div>
                )}

                {/* Meal Cards (Filled State) */}
                {showContent && (
                    <div className={`space-y-6 transition-transform duration-500 ease-in-out ${justGenerated ? 'animate-in slide-in-from-right duration-500' : ''}`}>
                        <Carousel
                            opts={{
                                align: "start",
                                loop: false,
                            }}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-4">
                                <CarouselItem className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                    <MealCard
                                        title="아침"
                                        meal={meals.find(m => m.mealTime === 'breakfast')}
                                        simple
                                        onClick={() => {
                                            const meal = meals.find(m => m.mealTime === 'breakfast')
                                            if (meal) setSelectedMeal({ meal, mealTime: '아침' })
                                        }}
                                    />
                                </CarouselItem>
                                <CarouselItem className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                    <MealCard
                                        title="점심"
                                        meal={meals.find(m => m.mealTime === 'lunch')}
                                        simple
                                        onClick={() => {
                                            const meal = meals.find(m => m.mealTime === 'lunch')
                                            if (meal) setSelectedMeal({ meal, mealTime: '점심' })
                                        }}
                                    />
                                </CarouselItem>
                                <CarouselItem className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                    <MealCard
                                        title="저녁"
                                        meal={meals.find(m => m.mealTime === 'dinner')}
                                        simple
                                        onClick={() => {
                                            const meal = meals.find(m => m.mealTime === 'dinner')
                                            if (meal) setSelectedMeal({ meal, mealTime: '저녁' })
                                        }}
                                    />
                                </CarouselItem>
                                {meals.filter(m => m.mealTime === 'snack').map((snack, index) => (
                                    <CarouselItem key={snack.id || `snack-${index}`} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                        <MealCard
                                            title={meals.filter(m => m.mealTime === 'snack').length > 1 ? `간식 ${index + 1}` : "간식"}
                                            meal={snack}
                                            simple
                                            onClick={() => setSelectedMeal({ meal: snack, mealTime: '간식' })}
                                        />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>

                        {/* Button at the bottom (as per design) */}
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full bg-black hover:bg-gray-800 text-white py-6 rounded-xl text-lg font-bold shadow-lg"
                        >
                            AI 식단 추가하기
                        </Button>
                    </div>
                )}
            </div>

            <MealGenerationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userId={userId}
                onGenerate={handleGenerate}
            />

            <MealDetailModal
                meal={selectedMeal?.meal || null}
                mealTime={selectedMeal?.mealTime || ''}
                isOpen={!!selectedMeal}
                onClose={() => setSelectedMeal(null)}
            />
        </section>
    )
}
