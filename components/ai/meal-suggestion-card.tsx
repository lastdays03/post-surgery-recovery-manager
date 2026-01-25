import { Meal } from '@/lib/types/meal.types'
import { Utensils, Clock, Check } from 'lucide-react'

interface MealSuggestionCardProps {
    meal: Meal
    onSelect?: (meal: Meal) => void
}

export function MealSuggestionCard({ meal, onSelect }: MealSuggestionCardProps) {
    return (
        <div className="bg-white border-2 border-emerald-100 rounded-xl overflow-hidden shadow-md my-2 hover:border-emerald-300 transition-colors">
            <div className="bg-emerald-50 p-3 flex justify-between items-center border-b border-emerald-100">
                <div className="flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-emerald-900">{meal.name}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-700 bg-white px-2 py-1 rounded-full border border-emerald-200">
                    <Clock className="w-3 h-3" />
                    {meal.prepTime}분
                </div>
            </div>

            <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded-lg">
                        <span className="block text-xs text-gray-500">칼로리</span>
                        <span className="font-semibold">{meal.nutrition.calories} kcal</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                        <span className="block text-xs text-gray-500">단백질</span>
                        <span className="font-semibold">{meal.nutrition.protein}g</span>
                    </div>
                </div>

                <div className="text-sm">
                    <h4 className="font-semibold mb-1 text-gray-700">핵심 재료</h4>
                    <div className="flex flex-wrap gap-1">
                        {meal.ingredients.slice(0, 3).map((ing, i) => (
                            <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-100">
                                {ing}
                            </span>
                        ))}
                    </div>
                </div>

                {onSelect && (
                    <button
                        onClick={() => onSelect(meal)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        식단에 추가하기
                    </button>
                )}
            </div>
        </div>
    )
}
