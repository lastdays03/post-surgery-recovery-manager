import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { StandardLayout } from '@/components/reports/pdf/common/StandardLayout'
import { Text } from '@react-pdf/renderer'

describe('PDF UI Infrastructure', () => {
    it('should render StandardLayout to buffer without errors', async () => {
        const doc = (
            <StandardLayout title="테스트 리포트" subtitle="2026-01-25">
                <Text>한글 렌더링 테스트입니다.</Text>
            </StandardLayout>
        )

        const buffer = await renderToBuffer(doc)

        expect(buffer).toBeDefined()
        expect(buffer.length).toBeGreaterThan(0)
    })
})
