import { ref, watch, onMounted } from 'vue'

export type Theme = 'light' | 'dark' | 'auto'

export function useTheme() {
    // Safe localStorage access
    const getStoredTheme = (): Theme | null => {
        if (typeof window === 'undefined') return null
        try {
            return localStorage.getItem('theme') as Theme
        } catch (e) {
            console.warn('LocalStorage access denied', e)
            return null
        }
    }

    const theme = ref<Theme>(getStoredTheme() || 'auto')

    function applyTheme() {
        if (typeof window === 'undefined') return

        const isDark =
            theme.value === 'dark' ||
            (theme.value === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)

        document.documentElement.classList.toggle('dark', isDark)
    }

    // Watch for theme changes
    watch(theme, (newTheme) => {
        try {
            localStorage.setItem('theme', newTheme)
        } catch { }
        applyTheme()
    })

    // Listen to system changes if auto
    onMounted(() => {
        applyTheme()
        try {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (theme.value === 'auto') applyTheme()
            })
        } catch { }
    })

    function toggleNext() {
        const modes: Theme[] = ['light', 'dark', 'auto']
        const nextIndex = (modes.indexOf(theme.value) + 1) % modes.length
        theme.value = modes[nextIndex] as Theme
    }

    return {
        theme,
        toggleNext
    }
}
