
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableInfo() {
    // Check for today's meal plan (2026-01-29)
    console.log('Checking for meal plans on 2026-01-29...');
    const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('date', '2026-01-29')
        .limit(5);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log(`Found ${data.length} records for 2026-01-29.`);
        data.forEach((row, index) => {
            console.log(`[Record ${index + 1}] UserID: ${row.user_id}, ID: ${row.id}`);
        });
    } else {
        console.log('No records found for 2026-01-29.');

        // Check recent records just in case
        const { data: recent } = await supabase
            .from('meal_plans')
            .select('date, created_at')
            .order('created_at', { ascending: false })
            .limit(3);

        console.log('Most recent 3 records:', recent);
    }
}

checkTableInfo();
