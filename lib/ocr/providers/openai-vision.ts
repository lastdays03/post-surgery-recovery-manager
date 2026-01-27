import OpenAI from 'openai'
import { OCRProvider, OCRResult, OCRProviderConfig } from '../provider.interface'

export class OpenAIVisionProvider implements OCRProvider {
    name = 'OpenAI Vision'
    private client: OpenAI

    constructor(config?: OCRProviderConfig) {
        this.client = new OpenAI({
            apiKey: config?.apiKey || process.env.OPENAI_API_KEY,
            dangerouslyAllowBrowser: true // Client-side usage requires this, but be careful with keys
        })
    }

    async isAvailable(): Promise<boolean> {
        return !!process.env.OPENAI_API_KEY
    }

    async process(file: File | Buffer): Promise<OCRResult> {
        const startTime = Date.now()

        try {
            const base64Image = await this.fileToBase64(file)
            const mimeType = file instanceof File ? file.type : 'image/png'

            const response = await this.client.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Please extract all text from this medical document accurately.
Pay special attention to:
- Surgery type and date
- Patient age, weight, height
- NRS-2002 score
- Serum Albumin level
- Comorbidities
- Clinical test results

Keep Korean and numbers exactly as they are.`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 2000
            })

            const text = response.choices[0].message.content || ''
            const confidence = response.choices[0].finish_reason === 'stop' ? 0.9 : 0.7

            return {
                text,
                confidence,
                metadata: {
                    provider: 'openai',
                    processingTime: Date.now() - startTime
                }
            }

        } catch (error: any) {
            throw new Error(`OpenAI Vision processing failed: ${error.message}`)
        }
    }

    private async fileToBase64(file: File | Buffer): Promise<string> {
        if (file instanceof Buffer) {
            return file.toString('base64')
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1]
                resolve(base64)
            }
            reader.onerror = reject
            reader.readAsDataURL(file as Blob)
        })
    }

    estimateCost(file: File): number {
        return 0.01 // ~$0.01 per image
    }
}
