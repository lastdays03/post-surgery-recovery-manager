import React from 'react'
import { Page, View, Text, StyleSheet, Document, Font } from '@react-pdf/renderer'
import '@/lib/pdf/font-registry' // 폰트 등록 실행

// 스타일 정의
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'NanumGothic',
        backgroundColor: '#ffffff',
        color: '#333333',
    },
    header: {
        marginBottom: 20,
        borderBottom: '1pt solid #eeeeee',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a56db', // blue-700
    },
    meta: {
        fontSize: 10,
        color: '#666666',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 9,
        color: '#999999',
        borderTop: '0.5pt solid #eeeeee',
        paddingTop: 5,
    },
    content: {
        flexGrow: 1,
    },
})

interface StandardLayoutProps {
    title: string
    subtitle?: string
    children: React.ReactNode
}

/**
 * 모든 PDF 리포트의 기본 뼈대가 되는 레이아웃 컴포넌트입니다.
 */
export const StandardLayout: React.FC<StandardLayoutProps> = ({ title, subtitle, children }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* 헤더 섹션 */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle && <Text style={styles.meta}>{subtitle}</Text>}
                </View>
                <Text style={styles.meta}>발행일: {new Date().toLocaleDateString('ko-KR')}</Text>
            </View>

            {/* 메인 콘텐츠 섹션 */}
            <View style={styles.content}>{children}</View>

            {/* 푸터 섹션 */}
            <Text
                style={styles.footer}
                render={({ pageNumber, totalPages }) => `페이지 ${pageNumber} / ${totalPages}`}
                fixed
            />
            <Text style={[styles.footer, { bottom: 20 }]}>본 리포트는 수술 후 회복 관리 매니저에서 생성되었습니다.</Text>
        </Page>
    </Document>
)
