'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Lightbulb } from 'lucide-react'
import type { Meal } from '@/lib/types/meal.types'

interface MealDetailModalProps {
    meal: Meal | null
    mealTime: string
    isOpen: boolean
    onClose: () => void
}

export function MealDetailModal({ meal, mealTime, isOpen, onClose }: MealDetailModalProps) {
    if (!meal) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold text-gray-900">
                            {mealTime} - {meal.name}
                        </DialogTitle>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {meal.nutrition.calories} kcal
                        </span>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Nutrition Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">단백질: <span className="font-semibold text-gray-900">{meal.nutrition.protein}g</span></p>
                            <p className="text-sm text-gray-500 mb-1">지방: <span className="font-semibold text-gray-900">{meal.nutrition.fat}g</span></p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">탄수화물: <span className="font-semibold text-gray-900">{meal.nutrition.carbs}g</span></p>
                            <p className="text-sm text-gray-500 mb-1">조리시간: <span className="font-semibold text-gray-900">{meal.prepTime}분</span></p>
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">재료</h3>
                        <p className="text-gray-700 leading-relaxed">
                            {meal.ingredients.join(', ')}
                        </p>
                    </div>

                    {/* Instructions */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">조리 방법</h3>
                        <ol className="space-y-2">
                            {meal.instructions.map((instruction, index) => (
                                <li key={index} className="text-gray-700 flex gap-2">
                                    <span className="font-semibold">{index + 1}.</span>
                                    <span>{instruction}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Notes/Tips */}
                    {meal.notes && (
                        <Card className="bg-yellow-50 border-yellow-200 p-4">
                            <div className="flex items-start gap-3">
                                <Lightbulb className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {meal.notes}
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
