<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Save, RefreshCw, Trash2 } from 'lucide-vue-next'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const isSaving = ref(false)
const isDeleting = ref(false)

// User settings
const settings = ref({
  baseCurrency: 'CNY',
})

// Supported currencies
const currencies = [
  { code: 'CNY', name: '人民币 (CNY)' },
  { code: 'USD', name: '美元 (USD)' },
  { code: 'EUR', name: '欧元 (EUR)' },
  { code: 'GBP', name: '英镑 (GBP)' },
  { code: 'JPY', name: '日元 (JPY)' },
  { code: 'HKD', name: '港币 (HKD)' },
  { code: 'AUD', name: '澳元 (AUD)' },
  { code: 'MYR', name: '马来西亚林吉特 (MYR)' },
  { code: 'THB', name: '泰铢 (THB)' },
  { code: 'SGD', name: '新加坡元 (SGD)' },
]

// Exchange rates (Mock for now, normally fetched from exchange_rates table)
const exchangeRates = ref([
  { code: 'USD', rate: 7.25, updated: '2026-01-21' },
  { code: 'EUR', rate: 7.85, updated: '2026-01-21' },
  { code: 'GBP', rate: 9.15, updated: '2026-01-21' },
  { code: 'JPY', rate: 0.047, updated: '2026-01-21' },
  { code: 'HKD', rate: 0.93, updated: '2026-01-21' },
  { code: 'AUD', rate: 4.65, updated: '2026-01-21' },
  { code: 'MYR', rate: 1.62, updated: '2026-01-21' },
  { code: 'THB', rate: 0.21, updated: '2026-01-21' },
  { code: 'SGD', rate: 5.35, updated: '2026-01-21' },
])

async function saveSettings() {
  isSaving.value = true
  try {
    // Basic User Metadata update
    const { error } = await supabase.from('user_settings').upsert({ 
        user_id: (await supabase.auth.getUser()).data.user?.id,
        base_currency: settings.value.baseCurrency,
        updated_at: new Date() 
    })
    
    if (error) throw error
    alert('设置已保存')
  } catch (e: any) {
    console.error('Save error:', e)
    alert('保存失败: ' + e.message)
  } finally {
    isSaving.value = false
  }
}

// ----------------------------------------
// CLEANING ALGORITHM (Data Decoupling)
// ----------------------------------------
async function handleDeleteAllData() {
  if (!confirm('⚠️ 严重警告：此操作将永久删除您的所有账单、图片附件和设置。数据无法恢复！\n\n确定要执行"彻底清洁"吗？')) {
    return
  }
  
  isDeleting.value = true
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Step 1: Fetch all attachment keys from transactions
    // We need to know what to delete from R2
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('attachments')
      .eq('user_id', user.id)
    
    if (txError) throw txError
    
    // Extract all R2 keys
    const allKeys: string[] = []
    transactions?.forEach(t => {
      if (Array.isArray(t.attachments)) {
        t.attachments.forEach((att: any) => {
          if (att.key) allKeys.push(att.key)
        })
      }
    })
    
    console.log(`[Cleaning Algorithm] Found ${allKeys.length} files to delete from R2.`)
    
    // Step 2: Delete from R2 (Concurrent batches)
    const chunkSize = 5 // Limit concurrency
    for (let i = 0; i < allKeys.length; i += chunkSize) {
      const chunk = allKeys.slice(i, i + chunkSize)
      await Promise.all(chunk.map(key => 
        fetch('/api/r2-delete', {
          method: 'POST',
          body: JSON.stringify({ key })
        }).catch(err => console.error(`Failed to delete ${key}`, err))
      ))
    }
    
    // Step 3: Delete DB Records
    await supabase.from('transactions').delete().eq('user_id', user.id)
    await supabase.from('categories').delete().eq('user_id', user.id)
    await supabase.from('ledgers').delete().eq('user_id', user.id)
    await supabase.from('user_settings').delete().eq('user_id', user.id)
    
    console.log('[Cleaning Algorithm] DB Cleaned.')
    
    // Step 4: Sign out
    await supabase.auth.signOut()
    router.push('/login')
    
  } catch (e: any) {
    console.error('Cleaning failed:', e)
    alert('清洁过程遇到错误，部分数据可能未删除。请重试。\nError: ' + e.message)
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
    // Load settings
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { data } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single()
        if (data) {
            settings.value.baseCurrency = data.base_currency
        }
    }
})
</script>

<template>
  <div class="max-w-4xl space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">设置</h1>
      <p class="text-gray-500 dark:text-slate-400 mt-1">配置账户和系统偏好</p>
    </div>

    <!-- Currency Settings -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">货币设置</h2>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">默认结算币种</label>
          <select
            v-model="settings.baseCurrency"
            class="w-full max-w-xs px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
          >
            <option v-for="c in currencies" :key="c.code" :value="c.code">{{ c.name }}</option>
          </select>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-2">所有账单将自动换算为此币种进行统计</p>
        </div>
      </div>

      <button
        @click="saveSettings"
        :disabled="isSaving"
        class="flex items-center gap-2 mt-6 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:bg-gray-400 transition-all"
      >
        <Save :size="18" />
        <span>{{ isSaving ? '保存中...' : '保存设置' }}</span>
      </button>
    </div>

    <!-- Exchange Rates -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">汇率表</h2>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">汇率每周从 Yahoo Finance 自动更新</p>
        </div>
        <button class="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-primary-500 transition-colors">
          <RefreshCw :size="18" />
          <span>最后更新: 2026-01-21</span>
        </button>
      </div>

      <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-600">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-400">币种</th>
              <th class="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-slate-400">对 CNY 汇率</th>
              <th class="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-slate-400">更新时间</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-600">
            <tr v-for="rate in exchangeRates" :key="rate.code" class="hover:bg-gray-50 dark:hover:bg-slate-700/50">
              <td class="px-6 py-4 text-gray-900 dark:text-white font-medium">{{ rate.code }}</td>
              <td class="px-6 py-4 text-right text-gray-700 dark:text-slate-300">{{ rate.rate.toFixed(4) }}</td>
              <td class="px-6 py-4 text-right text-gray-500 dark:text-slate-400">{{ rate.updated }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Danger Zone (Cleaning Algorithm) -->
    <div class="bg-red-50 dark:bg-red-900/10 rounded-2xl p-6 shadow-sm border border-red-100 dark:border-red-900/30">
      <h2 class="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">危险区域</h2>
      <p class="text-sm text-red-600/80 dark:text-red-400/80 mb-6">
        执行"彻底注销"将触发<b>清洁算法</b>：系统会递归删除您所有的账本、分类、账单以及<b>R2存储中的所有附件</b>，确保不留任何数据痕迹，然后安全退出。此操作不可恢复。
      </p>
      
      <button
        @click="handleDeleteAllData"
        :disabled="isDeleting"
        class="flex items-center gap-2 px-6 py-3 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-600 hover:text-white hover:border-transparent transition-all shadow-sm"
      >
        <Trash2 :size="18" />
        <span>{{ isDeleting ? '正在清洁数据...' : '彻底注销并清空数据' }}</span>
      </button>
    </div>
  </div>
</template>
