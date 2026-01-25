import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { StandardLayout } from './common/StandardLayout'
import { WeeklyReport } from '@/lib/types/report.types'

const styles = StyleSheet.create({
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#374151', // gray-700
        borderLeft: '4pt solid #3b82f6',
        paddingLeft: 8,
    },
    cardContainer: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 20,
    },
    card: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        border: '1pt solid #e5e7eb',
        backgroundColor: '#f9fafb',
    },
    cardLabel: {
        fontSize: 10,
        color: '#6b7280',
        marginBottom: 5,
    },
    cardValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    cardTrend: {
        fontSize: 9,
        marginTop: 4,
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        flexDirection: 'row',
    },
    tableCol: {
        width: '25%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableCell: {
        margin: 5,
        fontSize: 9,
    },
    tableHeaderCell: {
        margin: 5,
        fontSize: 10,
        fontWeight: 'bold',
        backgroundColor: '#f3f4f6',
    },
    summary: {
        padding: 15,
        backgroundColor: '#eff6ff', // blue-50
        borderRadius: 8,
        marginTop: 20,
    },
    summaryText: {
        fontSize: 11,
        color: '#1e40af', // blue-800
        lineHeight: 1.5,
    },
})

interface WeeklyReportTemplateProps {
    report: WeeklyReport
    period: string
}

/**
 * 주간 회복 리포트 전용 PDF 템플릿입니다.
 */
export const WeeklyReportTemplate: React.FC<WeeklyReportTemplateProps> = ({ report, period }) => {
    return (
        <StandardLayout title="주간 회복 리포트" subtitle={period}>
            {/* 1. 요약 카드 섹션 */}
            <View style={styles.cardContainer}>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>평균 통증 수치</Text>
                    <Text style={[styles.cardValue, { color: '#ef4444' }]}>{report.avgPainLevel} / 10</Text>
                    <Text style={[styles.cardTrend, { color: report.symptomTrend === 'improving' ? '#10b981' : '#f59e0b' }]}>
                        {report.symptomTrend === 'improving' && '▼ 감소 추세 (호전 중)'}
                        {report.symptomTrend === 'worsening' && '▲ 증가 추세 (주의 필요)'}
                        {report.symptomTrend === 'stable' && '- 변화 없음'}
                    </Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>평균 기력 상태</Text>
                    <Text style={[styles.cardValue, { color: '#3b82f6' }]}>{report.avgEnergyLevel} / 10</Text>
                    <Text style={styles.cardTrend}>전반적인 활력 상태입니다.</Text>
                </View>
            </View>

            {/* 2. 일별 점수 테이블 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>일별 데이터 요약</Text>
                <View style={styles.table}>
                    {/* 헤더 */}
                    <View style={[styles.tableRow, { backgroundColor: '#f3f4f6' }]}>
                        <View style={[styles.tableCol, { width: '40%' }]}><Text style={styles.tableHeaderCell}>날짜</Text></View>
                        <View style={[styles.tableCol, { width: '30%' }]}><Text style={styles.tableHeaderCell}>통증</Text></View>
                        <View style={[styles.tableCol, { width: '30%' }]}><Text style={styles.tableHeaderCell}>기력</Text></View>
                    </View>
                    {/* 로우 */}
                    {report.dailyScores.map((day, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={[styles.tableCol, { width: '40%' }]}><Text style={styles.tableCell}>{day.date}</Text></View>
                            <View style={[styles.tableCol, { width: '30%' }]}><Text style={styles.tableCell}>{day.pain}</Text></View>
                            <View style={[styles.tableCol, { width: '30%' }]}><Text style={styles.tableCell}>{day.energy}</Text></View>
                        </View>
                    ))}
                </View>
            </View>

            {/* 3. 기록 충실도 및 권고 */}
            <View style={styles.summary}>
                <Text style={[styles.sectionTitle, { borderLeft: 'none', paddingLeft: 0, color: '#1e40af' }]}>종합 의견</Text>
                <Text style={styles.summaryText}>
                    이번 주 기록 충실도는 {report.complianceRate}% 입니다.
                    {report.complianceRate >= 80
                        ? ' 꾸준한 기록을 통해 회복 상태를 잘 관리하고 계십니다. 현재와 같은 상태를 유지하시기 바랍니다.'
                        : ' 조금 더 자주 기록을 남겨주시면 정밀한 회복 분석이 가능합니다.'}
                </Text>
                {report.avgPainLevel >= 7 && (
                    <Text style={[styles.summaryText, { color: '#b91c1c', fontWeight: 'bold', marginTop: 10 }]}>
                        주의: 평균 통증 수치가 높습니다. 담당 의료진과 상담을 권장합니다.
                    </Text>
                )}
            </View>
        </StandardLayout>
    )
}
