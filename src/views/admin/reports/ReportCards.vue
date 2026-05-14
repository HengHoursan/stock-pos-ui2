<script setup lang="ts">
import { computed } from "vue";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useRouter } from "vue-router";
import { 
  BarChart3, 
  ShoppingBag, 
  ShoppingCart, 
  Package, 
  PieChart, 
  TrendingUp,
  ArrowRight 
} from "lucide-vue-next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const { menu } = useAppI18n();
const router = useRouter();

const reportCards = computed(() => [
  {
    id: "sales",
    path: "/admin/reports/sales",
    title: menu.salesReport,
    description: menu.salesReportDesc,
    icon: BarChart3,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "purchases",
    path: "/admin/reports/purchases",
    title: menu.purchasesReport,
    description: menu.purchasesReportDesc,
    icon: ShoppingBag,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "inventory",
    path: "/admin/reports/inventory",
    title: menu.inventoryReport,
    description: menu.inventoryReportDesc,
    icon: Package,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "profit-loss",
    path: "/admin/reports/profit-loss",
    title: menu.plReport,
    description: menu.plReportDesc,
    icon: PieChart,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "top-performers",
    path: "/admin/reports/top-performers",
    title: menu.topPerformers,
    description: menu.topPerformersDesc,
    icon: TrendingUp,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
]);

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<template>
  <div
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500"
  >
    <Card
      v-for="card in reportCards"
      :key="card.id"
      class="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-md relative overflow-hidden"
      @click="navigateTo(card.path)"
    >
      <div
        class="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
      ></div>
      <CardHeader
        class="pb-3 flex flex-row items-start justify-between space-y-0"
      >
        <div :class="['p-2.5 rounded-lg', card.bgColor, card.color]">
          <component :is="card.icon" class="h-6 w-6" />
        </div>
        <ArrowRight
          class="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors transform group-hover:translate-x-1"
        />
      </CardHeader>
      <CardContent>
        <CardTitle class="text-xl mb-1">{{ card.title }}</CardTitle>
        <CardDescription class="text-sm">
          {{ card.description }}
        </CardDescription>
      </CardContent>
    </Card>
  </div>
</template>
