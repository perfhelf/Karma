<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Edit2, Trash2, BookOpen, Check, Archive, RotateCcw } from 'lucide-vue-next'
import { 
  ledgers, 
  emojiCategories, 
  getLedgerBalance,
  getLedgerTransactionCount,
  formatCurrency,
  totalBalance,
  addLedger,
  updateLedger,
  deleteLedger as deleteLedgerAction
} from '../stores/data'

const showAddModal = ref(false)
const showArchivedView = ref(false) // Toggle between active and archived
const editingLedger = ref<any>(null)
const newLedger = ref({ name: '', icon: '📒', color: '#22c55e' })
const activeCategory = ref(emojiCategories[0]?.name || '')
const isSubmitting = ref(false)

const colorOptions = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'
]

// Computed ledger stats
const ledgerStats = computed(() => {
  return ledgers.value.map(l => ({
    ...l,
    balance: getLedgerBalance(l.id),
    count: getLedgerTransactionCount(l.id),
  }))
})

const activeLedgers = computed(() => ledgerStats.value.filter(level => !level.is_archived))
const archivedLedgers = computed(() => ledgerStats.value.filter(level => level.is_archived))

const displayLedgers = computed(() => showArchivedView.value ? archivedLedgers.value : activeLedgers.value)

function openAddModal() {
  editingLedger.value = null
  newLedger.value = { name: '', icon: '📒', color: '#22c55e' }
  activeCategory.value = emojiCategories[0]?.name || ''
  showAddModal.value = true
}

function openEditModal(ledger: any) {
  editingLedger.value = ledger
  newLedger.value = { name: ledger.name, icon: ledger.icon, color: ledger.color }
  activeCategory.value = emojiCategories[0]?.name || ''
  showAddModal.value = true
}

async function saveLedger() {
  if (!newLedger.value.name.trim()) {
    alert('请输入账本名称')
    return
  }
  
  isSubmitting.value = true
  try {
    if (editingLedger.value) {
      await updateLedger(editingLedger.value.id, newLedger.value)
    } else {
      await addLedger({
        ...newLedger.value,
        is_default: activeLedgers.value.length === 0, // Should be based on active existence? Or just any.
        is_archived: false
      })
    }
    showAddModal.value = false
  } catch (e) {
    console.error(e)
    alert('保存失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

async function setDefault(ledger: any) {
  try {
    // Optimistic update locally
    ledgers.value.forEach(l => l.is_default = (l.id === ledger.id))
    
    // Server update
    const prevDefault = ledgers.value.find(l => l.is_default && l.id !== ledger.id)
    if (prevDefault) await updateLedger(prevDefault.id, { is_default: false })
    
    await updateLedger(ledger.id, { is_default: true })
  } catch (e) {
    console.error(e)
    alert('设置失败')
  }
}

async function deleteLedger(ledger: any) {
  console.log('[UI] Delete ledger clicked:', ledger.id, ledger.name)
  if (!confirm(`确定要彻底删除"${ledger.name}"吗？这将无法恢复。`)) return
  
  try {
    console.log('[UI] Calling deleteLedgerAction...')
    await deleteLedgerAction(ledger.id)
  } catch (e) {
    console.error(e)
    alert('删除失败')
  }
}

async function archiveLedger(ledger: any) {
  if (!confirm(`确定要归档"${ledger.name}"吗？归档后可以在“已归档账本”中查看。`)) return
  
  try {
    await updateLedger(ledger.id, { is_archived: true })
    showAddModal.value = false
  } catch (e) {
    console.error(e)
    alert('归档失败')
  }
}

async function restoreLedger(ledger: any) {
  try {
    await updateLedger(ledger.id, { is_archived: false })
  } catch (e) {
    console.error(e)
    alert('恢复失败')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ showArchivedView ? '已归档账本' : '账本管理' }}
        </h1>
        <p class="text-gray-500 dark:text-slate-400 mt-1">
          {{ showArchivedView ? '查看和恢复已归档的账本' : '管理多个记账账本，独立统计资金流向' }}
        </p>
      </div>
      <div class="flex gap-2">
        <button 
          @click="showArchivedView = !showArchivedView" 
          class="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all font-medium"
        >
          <Archive :size="18" />
          <span>{{ showArchivedView ? '返回' : '归档箱' }}</span>
        </button>
        <button 
          v-if="!showArchivedView"
          @click="openAddModal" 
          class="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/30 font-medium"
        >
          <Plus :size="18" />
          <span>新建账本</span>
        </button>
      </div>
    </div>

    <!-- Total Account Card (Only show in active view) -->
    <div v-if="!showArchivedView" class="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-primary-100 text-sm">总账户</p>
          <p class="text-3xl font-bold mt-1">{{ formatCurrency(totalBalance) }}</p>
          <p class="text-primary-200 text-sm mt-2">汇总所有账本的资金</p>
        </div>
        <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
          <BookOpen :size="32" />
        </div>
      </div>
    </div>

    <!-- Ledgers Grid -->
    <div v-if="displayLedgers.length === 0" class="text-center py-12">
        <div class="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Archive v-if="showArchivedView" :size="32" />
            <BookOpen v-else :size="32" />
        </div>
        <p class="text-gray-500 dark:text-slate-400">
            {{ showArchivedView ? '没有已归档的账本' : '暂无账本，快去创建一个吧' }}
        </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="ledger in displayLedgers"
        :key="ledger.id"
        class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden transition-all hover:shadow-md"
      >
        <div class="absolute top-0 left-0 right-0 h-1" :style="{ backgroundColor: ledger.color }"></div>

        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" :style="{ backgroundColor: ledger.color + '20' }">
              {{ ledger.icon }}
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {{ ledger.name }}
                <span v-if="ledger.is_default" class="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full">默认</span>
                <span v-if="ledger.is_archived" class="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 rounded-full">已归档</span>
              </h3>
              <p class="text-sm text-gray-500 dark:text-slate-400">{{ ledger.count }} 笔账单</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <template v-if="showArchivedView">
                <button @click="restoreLedger(ledger)" class="p-2 text-gray-400 hover:text-green-500" title="恢复账本">
                  <RotateCcw :size="16" />
                </button>
            </template>
            <template v-else>
                <button v-if="!ledger.is_default" @click="setDefault(ledger)" class="p-2 text-gray-400 hover:text-primary-500" title="设为默认">
                  <Check :size="16" />
                </button>
                <button @click="openEditModal(ledger)" class="p-2 text-gray-400 hover:text-primary-500" title="编辑">
                  <Edit2 :size="16" />
                </button>
            </template>
            <button @click.stop.prevent="deleteLedger(ledger)" class="p-2 text-gray-400 hover:text-red-500" title="删除">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-slate-400">余额</span>
            <span :class="['font-semibold', ledger.balance >= 0 ? 'text-primary-500' : 'text-red-500']">
              {{ formatCurrency(ledger.balance) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAddModal = false"></div>
        <div class="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
          
          <div class="p-6 border-b border-gray-100 dark:border-slate-700 flex-none">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ editingLedger ? '编辑账本' : '新建账本' }}
            </h2>
          </div>
          
          <div class="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <!-- Name Input -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">账本名称</label>
              <div class="flex gap-3">
                <div class="w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-gray-100 dark:bg-slate-700 flex-shrink-0">
                  {{ newLedger.icon }}
                </div>
                <input 
                  v-model="newLedger.name" 
                  type="text" 
                  placeholder="例如：个人账本" 
                  class="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" 
                />
              </div>
            </div>

            <!-- Emoji Picker -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">选择图标</label>
              <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden">
                <!-- Category Tabs -->
                <div class="flex overflow-x-auto border-b border-gray-200 dark:border-slate-600 custom-scrollbar hide-scrollbar">
                  <button
                    v-for="cat in emojiCategories"
                    :key="cat.name"
                    @click="activeCategory = cat.name"
                    :class="['px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2', activeCategory === cat.name ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700']"
                  >
                    {{ cat.name }}
                  </button>
                </div>
                
                <!-- Emoji Grid -->
                <div class="p-4 h-48 overflow-y-auto custom-scrollbar">
                  <div class="grid grid-cols-8 gap-2">
                    <button
                      v-for="emoji in emojiCategories.find(c => c.name === activeCategory)?.emojis"
                      :key="emoji"
                      @click="newLedger.icon = emoji"
                      :class="['w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all', newLedger.icon === emoji ? 'bg-white shadow-sm ring-2 ring-primary-500' : 'hover:bg-gray-200 dark:hover:bg-slate-600']"
                    >{{ emoji }}</button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Color Picker -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">主题色</label>
              <div class="flex gap-3">
                <button
                  v-for="color in colorOptions"
                  :key="color"
                  @click="newLedger.color = color"
                  :class="['w-8 h-8 rounded-full transition-all ring-2 ring-offset-2 dark:ring-offset-slate-800', newLedger.color === color ? 'ring-gray-400 scale-110' : 'ring-transparent']"
                  :style="{ backgroundColor: color }"
                ></button>
              </div>
            </div>
          </div>
          
          <div class="p-6 border-t border-gray-100 dark:border-slate-700 flex gap-3 flex-none bg-gray-50 dark:bg-slate-700/30 rounded-b-2xl">
            <button 
              v-if="editingLedger" 
              @click="archiveLedger(editingLedger)" 
              class="px-4 py-3 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-500 transition-all font-medium flex items-center gap-2"
              title="归档后不显示在主列表，但保留数据"
            >
              <Archive :size="18" />
              <span class="hidden sm:inline">归档</span>
            </button>
            <button @click="showAddModal = false" class="flex-1 py-3 bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-50 transition-all font-medium">取消</button>
            <button @click="saveLedger" class="flex-1 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/30 font-medium">保存</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
