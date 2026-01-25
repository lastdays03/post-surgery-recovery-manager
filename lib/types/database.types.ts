export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    created_at: string
                    is_anonymous: boolean
                }
                Insert: {
                    id: string
                    created_at?: string
                    is_anonymous?: boolean
                }
                Update: {
                    id?: string
                    created_at?: string
                    is_anonymous?: boolean
                }
            }
            user_profiles: {
                Row: {
                    id: string
                    user_id: string | null
                    surgery_type: string
                    surgery_date: string
                    digestive_capacity: string
                    comorbidities: string[]
                    current_phase: string | null
                    local_storage_key: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    surgery_type: string
                    surgery_date: string
                    digestive_capacity: string
                    comorbidities?: string[]
                    current_phase?: string | null
                    local_storage_key?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    surgery_type?: string
                    surgery_date?: string
                    digestive_capacity?: string
                    comorbidities?: string[]
                    current_phase?: string | null
                    local_storage_key?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            daily_logs: {
                Row: {
                    id: string
                    profile_id: string
                    log_date: string
                    meals_completed: Json | null
                    exercises_completed: Json | null
                    symptoms: Json | null
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    profile_id: string
                    log_date: string
                    meals_completed?: Json | null
                    exercises_completed?: Json | null
                    symptoms?: Json | null
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    profile_id?: string
                    log_date?: string
                    meals_completed?: Json | null
                    exercises_completed?: Json | null
                    symptoms?: Json | null
                    notes?: string | null
                    created_at?: string
                }
            }
            knowledge_base: {
                Row: {
                    id: string
                    content: string
                    embedding: string
                    metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    content: string
                    embedding: string
                    metadata: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    content?: string
                    embedding?: string
                    metadata?: Json
                    created_at?: string
                }
            }
            token_usage: {
                Row: {
                    id: string
                    user_id: string
                    date: string
                    endpoint: string
                    input_tokens: number
                    output_tokens: number
                    cost: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    date: string
                    endpoint: string
                    input_tokens: number
                    output_tokens: number
                    cost: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    date?: string
                    endpoint?: string
                    input_tokens?: number
                    output_tokens?: number
                    cost?: number
                    created_at?: string
                }
            }
            ai_logs: {
                Row: {
                    id: string
                    user_id: string
                    endpoint: string
                    status: string
                    latency_ms: number
                    error_message: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    endpoint: string
                    status: string
                    latency_ms: number
                    error_message?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    endpoint?: string
                    status?: string
                    latency_ms?: number
                    error_message?: string | null
                    created_at?: string
                }
            }
            meal_plans: {
                Row: {
                    id: string
                    user_id: string
                    date: string
                    recovery_phase: string
                    meals: Json
                    preferences: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    date: string
                    recovery_phase: string
                    meals: Json
                    preferences?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    date?: string
                    recovery_phase?: string
                    meals?: Json
                    preferences?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Functions: {
            match_documents: {
                Args: {
                    query_embedding: string
                    match_threshold?: number
                    match_count?: number
                    filter?: Json
                }
                Returns: {
                    id: string
                    content: string
                    metadata: Json
                    similarity: number
                }[]
            }
        }
    }
}
