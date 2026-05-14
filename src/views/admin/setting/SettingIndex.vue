<script setup lang="ts">
import { computed } from "vue";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useRoute, useRouter } from "vue-router";
import { Settings, AlertTriangle, ArrowLeft } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";

const { layout } = useAppI18n();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

// Only show back button if we are NOT on the settings root page
const showBackButton = computed(() => route.path !== "/admin/settings");

</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button 
          v-if="showBackButton && !authStore.user?.must_change_password" 
          variant="outline" 
          size="icon"
          class="mr-2"
          @click="router.push('/admin/settings')"
        >
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <div class="p-2 bg-primary/10 rounded-lg">
          <Settings class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 class="text-3xl font-bold tracking-tight">{{ layout.settingsDomain }}</h2>
          <p class="text-muted-foreground">{{ layout.settingsDescription || "Manage your account settings and preferences." }}</p>
        </div>
      </div>
    </div>

    <!-- Security Warning Banner -->
    <div 
      v-if="authStore.user?.must_change_password" 
      class="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-lg flex items-start gap-4 mb-6 animate-in slide-in-from-top-4"
    >
      <AlertTriangle class="h-6 w-6 text-destructive shrink-0 mt-0.5" />
      <div>
        <h3 class="text-destructive font-bold text-lg">Action Required: Update Your Password</h3>
        <p class="text-destructive/80 mt-1">
          Your password has been reset by an administrator. For your security, you must create a new private password before you can access the rest of the application.
        </p>
      </div>
    </div>

    <!-- This will render either SettingCards (the grid) or a specific setting view (full width) -->
    <RouterView class="animate-in fade-in duration-500" />
  </div>
</template>
