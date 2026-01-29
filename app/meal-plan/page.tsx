'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/local-storage'
import { calculateRecoveryPhase } from '@/lib/profiling-engine'
import type { UserProfile } from '@/lib/types/user.types'
import type { Meal } from '@/lib/types/meal.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MealChat } from '@/components/meal-plan/meal-chat'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { RefreshCw, MessageSquare, Loader2, ArrowLeft, AlertCircle, X, Calendar } from 'lucide-react'


<h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">오늘의 AI 맞춤 식단</h1>
import {
    getTodayMealPlan,
    saveMealPlan,
    updateMealPlan,
    isMealPlanValid,
    isCacheValid,
    fetchMealPlan,
    getTodayDate,
    type MealPlan
} from '@/lib/services/meal-service'
import { saveMealPlanToDB, updateMealPlanInDB } from '@/lib/services/meal-service'

// ... (다른 imports 생략, replace 로직에서 처리)

export default function MealPlanPage() {
    const router = useRouter()
    // 쿼리 파라미터에서 date 가져오기 (없으면 오늘 날짜)

    const [profile, setProfile] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [meals, setMeals] = useState<Meal[]>([])
    const [showChat, setShowChat] = useState(false)
    const [currentPhaseName, setCurrentPhaseName] = useState('')
    const [recoveryPhase, setRecoveryPhase] = useState<'liquid' | 'soft' | 'regular'>('soft')
    const [isRegenOpen, setIsRegenOpen] = useState(false)

    useEffect(() => {
        // 날짜가 변경되면 데이터 로드
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

            let hasData = false

            // 1. 로컬 캐시 확인 (오늘 날짜인 경우에만)
            console.log('1️⃣ 데이터 조회 시작')

            // 오늘 날짜인 경우 로컬 스토리지 우선 확인
            const cachedPlan = getTodayMealPlan(savedProfile.id)
            if (cachedPlan && isMealPlanValid(cachedPlan, mealPhase)) {
                console.log('✅ 로컬 캐시 식단 사용')
                setMeals(cachedPlan.meals)
                setLoading(false)
                hasData = true
            }

            // 2. DB 조회 (캐시 없거나 날짜가 다른 경우)
            if (!hasData) {
                try {
                    console.log('2️⃣ DB에서 식단 조회 중...')
                    const dbPlan = await fetchMealPlan(savedProfile.id)

                    if (dbPlan && isMealPlanValid(dbPlan, mealPhase)) {
                        console.log('✅ DB 데이터 수신 - UI 업데이트')
                        setMeals(dbPlan.meals)
                        setLoading(false)
                        hasData = true
                    }
                } catch (dbError) {
                    console.error('DB 조회 실패:', dbError)
                }
            }

            // 3. 데이터 없음: LLM 생성 (오늘 날짜인 경우에만 자동 생성할지 고민, 일단 자동 생성)
            if (!hasData) {
                console.log('3️⃣ 데이터 없음 - LLM으로 새 식단 생성')
                await generateMeals(savedProfile.id, mealPhase, savedProfile.surgery_type)
            }
        } catch (e) {
            console.error('Error:', e)
        }

        setLoading(false)
    }

    const [error, setError] = useState<string | null>(null)

    const generateMeals = async (userId: string, phase: 'liquid' | 'soft' | 'regular', surgeryType?: string) => {
        setGenerating(true)
        setError(null)
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

                // 🔥 변경: DB에 저장
                if (data.mealPlan) {
                    await saveMealPlanToDB(data.mealPlan)
                    console.log('💾 식단을 DB에 저장했습니다')
                }
            } else {
                setError(data.error || '식단 생성에 실패했습니다.')
            }
        } catch (error) {
            console.error('식단 생성 오류:', error)
            setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
        } finally {
            setGenerating(false)
        }
    }

    const handleRegenerate = () => {
        if (profile) {
            generateMeals(profile.id, recoveryPhase, profile.surgery_type)
        }
    }

    const handleMealsUpdated = async (updatedMeals: Meal[]) => {
        setMeals(updatedMeals)

        // 🔥 변경: DB 업데이트
        if (profile) {
            await updateMealPlanInDB(profile.id, updatedMeals)
            console.log('💾 수정된 식단을 DB에 저장했습니다')
        }
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
    const snacks = meals.filter(m => m.mealTime.includes('snack'))

    // Calculate daily nutrition (안전 처리)
    const dailyNutrition = meals.reduce(
        (acc, meal) => {
            // nutrition 필드가 없는 경우 기본값 사용
            const nutrition = meal.nutrition || { calories: 0, protein: 0, fat: 0, carbs: 0 }
            return {
                calories: acc.calories + (nutrition.calories || 0),
                protein: acc.protein + (nutrition.protein || 0),
                fat: acc.fat + (nutrition.fat || 0),
                carbs: acc.carbs + (nutrition.carbs || 0)
            }
        },
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
            <Card className="mb-4 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {title} - {meal.name}
                    </h3>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm whitespace-nowrap">
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
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header Section */}
            {/* Header Section */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-xl font-bold text-gray-800">AI 맞춤 식단</h1>
                    </div>
                    <div className="flex gap-2">
                        {/* Additional header actions if needed */}
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header with Title and Actions */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 식단
                    </h1>

                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/meal-plan/calendar')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-900 border-gray-200 hover:bg-gray-50 h-9 px-4 text-sm rounded-full shadow-sm"
                        >
                            <Calendar size={14} />
                            달력보기
                        </Button>

                        <Button
                            onClick={() => setShowChat(!showChat)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white border border-transparent h-9 px-4 text-sm rounded-full shadow-sm"
                        >
                            <MessageSquare size={14} />
                            {showChat ? '대화 닫기' : 'AI와 대화하기'}
                        </Button>

                        {/* Regenerate Button with Confirmation Dialog */}
                        <Dialog open={isRegenOpen} onOpenChange={setIsRegenOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    disabled={generating}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-900 border-gray-200 hover:bg-gray-50 h-9 px-4 text-sm rounded-full shadow-sm"
                                >
                                    <RefreshCw className={generating ? 'animate-spin' : ''} size={14} />
                                    {generating ? '생성 중...' : '식단 다시 추천받기'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md rounded-2xl p-6">
                                <DialogHeader className="text-left space-y-2">
                                    <DialogTitle className="text-xl font-bold leading-relaxed whitespace-pre-wrap">
                                        {'해당 날짜의 식단을\n다시 추천 받으시겠어요?'}
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-500 text-sm">
                                        기존에 있는 맞춤 추천 식단은 삭제돼요.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="mt-6 sm:justify-center">
                                    <Button
                                        onClick={() => {
                                            setIsRegenOpen(false)
                                            handleRegenerate()
                                        }}
                                        className="w-full bg-black hover:bg-gray-800 text-white font-bold py-6 rounded-xl text-base"
                                    >
                                        다시 추천받기
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {showChat && (
                    <div className="mb-8">
                        <MealChat userId={profile.id} currentMeals={meals} onMealsUpdated={handleMealsUpdated} />
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setError(null)} className="text-red-700 hover:bg-red-100 hover:text-red-900 h-8 w-8 p-0">
                            <X size={16} />
                        </Button>
                    </div>
                )}


                <p className="text-lg sm:text-xl text-gray-700 font-medium mb-6 sm:mb-8">
                    현재 단계: <span className="font-bold text-blue-600">{currentPhaseName}</span>
                </p>

                <div className="space-y-6">
                    {/* Daily Nutrition Summary */}
                    <Card className="bg-blue-50 border-blue-100 p-4 sm:p-6">
                        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-blue-900">일일 영양 목표 달성도</h2>
                        {/* 반응형 그리드: 모바일 1열, 태블릿 2열, 데스크톱 4열 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                                <p className="text-4xl sm:text-3xl font-bold text-blue-600">{dailyNutrition.calories}</p>
                                <p className="text-gray-600 text-sm font-medium mt-1">총 칼로리 (kcal)</p>
                            </div>
                            <div className="text-center bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                                <p className="text-4xl sm:text-3xl font-bold text-green-600">{dailyNutrition.protein}g</p>
                                <p className="text-gray-600 text-sm font-medium mt-1">단백질</p>
                            </div>
                            <div className="text-center bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                                <p className="text-4xl sm:text-3xl font-bold text-orange-600">{dailyNutrition.fat}g</p>
                                <p className="text-gray-600 text-sm font-medium mt-1">지방</p>
                            </div>
                            <div className="text-center bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                                <p className="text-4xl sm:text-3xl font-bold text-purple-600">{dailyNutrition.carbs}g</p>
                                <p className="text-gray-600 text-sm font-medium mt-1">탄수화물</p>
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
            </div>
        </div>
    )
}
