import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

// Should be configured in Vercel Environment Variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'img';
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || 'img.xuebz.com';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
});

export const config = {
    runtime: 'edge', // Use Edge Runtime for speed if possible, or omit for Node.js
    // Note: @aws-sdk might prefer Node.js runtime depending on version. 
    // Safety: standard Node.js runtime is often more compatible with AWS SDK v3 stream handling.
};

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    // --- JWT Authentication ---
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        );
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
        }
    } catch {
        return new Response(JSON.stringify({ error: 'Auth service error' }), { status: 500 });
    }

    // --- Upload Logic (unchanged) ---
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string || 'karma';

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        // sanitize filename
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
        const key = `${folder}/${year}/${month}/${timestamp}-${random}-${safeName}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: Buffer.from(buffer), // Convert ArrayBuffer to Buffer for Node env
            ContentType: file.type,
        });

        await s3Client.send(command);

        const publicUrl = `https://${R2_PUBLIC_DOMAIN}/${key}`;

        return new Response(JSON.stringify({
            key: key,
            url: publicUrl
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
