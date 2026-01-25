'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/local-storage'
import { calculateRecoveryPhase } from '@/lib/profiling-engine'
import type { UserProfile } from '@/lib/types/user.types'
import type { Meal } from '@/lib/types/meal.types'
import { SAMPLE_MEALS } from '@/data/meals/sample-meals'
import { filterMealsByPhase, getMealsByTime, calculateDailyNutrition } from '@/lib/utils/meal-utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function MealPlanPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedMeals, setSelectedMeals] = useState<{
        breakfast?: Meal
        lunch?: Meal
        dinner?: Meal
        snacks: Meal[]
    }>({ snacks: [] })

    const [currentPhaseName, setCurrentPhaseName] = useState('')

    useEffect(() => {
        const savedProfile = getProfile()

        if (!savedProfile) {
            router.push('/onboarding')
            return
        }

        setProfile(savedProfile)

        // Calculate current phase and filter meals
        const userProfile: UserProfile = {
            ...savedProfile,
            surgery_date: new Date(savedProfile.surgery_date),
            created_at: new Date(savedProfile.created_at),
            updated_at: new Date(savedProfile.updated_at)
        }

        try {
            const currentPhase = calculateRecoveryPhase(userProfile)
            setCurrentPhaseName(currentPhase.description) // UI용 설명

            // 프로토콜의 phase name ('liquid', 'soft')과 식단 데이터의 phase ('liquid', 'soft') 매칭
            // 만약 프로토콜에 'normal'이 있고 식단에 'regular'가 있다면 매핑 필요
            let mealPhase = currentPhase.name
            if (mealPhase === 'normal') mealPhase = 'regular' // 매핑 예시

            const phaseMeals = filterMealsByPhase(SAMPLE_MEALS, mealPhase)

            // Select default meals for the day
            const breakfasts = getMealsByTime(phaseMeals, 'breakfast')
            const lunches = getMealsByTime(phaseMeals, 'lunch')
            const dinners = getMealsByTime(phaseMeals, 'dinner')
            const snacks = getMealsByTime(phaseMeals, 'snack')

            setSelectedMeals({
                breakfast: breakfasts[0], // 랜덤하게 혹은 첫번째꺼
                lunch: lunches[0],
                dinner: dinners[0],
                snacks: snacks.slice(0, 2)
            })
        } catch (e) {
            console.error('Error calculating phase:', e)
        }

        setLoading(false)
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-2xl">로딩 중...</div>
            </div>
        )
    }

    if (!profile) return null

    const allMeals = [
        selectedMeals.breakfast,
        selectedMeals.lunch,
        selectedMeals.dinner,
        ...selectedMeals.snacks
    ].filter((m): m is Meal => m !== undefined)

    const dailyNutrition = calculateDailyNutrition(allMeals)

    const MealCard = ({ meal, title }: { meal?: Meal, title: string }) => {
        if (!meal) return (
            <Card className="mb-4 bg-gray-50 border-dashed border-2">
                <h3 className="text-xl font-bold mb-2 text-gray-500">{title}</h3>
                <p className="text-gray-600 font-medium">추천 식단이 없습니다.</p>
            </Card>
        )

        return (
            <Card className="mb-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">{title} - {meal.name}</h3>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {meal.nutrition.calories} kcal
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-gray-50 p-4 rounded-xl">
                    <div>
                        <p className="text-gray-700">단백질: <span className="font-bold text-gray-900">{meal.nutrition.protein}g</span></p>
                        <p className="text-gray-700">지방: <span className="font-bold text-gray-900">{meal.nutrition.fat}g</span></p>
                    </div>
                    <div>
                        <p className="text-gray-700">탄수화물: <span className="font-bold text-gray-900">{meal.nutrition.carbs}g</span></p>
                    </div>
                </div>

                <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-gray-900">재료</h4>
                    <p className="text-gray-700 text-sm font-medium">{meal.ingredients.join(', ')}</p>
                </div>

                {meal.notes && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <p className="text-sm text-yellow-800">💡 {meal.notes}</p>
                    </div>
                )}
            </Card>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Button variant="secondary" onClick={() => router.push('/dashboard')}>
                        ← 대시보드로 돌아가기
                    </Button>
                </div>

                <h1 className="text-4xl font-bold mb-2 text-gray-900">오늘의 추천 식단</h1>
                <p className="text-xl text-gray-700 font-medium mb-8">
                    현재 단계: <span className="font-bold text-blue-600">{currentPhaseName}</span>
                </p>

                {/* Daily Nutrition Summary */}
                <Card className="mb-8 bg-blue-50 border-blue-100">
                    <h2 className="text-2xl font-bold mb-4 text-blue-900">일일 영양 목표 달성도</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center bg-white p-4 rounded-xl shadow-sm">
                            <p className="text-3xl font-bold text-blue-600">{dailyNutrition.calories}</p>
                            <p className="text-gray-600 text-sm font-medium">총 칼로리 (kcal)</p>
                        </div>
                        <div className="text-center bg-white p-4 rounded-xl shadow-sm">
                            <p className="text-3xl font-bold text-green-600">{dailyNutrition.protein}g</p>
                            <p className="text-gray-600 text-sm font-medium">단백질</p>
                        </div>
                        <div className="text-center bg-white p-4 rounded-xl shadow-sm">
                            <p className="text-3xl font-bold text-orange-600">{dailyNutrition.fat}g</p>
                            <p className="text-gray-600 text-sm font-medium">지방</p>
                        </div>
                        <div className="text-center bg-white p-4 rounded-xl shadow-sm">
                            <p className="text-3xl font-bold text-gray-600">{dailyNutrition.carbs}g</p>
                            <p className="text-gray-600 text-sm font-medium">탄수화물</p>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <MealCard title="아침" meal={selectedMeals.breakfast} />
                    <MealCard title="점심" meal={selectedMeals.lunch} />
                    <MealCard title="저녁" meal={selectedMeals.dinner} />

                    {selectedMeals.snacks.map((snack, i) => (
                        <MealCard key={i} title={`간식 ${i + 1}`} meal={snack} />
                    ))}
                </div>
            </div>
        </div>
    )
}
