import { OCRProvider, OCRResult } from '../provider.interface'

export class TesseractProvider implements OCRProvider {
    name = 'Tesseract OCR'

    async isAvailable(): Promise<boolean> {
        // Available client-side
        return true
    }

    async process(file: File | Buffer): Promise<OCRResult> {
        const startTime = Date.now()

        try {
            // Dynamic import for client-side execution
            const Tesseract = (await import('tesseract.js')).default

            // Create image URL
            const imageUrl = file instanceof File
                ? URL.createObjectURL(file)
                : this.bufferToDataURL(file)

            // Run Tesseract (Korean + English)
            const worker = await Tesseract.createWorker('kor+eng')
            const { data } = await worker.recognize(imageUrl)
            await worker.terminate()

            // Revoke URL if it was created from File
            if (file instanceof File) {
                URL.revokeObjectURL(imageUrl)
            }

            return {
                text: data.text,
                confidence: data.confidence / 100,
                metadata: {
                    provider: 'tesseract',
                    processingTime: Date.now() - startTime
                }
            }

        } catch (error: any) {
            throw new Error(`Tesseract processing failed: ${error.message}`)
        }
    }

    private bufferToDataURL(buffer: Buffer): string {
        const base64 = buffer.toString('base64')
        return `data:image/png;base64,${base64}`
    }

    estimateCost(file: File): number {
        return 0 // Free
    }
}
