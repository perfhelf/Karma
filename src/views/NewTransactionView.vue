<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Calendar, 
  X,
  ChevronDown,
  Upload,
  Plus,
  FileText
} from 'lucide-vue-next'
import { 
  ledgers, 
  categories, 
  parentCategories, 
  addTransaction
} from '../stores/data'

interface AttachmentSlot {
  id: number // Unique ID for key
  file: File | null
}

const router = useRouter()
const isSubmitting = ref(false)

const form = ref({
  amount: '',
  currency: 'CNY',
  date: new Date().toISOString().split('T')[0],
  categoryId: '',
  subcategoryId: '',
  ledgerId: '',
  description: '',
  attachments: [] as File[], // Compatibility for submit
  type: 'expense' as 'expense' | 'income'
})

// Slot System State
const slots = ref<AttachmentSlot[]>([
  { id: Date.now(), file: null }
])
// fileInputs Ref: We use a function ref or direct access via index if bound?
// In v-for, ref="fileInputs" creates an array.
const fileInputs = ref<HTMLInputElement[]>([])

// Helper for previews
const getObjectUrl = (file: File) => URL.createObjectURL(file)
const MAX_SLOTS = 10

// Slot Management
function addSlot() {
  if (slots.value.length < MAX_SLOTS) {
    slots.value.push({ id: Date.now(), file: null })
  }
}

function removeSlot(index: number) {
  if (slots.value.length > 1) {
    slots.value.splice(index, 1)
  } else if (slots.value[0]) {
    slots.value[0].file = null
  }
}

function triggerSlotInput(index: number) {
  if (fileInputs.value[index]) {
    fileInputs.value[index].click()
  }
}

function handleSlotFileChange(event: Event, index: number) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0] && slots.value[index]) {
    slots.value[index].file = input.files[0]
    input.value = '' // Reset
  }
}

function handleSlotDrop(event: DragEvent, index: number) {
  if (event.dataTransfer?.files && event.dataTransfer.files[0] && slots.value[index]) {
    const file = event.dataTransfer.files[0]
    // Filter type check
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
       slots.value[index].file = file
    }
  }
}

function handleSlotPaste(event: ClipboardEvent, index: number) {
  if (event.clipboardData && event.clipboardData.files.length > 0 && slots.value[index]) {
    const file = event.clipboardData.files[0]
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
       event.preventDefault()
       slots.value[index].file = file
    }
  }
}

// Set default ledger
const defaultLedger = computed(() => ledgers.value.find(l => l.is_default))
watch(defaultLedger, (newVal) => {
  if (newVal && !form.value.ledgerId) {
    form.value.ledgerId = newVal.id
  }
}, { immediate: true })

const currencies = [{ code: 'CNY' }, { code: 'USD' }, { code: 'EUR' }, { code: 'GBP' }, { code: 'JPY' }, { code: 'HKD' }]

const subcategories = computed(() => {
  if (!form.value.categoryId) return []
  return categories.value.filter(c => c.parent_id === form.value.categoryId)
})

watch(() => form.value.categoryId, () => {
  form.value.subcategoryId = ''
})

async function handleSubmit() {
  if (!form.value.amount) {
    alert('请填写金额')
    return
  }

  isSubmitting.value = true
  try {
    // Collect files
    const finalFiles = slots.value
      .map(s => s.file)
      .filter((f): f is File => f !== null)

    const finalCategoryId = form.value.subcategoryId || form.value.categoryId || null

    await addTransaction({
      ledger_id: form.value.ledgerId || null,
      category_id: finalCategoryId,
      amount: parseFloat(form.value.amount),
      currency: form.value.currency,
      type: form.value.type,
      description: form.value.description,
      transaction_date: form.value.date || new Date().toISOString(),
      files: finalFiles
    })

    router.push('/')
  } catch (e) {
    console.error(e)
    alert('保存失败')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">新增账单</h1>
      <p class="text-gray-500 dark:text-slate-400 mt-1">记录一笔新的收入或支出</p>
    </div>

    <form @submit.prevent="handleSubmit" class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-gray-100 dark:border-slate-700 space-y-6">
      <!-- Type Toggle -->
      <div class="flex gap-4">
        <button type="button" @click="form.type = 'expense'" :class="['flex-1 py-3 rounded-xl font-medium transition-all', form.type === 'expense' ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400']">支出</button>
        <button type="button" @click="form.type = 'income'" :class="['flex-1 py-3 rounded-xl font-medium transition-all', form.type === 'income' ? 'bg-green-500 text-white shadow-md shadow-green-500/30' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400']">收入</button>
      </div>

      <!-- Amount & Currency -->
      <div class="flex gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">金额 *</label>
          <div class="relative">
             <input v-model="form.amount" type="number" step="0.01" placeholder="0.00" class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-2xl font-bold text-gray-900 dark:text-white placeholder-gray-400 outline-hidden focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div class="w-32">
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">币种</label>
          <div class="relative">
            <select v-model="form.currency" class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white appearance-none cursor-pointer outline-hidden">
              <option v-for="c in currencies" :key="c.code" :value="c.code">{{ c.code }}</option>
            </select>
            <ChevronDown :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <!-- Category -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">分类</label>
        <div class="relative">
          <select v-model="form.categoryId" class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white appearance-none cursor-pointer outline-hidden">
            <option value="">选择分类...</option>
            <option v-for="cat in parentCategories" :key="cat.id" :value="cat.id">{{ cat.icon }} {{ cat.name }}</option>
          </select>
          <ChevronDown :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <!-- Subcategory -->
      <div v-if="subcategories.length > 0">
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">子分类</label>
        <div class="relative">
          <select v-model="form.subcategoryId" class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white appearance-none cursor-pointer outline-hidden">
            <option value="">不选择子分类</option>
            <option v-for="sub in subcategories" :key="sub.id" :value="sub.id">{{ sub.icon }} {{ sub.name }}</option>
          </select>
          <ChevronDown :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <!-- Ledger -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">账本</label>
        <div class="relative">
          <select v-model="form.ledgerId" class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white appearance-none cursor-pointer outline-hidden">
            <option value="">总账户 (默认)</option>
            <option v-for="ledger in ledgers.filter(l => !l.is_archived)" :key="ledger.id" :value="ledger.id">{{ ledger.icon || '📒' }} {{ ledger.name }}</option>
          </select>
          <ChevronDown :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <p class="text-xs text-gray-400 mt-1">选择记入哪个账本</p>
      </div>

      <!-- Date -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">日期</label>
        <div class="relative">
          <input v-model="form.date" type="date" class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white outline-hidden" />
           <Calendar :size="18" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">备注</label>
        <textarea v-model="form.description" rows="2" placeholder="添加备注..." class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 resize-none outline-hidden"></textarea>
      </div>

      <!-- SLOTS SYSTEM -->
      <div>
        <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300">附件 ({{ slots.length }}/{{ MAX_SLOTS }})</label>
            <span class="text-xs text-gray-400">点击卡槽或粘贴图片</span>
        </div>

        <div class="space-y-4">
          <!-- Slot Loop -->
          <div 
             v-for="(slot, index) in slots" 
             :key="slot.id"
             @paste="handleSlotPaste($event, index)"
             @dragover.prevent
             @drop.prevent="handleSlotDrop($event, index)"
             class="group relative transition-all rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
             tabindex="0"
          >
             <!-- 1. FILLED STATE -->
             <div 
               v-if="slot.file" 
               class="aspect-[3/1] sm:aspect-[4/1] bg-gray-100 dark:bg-slate-700 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 flex items-center p-3 gap-4"
             >
                <!-- Preview Thumbnail -->
                <div class="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 flex items-center justify-center">
                   <img 
                      v-if="slot.file.type.startsWith('image/')" 
                      :src="getObjectUrl(slot.file)" 
                      class="w-full h-full object-cover" 
                   />
                   <FileText v-else :size="24" class="text-red-500" />
                </div>
                
                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ slot.file.name }}</p>
                  <p class="text-xs text-gray-500 dark:text-slate-400">{{ (slot.file.size / 1024).toFixed(1) }} KB</p>
                </div>

                <!-- Delete Action -->
                <button 
                  type="button" 
                  @click="removeSlot(index)"
                  class="p-2 bg-white dark:bg-slate-600 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-500 rounded-lg transition-all"
                >
                  <X :size="18" />
                </button>
             </div>

             <!-- 2. EMPTY STATE (The Big Box Logic) -->
             <div 
               v-else 
               class="relative rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/30 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all py-8 flex flex-col items-center justify-center gap-2 cursor-text"
             >
                <!-- Clickable Upload Button (Stops propagation) -->
                <button 
                  type="button"
                  @click.stop="triggerSlotInput(index)"
                  class="p-4 bg-white dark:bg-slate-600 rounded-full shadow-xs text-gray-400 hover:text-primary-500 hover:shadow-sm hover:scale-110 transition-all cursor-pointer z-10"
                >
                  <Upload :size="24" />
                </button>
                <div class="text-center pointer-events-none">
                  <span class="block text-sm font-medium text-gray-500 dark:text-slate-400">点击按钮选择文件</span>
                  <span class="block text-xs text-gray-400 mt-1">或在此处 Ctrl+V 粘贴</span>
                </div>
                
                <!-- Delete Empty Slot (Only if > 1) -->
                <button 
                  v-if="slots.length > 1"
                  type="button"
                  @click.stop="removeSlot(index)"
                  class="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 transition-colors z-20"
                >
                  <X :size="16" />
                </button>
             </div>

             <!-- Hidden Input for this slot -->
             <!-- Note: Ref array mapping -->
             <input 
               ref="fileInputs" 
               type="file" 
               accept="image/*,.pdf" 
               @change="handleSlotFileChange($event, index)" 
               class="hidden" 
             />
          </div>

          <!-- Add Button -->
          <button 
             v-if="slots.length < MAX_SLOTS"
             type="button" 
             @click="addSlot"
             class="w-full py-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-gray-400 hover:text-primary-500 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Plus :size="20" />
            <span>增加附件</span>
          </button>
        </div>
      </div>

      <!-- Submit -->
      <button type="submit" :disabled="isSubmitting" class="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white font-medium rounded-xl transition-all shadow-md shadow-primary-500/30">
        {{ isSubmitting ? '保存中...' : '保存账单' }}
      </button>
    </form>
  </div>
</template>
