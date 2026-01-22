import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';

// Admin operations require the Service Role Key
const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

// Initialize Admin Client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// R2 Config
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'img';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://img.xuebz.com';

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

// Admin email whitelist
const ADMIN_EMAILS = ['perfhelf@gmail.com'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Verify admin authorization
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller || !ADMIN_EMAILS.includes(caller.email || '')) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        // GET - List all users
        if (req.method === 'GET') {
            const allUsers: any[] = [];
            let page = 1;
            const perPage = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabaseAdmin.auth.admin.listUsers({
                    page,
                    perPage
                });
                if (error) throw error;

                if (data.users && data.users.length > 0) {
                    allUsers.push(...data.users);
                    hasMore = data.users.length === perPage;
                    page++;
                } else {
                    hasMore = false;
                }
            }

            return res.status(200).json({ users: allUsers });
        }

        // PUT - Update user
        if (req.method === 'PUT') {
            const { userId, email, password } = req.body;
            if (!userId) {
                return res.status(400).json({ error: 'User ID required' });
            }

            const updateData: any = {};
            if (email) updateData.email = email;
            if (password) updateData.password = password;

            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
            if (error) throw error;
            return res.status(200).json({ user: data.user });
        }

        // PATCH - Revoke authorization (delete user data but keep account)
        if (req.method === 'PATCH') {
            const { userId, action } = req.body;
            if (!userId || action !== 'revoke') {
                return res.status(400).json({ error: 'User ID and action required' });
            }

            await cleanupUserData(userId);

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('Admin API error:', error);
        return res.status(500).json({ error: error.message });
    }
}

// Helper: Clean up all user data (DB + R2)
async function cleanupUserData(userId: string) {
    // 1. Remove from authorized_users
    await supabaseAdmin.from('authorized_users').delete().eq('user_id', userId);

    // 2. Delete DB Records (Karma Specific)
    // Cascading deletions are often cleaner if set in SQL, but explicit delete is safer.
    // Transactions, Ledgers, Categories, UserSettings

    // R2 Deletion logic for Karma transactions
    // Fetch transactions with attachments
    const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select('attachments')
        .eq('user_id', userId);

    if (transactions && transactions.length > 0) {
        const keysToDelete: { Key: string }[] = [];

        transactions.forEach(t => {
            if (Array.isArray(t.attachments)) {
                t.attachments.forEach((att: any) => {
                    if (att.key) keysToDelete.push({ Key: att.key });
                });
            }
        });

        if (keysToDelete.length > 0) {
            const chunkSize = 1000;
            for (let i = 0; i < keysToDelete.length; i += chunkSize) {
                const chunk = keysToDelete.slice(i, i + chunkSize);
                try {
                    await s3Client.send(new DeleteObjectsCommand({
                        Bucket: R2_BUCKET_NAME,
                        Delete: { Objects: chunk }
                    }));
                } catch (e) {
                    console.error('R2 delete failed for chunk', e);
                }
            }
        }
    }

    // Delete tables
    await supabaseAdmin.from('transactions').delete().eq('user_id', userId);
    await supabaseAdmin.from('categories').delete().eq('user_id', userId);
    await supabaseAdmin.from('ledgers').delete().eq('user_id', userId);
    await supabaseAdmin.from('user_settings').delete().eq('user_id', userId);
    await supabaseAdmin.from('profiles').delete().eq('id', userId);
}
