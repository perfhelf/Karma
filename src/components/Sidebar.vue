<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, Receipt, FolderTree, BookOpen, Settings, Plus, Moon, Sun, Monitor, LogOut, X } from 'lucide-vue-next'
import { useTheme } from '../composables/useTheme'
import { supabase } from '../lib/supabase'

const props = defineProps<{
  isMobileOpen?: boolean
}>()

const emit = defineEmits(['close'])

const route = useRoute()
const router = useRouter()
const { theme, toggleNext } = useTheme()

const navItems = [
  { path: '/', name: '仪表盘', icon: LayoutDashboard },
  { path: '/transactions', name: '账单列表', icon: Receipt },
  { path: '/ledgers', name: '账本管理', icon: BookOpen },
  { path: '/categories', name: '分类管理', icon: FolderTree },
  { path: '/settings', name: '设置', icon: Settings },
]

async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<template>
  <aside 
    :class="[
      'fixed inset-y-0 left-0 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col z-50 transition-transform duration-300 w-64',
      // Desktop: always visible (translate-x-0) relative to its flex container, but here we need to handle fixed vs static.
      // Actually, relying on App.vue to use a transform wrapper is better for mobile.
      // Let's stick to the plan: Desktop = Flex Item, Mobile = Fixed Drawer.
      'lg:translate-x-0 lg:static lg:h-full', 
      isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'
    ]"
  >
    <!-- Logo -->
    <div class="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-primary-600 dark:text-primary-400 flex items-center gap-2">
          <img src="/logo.svg" alt="Logo" class="w-8 h-8" />
          鲲侯·Karma
        </h1>
        <p class="text-sm text-gray-500 dark:text-slate-400 mt-1 pl-10">记账系统</p>
      </div>
      <!-- Mobile Close Button -->
      <button @click="$emit('close')" class="lg:hidden p-2 text-gray-400 hover:text-gray-600">
        <X :size="20" />
      </button>
    </div>

    <!-- Quick Add Button -->
    <div class="p-4">
      <RouterLink 
        to="/transactions/new"
        @click="$emit('close')"
        class="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/30"
      >
        <Plus :size="20" />
        <span>新增账单</span>
      </RouterLink>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        @click="$emit('close')"
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
        :class="[
          route.path === item.path 
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium' 
            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
        ]"
      >
        <component :is="item.icon" :size="20" />
        <span>{{ item.name }}</span>
      </RouterLink>
    </nav>

    <!-- Footer Actions (Theme & Logout) -->
    <div class="p-4 border-t border-gray-200 dark:border-slate-700 space-y-2">
      <!-- Theme Toggle -->
      <button 
        @click="toggleNext"
        class="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all"
      >
        <Sun v-if="theme === 'light'" :size="20" />
        <Moon v-else-if="theme === 'dark'" :size="20" />
        <Monitor v-else :size="20" />
        <span>{{ 
          theme === 'light' ? '浅色模式' : 
          theme === 'dark' ? '深色模式' : '跟随系统' 
        }}</span>
      </button>

      <!-- Logout -->
      <button 
        @click="handleLogout"
        class="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
      >
        <LogOut :size="20" />
        <span>退出登录</span>
      </button>
    </div>
  </aside>
</template>
