import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { generateMockTransactions, mockLedgers, mockCategories } from './mockData'

// ============================================
// UNIFIED DATA STORE FOR KARMA (Supabase + R2)
// ============================================

const isLoading = ref(false)
const error = ref<string | null>(null)
export const isDemoMode = ref(false)

// ==================== LEDGERS ====================
export interface Ledger {
    id: string
    name: string
    icon: string
    color: string
    is_default: boolean
    is_archived: boolean
}

export const ledgers = ref<Ledger[]>([])

export const emojiCategories = [
    {
        name: '表情 & 人物',
        icon: '😀',
        emojis: [
            '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇',
            '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑',
            '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
            '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵',
            '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️',
            '👤', '👥', '🫂', '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '🧓', '👴'
        ]
    },
    {
        name: '活动',
        icon: '⚽',
        emojis: [
            '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸',
            '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽',
            '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️',
            '🤺', '🤾', '⛳', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '攀', '🚵', '🚴', '🏆',
            '🥇', '🥈', '🥉', '🏅', '🎖', '🏵', '🎗', '🎫', '🎟', '🎪', '🤹', '🎭', '🩰',
            '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻',
            '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩'
        ]
    },
    {
        name: '旅行 & 地点',
        icon: '✈️',
        emojis: [
            '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛',
            '🚜', '🏍', '🛵', '🚲', '🛴', '🛺', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟',
            '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️',
            '🛫', '🛬', '🛩', '💺', '🛰', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥', '🛳',
            '⛴', '🚢', '⚓', '⛽', '🚧', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟', '🎡', '🎢',
            '🎠', '⛲', '⛱', '🏖', '🏝', '🌋', '⛰', '🏔', '🗻', '⛺',
            '🏠', '🏡', '🏘', '🏚', '🏗', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨',
            '🏪', '🏫', '🏩', '💒', '🏛', '⛪', '🕌', '🕍', '🛕', '🕋', '⛩', '🛤', '🛣'
        ]
    },
    {
        name: '物体',
        icon: '💡',
        emojis: [
            '⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾',
            '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠',
            '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡',
            '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷',
            '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒', '🛠', '⛏', '🪚', '🔩', '⚙️',
            '🪤', '🧱', '⛓', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡', '⚔️', '🛡', '🚬',
            '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳', '🩹',
            '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡', '🧹', '🪠', '🧺', '🧻',
            '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎', '🔑',
            '🗝', '🚪', '🪑', '🛋', '🛏', '🛌', '🧸', '🪆', '🖼', '🪞', '🪟', '🛍', '🛒',
            '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️',
            '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷', '🪧', '📪', '📫', '📬', '📭',
            '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒', '🗓', '📆',
            '📅', '🗑', '📇', '🗃', '🗳', '🗄', '📋', '📁', '📂', '🗂', '🗞', '📰', '📓',
            '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇',
            '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊', '🖋', '✒️', '🖌', '🖍', '📝', '✏️',
            '🔍', '🔎', '🔏', '🔐', '🔒', '🔓'
        ]
    },
    {
        name: '符号 & 旗帜',
        icon: '❤️',
        emojis: [
            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞',
            '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯',
            '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏',
            '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚',
            '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲',
            '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯',
            '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❕', '❓', '❔',
            '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯',
            '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️',
            '🛗', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧', '🚻', '🚮',
            '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕',
            '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣',
            '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸', '⏯', '⏹', '⏺', '⏭', '⏮', '⏩',
            '⏪', '🔀', '🔁', '🔂', '◀️', '🔼', '🔽', '⏫', '⏬', '➡️', '⬅️', '⬆️', '⬇️',
            '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔆', '🔃', '🔄',
            '🔙', '🔚', '🔛', '🔜', '🔝'
        ]
    }
]

export const ledgerIconOptions = emojiCategories.flatMap(c => c.emojis)

// ==================== CATEGORIES ====================
export interface Category {
    id: string
    name: string
    parent_id: string | null
    icon: string
}

export const categories = ref<Category[]>([])

// Computed: parent categories only
export const parentCategories = computed(() => {
    return categories.value.filter(c => c.parent_id === null)
})

// Get subcategories for a parent
export function getSubcategories(parentId: string) {
    return categories.value.filter(c => c.parent_id === parentId)
}

// Get category by ID
export function getCategoryById(id: string | null) {
    if (!id) return undefined
    return categories.value.find(c => c.id === id)
}

// ==================== TRANSACTIONS ====================
export interface Attachment {
    key: string
    url: string
    name: string
    type: string
}

export interface Transaction {
    id: string
    ledger_id: string | null  // null = 总账户
    category_id: string | null // null = 未分类
    amount: number
    currency: string
    type: 'expense' | 'income'
    description: string
    attachments: Attachment[] // JSONB Decoupled Storage
    transaction_date: string
    created_at: string
}

export const transactions = ref<Transaction[]>([])

// ==================== COMPUTED STATS ====================

export function calculateTotal(txns: Transaction[], type: 'expense' | 'income') {
    return txns
        .filter(t => t.type === type)
        .reduce((sum, t) => sum + t.amount, 0)
}

export function getLedgerBalance(ledgerId: string | null) {
    const txns = transactions.value.filter(t =>
        ledgerId === null ? true : t.ledger_id === ledgerId
    )
    const income = calculateTotal(txns, 'income')
    const expense = calculateTotal(txns, 'expense')
    return income - expense
}

export const totalBalance = computed(() => getLedgerBalance(null))

export function getLedgerTransactionCount(ledgerId: string | null) {
    return transactions.value.filter(t =>
        ledgerId === null ? true : t.ledger_id === ledgerId
    ).length
}

export function getExpenseByCategory(txns: Transaction[]) {
    const result: Record<string, number> = {}
    txns.filter(t => t.type === 'expense').forEach(t => {
        if (!t.category_id) {
            const groupName = '未分类'
            result[groupName] = (result[groupName] || 0) + t.amount
            return
        }
        const cat = getCategoryById(t.category_id)
        if (!cat) return
        let groupName = cat.name
        if (cat.parent_id) {
            const parent = getCategoryById(cat.parent_id)
            if (parent) groupName = parent.name
        }
        result[groupName] = (result[groupName] || 0) + t.amount
    })
    return result
}

// ==================== CURRENCIES ====================
export const currencies = [
    { code: 'CNY', name: '人民币' },
    { code: 'USD', name: '美元' },
    { code: 'EUR', name: '欧元' },
    { code: 'GBP', name: '英镑' },
    { code: 'JPY', name: '日元' },
    { code: 'HKD', name: '港币' },
    { code: 'AUD', name: '澳元' },
    { code: 'MYR', name: '马来西亚林吉特' },
    { code: 'THB', name: '泰铢' },
    { code: 'SGD', name: '新加坡元' },
]

// ==================== UTILITY FUNCTIONS ====================
export function formatCurrency(amount: number) {
    return `¥${amount.toLocaleString()}`
}

export function getLedgerById(id: string) {
    return ledgers.value.find(l => l.id === id)
}

// ==================== R2 STORAGE ACTIONS ====================

export async function uploadFileToR2(file: File): Promise<Attachment | null> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'karma') // Separate folder for Karma

    try {
        if (isDemoMode.value) {
            // Mock upload
            await new Promise(r => setTimeout(r, 500))
            return {
                key: `mock-key-${Date.now()}`,
                url: URL.createObjectURL(file), // Local blob url for preview
                name: file.name,
                type: file.type
            }
        }

        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch('/api/r2-upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session?.access_token}`
            },
            body: formData
        })

        if (!response.ok) {
            throw new Error('Upload failed')
        }

        const { key, url } = await response.json()
        return {
            key,
            url,
            name: file.name,
            type: file.type
        }
    } catch (e) {
        console.error('R2 Upload Error:', e)
        return null
    }
}

// ==================== SUPABASE ACTIONS ====================

const isInitialized = ref(false)

export function resetStore() {
    isInitialized.value = false
    ledgers.value = []
    categories.value = []
    transactions.value = []
    isLoading.value = false
    error.value = null
}

// Initialize Data
export async function fetchInitialData(force = false) {
    if (isLoading.value) return
    if (isInitialized.value && !force) return // Cache hit

    isLoading.value = true
    error.value = null

    try {
        if (isDemoMode.value) {
            // Load Mock Data
            ledgers.value = mockLedgers
            categories.value = mockCategories
            // Generate transactions if empty, or just regenerate for demo
            if (transactions.value.length === 0) {
                transactions.value = generateMockTransactions()
            }
            isLoading.value = false
            return
        }

        // 1. Fetch Ledgers
        const { data: ledgersData, error: ledgersError } = await supabase
            .from('ledgers')
            .select('*')
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: true })

        if (ledgersError) throw ledgersError
        ledgers.value = ledgersData || []

        // 2. Fetch Categories
        const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('*')
        // We can manually sort hierarchy if needed, but DB storage is flat

        if (categoriesError) throw categoriesError
        categories.value = categoriesData || []

        // 3. Fetch Transactions
        const { data: transactionsData, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .order('transaction_date', { ascending: false })

        if (transactionsError) throw transactionsError
        transactions.value = transactionsData || []

        isInitialized.value = true // Mark as initialized

    } catch (e: any) {
        console.error('Failed to fetch data:', e)
        error.value = e.message
    } finally {
        isLoading.value = false
    }
}

// ---- Ledger Actions ----
export async function addLedger(ledger: Omit<Ledger, 'id'>) {
    if (isDemoMode.value) {
        const newLedger = { ...ledger, id: `mock-ledger-${Date.now()}` }
        ledgers.value.push(newLedger)
        return newLedger
    }

    // Get current user for robustness (Client-side validation of auth)
    const { data: { user } } = await supabase.auth.getUser()

    const ledgerPayload = {
        ...ledger,
        user_id: user?.id // Explicitly passing it guarantees it (if SQL default fails for some reason)
    }

    const { data, error } = await supabase
        .from('ledgers')
        .insert([ledgerPayload])
        .select()
        .single()

    if (error) throw error
    if (data) ledgers.value.push(data)
    return data
}

export async function updateLedger(id: string, updates: Partial<Ledger>) {
    if (isDemoMode.value) {
        const idx = ledgers.value.findIndex(l => l.id === id)
        if (idx !== -1) {
            ledgers.value[idx] = { ...ledgers.value[idx], ...updates } as Ledger
            return ledgers.value[idx]
        }
        return null
    }

    const { data, error } = await supabase
        .from('ledgers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    if (data) {
        const idx = ledgers.value.findIndex(l => l.id === id)
        if (idx !== -1) ledgers.value[idx] = data
    }
    return data
}

export async function deleteLedger(id: string) {
    console.log('[Store] deleteLedger called for id:', id)

    if (isDemoMode.value) {
        console.log('[Store] Demo mode delete')
        ledgers.value = ledgers.value.filter(l => l.id !== id)
        transactions.value = transactions.value.filter(t => t.ledger_id !== id)
        return
    }

    try {
        console.log('[Store] Starting Clean Deletion Flow...')
        // [Clean Algorithm] Step 1: Find all transactions for this ledger
        const { data: ledgerTxns, error: fetchError } = await supabase
            .from('transactions')
            .select('id, attachments')
            .eq('ledger_id', id)

        if (fetchError) throw fetchError

        // [Clean Algorithm] Step 2: Delete R2 files and Transactions
        if (ledgerTxns && ledgerTxns.length > 0) {
            // 2a. Collect and delete all attachments
            const allAttachments: Attachment[] = ledgerTxns.flatMap((t: any) => t.attachments || [])

            if (allAttachments.length > 0) {
                console.log(`[Clean Ledger] Deleting ${allAttachments.length} attachments from ${ledgerTxns.length} transactions`)

                const deletePromises = allAttachments.map(async (att) => {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

                    try {
                        const { data: { session: delSession } } = await supabase.auth.getSession()
                        const res = await fetch('/api/r2-delete', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${delSession?.access_token}`
                            },
                            body: JSON.stringify({ key: att.key }),
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);

                        if (res.ok) console.log(`[R2] Deleted: ${att.key}`);
                        else console.error(`[R2] Failed: ${att.key}, Status: ${res.status}`);
                    } catch (e: any) {
                        if (e.name === 'AbortError') {
                            console.error(`[R2] Timeout deleting: ${att.key}`);
                        } else {
                            console.error(`[R2] Error: ${att.key}`, e);
                        }
                    }
                });

                await Promise.allSettled(deletePromises);
            }

            // 2b. Delete transactions
            const txIds = ledgerTxns.map(t => t.id)
            const { error: txnDeleteError } = await supabase
                .from('transactions')
                .delete()
                .in('id', txIds)

            if (txnDeleteError) throw txnDeleteError
        }

        // [Clean Algorithm] Step 3: Delete Ledger
        const { error, count } = await supabase
            .from('ledgers')
            .delete({ count: 'exact' })
            .eq('id', id)

        if (error) throw error
        if (count === 0) throw new Error('Ledger not found or permission denied')


        // [Clean Algorithm] Step 4: Update Local State
        ledgers.value = ledgers.value.filter(l => l.id !== id)
        transactions.value = transactions.value.filter(t => t.ledger_id !== id)

    } catch (e) {
        console.error('Delete Ledger Failed:', e)
        throw e
    }
}

// ---- Transaction Actions ----
export async function addTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'attachments'> & { files?: File[] }) {

    // 1. Upload files to R2 first (Decoupled Storage)
    const uploadedAttachments: Attachment[] = []

    if (transaction.files && transaction.files.length > 0) {
        // Parallel uploads
        const uploadPromises = transaction.files.map(file => uploadFileToR2(file))
        const results = await Promise.all(uploadPromises)

        results.forEach(res => {
            if (res) uploadedAttachments.push(res)
        })
    }

    // 2. Prepare DB record (Metadata + Attachment Keys)
    // Get current user for robustness
    const { data: { user } } = await supabase.auth.getUser()

    const dbRecord = {
        ledger_id: transaction.ledger_id,
        category_id: transaction.category_id,
        amount: transaction.amount,
        currency: transaction.currency,
        type: transaction.type,
        description: transaction.description,
        transaction_date: transaction.transaction_date,
        attachments: uploadedAttachments, // JSONB
        user_id: user?.id // Explicit user_id
    }

    // 3. Insert into Supabase
    if (isDemoMode.value) {
        const newTxn: Transaction = {
            id: `mock-txn-${Date.now()}`,
            ...dbRecord,
            created_at: new Date().toISOString()
        }
        // ... (mock logic unchanged)
        transactions.value.unshift(newTxn)
        transactions.value.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
        return newTxn
    }

    const { data, error } = await supabase
        .from('transactions')
        .insert([dbRecord])
        .select()
        .single()

    if (error) throw error
    if (data) {
        transactions.value.unshift(data)
        // Re-sort if date is not newest?
        transactions.value.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    }
    return data
}

export async function deleteTransaction(id: string) {
    // 1. Get transaction to check for attachments
    const txn = transactions.value.find(t => t.id === id)

    // 2. Clean Deletion of R2 Files
    if (txn?.attachments && txn.attachments.length > 0) {
        console.log(`[Clean Algorithm] Ensuring deletion of ${txn.attachments.length} attachments for txn ${id}`)

        if (!isDemoMode.value) {
            // We use Promise.allSettled to ensure we try to delete all, even if some fail
            const { data: { session: txnSession } } = await supabase.auth.getSession()
            const deletePromises = txn.attachments.map(att =>
                fetch('/api/r2-delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${txnSession?.access_token}`
                    },
                    body: JSON.stringify({ key: att.key })
                })
                    .then(res => {
                        if (res.ok) console.log(`[R2] Deleted: ${att.key}`)
                        else console.error(`[R2] Failed to delete: ${att.key}`)
                    })
                    .catch(e => console.error(`[R2] Error deleting ${att.key}:`, e))
            )

            await Promise.allSettled(deletePromises)
        }
    }

    // 3. Delete DB Record
    if (isDemoMode.value) {
        transactions.value = transactions.value.filter(t => t.id !== id)
        return
    }

    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

    if (error) throw error

    // 4. Update Local State
    transactions.value = transactions.value.filter(t => t.id !== id)
}

// ---- Category Actions ----
// Implemented properly now
export async function addCategory(category: Omit<Category, 'id'>) {
    if (isDemoMode.value) {
        const newCat = { ...category, id: `mock-cat-${Date.now()}` }
        categories.value.push(newCat)
        return newCat
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
        .from('categories')
        .insert([{
            ...category,
            user_id: user?.id
        }])
        .select()
        .single()

    if (error) throw error
    if (data) categories.value.push(data)
    return data
}

export async function updateCategory(id: string, updates: Partial<Category>) {
    if (isDemoMode.value) {
        const idx = categories.value.findIndex(c => c.id === id)
        if (idx !== -1) {
            categories.value[idx] = { ...categories.value[idx], ...updates } as Category
            return categories.value[idx]
        }
        return null
    }

    const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    if (data) {
        const idx = categories.value.findIndex(c => c.id === id)
        if (idx !== -1) categories.value[idx] = data
    }
    return data
}

export async function deleteCategory(id: string) {
    if (isDemoMode.value) {
        categories.value = categories.value.filter(c => c.id !== id)
        // Also remove subs? Or UI handles it logic?
        // Simple filter for now.
        return
    }

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

    if (error) throw error
    categories.value = categories.value.filter(c => c.id !== id)
}
