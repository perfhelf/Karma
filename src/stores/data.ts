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
export function getCategoryById(id: string) {
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
    category_id: string
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

        const response = await fetch('/api/r2-upload', {
            method: 'POST',
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

// Initialize Data
export async function fetchInitialData() {
    if (isLoading.value) return
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

    const { data, error } = await supabase
        .from('ledgers')
        .insert([ledger])
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
            ledgers.value[idx] = { ...ledgers.value[idx], ...updates }
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
    if (isDemoMode.value) {
        ledgers.value = ledgers.value.filter(l => l.id !== id)
        transactions.value.forEach(t => {
            if (t.ledger_id === id) t.ledger_id = null
        })
        return
    }

    const { error } = await supabase
        .from('ledgers')
        .delete()
        .eq('id', id)

    if (error) throw error
    ledgers.value = ledgers.value.filter(l => l.id !== id)
    // Transactions associated will be handled by DB constraints (ON DELETE SET NULL)
    // but local state needs update?
    // We should refresh transactions or manually update local
    transactions.value.forEach(t => {
        if (t.ledger_id === id) t.ledger_id = null
    })
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
    const dbRecord = {
        ledger_id: transaction.ledger_id,
        category_id: transaction.category_id,
        amount: transaction.amount,
        currency: transaction.currency,
        type: transaction.type,
        description: transaction.description,
        transaction_date: transaction.transaction_date,
        attachments: uploadedAttachments // JSONB
    }

    // 3. Insert into Supabase
    if (isDemoMode.value) {
        const newTxn: Transaction = {
            id: `mock-txn-${Date.now()}`,
            ...dbRecord,
            created_at: new Date().toISOString()
        }
        transactions.value.unshift(newTxn)
        // Re-sort
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
            const deletePromises = txn.attachments.map(att =>
                fetch('/api/r2-delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
// (Implemented as needed, currently UI mainly reads categories)
