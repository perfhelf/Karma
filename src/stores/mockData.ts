import type { Ledger, Category, Transaction } from './data'

export const mockLedgers: Ledger[] = [
    { id: 'ledger-1', name: '日常开销', icon: '💳', color: 'blue', is_default: true, is_archived: false },
    { id: 'ledger-2', name: '旅行基金', icon: '✈️', color: 'green', is_default: false, is_archived: false },
    { id: 'ledger-3', name: '公司报销', icon: '🏢', color: 'orange', is_default: false, is_archived: false },
    { id: 'ledger-4', name: '私房钱', icon: '🔒', color: 'gray', is_default: false, is_archived: false },
]

export const mockCategories: Category[] = [
    { id: 'cat-food', name: '餐饮', parent_id: null, icon: '🍔' },
    { id: 'cat-breakfast', name: '早餐', parent_id: 'cat-food', icon: '🥐' },
    { id: 'cat-lunch', name: '午餐', parent_id: 'cat-food', icon: '🍱' },
    { id: 'cat-dinner', name: '晚餐', parent_id: 'cat-food', icon: '🥩' },

    { id: 'cat-transport', name: '交通', parent_id: null, icon: '🚗' },
    { id: 'cat-taxi', name: '打车', parent_id: 'cat-transport', icon: '🚕' },
    { id: 'cat-subway', name: '地铁', parent_id: 'cat-transport', icon: '🚇' },

    { id: 'cat-shopping', name: '购物', parent_id: null, icon: '🛍️' },
    { id: 'cat-digital', name: '数码', parent_id: 'cat-shopping', icon: '💻' },
    { id: 'cat-clothes', name: '服饰', parent_id: 'cat-shopping', icon: '👕' },

    { id: 'cat-income', name: '收入', parent_id: null, icon: '💰' },
    { id: 'cat-salary', name: '工资', parent_id: 'cat-income', icon: '💼' },
    { id: 'cat-bonus', name: '奖金', parent_id: 'cat-income', icon: '🧧' },
]

function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function generateMockTransactions(): Transaction[] {
    const txns: Transaction[] = []
    const now = new Date()
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())

    // Generate ~1500 transactions over 2 years
    for (let i = 0; i < 1500; i++) {
        const date = randomDate(twoYearsAgo, now)
        const isExpense = Math.random() > 0.3 // 70% expense

        let amount = 0
        let categoryId = ''
        const randomLedger = mockLedgers[Math.floor(Math.random() * mockLedgers.length)]
        let ledgerId = randomLedger ? randomLedger.id : 'ledger-1'

        if (isExpense) {
            amount = Math.floor(Math.random() * 500) + 10 // 10 - 510
            // Random expense category
            const expenseCats = ['cat-breakfast', 'cat-lunch', 'cat-dinner', 'cat-taxi', 'cat-subway', 'cat-digital', 'cat-clothes']
            const randomCat = expenseCats[Math.floor(Math.random() * expenseCats.length)]
            categoryId = randomCat || 'cat-food'
        } else {
            amount = Math.floor(Math.random() * 10000) + 5000 // 5000 - 15000
            // Random income category
            const incomeCats = ['cat-salary', 'cat-bonus']
            const randomCat = incomeCats[Math.floor(Math.random() * incomeCats.length)]
            categoryId = randomCat || 'cat-salary'
            // Monthly salary usually, but random here for demo
        }

        txns.push({
            id: `mock-txn-${i}`,
            ledger_id: ledgerId,
            category_id: categoryId,
            amount: amount,
            currency: 'CNY',
            type: isExpense ? 'expense' : 'income',
            description: isExpense ? '随机消费' : '工资收入',
            attachments: [],
            transaction_date: date.toISOString(),
            created_at: date.toISOString()
        })
    }

    // Sort by date desc
    return txns.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
}
