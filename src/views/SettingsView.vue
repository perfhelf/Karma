<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
    await supabase.auth.signOut({ scope: 'local' })
    router.push('/login')
    
  } catch (e: any) {
    console.error('Cleaning failed:', e)
    alert('清洁过程遇到错误，部分数据可能未删除。请重试。\nError: ' + e.message)
  } finally {
    isDeleting.value = false
  }
}

// ----------------------------------------
// ADMIN AUTHORIZATION LOGIC
// ----------------------------------------
const isAdmin = ref(false)
const users = ref<any[]>([])
const authorizedUsersMap = ref<Map<string, string | null>>(new Map())
const loadingUsers = ref(false)
const searchQuery = ref('')

const authModalUser = ref<any | null>(null)
const authModalMode = ref<'new' | 'renew'>('new')
const authType = ref<'permanent' | 'timed'>('permanent')
const authExpiryDate = ref('')

const minExpiryDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().slice(0, 10)
})

const authorizedUsers = computed(() => {
  return users.value.filter(u => authorizedUsersMap.value.has(u.id))
})

const unactionedUsers = computed(() => {
    return users.value.filter(u => !authorizedUsersMap.value.has(u.id) && !['perfhelf@gmail.com'].includes(u.email))
})

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return unactionedUsers.value
  const query = searchQuery.value.toLowerCase()
  return unactionedUsers.value.filter(u => u.email.toLowerCase().includes(query))
})

function getExpiryInfo(userId: string) {
  const expiresAt = authorizedUsersMap.value.get(userId)
  if (expiresAt === null || expiresAt === undefined) return { isPermanent: true, isExpired: false, daysLeft: Infinity }
  const expiry = new Date(expiresAt)
  const now = new Date()
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return { isPermanent: false, isExpired: daysLeft <= 0, daysLeft: Math.max(0, daysLeft) }
}

function setQuickExpiry(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  authExpiryDate.value = date.toISOString().slice(0, 10)
}

function openAuthModal(user: any, mode: 'new' | 'renew') {
  authModalUser.value = user
  authModalMode.value = mode
  authType.value = 'permanent'
  authExpiryDate.value = ''
}

async function confirmAuthorization() {
  if (!authModalUser.value) return
  const expiresAt = authType.value === 'permanent' ? null : new Date(authExpiryDate.value + 'T23:59:59').toISOString()
  
  try {
    // 1. Update DB via Supabase directly (Assuming public write or admin policy)
    // Wait, we need ADMIN rights to write to authorized_users if RLS is strict.
    // However, for this simplified port, we can use the same pattern as Login - explicit insert.
    // BUT we should verify RLS policies. update_auth_schema.sql allows Perfhelf to write.
    
    if (authModalMode.value === 'new') {
      const { error } = await supabase.from('authorized_users').insert({ user_id: authModalUser.value.id, expires_at: expiresAt })
      if (error) throw error
    } else {
      const { error } = await supabase.from('authorized_users').update({ expires_at: expiresAt }).eq('user_id', authModalUser.value.id)
      if (error) throw error
    }

    authorizedUsersMap.value.set(authModalUser.value.id, expiresAt)
    authorizedUsersMap.value = new Map(authorizedUsersMap.value)
    
    authModalUser.value = null
    alert(authModalMode.value === 'new' ? '授权成功' : '续期成功')
  } catch (e: any) {
    alert('操作失败: ' + e.message)
  }
}

async function revokeAuthorization(user: any) {
    if (!confirm(`⚠️ 严正警告：取消授权 ${user.email}？\n\n这将触发清洁算法，清除其所有数据！`)) return
    try {
        // Call Admin API for CLEANUP (Backend)
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/admin-users', {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ userId: user.id, action: 'revoke' })
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)

        authorizedUsersMap.value.delete(user.id)
        authorizedUsersMap.value = new Map(authorizedUsersMap.value)
        alert('已取消授权并执行清洁算法')
    } catch (e: any) {
        alert('失败: ' + e.message)
    }
}



async function loadUsers() {
    // Check not needed for debugging button
    // if (!isAdmin.value) return 
    loadingUsers.value = true
    try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!res.ok || data.error) {
            console.error('❌ Admin API Error:', data)
            alert('授权中心加载失败: ' + (data.error || 'Unknown error'))
            return
        }

        users.value = data.users || []
        
        // Load Authorized Status
        const { data: authData } = await supabase.from('authorized_users').select('user_id, expires_at')
        if (authData) {
            authData.forEach((r: any) => authorizedUsersMap.value.set(r.user_id, r.expires_at))
        }
    } catch (e: any) {
        console.error('Admin Load Failed', e)
        alert('授权中心加载失败: ' + e.message) 
    } finally {
        loadingUsers.value = false
    }
}

onMounted(async () => {
    // Load settings
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        // Check Admin
        if (['perfhelf@gmail.com'].includes(user.email || '')) {
            isAdmin.value = true
            loadUsers()
        }

        const { data } = await supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle()
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

    <!-- ADMIN ZONE (Only for Perfhelf) -->
    <div v-if="isAdmin" class="bg-gray-900 text-white rounded-2xl p-6 shadow-xl border border-gray-700 mt-12">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-green-400 flex items-center gap-2">
                    🛡️ 授权中心 (Matrix Auth)
                </h2>
                <div class="flex items-center gap-3">
                     <button 
                        @click="loadUsers" 
                        :disabled="loadingUsers"
                        class="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2 border border-gray-700"
                    >
                        <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': loadingUsers }" />
                        刷新列表
                    </button>
                    <div class="text-xs bg-red-600 text-white px-2 py-1 rounded font-bold">ADMIN</div>
                </div>
            </div>

        <!-- Authorized Users -->
        <div class="mb-8">
            <h3 class="text-gray-400 text-sm font-bold uppercase mb-4 tracking-wider">✅ 已授权用户 ({{ authorizedUsers.length }})</h3>
            <div class="space-y-3">
                <div v-if="authorizedUsers.length === 0" class="p-4 text-center text-gray-500 bg-gray-800 rounded-xl">暂无授权用户</div>
                <div v-for="user in authorizedUsers" :key="user.id" class="flex justify-between items-center bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div>
                        <div class="font-mono text-green-300">{{ user.email }}</div>
                        <div class="text-xs text-gray-500 mt-1 flex gap-2">
                             <span>ID: {{ user.id.slice(0, 8) }}...</span>
                             <span v-if="getExpiryInfo(user.id).isPermanent" class="text-blue-400">永久授权</span>
                             <span v-else-if="getExpiryInfo(user.id).isExpired" class="text-red-400">已过期</span>
                             <span v-else class="text-yellow-400">剩余 {{ getExpiryInfo(user.id).daysLeft }} 天</span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="px-3 py-1 text-xs border border-green-500 text-green-500 rounded hover:bg-green-500/10" @click="openAuthModal(user, 'renew')">续期</button>
                        <button class="px-3 py-1 text-xs border border-red-500 text-red-500 rounded hover:bg-red-500/10" @click="revokeAuthorization(user)">取消</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- All Users -->
        <div>
            <h3 class="text-gray-400 text-sm font-bold uppercase mb-4 tracking-wider">用户列表 ({{ unactionedUsers.length }} 待授权)</h3>
             <input v-model="searchQuery" type="text" placeholder="🔍 搜索邮箱..." class="w-full bg-gray-800 border-none rounded-lg px-4 py-3 text-white mb-4 focus:ring-2 focus:ring-green-500 outline-none" />
             
             <div class="space-y-2 max-h-96 overflow-y-auto pr-2">
                <div v-if="loadingUsers" class="text-center py-4 text-gray-500">加载中...</div>
                <div v-for="user in filteredUsers" :key="user.id" class="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg hover:bg-gray-800 transition-colors">
                     <div class="text-sm text-gray-300 font-mono">{{ user.email }}</div>
                     <button class="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500" @click="openAuthModal(user, 'new')">授权</button>
                </div>
             </div>
        </div>
    </div>


    <!-- Auth Modal -->
    <div v-if="authModalUser" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm" @click.self="authModalUser = null">
      <div class="bg-gray-900 border border-green-500/30 p-8 rounded-2xl w-full max-w-sm shadow-2xl">
        <h3 class="text-xl text-green-400 font-bold mb-6">{{ authModalMode === 'new' ? '授权用户' : '续期授权' }}</h3>
        <p class="text-gray-300 font-mono mb-6 border-b border-gray-800 pb-4">{{ authModalUser.email }}</p>
        
        <div class="space-y-4 mb-8">
          <label class="flex items-center gap-3 text-gray-300 cursor-pointer">
            <input type="radio" v-model="authType" value="permanent" class="accent-green-500 w-5 h-5" />
            永久授权
          </label>
          <label class="flex items-center gap-3 text-gray-300 cursor-pointer">
            <input type="radio" v-model="authType" value="timed" class="accent-green-500 w-5 h-5" />
            限时授权
          </label>
        </div>
        
        <div v-if="authType === 'timed'" class="mb-8 space-y-3">
          <input type="date" v-model="authExpiryDate" :min="minExpiryDate" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-green-500" />
          <div class="flex gap-2">
            <button class="flex-1 bg-gray-800 text-xs py-2 rounded text-gray-400 hover:text-white" @click="setQuickExpiry(30)">+30天</button>
            <button class="flex-1 bg-gray-800 text-xs py-2 rounded text-gray-400 hover:text-white" @click="setQuickExpiry(180)">+180天</button>
            <button class="flex-1 bg-gray-800 text-xs py-2 rounded text-gray-400 hover:text-white" @click="setQuickExpiry(365)">+1年</button>
          </div>
        </div>
        
        <div class="flex gap-3">
          <button class="flex-1 py-3 border border-gray-600 text-gray-400 rounded-xl hover:bg-gray-800" @click="authModalUser = null">取消</button>
          <button class="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 font-bold disabled:opacity-50" @click="confirmAuthorization" :disabled="authType === 'timed' && !authExpiryDate">
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
