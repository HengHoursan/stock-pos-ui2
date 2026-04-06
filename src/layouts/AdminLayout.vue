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
  Package,
  Truck,
  Users,
  UserCog,
  History,
} from "lucide-vue-next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuthStore } from "@/stores/auth";
import ModeToggle from "@/components/ModeToggle.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { locale, t } = useI18n();

interface NavItem {
  titleKey: string;
  icon: any;
  url?: string;
  children?: { titleKey: string; url: string; icon: any }[];
}

interface NavDomain {
  domainKey: string;
  items: NavItem[];
}

const navDomains: NavDomain[] = [
  {
    domainKey: "layout.posDomain",
    items: [
      { titleKey: "menu.dashboard", url: "/dashboard", icon: LayoutDashboard },
      { titleKey: "menu.customers", url: "/admin/customers", icon: Users },
    ]
  },
  {
    domainKey: "layout.stockDomain",
    items: [
      {
        titleKey: "menu.transactions",
        icon: History,
        children: [
          { titleKey: "menu.allTransactions", url: "/admin/transactions", icon: List },
          { titleKey: "menu.addTransaction", url: "/admin/transactions/create", icon: Plus },
        ],
      },
    ]
  },
  {
    domainKey: "layout.inventoryDomain",
    items: [
      {
        titleKey: "menu.products",
        icon: Package,
        children: [
          { titleKey: "menu.allProducts", url: "/admin/products", icon: List },
          { titleKey: "menu.addProduct", url: "/admin/products/create", icon: Plus },
        ],
      },
      {
        titleKey: "menu.categories",
        icon: Tag,
        children: [
          { titleKey: "menu.allCategories", url: "/admin/categories", icon: List },
          { titleKey: "menu.addCategory", url: "/admin/categories/create", icon: Plus },
        ],
      },
      {
        titleKey: "menu.brands",
        icon: Bookmark,
        children: [
          { titleKey: "menu.allBrands", url: "/admin/brands", icon: List },
          { titleKey: "menu.addBrand", url: "/admin/brands/create", icon: Plus },
        ],
      },
      {
        titleKey: "menu.units",
        icon: Ruler,
        children: [
          { titleKey: "menu.allUnits", url: "/admin/units", icon: List },
          { titleKey: "menu.addUnit", url: "/admin/units/create", icon: Plus },
        ],
      },
    ]
  },
  {
    domainKey: "layout.settingsDomain",
    items: [
      {
        titleKey: "menu.currencies",
        icon: Coins,
        children: [
          { titleKey: "menu.allCurrencies", url: "/admin/currencies", icon: List },
          { titleKey: "menu.addCurrency", url: "/admin/currencies/create", icon: Plus },
        ],
      },
      {
        titleKey: "menu.users",
        icon: UserCog,
        children: [
          { titleKey: "menu.allUsers", url: "/admin/users", icon: List },
          { titleKey: "menu.addUser", url: "/admin/users/create", icon: Plus },
        ],
      },
      {
        titleKey: "menu.suppliers",
        icon: Truck,
        children: [
          { titleKey: "menu.allSuppliers", url: "/admin/suppliers", icon: List },
          { titleKey: "menu.addSupplier", url: "/admin/suppliers/create", icon: Plus },
        ],
      },
    ]
  }
];

const currentLocaleItem = computed(() => {
  return availableLocales.find((l) => l.code === locale.value) || availableLocales[0];
});

function changeLanguage(code: "en" | "kh") {
  setLanguage(code);
}

const currentPageTitle = computed(() => {
  const titleKey = route.meta.title as string | undefined;
  if (titleKey) {
    return t(titleKey);
  }
  return String(route.name ?? "Page");
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
        <SidebarGroup v-for="domain in navDomains" :key="domain.domainKey">
          <SidebarGroupLabel>{{ $t(domain.domainKey) }}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="item in domain.items" :key="item.titleKey">
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
                          <SidebarMenuSubButton as-child :class="{ 'bg-primary/10 text-primary font-semibold ring-1 ring-primary/20': route.path === subItem.url }">
                            <RouterLink :to="subItem.url">
                              <component
                                :is="subItem.icon"
                                v-if="subItem.icon"
                                :class="['size-4', route.path === subItem.url ? 'text-primary' : 'text-muted-foreground']"
                              />
                              <span>{{ $t(subItem.titleKey) }}</span>
                            </RouterLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
                <SidebarMenuButton v-else as-child :tooltip="$t(item.titleKey)" :class="{ 'bg-primary/10 text-primary font-semibold ring-1 ring-primary/20': item.url && route.path === item.url }">
                  <RouterLink :to="item.url || ''">
                    <component :is="item.icon" :class="item.url && route.path === item.url ? 'text-primary' : 'text-muted-foreground'" />
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
                  <RouterLink to="/" class="hover:text-primary transition-colors">{{ $t('common.home') }}</RouterLink>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <template v-if="route.name !== 'Dashboard'">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage class="text-primary font-semibold">{{ currentPageTitle }}</BreadcrumbPage>
                </BreadcrumbItem>
              </template>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div class="flex items-center gap-3">
          <!-- Theme Toggle -->
          <ModeToggle />

          <!-- Language Switcher: Dropdown -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm" class="h-8 gap-2 px-3 text-sm font-medium border-muted-foreground/20 hover:border-primary/50 transition-colors">
                <img
                  :src="currentLocaleItem.flag"
                  :alt="currentLocaleItem.name"
                  class="h-3.5 w-5 rounded-sm object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.10)]"
                />
                <span class="hidden sm:inline">{{ currentLocaleItem.nativeName }}</span>
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
        </div>
      </header>

      <main class="flex flex-1 flex-col gap-4 p-4 w-full">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>

<style scoped>
</style>
