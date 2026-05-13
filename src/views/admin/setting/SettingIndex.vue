<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAppI18n } from "@/hooks/useAppI18n";
import ProfileSetting from "./ProfileSetting.vue";
import SecuritySetting from "./SecuritySetting.vue";
import { User, ShieldCheck, Settings, AlertTriangle } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";

const { t } = useAppI18n();
const authStore = useAuthStore();
const activeTab = ref("profile");

onMounted(() => {
  if (authStore.user?.must_change_password) {
    activeTab.value = "security";
  }
});

const tabs = [
  { id: "profile", label: t("layout.profile"), icon: User },
  { id: "security", label: t("layout.security"), icon: ShieldCheck },
];
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Settings class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 class="text-3xl font-bold tracking-tight">{{ t("layout.settingsDomain") }}</h2>
          <p class="text-muted-foreground">{{ t("layout.settingsDescription") || "Manage your account settings and preferences." }}</p>
        </div>
      </div>
    </div>

    <!-- Security Warning Banner -->
    <div 
      v-if="authStore.user?.must_change_password" 
      class="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-lg flex items-start gap-4 mb-6"
    >
      <AlertTriangle class="h-6 w-6 text-destructive shrink-0 mt-0.5" />
      <div>
        <h3 class="text-destructive font-bold text-lg">Action Required: Update Your Password</h3>
        <p class="text-destructive/80 mt-1">
          Your password has been reset by an administrator. For your security, you must create a new private password before you can access the rest of the application.
        </p>
      </div>
    </div>

    <div class="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
      <aside class="lg:w-1/5">
        <nav class="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
          <Button
            v-for="tab in tabs"
            :key="tab.id"
            variant="ghost"
            class="justify-start gap-2"
            :class="{ 
              'bg-muted hover:bg-muted': activeTab === tab.id,
              'opacity-50 cursor-not-allowed': authStore.user?.must_change_password && tab.id !== 'security'
            }"
            :disabled="authStore.user?.must_change_password && tab.id !== 'security'"
            @click="activeTab = tab.id"
          >
            <component :is="tab.icon" class="h-4 w-4" />
            {{ tab.label }}
          </Button>
        </nav>
      </aside>
      
      <div class="flex-1 lg:max-w-4xl">
        <div v-if="activeTab === 'profile'" class="space-y-6 animate-in fade-in duration-500">
          <ProfileSetting />
        </div>
        <div v-if="activeTab === 'security'" class="space-y-6 animate-in fade-in duration-500">
          <SecuritySetting />
        </div>
      </div>
    </div>
  </div>
</template>
