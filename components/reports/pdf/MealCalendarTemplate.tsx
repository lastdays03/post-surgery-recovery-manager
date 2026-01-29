import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { StandardLayout } from './common/StandardLayout'

const styles = StyleSheet.create({
    calendarContainer: {
        marginTop: 10,
        border: '1pt solid #e5e7eb',
    },
    weekHeader: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        borderBottom: '1pt solid #e5e7eb',
    },
    weekDayName: {
        flex: 1,
        padding: 5,
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#4b5563',
    },
    row: {
        flexDirection: 'row',
        borderBottom: '1pt solid #e5e7eb',
        minHeight: 80,
    },
    cell: {
        flex: 1,
        padding: 5,
        borderRight: '1pt solid #e5e7eb',
    },
    dayNumber: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    otherMonthDay: {
        color: '#d1d5db',
    },
    currentMonthDay: {
        color: '#111827',
    },
    mealItem: {
        fontSize: 8,
        padding: 2,
        marginBottom: 2,
        borderRadius: 2,
    },
    breakfast: {
        backgroundColor: '#eff6ff',
        color: '#1e40af',
    },
    lunch: {
        backgroundColor: '#ecfdf5',
        color: '#065f46',
    },
    dinner: {
        backgroundColor: '#fff7ed',
        color: '#9a3412',
    },
    snack: {
        backgroundColor: '#f5f3ff',
        color: '#5b21b6',
    },
    emptyCell: {
        backgroundColor: '#f9fafb',
    }
})

interface MealCalendarTemplateProps {
    year: number
    month: number
    calendarGrid: {
        date: string
        day: number
        isCurrentMonth: boolean
    }[][]
    mealStats: Record<string, {
        hasPlan: boolean
        meals: { type: string; names: string[] }[]
    }>
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export const MealCalendarTemplate: React.FC<MealCalendarTemplateProps> = ({
    year,
    month,
    calendarGrid,
    mealStats
}) => {
    const getMealStyle = (type: string) => {
        switch (type) {
            case 'breakfast': return styles.breakfast;
            case 'lunch': return styles.lunch;
            case 'dinner': return styles.dinner;
            default: return styles.snack;
        }
    };

    const getMealLabel = (type: string) => {
        switch (type) {
            case 'breakfast': return '아침';
            case 'lunch': return '점심';
            case 'dinner': return '저녁';
            default: return '간식';
        }
    };

    return (
        <StandardLayout
            title={`${year}년 ${month}월 식단 달력`}
            subtitle="수술 후 회복을 위한 맞춤형 식단 계획입니다."
        >
            <View style={styles.calendarContainer}>
                {/* 요일 헤더 */}
                <View style={styles.weekHeader}>
                    {WEEKDAYS.map((day) => (
                        <Text key={day} style={styles.weekDayName}>{day}</Text>
                    ))}
                </View>

                {/* 달력 그리드 */}
                {calendarGrid.map((week, weekIdx) => (
                    <View key={weekIdx} style={styles.row}>
                        {week.map((day, dayIdx) => {
                            const dayData = mealStats[day.date];
                            return (
                                <View
                                    key={dayIdx}
                                    style={[
                                        styles.cell,
                                        !day.isCurrentMonth ? styles.emptyCell : {},
                                        dayIdx === 6 ? { borderRight: 0 } : {}
                                    ]}
                                >
                                    <Text style={[
                                        styles.dayNumber,
                                        day.isCurrentMonth ? styles.currentMonthDay : styles.otherMonthDay
                                    ]}>
                                        {day.day}
                                    </Text>

                                    {day.isCurrentMonth && dayData?.hasPlan && (
                                        <View>
                                            {dayData.meals.map((meal, mIdx) => (
                                                <View key={mIdx} style={[styles.mealItem, getMealStyle(meal.type)]}>
                                                    <Text style={{ fontWeight: 'bold' }}>{getMealLabel(meal.type)}</Text>
                                                    <Text>{meal.names.join(', ')}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ))}
            </View>
        </StandardLayout>
    )
}
