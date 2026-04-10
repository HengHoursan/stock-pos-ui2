<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Package, 
  Truck, 
  History, 
  RotateCcw, 
  Banknote,
} from 'lucide-vue-next'

const { t } = useI18n()

// SALES & POS
const posStats = computed(() => [
  { title: t('menu.customers'), value: '24', icon: Users, change: t('dashboard.thisMonth', { change: '+3' }), color: 'text-emerald-500' },
  { title: t('menu.salePayments'), value: '128', icon: Banknote, change: t('dashboard.thisMonth', { change: '+12' }), color: 'text-emerald-500' },
  { title: t('menu.saleReturns'), value: '2', icon: RotateCcw, change: t('dashboard.noChange'), color: 'text-rose-500' },
])

// STOCK & PURCHASES
const stockStats = computed(() => [
  { title: t('menu.transactions'), value: '1,432', icon: History, change: t('dashboard.thisMonth', { change: '+89' }), color: 'text-orange-500' },
  { title: t('menu.purchasePayments'), value: '64', icon: Banknote, change: t('dashboard.thisMonth', { change: '+5' }), color: 'text-orange-500' },
  { title: t('menu.purchaseReturns'), value: '1', icon: RotateCcw, change: t('dashboard.noChange'), color: 'text-rose-500' },
])

// INVENTORY & MASTER
const inventoryStats = computed(() => [
  { title: t('menu.products'), value: '142', icon: Package, change: t('dashboard.thisMonth', { change: '+12' }), color: 'text-blue-500' },
  { title: t('menu.suppliers'), value: '8', icon: Truck, change: t('dashboard.noChange'), color: 'text-blue-500' },
])
</script>

<template>
  <div class="space-y-8">
    
    <!-- POS Section -->
    <div class="space-y-4">
      <h2 class="text-xl font-bold tracking-tight text-primary border-b pb-2">{{ $t('dashboard.pointOfSale') }}</h2>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card v-for="stat in posStats" :key="stat.title" class="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
            <CardTitle class="text-xs font-bold uppercase tracking-wider text-muted-foreground">{{ stat.title }}</CardTitle>
            <div class="p-2 rounded-lg bg-background shadow-sm group-hover:scale-110 transition-transform duration-300">
              <component :is="stat.icon" :class="['h-4 w-4', stat.color]" />
            </div>
          </CardHeader>
          <CardContent class="pt-4">
            <div class="text-3xl font-black tracking-tighter">{{ stat.value }}</div>
            <p class="text-[10px] font-medium text-muted-foreground mt-1">{{ stat.change }}</p>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- STOCK Section -->
    <div class="space-y-4">
      <h2 class="text-xl font-bold tracking-tight text-primary border-b pb-2">{{ $t('dashboard.stock') }}</h2>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card v-for="stat in stockStats" :key="stat.title" class="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
            <CardTitle class="text-xs font-bold uppercase tracking-wider text-muted-foreground">{{ stat.title }}</CardTitle>
            <div class="p-2 rounded-lg bg-background shadow-sm group-hover:scale-110 transition-transform duration-300">
              <component :is="stat.icon" :class="['h-4 w-4', stat.color]" />
            </div>
          </CardHeader>
          <CardContent class="pt-4">
            <div class="text-3xl font-black tracking-tighter">{{ stat.value }}</div>
            <p class="text-[10px] font-medium text-muted-foreground mt-1">{{ stat.change }}</p>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- INVENTORY Section -->
    <div class="space-y-4">
      <h2 class="text-xl font-bold tracking-tight text-primary border-b pb-2">{{ $t('dashboard.inventory') }}</h2>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card v-for="stat in inventoryStats" :key="stat.title" class="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
            <CardTitle class="text-xs font-bold uppercase tracking-wider text-muted-foreground">{{ stat.title }}</CardTitle>
            <div class="p-2 rounded-lg bg-background shadow-sm group-hover:scale-110 transition-transform duration-300">
              <component :is="stat.icon" :class="['h-4 w-4', stat.color]" />
            </div>
          </CardHeader>
          <CardContent class="pt-4">
            <div class="text-3xl font-black tracking-tighter">{{ stat.value }}</div>
            <p class="text-[10px] font-medium text-muted-foreground mt-1">{{ stat.change }}</p>
          </CardContent>
        </Card>
      </div>
    </div>

  </div>
</template>

