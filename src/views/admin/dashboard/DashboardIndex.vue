<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, Tag, Ruler, Users } from 'lucide-vue-next'

const { t } = useI18n()

const stats = computed(() => [
  { title: t('dashboard.totalBrands'), value: '12', icon: ShoppingBag, change: t('dashboard.thisMonth', { change: '+2' }) },
  { title: t('dashboard.totalCategories'), value: '8', icon: Tag, change: t('dashboard.thisMonth', { change: '+1' }) },
  { title: t('dashboard.totalUnits'), value: '5', icon: Ruler, change: t('dashboard.noChange') },
  { title: t('dashboard.totalUsers'), value: '3', icon: Users, change: t('dashboard.thisMonth', { change: '+1' }) },
])
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">{{ $t('dashboard.title') }}</h1>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card v-for="stat in stats" :key="stat.title">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">{{ stat.title }}</CardTitle>
          <component :is="stat.icon" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stat.value }}</div>
          <p class="text-xs text-muted-foreground">{{ stat.change }}</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
