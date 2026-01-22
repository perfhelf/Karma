<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu } from 'lucide-vue-next'
import Sidebar from './components/Sidebar.vue'
import { fetchInitialData } from './stores/data'
import { supabase } from './lib/supabase'
import { useTheme } from './composables/useTheme'

const router = useRouter()
const route = useRoute()
const isReady = ref(false)
const isMobileMenuOpen = ref(false)

// Init theme
useTheme()

onMounted(async () => {
  try {
    // Listen for auth changes
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (route.path === '/login') {
           router.push('/')
        }
        fetchInitialData()
      }
    })

    // Initial check with timeout fallback to prevent white screen
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000))
    
    // Race to ensure we don't hang forever
    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any

    if (session) {
       fetchInitialData()
       updateHeartbeat(session.user.id)
    } else if (route.meta.requiresAuth) {
       router.push('/login')
    }
  } catch (e) {
    console.warn('Initialization warning:', e)
    // Even if check fails, we proceed. Router guard will safely redirect if needed.
  } finally {
    isReady.value = true
  }
})

// Heartbeat Sync
async function updateHeartbeat(userId: string) {
    try {
        if (userId) {
            await supabase.from('profiles').upsert({
                id: userId,
                last_active_at: new Date().toISOString(),
                last_active_site_origin: window.location.origin,
                email: (await supabase.auth.getUser()).data.user?.email 
            }, { onConflict: 'id' }).select().single()
            console.log('💚 Heartbeat sent')
        }
    } catch (e) {
        // Silent fail for heartbeat
        console.warn('Heartbeat failed', e)
    }
}
</script>

<template>
  <!-- Loading Spinner -->
  <div v-if="!isReady" class="flex h-[100dvh] items-center justify-center bg-gray-50 dark:bg-slate-900">
    <div class="text-center">
      <img src="/logo.svg" alt="Logo" class="w-16 h-16 animate-bounce mx-auto mb-4" />
      <p class="text-gray-500 dark:text-slate-400 font-medium">正在启动 鲲侯·Karma...</p>
    </div>
  </div>

  <!-- Main App -->
  <div v-else class="flex h-[100dvh] bg-gray-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200">
    <!-- Mobile Sidebar Overlay -->
    <div 
      v-if="isMobileMenuOpen" 
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="isMobileMenuOpen = false"
    ></div>

    <!-- Sidebar (Hidden on Login) -->
    <Sidebar 
      v-if="route.name !== 'Login'" 
      :is-mobile-open="isMobileMenuOpen"
      @close="isMobileMenuOpen = false"
    />

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300">
      <!-- Mobile Header -->
      <div v-if="route.name !== 'Login'" class="lg:hidden p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-2">
           <img src="/logo.svg" alt="Logo" class="w-8 h-8" />
           <h1 class="text-xl font-bold text-primary-600 dark:text-primary-400">鲲侯·Karma</h1>
        </div>
        <button @click="isMobileMenuOpen = true" class="p-2 text-gray-600 dark:text-slate-300">
          <Menu :size="24" />
        </button>
      </div>

      <!-- Page Content -->
      <!-- Page Content -->
      <div :class="['flex-1 overflow-auto', route.name === 'Login' ? 'flex items-center justify-center' : 'p-4 lg:p-8']">
        <div :class="route.name !== 'Login' ? 'container mx-auto max-w-7xl' : 'w-full h-full'">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Global scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.dark ::-webkit-scrollbar-thumb {
  background: #475569;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
