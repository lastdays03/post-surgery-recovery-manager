import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { WeeklyReportTemplate } from '@/components/reports/pdf/WeeklyReportTemplate'
import { WeeklyReport } from '@/lib/types/report.types'
import { saveAs } from 'file-saver'

/**
 * PDF 리포트 생성을 위한 커스텀 훅입니다.
 */
export function usePdfReport() {
    const [isGenerating, setIsGenerating] = useState(false)

    const downloadWeeklyReport = async (report: WeeklyReport) => {
        setIsGenerating(true)
        try {
            const period = `${report.dailyScores[0].date} ~ ${report.dailyScores[report.dailyScores.length - 1].date}`

            // 1. PDF Blob 생성
            const doc = <WeeklyReportTemplate report={report} period={period} />
            const blob = await pdf(doc).toBlob()

            // 2. 파일 다운로드 (file-saver 사용)
            saveAs(blob, `weekly_report_${report.dailyScores[0].date}.pdf`)
        } catch (error) {
            console.error('Failed to generate PDF:', error)
            alert('PDF 생성 중 오류가 발생했습니다.')
        } finally {
            setIsGenerating(false)
        }
    }

    return {
        downloadWeeklyReport,
        isGenerating
    }
}
