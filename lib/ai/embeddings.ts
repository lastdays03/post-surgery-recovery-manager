import { supabaseAdmin } from '@/lib/supabase-client'
import { LLMService } from './llm-service'
import { SURGERY_PROTOCOLS } from '@/data/protocols/surgery-protocols'
import { SAMPLE_MEALS } from '@/data/meals/sample-meals'
import exerciseDatabase from '@/data/exercises/exercise-database.json'

export async function generateEmbedding(text: string): Promise<number[]> {
    const client = LLMService.getClient()
    return client.generateEmbedding(text)
}

// 수술 프로토콜 인덱싱
export async function indexSurgeryProtocols() {
    const protocols = Object.entries(SURGERY_PROTOCOLS)

    for (const [surgeryType, protocol] of protocols) {
        // 회복 단계별 인덱싱
        for (const phase of protocol.phases) {
            const document = `
수술 종류: ${surgeryType}
회복 단계: ${phase.name} (${phase.description})
기간: ${phase.daysRange[0]}일 ~ ${phase.daysRange[1]}일
금기 식품: ${phase.forbiddenFoods.join(', ')}
권장 영양: 단백질 ${protocol.nutritionRequirements.proteinMultiplier}g/kg, 칼로리 ${protocol.nutritionRequirements.calorieTarget}kcal
      `.trim()

            const embedding = await generateEmbedding(document)

            await supabaseAdmin.from('knowledge_base').insert({
                content: document,
                embedding: JSON.stringify(embedding), // pgvector format
                metadata: {
                    category: 'protocol',
                    surgery_type: surgeryType,
                    phase: phase.name,
                    tags: phase.forbiddenFoods
                }
            } as any)

            console.log(`✅ Indexed protocol: ${surgeryType} - ${phase.name}`)
        }

        // 재활 프로토콜 인덱싱
        if (protocol.rehabPhases) {
            for (const rehabPhase of protocol.rehabPhases) {
                const document = `
수술 종류: ${surgeryType}
재활 단계: ${rehabPhase.name} (${rehabPhase.description})
주차: ${rehabPhase.weekRange[0]}주 ~ ${rehabPhase.weekRange[1]}주
허용 운동: ${rehabPhase.allowedExercises.join(', ')}
주의사항: ${rehabPhase.warnings?.join('. ') || '없음'}
        `.trim()

                const embedding = await generateEmbedding(document)

                await supabaseAdmin.from('knowledge_base').insert({
                    content: document,
                    embedding: JSON.stringify(embedding),
                    metadata: {
                        category: 'rehab',
                        surgery_type: surgeryType,
                        phase: rehabPhase.name,
                        tags: rehabPhase.allowedExercises,
                        warnings: rehabPhase.warnings || []
                    }
                } as any)

                console.log(`✅ Indexed rehab: ${surgeryType} - ${rehabPhase.name}`)
            }
        }
    }
}

// 식단 데이터베이스 인덱싱
export async function indexMealDatabase() {
    for (const meal of SAMPLE_MEALS) {
        const document = `
메뉴명: ${meal.name}
식감 타입: ${meal.phase}
영양 정보: 칼로리 ${meal.nutrition.calories}kcal, 단백질 ${meal.nutrition.protein}g, 탄수화물 ${meal.nutrition.carbs}g, 지방 ${meal.nutrition.fat}g
특징: ${meal.phase}단계, ${meal.mealTime}
재료: ${meal.ingredients.join(', ')}
조리 시간: ${meal.prepTime}분
    `.trim()

        const embedding = await generateEmbedding(document)

        await supabaseAdmin.from('knowledge_base').insert({
            content: document,
            embedding: JSON.stringify(embedding),
            metadata: {
                category: 'meal',
                meal_id: meal.id,
                texture_type: meal.phase,
                tags: [meal.phase, meal.mealTime],
                substitution_group: 'general'
            }
        } as any)

        console.log(`✅ Indexed meal: ${meal.name}`)
    }
}

// 운동 데이터베이스 인덱싱
export async function indexExerciseDatabase() {
    // exerciseDatabase is { exercises: [...] }
    for (const exercise of exerciseDatabase.exercises) {
        const targetSurgery = ['general']
        const document = `
운동명: ${exercise.name}
설명: ${exercise.description}
난이도: ${exercise.difficulty}
    `.trim()

        const embedding = await generateEmbedding(document)

        await supabaseAdmin.from('knowledge_base').insert({
            content: document,
            embedding: JSON.stringify(embedding),
            metadata: {
                category: 'exercise',
                exercise_id: exercise.id,
                difficulty: exercise.difficulty,
                target_surgery: targetSurgery,
                precautions: []
            }
        } as any)

        console.log(`✅ Indexed exercise: ${exercise.name}`)
    }
}
