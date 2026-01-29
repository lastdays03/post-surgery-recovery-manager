import { Card } from '@/components/ui/card'
import type { Meal } from '@/lib/types/meal.types'

interface MealCardProps {
    meal?: Meal
    title: string
    simple?: boolean // If true, show less detail (for dashboard)
    onClick?: () => void
}

export function MealCard({ meal, title, simple = false, onClick }: MealCardProps) {
    if (!meal) {
        return (
            <Card className="h-full bg-gray-50 border-dashed border-2 p-6 flex items-center justify-center">
                <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-400 mb-1">{title}</h3>
                    <p className="text-gray-500 text-sm">준비 중</p>
                </div>
            </Card>
        )
    }

    const cardContent = (
        <>
            <div>
                <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{title}</span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-xs font-medium">
                        {meal.nutrition.calories} kcal
                    </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-3 truncate">
                    {meal.name}
                </h3>

                {!simple && (
                    <div className="space-y-3 mb-4">
                        <div className="flex gap-3 text-sm text-gray-600">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">탄수화물</span>
                                <span className="font-medium">{meal.nutrition.carbs}g</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">단백질</span>
                                <span className="font-medium text-blue-600">{meal.nutrition.protein}g</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">지방</span>
                                <span className="font-medium">{meal.nutrition.fat}g</span>
                            </div>
                        </div>
                    </div>
                )}

                {simple && (
                    <p className="text-sm text-gray-500 truncate mb-4">
                        {meal.ingredients.slice(0, 3).join(', ')}...
                    </p>
                )}
            </div>

            {/* Tags or Simple Footer */}
            <div className="mt-auto pt-3 border-t border-gray-100 flex gap-2 overflow-x-auto hide-scrollbar">
                {meal.tags?.slice(0, 2).map((tag, i) => (
                    <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-sm whitespace-nowrap">
                        #{tag}
                    </span>
                ))}
            </div>
        </>
    )

    if (onClick) {
        return (
            <button onClick={onClick} className="w-full text-left">
                <Card className="h-full p-5 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer">
                    {cardContent}
                </Card>
            </button>
        )
    }

    return (
        <Card className="h-full p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            {cardContent}
        </Card>
    )
}
