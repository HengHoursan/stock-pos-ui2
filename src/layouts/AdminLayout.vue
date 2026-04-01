<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterView, RouterLink, useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { setLanguage, availableLocales } from "@/i18n";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "vue-sonner";
import {
  LayoutDashboard,
  Tag,
  LogOut,
  ChevronsUpDown,
  ChevronRight,
  Plus,
  List,
  Bookmark,
  Ruler,
  Coins,
  TicketPercent,
} from "lucide-vue-next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { locale, t } = useI18n();

const navItems = [
  { titleKey: "menu.dashboard", url: "/dashboard", icon: LayoutDashboard },
  {
    titleKey: "menu.categories",
    icon: Tag,
    children: [
      { titleKey: "menu.allCategories", url: "/admin/categories", icon: List },
      {
        titleKey: "menu.addCategory",
        url: "/admin/categories/create",
        icon: Plus,
      },
    ],
  },
  {
    titleKey: "menu.brands",
    icon: Bookmark,
    children: [
      { titleKey: "menu.allBrands", url: "/admin/brands", icon: List },
      {
        titleKey: "menu.addBrand",
        url: "/admin/brands/create",
        icon: Plus,
      },
    ],
  },
  {
    titleKey: "menu.units",
    icon: Ruler,
    children: [
      { titleKey: "menu.allUnits", url: "/admin/units", icon: List },
      {
        titleKey: "menu.addUnit",
        url: "/admin/units/create",
        icon: Plus,
      },
    ],
  },
  {
    titleKey: "menu.currencies",
    icon: Coins,
    children: [
      { titleKey: "menu.allCurrencies", url: "/admin/currencies", icon: List },
      {
        titleKey: "menu.addCurrency",
        url: "/admin/currencies/create",
        icon: Plus,
      },
    ],
  },
  {
    titleKey: "menu.discounts",
    icon: TicketPercent,
    children: [
      { titleKey: "menu.allDiscounts", url: "/admin/discounts", icon: List },
      {
        titleKey: "menu.addDiscount",
        url: "/admin/discounts/create",
        icon: Plus,
      },
    ],
  },
];

const currentLocaleItem = computed(() => {
  return availableLocales.find((l) => l.code === locale.value) || availableLocales[0];
});

function changeLanguage(code: "en" | "kh") {
  setLanguage(code);
}

const currentPageTitle = computed(() => {
  // Translate current page title conditionally or just return raw
  // In a robust app, we'd map route names to i18n keys
  const routeName = String(route.name ?? "Page");
  
  const routeKeyMap: Record<string, string> = {
    Dashboard: "menu.dashboard",
    Categories: "menu.allCategories",
    CategoryCreate: "menu.addCategory",
    Brands: "menu.allBrands",
    BrandCreate: "menu.addBrand",
    Units: "menu.allUnits",
    UnitCreate: "menu.addUnit",
    Currencies: "menu.allCurrencies",
    CurrencyCreate: "menu.addCurrency",
    Discounts: "menu.allDiscounts",
    DiscountCreate: "menu.addDiscount",
  };

  if (routeKeyMap[routeName]) {
    return t(routeKeyMap[routeName]);
  }
  return routeName;
});

const userInitials = computed(() => {
  const username = authStore.user?.username || authStore.user?.email || "U";
  return username.slice(0, 2).toUpperCase();
});

const formattedUsername = computed(() => {
  const name = authStore.user?.username || "Guest";
  return name.charAt(0).toUpperCase() + name.slice(1);
});

async function handleLogout() {
  await authStore.logout();
  toast.success("Logout successfully");
  router.push("/login");
}

onMounted(() => {
  authStore.fetchUser();
});
</script>

<template>
  <SidebarProvider>
    <Sidebar variant="inset" collapsible="icon">
      <!-- Header: Logo -->
      <SidebarHeader>
        <div class="flex items-center gap-2 px- py-2">
          <div
            class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <LayoutDashboard class="size-4" />
          </div>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-semibold">Stock POS</span>
            <span class="truncate text-xs text-muted-foreground">{{ $t('layout.adminPanel') }}</span>
          </div>
        </div>
      </SidebarHeader>

      <!-- Navigation -->
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{{ $t('layout.mainMenu') }}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="item in navItems" :key="item.titleKey">
                <Collapsible
                  v-if="item.children"
                  as-child
                  class="group/collapsible"
                >
                  <div>
                    <CollapsibleTrigger as-child>
                      <SidebarMenuButton :tooltip="$t(item.titleKey)">
                        <component :is="item.icon" />
                        <span>{{ $t(item.titleKey) }}</span>
                        <ChevronRight
                          class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem
                          v-for="subItem in item.children"
                          :key="subItem.titleKey"
                        >
                          <SidebarMenuSubButton as-child>
                            <RouterLink :to="subItem.url">
                              <component
                                :is="subItem.icon"
                                v-if="subItem.icon"
                                class="size-4"
                              />
                              <span>{{ $t(subItem.titleKey) }}</span>
                            </RouterLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
                <SidebarMenuButton v-else as-child :tooltip="$t(item.titleKey)">
                  <RouterLink :to="item.url">
                    <component :is="item.icon" />
                    <span>{{ $t(item.titleKey) }}</span>
                  </RouterLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <!-- Footer: User info + Logout -->
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <SidebarMenuButton
                  size="lg"
                  class="data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar class="h-8 w-8 rounded-lg">
                    <AvatarFallback class="rounded-lg">{{
                      userInitials
                    }}</AvatarFallback>
                  </Avatar>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{{
                      formattedUsername
                    }}</span>
                  </div>
                  <ChevronsUpDown class="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" class="w-56" align="start">
                <div class="flex items-center gap-2 p-2">
                  <Avatar class="h-8 w-8 rounded-lg">
                    <AvatarFallback class="rounded-lg">{{
                      userInitials
                    }}</AvatarFallback>
                  </Avatar>
                  <div class="grid flex-1 text-sm leading-tight">
                    <span class="truncate font-semibold">{{
                      formattedUsername
                    }}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  @click="handleLogout"
                  class="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut class="mr-2 h-4 w-4" />
                  {{ $t('common.logout') }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>

    <!-- Main content area -->
    <SidebarInset>
      <!-- Header with breadcrumb and Language Switcher -->
      <header class="flex h-16 shrink-0 items-center border-b px-4 justify-between w-full bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div class="flex items-center gap-2">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink as-child>
                  <RouterLink to="/">{{ $t('common.home') }}</RouterLink>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <template v-if="route.name !== 'Dashboard'">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{{ currentPageTitle }}</BreadcrumbPage>
                </BreadcrumbItem>
              </template>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <!-- Language Switcher: Dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm" class="h-8 gap-2 px-3 text-sm font-medium">
              <img
                :src="currentLocaleItem.flag"
                :alt="currentLocaleItem.name"
                class="h-3.5 w-5 rounded-sm object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.10)]"
              />
              <span>{{ currentLocaleItem.nativeName }}</span>
              <ChevronsUpDown class="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-44">
            <DropdownMenuItem
              v-for="lang in availableLocales"
              :key="lang.code"
              class="cursor-pointer gap-2"
              @click="changeLanguage(lang.code as 'en' | 'kh')"
            >
              <img
                :src="lang.flag"
                :alt="lang.name"
                class="h-3.5 w-5 rounded-sm object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.10)]"
              />
              <span class="flex-1">{{ lang.name }}</span>
              <span v-if="locale === lang.code" class="text-primary text-xs font-bold">✓</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main class="flex flex-1 flex-col gap-4 p-4 w-full">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>

<style scoped>
</style>
