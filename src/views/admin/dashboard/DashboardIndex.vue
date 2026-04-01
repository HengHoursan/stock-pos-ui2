<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, Tag, Ruler, Users, Coins, TicketPercent } from 'lucide-vue-next'

const { t } = useI18n()

const stats = computed(() => [
  { title: t('dashboard.totalBrands'), value: '12', icon: ShoppingBag, change: t('dashboard.thisMonth', { change: '+2' }) },
  { title: t('dashboard.totalCategories'), value: '8', icon: Tag, change: t('dashboard.thisMonth', { change: '+1' }) },
  { title: t('dashboard.totalUnits'), value: '5', icon: Ruler, change: t('dashboard.noChange') },
  { title: t('dashboard.totalUsers'), value: '3', icon: Users, change: t('dashboard.thisMonth', { change: '+1' }) },
  { title: t('dashboard.totalCurrencies'), value: '2', icon: Coins, change: t('dashboard.noChange') },
  { title: t('dashboard.totalDiscounts'), value: '15', icon: TicketPercent, change: t('dashboard.thisMonth', { change: '+5' }) },
])
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold tracking-tight">{{ $t('dashboard.title') }}</h1>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="stat in stats" :key="stat.title" class="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
          <CardTitle class="text-xs font-bold uppercase tracking-wider text-muted-foreground">{{ stat.title }}</CardTitle>
          <div class="p-2 rounded-lg bg-background shadow-sm group-hover:scale-110 transition-transform duration-300">
            <component :is="stat.icon" class="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent class="pt-4">
          <div class="text-3xl font-black tracking-tighter">{{ stat.value }}</div>
          <p class="text-[10px] font-medium text-muted-foreground mt-1">{{ stat.change }}</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
