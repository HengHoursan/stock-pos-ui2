<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, Tag, Ruler, Users } from 'lucide-vue-next'

const stats = [
  { title: 'Total Brands', value: '12', icon: ShoppingBag, change: '+2 this month' },
  { title: 'Total Categories', value: '8', icon: Tag, change: '+1 this month' },
  { title: 'Total Units', value: '5', icon: Ruler, change: 'No change' },
  { title: 'Total Users', value: '3', icon: Users, change: '+1 this month' },
]
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Dashboard</h1>
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
