import { OCRProvider, OCRResult, OCRProviderConfig } from '../provider.interface'

export class GoogleDocumentAIProvider implements OCRProvider {
    name = 'Google Document AI'
    private config: OCRProviderConfig

    constructor(config?: OCRProviderConfig) {
        this.config = {
            apiKey: config?.apiKey || process.env.GOOGLE_DOCUMENT_AI_API_KEY,
            endpoint: config?.endpoint || process.env.GOOGLE_DOCUMENT_AI_ENDPOINT,
            ...config
        }
    }

    async isAvailable(): Promise<boolean> {
        return !!(this.config.apiKey && this.config.endpoint)
    }

    async process(file: File | Buffer): Promise<OCRResult> {
        // TODO: Implement Google Document AI in Phase 5
        throw new Error('Google Document AI not implemented yet')
    }

    estimateCost(file: File): number {
        return 0.0015 // $1.50 per 1000 pages
    }
}
