<script setup lang="ts">
import { computed } from "vue";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useRoute, useRouter } from "vue-router";
import { BarChart3, ArrowLeft } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

const { layout } = useAppI18n();
const route = useRoute();
const router = useRouter();

// Only show back button if we are NOT on the reports root page
const showBackButton = computed(() => route.path !== "/admin/reports");

</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button 
          v-if="showBackButton" 
          variant="outline" 
          size="icon"
          class="mr-2"
          @click="router.push('/admin/reports')"
        >
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <div class="p-2 bg-primary/10 rounded-lg">
          <BarChart3 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 class="text-3xl font-bold tracking-tight">{{ layout.reportsDomain }}</h2>
          <p class="text-muted-foreground">{{ layout.reportsDomainDesc }}</p>
        </div>
      </div>
    </div>

    <!-- Nested view area -->
    <RouterView />
  </div>
</template>
