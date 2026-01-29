
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// IMPORTANT: Use Anon Key to simulate client-side access
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TARGET_USER_ID = 'a5fc9258-1e26-487b-94be-c79abd044f26';
const TARGET_DATE = '2026-01-29';

async function checkRlsAccess() {
    console.log(`Checking access with ANON KEY for User: ${TARGET_USER_ID}, Date: ${TARGET_DATE}`);

    const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', TARGET_USER_ID)
        .eq('date', TARGET_DATE);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('SUCCESS: Data fetched successfully with Anon Key.');
        console.log('Record ID:', data[0].id);
    } else {
        console.log('FAILURE: No data found with Anon Key. (RLS might be blocking)');
    }
}

checkRlsAccess();
