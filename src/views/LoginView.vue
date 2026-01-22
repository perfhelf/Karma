<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { isDemoMode, fetchInitialData } from '../stores/data'

const router = useRouter()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = '请输入邮箱和密码'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (authError) {
      error.value = authError.message
      return
    }

    if (data.user) {
      router.push('/')
    }
  } catch (e) {
    error.value = '登录失败，请重试'
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

async function handleDemoLogin() {
    isDemoMode.value = true
    await fetchInitialData()
    router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex bg-white dark:bg-slate-900">
    <!-- Left Side: Brand/Image (Hidden on mobile) -->
    <div class="hidden lg:flex lg:w-1/2 bg-primary-600 relative overflow-hidden items-center justify-center p-12">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800 opacity-90 z-10"></div>
      <img 
        src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop" 
        alt="Finance" 
        class="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
      />
      
      <!-- Brand Content -->
      <div class="relative z-20 text-white max-w-lg">
        <h1 class="text-5xl font-bold mb-6">鲲侯Karma记账系统</h1>
        <p class="text-xl text-primary-100 leading-relaxed">
          掌握您的财务命运。
          <br>简洁、强大、且完全属于您的每一笔交易。
        </p>
        
        <div class="mt-8 flex gap-4">
          <div class="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <p class="text-2xl font-bold">Privacy</p>
            <p class="text-sm text-primary-200">数据隐私优先</p>
          </div>
          <div class="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <p class="text-2xl font-bold">Speed</p>
            <p class="text-sm text-primary-200">极速记账体验</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Side: Login Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gray-50 dark:bg-slate-900">
      <div class="w-full max-w-md space-y-8">
        <!-- Mobile Logo (Hidden on Desktop) -->
        <div class="text-center lg:text-left">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2 lg:hidden">鲲侯·Karma</h1>
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white hidden lg:block">欢迎回来</h2>
          <p class="text-gray-500 dark:text-slate-400">请登录您的账户</p>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-slate-700">
          <form @submit.prevent="handleLogin" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">邮箱</label>
              <input
                v-model="email"
                type="email"
                placeholder="your@email.com"
                class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900 dark:text-white transition-all"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">密码</label>
              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900 dark:text-white transition-all"
              />
            </div>

            <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
              ⚠️ {{ error }}
            </div>

            <div class="flex flex-col gap-3">
                <button
                type="submit"
                :disabled="isLoading"
                class="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-600/30 transform active:scale-[0.98]"
                >
                {{ isLoading ? '登录中...' : '立即登录' }}
                </button>

                <button
                type="button"
                @click="handleDemoLogin"
                class="w-full py-3 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-500 transition-all font-medium"
                >
                👋 访客试用 (Guest Demo)
                </button>
            </div>
          </form>
        </div>
        
        <p class="text-center text-sm text-gray-400">
          Powered by Karma Ledger System
        </p>
      </div>
    </div>
  </div>
</template>
