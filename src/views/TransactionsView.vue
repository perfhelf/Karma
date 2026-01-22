<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Download, Calendar, ChevronDown } from 'lucide-vue-next'
import { 
  transactions, 
  ledgers, 
  parentCategories, 
  getSubcategories,
  getCategoryById,
  getLedgerById,
  formatCurrency 
} from '../stores/data'

const searchQuery = ref('')
const dateRange = ref({ start: '', end: '' })
const amountRange = ref({ min: '', max: '' })
const selectedLedger = ref('')
const selectedCategory = ref('')

// Filtered transactions
const filteredTransactions = computed(() => {
  let result = [...transactions.value].sort((a, b) => 
    new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  )
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(t => 
      t.description.toLowerCase().includes(query) ||
      getCategoryById(t.category_id)?.name.toLowerCase().includes(query)
    )
  }
  
  if (selectedLedger.value) {
    if (selectedLedger.value === 'total') {
      result = result.filter(t => t.ledger_id === null)
    } else {
      result = result.filter(t => t.ledger_id === selectedLedger.value)
    }
  }
  
  if (selectedCategory.value) {
    // If selected category is a parent, include all its subcategories
    const category = getCategoryById(selectedCategory.value)
    if (category && category.parent_id === null) {
      const subIds = getSubcategories(category.id).map(c => c.id)
      result = result.filter(t => t.category_id === selectedCategory.value || subIds.includes(t.category_id))
    } else {
      // Exact match for subcategory or parent info
      result = result.filter(t => t.category_id === selectedCategory.value)
    }
  }
  
  if (dateRange.value.start) {
    result = result.filter(t => t.transaction_date >= dateRange.value.start)
  }
  if (dateRange.value.end) {
    result = result.filter(t => t.transaction_date <= dateRange.value.end)
  }
  
  if (amountRange.value.min) {
    result = result.filter(t => t.amount >= Number(amountRange.value.min))
  }
  if (amountRange.value.max) {
    result = result.filter(t => t.amount <= Number(amountRange.value.max))
  }
  
  return result.slice(0, 100)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">账单列表</h1>
        <p class="text-gray-500 dark:text-slate-400 mt-1">共 {{ filteredTransactions.length }} 条记录 (显示前100条)</p>
      </div>
      <button class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all">
        <Download :size="18" />
        <span>导出</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
      <!-- Row 1 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Search -->
        <div class="relative">
          <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索备注、分类..."
            class="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        <!-- Ledger Filter -->
        <div class="relative">
          <select
            v-model="selectedLedger"
            class="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none text-gray-900 dark:text-white appearance-none cursor-pointer"
          >
            <option value="">全部账本</option>
            <option value="total">总账户</option>
            <option v-for="ledger in ledgers.filter(l => !l.is_archived)" :key="ledger.id" :value="ledger.id">
              {{ ledger.icon }} {{ ledger.name }}
            </option>
          </select>
          <ChevronDown :size="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <!-- Category Filter (Grouped) -->
        <div class="relative">
          <select
            v-model="selectedCategory"
            class="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none text-gray-900 dark:text-white appearance-none cursor-pointer"
          >
            <option value="">全部分类</option>
            <template v-for="parent in parentCategories" :key="parent.id">
              <option :value="parent.id" class="font-bold">
                {{ parent.icon }} {{ parent.name }} (全部)
              </option>
              <option 
                v-for="sub in getSubcategories(parent.id)" 
                :key="sub.id" 
                :value="sub.id"
                class="pl-4"
              >
                &nbsp;&nbsp;&nbsp;&nbsp;{{ sub.icon }} {{ sub.name }}
              </option>
            </template>
          </select>
          <ChevronDown :size="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <!-- Row 2 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Date Range -->
        <div class="flex items-center gap-2">
          <Calendar :size="18" class="text-gray-400 shrink-0" />
          <input v-model="dateRange.start" type="date" class="flex-1 min-w-0 px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none text-gray-900 dark:text-white text-sm" />
          <span class="text-gray-400 shrink-0">至</span>
          <input v-model="dateRange.end" type="date" class="flex-1 min-w-0 px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none text-gray-900 dark:text-white text-sm" />
        </div>

        <!-- Amount Range -->
        <div class="flex items-center gap-2">
          <span class="text-gray-400 text-sm shrink-0">金额</span>
          <input v-model="amountRange.min" type="number" placeholder="最低" class="flex-1 min-w-0 px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none text-gray-900 dark:text-white placeholder-gray-400 text-sm" />
          <span class="text-gray-400 shrink-0">-</span>
          <input v-model="amountRange.max" type="number" placeholder="最高" class="flex-1 min-w-0 px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none text-gray-900 dark:text-white placeholder-gray-400 text-sm" />
        </div>

        <!-- Clear Button -->
        <button 
          @click="searchQuery = ''; selectedLedger = ''; selectedCategory = ''; dateRange = { start: '', end: '' }; amountRange = { min: '', max: '' }"
          class="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 rounded-xl hover:bg-gray-200 transition-all"
        >
          清除筛选
        </button>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
      <div v-if="filteredTransactions.length === 0" class="text-center py-16 text-gray-400 dark:text-slate-500">
        <p class="text-lg">暂无匹配记录</p>
        <p class="text-sm mt-1">尝试调整筛选条件</p>
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">日期</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">分类</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">账本</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">备注</th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-slate-400">金额</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
            <tr v-for="txn in filteredTransactions" :key="txn.id" class="hover:bg-gray-50 dark:hover:bg-slate-700/50">
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-slate-300">{{ txn.transaction_date }}</td>
              <td class="px-4 py-3 text-sm">
                <span class="flex items-center gap-2">
                  <span>{{ getCategoryById(txn.category_id)?.icon || '📁' }}</span>
                  <span class="text-gray-700 dark:text-slate-300">{{ getCategoryById(txn.category_id)?.name || '未分类' }}</span>
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                {{ txn.ledger_id ? `${getLedgerById(txn.ledger_id)?.icon} ${getLedgerById(txn.ledger_id)?.name}` : '总账户' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-slate-300 max-w-xs truncate">{{ txn.description }}</td>
              <td class="px-4 py-3 text-sm text-right font-medium" :class="txn.type === 'income' ? 'text-green-500' : 'text-red-500'">
                {{ txn.type === 'income' ? '+' : '-' }}{{ formatCurrency(txn.amount) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
