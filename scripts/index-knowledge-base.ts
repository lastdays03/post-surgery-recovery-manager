import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import {
    indexSurgeryProtocols,
    indexMealDatabase,
    indexExerciseDatabase
} from '../lib/ai/embeddings'

async function main() {
    console.log('🚀 Starting knowledge base indexing...\n')

    try {
        console.log('📋 Indexing surgery protocols...')
        await indexSurgeryProtocols()
        console.log('✅ Surgery protocols indexed\n')

        console.log('🍽️  Indexing meal database...')
        await indexMealDatabase()
        console.log('✅ Meal database indexed\n')

        console.log('💪 Indexing exercise database...')
        await indexExerciseDatabase()
        console.log('✅ Exercise database indexed\n')

        console.log('🎉 Indexing complete!')
        process.exit(0)
    } catch (error) {
        console.error('❌ Indexing failed:', error)
        process.exit(1)
    }
}

main()
