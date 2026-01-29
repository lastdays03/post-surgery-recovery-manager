'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { X, Loader2, Calendar as CalendarIcon } from 'lucide-react'
import { ko } from 'date-fns/locale'
import { format, addDays } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { useRouter } from 'next/navigation'

interface MealGenerationModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    onGenerate: (range: DateRange) => Promise<void>
}

export function MealGenerationModal({ isOpen, onClose, userId, onGenerate }: MealGenerationModalProps) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [isLoading, setIsLoading] = useState(false)

    if (!isOpen) return null

    const handleConfirm = async () => {
        if (!dateRange?.from || !dateRange?.to) return

        setIsLoading(true)
        try {
            await onGenerate(dateRange)
            // The parent component should handle navigation or state update
        } catch (error) {
            console.error(error)
            alert('식단 생성 중 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    // Calculate nights/days just for display info
    const getDurationText = () => {
        if (!dateRange?.from) return ''
        if (!dateRange.to) return `${format(dateRange.from, 'M월 d일', { locale: ko })} (1일)`

        const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        return `${format(dateRange.from, 'M월 d일', { locale: ko })} - ${format(dateRange.to, 'M월 d일', { locale: ko })} (${diffDays}일)`
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="text-blue-600" size={20} />
                        식단 생성 기간 선택
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col items-center gap-6">
                    <div className="text-center space-y-1">
                        <p className="text-gray-600">
                            언제부터 언제까지의 식단이 필요하신가요?
                        </p>
                        <p className="text-xs text-gray-500">
                            오늘 이후의 날짜만 선택 가능합니다.
                        </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border">
                        <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={setDateRange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            className="bg-white rounded-xl shadow-sm"
                            numberOfMonths={1}
                        />
                    </div>

                    <div className="w-full bg-blue-50 p-4 rounded-xl flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-700">선택된 기간</span>
                        <span className="text-sm font-bold text-blue-900">
                            {dateRange?.from ? getDurationText() : '기간을 선택해주세요'}
                        </span>
                    </div>

                    <Button
                        disabled={!dateRange?.from || !dateRange?.to || isLoading}
                        onClick={handleConfirm}
                        className="w-full py-6 text-lg font-bold rounded-xl"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="animate-spin" />
                                AI가 맞춤 식단을 구성중입니다...
                            </div>
                        ) : (
                            '선택한 기간으로 식단 생성하기'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
