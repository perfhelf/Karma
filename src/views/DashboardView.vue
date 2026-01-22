<script setup lang="ts">
import { ref, computed } from 'vue'
import { TrendingUp, TrendingDown, Wallet, PieChart, ChevronDown } from 'lucide-vue-next'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart as EchartsPie } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import { getISOWeek, getYear, setWeek, startOfWeek, endOfWeek, format } from 'date-fns'
import { 
  transactions, 
  categories, 
  calculateTotal, 
  getExpenseByCategory,
  formatCurrency,
} from '../stores/data'

// Register ECharts components
use([CanvasRenderer, BarChart, EchartsPie, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent])

// Available years
const availableYears = computed(() => {
  const years = new Set(transactions.value.map(t => new Date(t.transaction_date).getFullYear()))
  return Array.from(years).sort((a, b) => b - a)
})

// Current selections
const selectedYear = ref(new Date().getFullYear())
const selectedPeriod = ref<'week' | 'month' | 'year'>('month')
const selectedType = ref<'all' | 'expense' | 'income'>('all')

const periods = [
  { value: 'week', label: '周线' },
  { value: 'month', label: '月线' },
  { value: 'year', label: '年线' },
]

// Filter transactions by selected year
const yearTransactions = computed(() => {
  return transactions.value.filter(t => {
    const date = new Date(t.transaction_date)
    return date.getFullYear() === selectedYear.value
  })
})

// Group transactions by period
const periodData = computed(() => {
  const txns = transactions.value
  
  if (selectedPeriod.value === 'year') {
    // 2020 to Current Year
    const startYear = 2020
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i)
    
    // Auto-expand if transactions exist in future (just in case)
    const maxTxnYear = Math.max(...txns.map(t => new Date(t.transaction_date).getFullYear()))
    if (maxTxnYear > currentYear) {
      for (let y = currentYear + 1; y <= maxTxnYear; y++) years.push(y)
    }

    const expense = years.map(y => 
      calculateTotal(txns.filter(t => new Date(t.transaction_date).getFullYear() === y), 'expense')
    )
    const income = years.map(y => 
      calculateTotal(txns.filter(t => new Date(t.transaction_date).getFullYear() === y), 'income')
    )
    return { labels: years.map(String), expense, income }
  }
  
  const currentYearTxns = yearTransactions.value
  
  if (selectedPeriod.value === 'month') {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const expense = months.map((_, i) => 
      calculateTotal(currentYearTxns.filter(t => new Date(t.transaction_date).getMonth() === i), 'expense')
    )
    const income = months.map((_, i) => 
      calculateTotal(currentYearTxns.filter(t => new Date(t.transaction_date).getMonth() === i), 'income')
    )
    return { labels: months, expense, income }
  }
  
  // Week line: Calculate real weeks for selected year
  // A year has 52 or 53 weeks.
  const weeksCount = 53
  const weekLabels = []
  const tooltips = []
  
  // Generate labels and date ranges
  for (let i = 1; i <= weeksCount; i++) {
    const date = setWeek(new Date(selectedYear.value, 0, 1), i, { weekStartsOn: 1, firstWeekContainsDate: 4 })
    // If the computed week date year is different and it's week 53, it might handle edge cases, 
    // but simplified: stick to 53 weeks max.
    
    const start = startOfWeek(date, { weekStartsOn: 1 })
    const end = endOfWeek(date, { weekStartsOn: 1 })
    
    // Only include if the week overlaps significantly with valid year range or just standard 52/53
    weekLabels.push(`第${i}周`)
    tooltips.push(`${format(start, 'MM-dd')} ~ ${format(end, 'MM-dd')}`)
  }
  
  const weeklyExpense = new Array(weeksCount).fill(0)
  const weeklyIncome = new Array(weeksCount).fill(0)
  
  currentYearTxns.forEach(t => {
    const date = new Date(t.transaction_date)
    const week = getISOWeek(date)
    const year = getYear(date)
    
    if (year === selectedYear.value) {
      const idx = week - 1
      if (idx >= 0 && idx < weeksCount) {
        if (t.type === 'expense') weeklyExpense[idx] += t.amount
        else weeklyIncome[idx] += t.amount
      }
    }
  })
  
  return {
    labels: weekLabels,
    expense: weeklyExpense,
    income: weeklyIncome,
    tooltips // Extra data for tooltip formatter
  }
})

// Stats
const totalExpense = computed(() => calculateTotal(yearTransactions.value, 'expense'))
const totalIncome = computed(() => calculateTotal(yearTransactions.value, 'income'))
const balance = computed(() => totalIncome.value - totalExpense.value)

// Period label
const periodLabel = computed(() => {
  if (selectedPeriod.value === 'year') return '年度财务概览'
  return `${selectedYear.value}年`
})

// Bar chart options
const chartOptions = computed(() => {
  const data = periodData.value
  const series = []
  
  if (selectedType.value === 'all' || selectedType.value === 'expense') {
    series.push({
      name: '支出',
      type: 'bar',
      data: data.expense,
      itemStyle: { color: '#ef4444', borderRadius: [2, 2, 0, 0] },
      barMaxWidth: 40,
    })
  }
  
  if (selectedType.value === 'all' || selectedType.value === 'income') {
    series.push({
      name: '收入',
      type: 'bar',
      data: data.income,
      itemStyle: { color: '#22c55e', borderRadius: [2, 2, 0, 0] },
      barMaxWidth: 40,
    })
  }

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const index = params[0].dataIndex
        let title = params[0].axisValue
        
        // Add date range for week view
        if (selectedPeriod.value === 'week' && data.tooltips && data.tooltips[index]) {
          title += `<br/><span style="color:#94a3b8;font-size:12px">${data.tooltips[index]}</span>`
        }
        
        let result = `<b>${title}</b><br/>`
        params.forEach((p: any) => {
          result += `${p.marker} ${p.seriesName}: ¥${p.value.toLocaleString()}<br/>`
        })
        return result
      },
      textStyle: { fontSize: 13 }
    },
    legend: {
      data: selectedType.value === 'all' ? ['支出', '收入'] : [selectedType.value === 'expense' ? '支出' : '收入'],
      bottom: 0,
      textStyle: { color: '#64748b' },
    },
    grid: { left: '2%', right: '2%', bottom: '15%', top: '5%', containLabel: true },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100,
        bottom: 35,
        height: 20,
        borderColor: 'transparent',
        backgroundColor: 'rgba(0,0,0,0.05)',
        fillerColor: 'rgba(34, 197, 94, 0.2)',
        handleStyle: { color: '#22c55e' },
      },
      {
        type: 'inside',
        xAxisIndex: [0],
        start: 0,
        end: 100,
      }
    ],
    xAxis: {
      type: 'category',
      data: data.labels,
      axisLabel: { color: '#64748b', interval: 'auto' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { 
        color: '#64748b',
        formatter: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value),
      },
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
    },
    series,
  }
})

// Category data for pie chart
const categoryStats = computed(() => {
  const expenseData = getExpenseByCategory(yearTransactions.value)
  return Object.entries(expenseData).map(([name, value]) => {
    const cat = categories.value.find(c => c.name === name)
    return { name: `${cat?.icon || '📁'} ${name}`, value, icon: cat?.icon || '📁' }
  }).sort((a, b) => b.value - a.value)
})

const categoryChartOptions = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
    label: { show: true, formatter: '{b}\n{d}%' },
    data: categoryStats.value.slice(0, 8),
  }],
}))
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Period & Year Selector -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">仪表盘</h1>
        <p class="text-gray-500 dark:text-slate-400 mt-1">{{ periodLabel }} 财务概览</p>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Year Selector (Only for Week/Month) -->
        <div v-if="selectedPeriod !== 'year'" class="relative">
          <select
            v-model="selectedYear"
            class="px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-700 dark:text-slate-300 appearance-none cursor-pointer pr-10 outline-none"
          >
            <option v-for="year in availableYears" :key="year" :value="year">{{ year }}年</option>
          </select>
          <ChevronDown :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        
        <!-- Period Selector -->
        <div class="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-xl">
          <button
            v-for="period in periods"
            :key="period.value"
            @click="selectedPeriod = period.value as any"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              selectedPeriod === period.value
                ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            ]"
          >
            {{ period.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">总支出</p>
            <p class="text-2xl font-bold mt-1 text-red-500">{{ formatCurrency(totalExpense) }}</p>
          </div>
          <div class="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500">
            <TrendingDown :size="24" />
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">总收入</p>
            <p class="text-2xl font-bold mt-1 text-green-500">{{ formatCurrency(totalIncome) }}</p>
          </div>
          <div class="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-500">
            <TrendingUp :size="24" />
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">结余</p>
            <p :class="['text-2xl font-bold mt-1', balance >= 0 ? 'text-primary-500' : 'text-red-500']">
              {{ formatCurrency(balance) }}
            </p>
          </div>
          <div class="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-500">
            <Wallet :size="24" />
          </div>
        </div>
      </div>
    </div>

    <!-- Chart Section -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">收支趋势</h2>
        
        <div class="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-xl">
          <button
            @click="selectedType = 'all'"
            :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-all', selectedType === 'all' ? 'bg-white dark:bg-slate-600 text-gray-700 dark:text-white shadow-sm' : 'text-gray-500']"
          >全部</button>
          <button
            @click="selectedType = 'expense'"
            :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-all', selectedType === 'expense' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500']"
          >支出</button>
          <button
            @click="selectedType = 'income'"
            :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-all', selectedType === 'income' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500']"
          >收入</button>
        </div>
      </div>
      
      <v-chart :option="chartOptions" style="height: 350px" autoresize />
    </div>

    <!-- Category Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <div class="flex items-center gap-2 mb-4">
          <PieChart :size="20" class="text-gray-400" />
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">支出分类</h2>
        </div>
        <v-chart :option="categoryChartOptions" style="height: 280px" autoresize />
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">分类明细</h2>
        <div class="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
          <div
            v-for="cat in categoryStats.slice(0, 10)"
            :key="cat.name"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
          >
            <span class="font-medium text-gray-700 dark:text-slate-300">{{ cat.name }}</span>
            <span class="font-semibold text-red-500">{{ formatCurrency(cat.value) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
</style>
