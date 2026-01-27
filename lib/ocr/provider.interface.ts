export interface OCRProviderConfig {
    apiKey?: string
    endpoint?: string
    options?: Record<string, any>
}

export interface OCRResult {
    text: string
    confidence: number
    metadata: {
        provider: 'google' | 'tesseract' | 'openai'
        processingTime: number
        pageCount?: number
    }
}

export interface OCRProvider {
    name: string

    // Check if API keys/dependencies are available
    isAvailable(): Promise<boolean>

    // Process OCR
    process(file: File | Buffer): Promise<OCRResult>

    // Estimated Cost (Optional)
    estimateCost?(file: File): number
}
