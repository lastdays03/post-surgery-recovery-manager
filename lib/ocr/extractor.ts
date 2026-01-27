import type { MedicalDataExtraction, FieldExtractionResult } from '@/lib/types/medical-profile'

function createEmptyFieldResult<T>(): FieldExtractionResult<T> {
    return { value: null, confidence: 0 }
}

export async function extractMedicalData(
    ocrText: string,
    options: {
        useRegex: boolean
        useLLM: boolean
    } = { useRegex: true, useLLM: false }
): Promise<MedicalDataExtraction> {

    const result: MedicalDataExtraction = {
        basic: {
            surgery_type: createEmptyFieldResult<string>(),
            surgery_date: createEmptyFieldResult<string>(),
            age: createEmptyFieldResult<number>(),
            weight: createEmptyFieldResult<number>(),
            height: createEmptyFieldResult<number>(),
            digestive_capacity: createEmptyFieldResult<'good' | 'moderate' | 'poor'>(),
            comorbidities: createEmptyFieldResult<string[]>(),
            allergies: createEmptyFieldResult<string[]>()
        },
        advanced: {
            nrs_2002_score: createEmptyFieldResult<number>(),
            weight_change_6m: createEmptyFieldResult<number>(),
            bmi: createEmptyFieldResult<number>(),
            sga_grade: createEmptyFieldResult<'A' | 'B' | 'C'>(),
            serum_albumin: createEmptyFieldResult<number>(),
            oral_intake_possible: createEmptyFieldResult<boolean>(),
            expected_fasting_days: createEmptyFieldResult<number>(),
            intake_rate: createEmptyFieldResult<number>(),
            gastric_emptying_delayed: createEmptyFieldResult<boolean>(),
            has_gerd: createEmptyFieldResult<boolean>(),
            has_sarcopenia: createEmptyFieldResult<boolean>()
        },
        hasAdvancedData: false,
        rawText: ocrText
    }

    if (options.useRegex) {
        extractWithRegex(ocrText, result)
    }

    // LLM Logic to be implemented in future phases

    // Check for advanced data
    result.hasAdvancedData = hasAnyAdvancedField(result.advanced)

    return result
}

function extractWithRegex(text: string, result: MedicalDataExtraction): void {
    // Surgery Type Pattern
    const surgeryPatterns: Record<string, RegExp> = {
        'gastric_resection': /위\s*절제|gastrectomy|subtotal\s*gastrectomy/i,
        'colon_resection': /대장\s*절제|colectomy|hemicolectomy/i,
        'tkr': /슬관절\s*치환|knee\s*replacement|TKR/i,
        'spinal_fusion': /척추\s*유합|spinal\s*fusion|PLIF|TLIF/i,
        'cholecystectomy': /담낭\s*절제|cholecystectomy/i,
        'thyroidectomy': /갑상선\s*절제|thyroidectomy/i
    }

    for (const [type, pattern] of Object.entries(surgeryPatterns)) {
        if (pattern.test(text)) {
            result.basic.surgery_type = { value: type, confidence: 0.85 }
            break // Prioritize first match
        }
    }

    // Surgery Date (YYYY-MM-DD or YYYY.MM.DD)
    const dateMatch = text.match(/수술\s*일자?[:\s]*(\d{4}[-./]\d{1,2}[-./]\d{1,2})/i)
    if (dateMatch) {
        const normalizedDate = dateMatch[1].replace(/[./]/g, '-')
        result.basic.surgery_date = { value: normalizedDate, confidence: 0.9, sourceText: dateMatch[0] }
    }

    // Age
    const ageMatch = text.match(/나이[:\s]*(\d{1,3})\s*세|(\d{1,3})\s*세/i)
    if (ageMatch) {
        const age = parseInt(ageMatch[1] || ageMatch[2])
        if (age >= 18 && age <= 100) {
            result.basic.age = { value: age, confidence: 0.88, sourceText: ageMatch[0] }
        }
    }

    // Weight
    const weightMatch = text.match(/체중[:\s]*([\d.]+)\s*kg/i)
    if (weightMatch) {
        const weight = parseFloat(weightMatch[1])
        if (weight >= 30 && weight <= 200) {
            result.basic.weight = { value: weight, confidence: 0.9, sourceText: weightMatch[0] }
        }
    }

    // Height
    const heightMatch = text.match(/신장|키[:\s]*([\d.]+)\s*cm/i)
    if (heightMatch) {
        const height = parseFloat(heightMatch[1])
        if (height >= 100 && height <= 250) {
            result.basic.height = { value: height, confidence: 0.9, sourceText: heightMatch[0] }
        }
    }

    // Comorbidities
    const comorbidities: string[] = []
    if (/당뇨|diabetes/i.test(text)) comorbidities.push('당뇨')
    if (/고혈압|hypertension/i.test(text)) comorbidities.push('고혈압')
    if (/심장|cardiac|heart/i.test(text)) comorbidities.push('심장질환')
    if (/신장|kidney|renal/i.test(text)) comorbidities.push('신장질환')
    if (/간|liver|hepatic/i.test(text)) comorbidities.push('간질환')

    if (comorbidities.length > 0) {
        result.basic.comorbidities = { value: comorbidities, confidence: 0.75 }
    }

    // Allergies (Very strict patterns)
    const allergies: string[] = []
    if (/알러지|allergy/i.test(text)) {
        if (/항생제|antibiotic/i.test(text)) allergies.push('항생제')
        if (/진통제|painkiller/i.test(text)) allergies.push('진통제')
        // Add more allergy patterns as needed
    }
    if (allergies.length > 0) {
        result.basic.allergies = { value: allergies, confidence: 0.8 }
    }


    // === Advanced Metrics ===

    // NRS-2002
    const nrsMatch = text.match(/NRS[-\s]*2002[:\s]*(\d+)/i)
    if (nrsMatch) {
        const score = parseInt(nrsMatch[1])
        if (score >= 0 && score <= 7) {
            result.advanced.nrs_2002_score = { value: score, confidence: 0.88, sourceText: nrsMatch[0] }
        }
    }

    // Serum Albumin
    const albuminMatch = text.match(/알부민[:\s]*([\d.]+)\s*g\/L|albumin[:\s]*([\d.]+)/i)
    if (albuminMatch) {
        const albumin = parseFloat(albuminMatch[1] || albuminMatch[2])
        result.advanced.serum_albumin = { value: albumin, confidence: 0.82, sourceText: albuminMatch[0] }
    }

    // SGA Grade
    const sgaMatch = text.match(/SGA[:\s]*([ABC])/i)
    if (sgaMatch) {
        result.advanced.sga_grade = {
            value: sgaMatch[1].toUpperCase() as 'A' | 'B' | 'C',
            confidence: 0.8,
            sourceText: sgaMatch[0]
        }
    }

    // Weight Change
    const weightChangeMatch = text.match(/체중\s*감소[:\s]*([\d.]+)\s*kg/i)
    if (weightChangeMatch) {
        result.advanced.weight_change_6m = {
            value: -parseFloat(weightChangeMatch[1]), // Negative value for loss
            confidence: 0.75,
            sourceText: weightChangeMatch[0]
        }
    }

    // Sarcopenia
    if (/근감소|sarcopenia/i.test(text)) {
        result.advanced.has_sarcopenia = { value: true, confidence: 0.7 }
    }

    // GERD
    if (/위식도\s*역류|GERD/i.test(text)) {
        result.advanced.has_gerd = { value: true, confidence: 0.75 }
    }
}

function hasAnyAdvancedField(advanced: MedicalDataExtraction['advanced']): boolean {
    return Object.values(advanced).some(field => field.value !== null)
}
