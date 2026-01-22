import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'

const routes = [
    {
        path: '/',
        name: 'Dashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/transactions',
        name: 'Transactions',
        component: () => import('../views/TransactionsView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/transactions/new',
        name: 'NewTransaction',
        component: () => import('../views/NewTransactionView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/categories',
        name: 'Categories',
        component: () => import('../views/CategoriesView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/ledgers',
        name: 'Ledgers',
        component: () => import('../views/LedgersView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/settings',
        name: 'Settings',
        component: () => import('../views/SettingsView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/LoginView.vue'),
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// Auth Guard
router.beforeEach(async (to, _from, next) => {
    // Check if route requires auth
    if (to.matched.some(record => record.meta.requiresAuth)) {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            next({ name: 'Login' })
            return
        }
    }

    // Check if user is already logged in and trying to access login page
    if (to.name === 'Login') {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            next({ name: 'Dashboard' })
            return
        }
    }

    next()
})

export default router
