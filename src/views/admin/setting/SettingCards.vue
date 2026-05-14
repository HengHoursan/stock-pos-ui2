<script setup lang="ts">
import { computed } from "vue";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useRouter } from "vue-router";
import { User, ShieldAlert, ArrowRight } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const { layout } = useAppI18n();
const router = useRouter();
const authStore = useAuthStore();

const isSuperAdmin = computed(() => {
  const roleName = authStore.user?.role?.name?.toLowerCase() || "";
  return roleName.includes("admin") || roleName === "super admin";
});

const settingCards = computed(() => {
  const cards = [
    {
      id: "profile",
      path: "/admin/settings/profile",
      title: layout.profile,
      description: layout.profileDesc,
      icon: User,
    },
  ];
  if (isSuperAdmin.value) {
    cards.push({
      id: "permissions",
      path: "/admin/settings/permissions",
      title: layout.rolePermissions,
      description: layout.rolePermissionsDesc,
      icon: ShieldAlert,
    });
  }
  return cards;
});

const navigateTo = (path: string, id: string) => {
  if (authStore.user?.must_change_password && id !== "profile") return;
  router.push(path);
};
</script>

<template>
  <div
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500"
  >
    <Card
      v-for="card in settingCards"
      :key="card.id"
      class="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-md relative overflow-hidden"
      :class="{
        'opacity-50 cursor-not-allowed pointer-events-none grayscale':
          authStore.user?.must_change_password && card.id !== 'profile',
        'border-destructive shadow-[0_0_15px_rgba(239,68,68,0.2)]':
          authStore.user?.must_change_password && card.id === 'profile',
      }"
      @click="navigateTo(card.path, card.id)"
    >
      <div
        class="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
      ></div>
      <CardHeader
        class="pb-3 flex flex-row items-start justify-between space-y-0"
      >
        <div class="p-2.5 bg-primary/10 rounded-lg text-primary">
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
