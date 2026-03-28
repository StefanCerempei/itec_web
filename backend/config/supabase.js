const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase env vars are missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

const testSupabaseConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE key in environment.');
    }

    const healthTable = (process.env.SUPABASE_HEALTH_TABLE || '').trim() || '_healthcheck_nonexistent_';
    const { error } = await supabase.from(healthTable).select('*').limit(1);

    // If no health table is configured, a "table not found" error still proves API reachability.
    if (error && healthTable === '_healthcheck_nonexistent_') {
        const isExpectedMissingTable =
            error.code === '42P01' ||
            error.code === 'PGRST205' ||
            /schema cache|could not find the table/i.test(error.message || '');

        if (isExpectedMissingTable) return;
    }

    if (error) {
        throw new Error(`Supabase connection test failed: ${error.message}`);
    }
};

module.exports = { supabase, testSupabaseConnection };
