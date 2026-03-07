/**
 * Vercel Serverless — /api/cron/cleanup-orphan-images
 *
 * Karma 孤儿数据防护 (孤儿数据 Skill + 清洁算法 Skill)
 *
 * R2 前缀: karma/
 * 引用来源: transactions.attachments JSONB 数组 → [{key, url, type}, ...]
 *
 * 宽限期: 7 天
 * 调度: cron-job.org 每周日 05:00 UTC
 * 安全: 幂等操作 + 7天宽限期 (CRON_SECRET 可选)
 */

import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'img'

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
})

const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000

export default async function handler(req: any, res: any) {
    // CRON_SECRET 可选: 设置了则校验，未设置则放行 (幂等安全操作)
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
        const secret = req.headers['x-cron-secret'] || req.query.secret
        if (secret !== cronSecret) {
            return res.status(401).json({ error: 'Unauthorized' })
        }
    }

    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        // Step 1: R2 列出 karma/ 下所有对象
        const r2Objects: any[] = []
        let continuationToken: string | undefined = undefined
        do {
            const resp = await s3Client.send(new ListObjectsV2Command({
                Bucket: R2_BUCKET_NAME,
                Prefix: 'karma/',
                ContinuationToken: continuationToken,
            }))
            if (resp.Contents) r2Objects.push(...resp.Contents)
            continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined
        } while (continuationToken)

        if (r2Objects.length === 0) {
            return res.status(200).json({ message: 'No R2 objects found', orphans: 0 })
        }

        // Step 2: DB 中提取所有引用的 R2 key
        const referencedKeys = new Set<string>()
        let offset = 0
        let hasMore = true
        while (hasMore) {
            const { data: transactions, error } = await supabase
                .from('transactions')
                .select('attachments')
                .not('attachments', 'is', null)
                .range(offset, offset + 499)
            if (error) throw error
            if (!transactions || transactions.length < 500) hasMore = false
            for (const tx of (transactions || [])) {
                const attachments = tx.attachments || []
                for (const att of attachments) {
                    if (att.key) referencedKeys.add(att.key)
                }
            }
            offset += 500
        }

        // Step 3: 差集 = 孤儿（超过宽限期）
        const now = Date.now()
        const orphans = r2Objects.filter((obj: any) => {
            if (referencedKeys.has(obj.Key)) return false
            const age = now - new Date(obj.LastModified).getTime()
            return age > GRACE_PERIOD_MS
        })

        if (orphans.length === 0) {
            return res.status(200).json({
                message: 'No orphans found',
                total_r2: r2Objects.length,
                referenced: referencedKeys.size,
            })
        }

        // Step 4: 批量删除
        let deletedCount = 0
        for (let i = 0; i < orphans.length; i += 1000) {
            const batch = orphans.slice(i, i + 1000)
            await s3Client.send(new DeleteObjectsCommand({
                Bucket: R2_BUCKET_NAME,
                Delete: {
                    Objects: batch.map((obj: any) => ({ Key: obj.Key })),
                    Quiet: true,
                },
            }))
            deletedCount += batch.length
        }

        console.log(`[Orphan Cleanup] Karma: deleted ${deletedCount} orphans`)
        return res.status(200).json({
            message: 'Orphan cleanup complete',
            total_r2: r2Objects.length,
            referenced: referencedKeys.size,
            deleted: deletedCount,
        })

    } catch (err: any) {
        console.error('[Orphan Cleanup] Error:', err)
        return res.status(500).json({ error: 'Orphan cleanup failed' })
    }
}
