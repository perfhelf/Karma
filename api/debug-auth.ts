import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const envVars = {
        VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    
    // Reveal partial values for debugging (safe: only shows structure, not full secret)
    const urlPreview = supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'EMPTY';
    const keyPreview = supabaseKey ? supabaseKey.substring(0, 20) + '...[' + supabaseKey.length + ' chars]' : 'EMPTY';

    let userTest = null;
    let error = null;

    if (supabaseUrl && supabaseKey) {
        try {
            // Test 1: Outbound connectivity
            const google = await fetch('https://www.google.com').then(r => r.status).catch(e => e.message);
            
            // Test 2: Explicit fetch binding
            // Use 'as any' to bypass type mismatch between node-fetch and GlobalFetch
            const supabase = createClient(supabaseUrl, supabaseKey, {
                auth: { 
                    autoRefreshToken: false, 
                    persistSession: false 
                },
                global: {
                    fetch: fetch as any
                }
            });
            const { data, error: err } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
            if (err) error = err;
            userTest = { data, google_test: google, node_version: process.version };
        } catch (e: any) {
            error = e.message;
        }
    }

    return res.status(200).json({
        env: envVars,
        url_preview: urlPreview,
        key_preview: keyPreview,
        test_result: userTest,
        error: error
    });
}
