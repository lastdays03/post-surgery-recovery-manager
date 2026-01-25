'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/local-storage'
import { calculateRecoveryPhase } from '@/lib/profiling-engine'
import type { UserProfile } from '@/lib/types/user.types'
import type { Meal } from '@/lib/types/meal.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MealChat } from '@/components/meal-plan/meal-chat'
import { RefreshCw, MessageSquare, Loader2 } from 'lucide-react'

export default function MealPlanPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [meals, setMeals] = useState<Meal[]>([])
    const [showChat, setShowChat] = useState(false)
    const [currentPhaseName, setCurrentPhaseName] = useState('')
    const [recoveryPhase, setRecoveryPhase] = useState<'liquid' | 'soft' | 'regular'>('soft')

    useEffect(() => {
        loadProfileAndGenerateMeals()
    }, [])

    const loadProfileAndGenerateMeals = async () => {
        const savedProfile = getProfile()

        if (!savedProfile) {
            router.push('/onboarding')
            return
        }

        setProfile(savedProfile)

        // Calculate current phase
        const userProfile: UserProfile = {
            ...savedProfile,
            surgery_date: new Date(savedProfile.surgery_date),
            created_at: new Date(savedProfile.created_at),
            updated_at: new Date(savedProfile.updated_at)
        }

        try {
            const currentPhase = calculateRecoveryPhase(userProfile)
            setCurrentPhaseName(currentPhase.description)

            // Map phase name
            let mealPhase: 'liquid' | 'soft' | 'regular' = 'soft'
            if (currentPhase.name === 'liquid') mealPhase = 'liquid'
            else if (currentPhase.name === 'normal') mealPhase = 'regular'
            else mealPhase = 'soft'

            setRecoveryPhase(mealPhase)

            // Generate meals with LLM
            await generateMeals(savedProfile.id, mealPhase, savedProfile.surgery_type)
        } catch (e) {
            console.error('Error:', e)
        }

        setLoading(false)
    }

    const generateMeals = async (userId: string, phase: 'liquid' | 'soft' | 'regular', surgeryType?: string) => {
        setGenerating(true)
        try {
            const response = await fetch('/api/ai/meal-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    recoveryPhase: phase,
                    surgeryType,
                    preferences: profile?.meal_preferences
                })
            })

            const data = await response.json()

            if (data.success && data.meals) {
                setMeals(data.meals)
            } else {
                alert(data.error || '식단 생성에 실패했습니다.')
            }
        } catch (error) {
            console.error('식단 생성 오류:', error)
            alert('서버 연결에 실패했습니다.')
        } finally {
            setGenerating(false)
        }
    }

    const handleRegenerate = () => {
        if (profile) {
            generateMeals(profile.id, recoveryPhase, profile.surgery_type)
        }
    }

    const handleMealsUpdated = (updatedMeals: Meal[]) => {
        setMeals(updatedMeals)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
                    <div className="text-2xl font-bold text-gray-900">식단 생성 중...</div>
                </div>
            </div>
        )
    }

    if (!profile) return null

    // Group meals by time
    const breakfast = meals.find(m => m.mealTime === 'breakfast')
    const lunch = meals.find(m => m.mealTime === 'lunch')
    const dinner = meals.find(m => m.mealTime === 'dinner')
    const snacks = meals.filter(m => m.mealTime === 'snack')

    // Calculate daily nutrition
    const dailyNutrition = meals.reduce(
        (acc, meal) => ({
            calories: acc.calories + meal.nutrition.calories,
            protein: acc.protein + meal.nutrition.protein,
            fat: acc.fat + meal.nutrition.fat,
            carbs: acc.carbs + meal.nutrition.carbs
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0 }
    )

    const MealCard = ({ meal, title }: { meal?: Meal; title: string }) => {
        if (!meal)
            return (
                <Card className="mb-4 bg-gray-50 border-dashed border-2 p-6">
                    <h3 className="text-xl font-bold mb-2 text-gray-500">{title}</h3>
                    <p className="text-gray-600 font-medium">식단을 생성 중입니다...</p>
                </Card>
            )

        return (
            <Card className="mb-4 p-6">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                        {title} - {meal.name}
                    </h3>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {meal.nutrition.calories} kcal
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-gray-50 p-4 rounded-xl">
                    <div>
                        <p className="text-gray-700">
                            단백질: <span className="font-bold text-gray-900">{meal.nutrition.protein}g</span>
                        </p>
                        <p className="text-gray-700">
                            지방: <span className="font-bold text-gray-900">{meal.nutrition.fat}g</span>
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-700">
                            탄수화물: <span className="font-bold text-gray-900">{meal.nutrition.carbs}g</span>
                        </p>
                        <p className="text-gray-700">
                            조리시간: <span className="font-bold text-gray-900">{meal.prepTime}분</span>
                        </p>
                    </div>
                </div>

                <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-gray-900">재료</h4>
                    <p className="text-gray-700 text-sm font-medium">{meal.ingredients.join(', ')}</p>
                </div>

                <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-gray-900">조리 방법</h4>
                    <ol className="list-decimal list-inside space-y-1">
                        {meal.instructions.map((step, i) => (
                            <li key={i} className="text-gray-700 text-sm font-medium">
                                {step}
                            </li>
                        ))}
                    </ol>
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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="mb-8 flex justify-between items-center">
                    <Button variant="secondary" onClick={() => router.push('/dashboard')}>
                        ← 대시보드로 돌아가기
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleRegenerate}
                            disabled={generating}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={generating ? 'animate-spin' : ''} size={16} />
                            {generating ? '생성 중...' : '식단 재생성'}
                        </Button>
                        <Button
                            onClick={() => setShowChat(!showChat)}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                            <MessageSquare size={16} />
                            {showChat ? 'AI 대화 닫기' : 'AI와 대화하기'}
                        </Button>
                    </div>
                </div>

                <h1 className="text-4xl font-bold mb-2 text-gray-900">오늘의 AI 맞춤 식단</h1>
                <p className="text-xl text-gray-700 font-medium mb-8">
                    현재 단계: <span className="font-bold text-blue-600">{currentPhaseName}</span>
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Daily Nutrition Summary */}
                        <Card className="bg-blue-50 border-blue-100 p-6">
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

                        {/* Meals */}
                        <MealCard title="아침" meal={breakfast} />
                        <MealCard title="점심" meal={lunch} />
                        <MealCard title="저녁" meal={dinner} />
                        {snacks.map((snack, i) => (
                            <MealCard key={i} title={`간식 ${i + 1}`} meal={snack} />
                        ))}
                    </div>

                    {/* Chat Sidebar */}
                    {showChat && (
                        <div className="lg:col-span-1">
                            <div className="sticky top-4">
                                <MealChat userId={profile.id} currentMeals={meals} onMealsUpdated={handleMealsUpdated} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
