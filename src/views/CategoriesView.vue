<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Edit2, Trash2, ChevronRight, FolderTree } from 'lucide-vue-next'
import { 
  parentCategories, 
  getSubcategories, 
  emojiCategories,
  addCategory,
  updateCategory,
  deleteCategory as deleteCategoryAction
} from '../stores/data'

const showAddModal = ref(false)
const editingCategory = ref<any>(null)
const newCategory = ref({ name: '', icon: '📁', parent_id: null as string | null })
const activeCategory = ref(emojiCategories[0]?.name || '')
const isSubmitting = ref(false)

// Expand state for parent categories
const expandedCategories = ref<Set<string>>(new Set())

function toggleExpand(id: string) {
  if (expandedCategories.value.has(id)) {
    expandedCategories.value.delete(id)
  } else {
    expandedCategories.value.add(id)
  }
}

function openAddModal(parentId: string | null = null) {
  editingCategory.value = null
  newCategory.value = { name: '', icon: '📁', parent_id: parentId }
  activeCategory.value = emojiCategories[0]?.name || ''
  showAddModal.value = true
}

function openEditModal(cat: any) {
  editingCategory.value = cat
  newCategory.value = { name: cat.name, icon: cat.icon, parent_id: cat.parent_id }
  activeCategory.value = emojiCategories[0]?.name || ''
  showAddModal.value = true
}

async function saveCategory() {
  if (!newCategory.value.name.trim()) {
    alert('请输入分类名称')
    return
  }

  isSubmitting.value = true
  try {
    if (editingCategory.value) {
      await updateCategory(editingCategory.value.id, {
        name: newCategory.value.name,
        icon: newCategory.value.icon,
        parent_id: newCategory.value.parent_id
      })
    } else {
      await addCategory({
        name: newCategory.value.name,
        icon: newCategory.value.icon,
        parent_id: newCategory.value.parent_id
      })
    }
    showAddModal.value = false
  } catch (e: any) {
    console.error(e)
    alert('保存失败: ' + e.message)
  } finally {
    isSubmitting.value = false
  }
}

async function deleteCategory(cat: any) {
  const subs = getSubcategories(cat.id)
  if (subs.length > 0) {
    alert('请先删除该分类下的子分类')
    return
  }
  if (!confirm(`确定要删除"${cat.name}"吗？`)) return
  
  try {
    await deleteCategoryAction(cat.id)
  } catch (e: any) {
    console.error(e)
    alert('删除失败: ' + e.message)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">分类管理</h1>
        <p class="text-gray-500 dark:text-slate-400 mt-1">管理收支分类，支持多级分类</p>
      </div>
      <button @click="openAddModal(null)" class="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/30">
        <Plus :size="18" />
        <span>新建分类</span>
      </button>
    </div>

    <!-- Categories List -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
      <div v-if="parentCategories.length === 0" class="text-center py-16 text-gray-400">
        <FolderTree :size="48" class="mx-auto mb-4 opacity-50" />
        <p class="text-lg">暂无分类</p>
        <p class="text-sm mt-1">点击"新建分类"创建你的第一个分类</p>
      </div>

      <div v-for="cat in parentCategories" :key="cat.id">
        <!-- Parent Category -->
        <div class="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
          <div class="flex items-center gap-3">
            <button 
              @click="toggleExpand(cat.id)"
              class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <ChevronRight 
                :size="18" 
                :class="['transition-transform', expandedCategories.has(cat.id) ? 'rotate-90' : '']" 
              />
            </button>
            <span class="text-2xl">{{ cat.icon }}</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ cat.name }}</span>
            <span class="text-xs text-gray-400 dark:text-slate-500">
              {{ getSubcategories(cat.id).length }} 个子分类
            </span>
          </div>
          <div class="flex items-center gap-1">
            <button @click="openAddModal(cat.id)" class="p-2 text-gray-400 hover:text-primary-500" title="添加子分类">
              <Plus :size="16" />
            </button>
            <button @click="openEditModal(cat)" class="p-2 text-gray-400 hover:text-primary-500">
              <Edit2 :size="16" />
            </button>
            <button @click="deleteCategory(cat)" class="p-2 text-gray-400 hover:text-red-500">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>

        <!-- Subcategories -->
        <div v-if="expandedCategories.has(cat.id)" class="bg-gray-50 dark:bg-slate-700/30">
          <div 
            v-for="sub in getSubcategories(cat.id)" 
            :key="sub.id"
            class="flex items-center justify-between px-6 py-3 pl-16 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <span class="text-xl">{{ sub.icon }}</span>
              <span class="text-gray-700 dark:text-slate-300">{{ sub.name }}</span>
            </div>
            <div class="flex items-center gap-1">
              <button @click="openEditModal(sub)" class="p-2 text-gray-400 hover:text-primary-500">
                <Edit2 :size="14" />
              </button>
              <button @click="deleteCategory(sub)" class="p-2 text-gray-400 hover:text-red-500">
                <Trash2 :size="14" />
              </button>
            </div>
          </div>
          <div v-if="getSubcategories(cat.id).length === 0" class="px-6 py-3 pl-16 text-gray-400 text-sm">
            暂无子分类
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showAddModal = false"></div>
        <div class="relative bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {{ editingCategory ? '编辑分类' : (newCategory.parent_id ? '新建子分类' : '新建分类') }}
          </h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">分类名称</label>
              <input v-model="newCategory.name" type="text" placeholder="例如：餐饮" class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white outline-none" />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">图标</label>
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
                      @click="newCategory.icon = emoji"
                      :class="['w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all', newCategory.icon === emoji ? 'bg-white shadow-sm ring-2 ring-primary-500' : 'hover:bg-gray-200 dark:hover:bg-slate-600']"
                    >{{ emoji }}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex gap-3 mt-6">
            <button @click="showAddModal = false" class="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-200 transition-all">取消</button>
            <button @click="saveCategory" :disabled="isSubmitting" class="flex-1 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50">
              {{ isSubmitting ? '保存中...' : '保存' }}
            </button>
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
