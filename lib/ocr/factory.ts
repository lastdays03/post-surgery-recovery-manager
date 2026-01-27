import { OCRProvider } from './provider.interface'
import { GoogleDocumentAIProvider } from './providers/google-document-ai'
import { TesseractProvider } from './providers/tesseract'
import { OpenAIVisionProvider } from './providers/openai-vision'

export type OCRProviderType = 'google' | 'tesseract' | 'openai' | 'auto'

export class OCRProviderFactory {
    private providers: Map<string, OCRProvider>

    constructor() {
        this.providers = new Map([
            ['google', new GoogleDocumentAIProvider()],
            ['tesseract', new TesseractProvider()],
            ['openai', new OpenAIVisionProvider()]
        ])
    }

    async getProvider(type: OCRProviderType): Promise<OCRProvider> {
        if (type === 'auto') {
            return await this.getAvailableProvider()
        }

        const provider = this.providers.get(type)
        if (!provider) {
            throw new Error(`Provider ${type} not found`)
        }

        // Check availability (e.g., API keys)
        const isAvailable = await provider.isAvailable()
        if (!isAvailable) {
            throw new Error(`Provider ${type} is not available (check API keys)`)
        }

        return provider
    }

    private async getAvailableProvider(): Promise<OCRProvider> {
        // Priority: Google > OpenAI > Tesseract
        const priority = ['google', 'openai', 'tesseract']

        for (consttype of priority) {
            const provider = this.providers.get(type)
            if (provider && await provider.isAvailable()) {
                return provider
            }
        }

        throw new Error('No OCR provider available')
    }

    async getAvailableProviders(): Promise<OCRProvider[]> {
        const available: OCRProvider[] = []

        for (const provider of this.providers.values()) {
            if (await provider.isAvailable()) {
                available.push(provider)
            }
        }

        return available
    }
}

// Singleton Instance
export const ocrFactory = new OCRProviderFactory()
