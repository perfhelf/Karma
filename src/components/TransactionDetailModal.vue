<script setup lang="ts">
import { ref } from 'vue'
import { X, Trash2, Calendar, FileText, Download } from 'lucide-vue-next'
import { formatCurrency, getCategoryById, getLedgerById, type Transaction, type Attachment } from '../stores/data'

const props = defineProps<{
  transaction: Transaction | null
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'delete'])

// ==================== IMAGE ZOOM LOGIC (Ported from matrix-trading-journal) ====================
const showFullImage = ref(false)
const activeImage = ref<Attachment | null>(null)
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isDragging = ref(false)
let dragStartX = 0
let dragStartY = 0

function openImage(att: Attachment) {
    if (att.type.startsWith('image/')) {
        activeImage.value = att
        showFullImage.value = true
        resetZoom()
    } else {
        // For non-images (PDF), open in new tab
        window.open(att.url, '_blank')
    }
}

function zoomIn() {
  if (zoomLevel.value < 5) zoomLevel.value = Math.min(5, zoomLevel.value + 0.25)
}

function zoomOut() {
  if (zoomLevel.value > 0.5) zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.25)
}

function resetZoom() {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

function handleWheel(e: WheelEvent) {
  if (e.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

function startDrag(e: MouseEvent) {
  if (zoomLevel.value <= 1) return
  isDragging.value = true
  dragStartX = e.clientX - panX.value
  dragStartY = e.clientY - panY.value
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return
  panX.value = e.clientX - dragStartX
  panY.value = e.clientY - dragStartY
}

function stopDrag() {
  isDragging.value = false
}

// ==================== ACTIONS ====================
function handleDelete() {
    if (!confirm('确定删除此交易记录？此操作不可恢复。')) return
    emit('delete', props.transaction?.id)
}
</script>

<template>
  <Teleport to="body">
    <!-- Main Modal Overlay -->
    <div v-if="isOpen && transaction" class="fixed inset-0 z-40 flex items-center justify-center px-4" @click.self="emit('close')">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')"></div>
      
      <!-- Modal Content -->
      <div class="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">交易详情</h3>
          <button @click="emit('close')" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
            <X :size="20" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            <!-- Amount & Type -->
            <div class="text-center py-2">
                <div class="text-4xl font-bold tracking-tight" :class="transaction.type === 'income' ? 'text-green-500' : 'text-red-500'">
                    {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                </div>
                <div class="text-sm text-gray-500 mt-1">{{ transaction.currency }}</div>
            </div>

            <!-- Info Grid -->
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                    <span class="text-xs text-gray-400 block mb-1">分类</span>
                    <div class="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                        <span>{{ getCategoryById(transaction.category_id)?.icon || '📁' }}</span>
                        <span>{{ getCategoryById(transaction.category_id)?.name || '未分类' }}</span>
                    </div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                    <span class="text-xs text-gray-400 block mb-1">账本</span>
                    <div class="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                        <span>{{ transaction.ledger_id ? getLedgerById(transaction.ledger_id)?.icon : '🏦' }}</span>
                        <span>{{ transaction.ledger_id ? getLedgerById(transaction.ledger_id)?.name : '总账户' }}</span>
                    </div>
                </div>
            </div>

            <!-- Date & Description -->
            <div class="space-y-4">
                <div class="flex items-start gap-3">
                    <div class="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg shrink-0">
                        <Calendar :size="18" />
                    </div>
                    <div>
                        <span class="text-xs text-gray-400 block">日期</span>
                        <span class="text-gray-900 dark:text-white font-medium">{{ transaction.transaction_date.slice(0, 10) }}</span>
                    </div>
                </div>
                
                <div class="flex items-start gap-3">
                     <div class="mt-1 p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-lg shrink-0">
                        <FileText :size="18" />
                    </div>
                    <div>
                        <span class="text-xs text-gray-400 block">备注</span>
                        <p class="text-gray-900 dark:text-white leading-relaxed">{{ transaction.description || '无备注' }}</p>
                    </div>
                </div>
            </div>

            <!-- Attachments -->
            <div v-if="transaction.attachments && transaction.attachments.length > 0">
                <h4 class="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    附件 <span class="text-xs font-normal text-gray-400">({{ transaction.attachments.length }})</span>
                </h4>
                <div class="grid grid-cols-3 gap-2">
                    <div 
                        v-for="att in transaction.attachments" 
                        :key="att.key"
                        @click="openImage(att)"
                        class="aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 relative group cursor-pointer bg-gray-50 dark:bg-gray-800"
                    >
                        <img 
                            v-if="att.type.startsWith('image/')" 
                            :src="att.url" 
                            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                        <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                            <FileText :size="24" />
                            <span class="text-[10px] mt-1 break-all line-clamp-2">{{ att.name }}</span>
                        </div>
                        
                        <!-- Hover Overlay -->
                        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                    </div>
                </div>
            </div>

        </div>

        <!-- Footer Actions -->
        <div class="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
            <button 
                @click="handleDelete"
                class="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all font-medium text-sm"
            >
                <Trash2 :size="16" />
                删除
            </button>
            <button 
                @click="emit('close')"
                class="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm"
            >
                关闭
            </button>
        </div>
      </div>
    </div>

    <!-- Lightbox (Full Screen Zoom) -->
    <div 
      v-if="showFullImage && activeImage" 
      class="fixed inset-0 z-50 bg-black/95 flex flex-col animate-in fade-in duration-200"
      @click="showFullImage = false"
      @mousemove="onDrag"
      @mouseup="stopDrag"
      @mouseleave="stopDrag"
    >
      <!-- Controls -->
      <div class="absolute top-4 right-4 z-50 flex gap-4" @click.stop>
         <button @click="showFullImage = false" class="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md">
            <X :size="24" />
         </button>
      </div>

      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10" @click.stop>
        <button @click="zoomOut" class="text-white hover:text-primary-400 text-xl font-bold w-8 disabled:opacity-30" :disabled="zoomLevel <= 0.5">−</button>
        <span class="text-white font-mono min-w-[3rem] text-center">{{ Math.round(zoomLevel * 100) }}%</span>
        <button @click="zoomIn" class="text-white hover:text-primary-400 text-xl font-bold w-8 disabled:opacity-30" :disabled="zoomLevel >= 5">+</button>
        <div class="w-px h-6 bg-white/20 mx-2"></div>
        <button @click="resetZoom" class="text-xs text-white/70 hover:text-white uppercase tracking-wider">Reset</button>
        <a :href="activeImage.url" download target="_blank" class="ml-2 text-white/70 hover:text-white" title="下载原图">
            <Download :size="18" />
        </a>
      </div>

      <!-- Image Canvas -->
      <div class="flex-1 flex items-center justify-center overflow-hidden w-full h-full cursor-zoom-in" @wheel.prevent="handleWheel">
        <img 
          :src="activeImage.url" 
          :style="{ 
            transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
            cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }"
          class="max-w-full max-h-full object-contain transition-transform duration-100 ease-out select-none"
          draggable="false"
          @click.stop
          @mousedown.prevent="startDrag"
        />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 4px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
</style>
