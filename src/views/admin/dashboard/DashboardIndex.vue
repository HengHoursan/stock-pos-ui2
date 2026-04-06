<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, Tag, Ruler, Users, Coins, TicketPercent, Package, Truck, Store, History } from 'lucide-vue-next'

const { t } = useI18n()

// POS
const posStats = computed(() => [
  { title: t('menu.customers'), value: '24', icon: Users, change: t('dashboard.thisMonth', { change: '+3' }) },
  { title: 'Sale Orders', value: '0', icon: Store, change: t('dashboard.noChange') },
  { title: 'Sale Invoices', value: '0', icon: TicketPercent, change: t('dashboard.noChange') },
])

// STOCK
const stockStats = computed(() => [
  { title: t('menu.transactions'), value: '1,432', icon: History, change: t('dashboard.thisMonth', { change: '+89' }) },
  { title: 'Purchase Orders', value: '0', icon: ShoppingBag, change: t('dashboard.noChange') },
  { title: 'Purchase Invoices', value: '0', icon: TicketPercent, change: t('dashboard.noChange') },
])

// INVENTORY
const inventoryStats = computed(() => [
  { title: t('menu.products'), value: '142', icon: Package, change: t('dashboard.thisMonth', { change: '+12' }) },
  { title: t('dashboard.totalCategories'), value: '8', icon: Tag, change: t('dashboard.thisMonth', { change: '+1' }) },
  { title: t('dashboard.totalBrands'), value: '12', icon: ShoppingBag, change: t('dashboard.thisMonth', { change: '+2' }) },
  { title: t('dashboard.totalUnits'), value: '5', icon: Ruler, change: t('dashboard.noChange') },
])

// SETTINGS
const settingsStats = computed(() => [
  { title: t('dashboard.totalCurrencies'), value: '2', icon: Coins, change: t('dashboard.noChange') },
  { title: t('menu.suppliers'), value: '8', icon: Truck, change: t('dashboard.noChange') },
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
              <component :is="stat.icon" class="h-4 w-4 text-emerald-500" />
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
              <component :is="stat.icon" class="h-4 w-4 text-orange-500" />
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
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card v-for="stat in inventoryStats" :key="stat.title" class="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
            <CardTitle class="text-xs font-bold uppercase tracking-wider text-muted-foreground">{{ stat.title }}</CardTitle>
            <div class="p-2 rounded-lg bg-background shadow-sm group-hover:scale-110 transition-transform duration-300">
              <component :is="stat.icon" class="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent class="pt-4">
            <div class="text-3xl font-black tracking-tighter">{{ stat.value }}</div>
            <p class="text-[10px] font-medium text-muted-foreground mt-1">{{ stat.change }}</p>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- SETTINGS Section -->
    <div class="space-y-4">
      <h2 class="text-xl font-bold tracking-tight text-primary border-b pb-2">{{ $t('dashboard.settings') }}</h2>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card v-for="stat in settingsStats" :key="stat.title" class="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
            <CardTitle class="text-xs font-bold uppercase tracking-wider text-muted-foreground">{{ stat.title }}</CardTitle>
            <div class="p-2 rounded-lg bg-background shadow-sm group-hover:scale-110 transition-transform duration-300">
              <component :is="stat.icon" class="h-4 w-4 text-slate-500" />
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
