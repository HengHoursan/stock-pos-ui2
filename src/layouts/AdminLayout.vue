<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterView, RouterLink, useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useDark, useToggle } from "@vueuse/core";
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
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  Bookmark,
  Ruler,
  Coins,
  Package,
  Truck,
  Users,
  UserCog,
  History,
  FileText,
  ShoppingBag,
  Receipt,
  ArrowRightLeft,
  CreditCard,
  Layers,
  ShieldCheck,
  Globe,
  RotateCcw,
  Banknote,
  LineChart,
  BarChart3,
  TrendingUp,
  PieChart,
  Sun,
  Moon,
  Settings,
  Star,
} from "lucide-vue-next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuthStore } from "@/stores/auth";
import { useCurrencyStore } from "@/stores/currency";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const currencyStore = useCurrencyStore();
const { locale, t } = useI18n();
const isDark = useDark();
const toggleDark = useToggle(isDark);

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
      { 
        titleKey: "menu.sales", 
        icon: Coins,
        children: [
          { titleKey: "menu.saleOrders", url: "/admin/sale-orders", icon: Package },
          { titleKey: "menu.saleQuotations", url: "/admin/sale-quotations", icon: FileText },
          { titleKey: "menu.saleInvoices", url: "/admin/sale-invoices", icon: CreditCard },
          { titleKey: "menu.salePayments", url: "/admin/sale-payments", icon: Banknote },
          { titleKey: "menu.saleReturns", url: "/admin/sale-returns", icon: RotateCcw },
        ]
      }
    ]
  },
  {
    domainKey: "layout.stockDomain",
    items: [
      {
        titleKey: "menu.transactions",
        icon: History,
        children: [
          { titleKey: "menu.allTransactions", url: "/admin/transactions", icon: ArrowRightLeft },
          { titleKey: "menu.addTransaction", url: "/admin/transactions/create", icon: Plus },
        ],
      },
      {
        titleKey: "menu.purchases",
        icon: Truck,
        children: [
          { titleKey: "menu.purchaseQuotations", url: "/admin/purchase-quotations", icon: FileText },
          { titleKey: "menu.purchaseOrders", url: "/admin/purchase-orders", icon: ShoppingBag },
          { titleKey: "menu.purchaseInvoices", url: "/admin/purchase-invoices", icon: Receipt },
          { titleKey: "menu.purchasePayments", url: "/admin/purchase-payments", icon: Banknote },
          { titleKey: "menu.purchaseReturns", url: "/admin/purchase-returns", icon: RotateCcw },
        ]
      }
    ]
  },
  {
    domainKey: "layout.inventoryDomain",
    items: [
      {
        titleKey: "menu.products",
        icon: Package,
        children: [
          { titleKey: "menu.allProducts", url: "/admin/products", icon: Package },
          { titleKey: "menu.addProduct", url: "/admin/products/create", icon: Plus },
        ],
      },
      {
        titleKey: "menu.categories",
        icon: Tag,
        children: [
          { titleKey: "menu.allCategories", url: "/admin/categories", icon: Layers },
          { titleKey: "menu.addCategory", url: "/admin/categories/create", icon: Plus },
        ],
      },
      {
        titleKey: "menu.brands",
        icon: Bookmark,
        children: [
          { titleKey: "menu.allBrands", url: "/admin/brands", icon: Bookmark },
          { titleKey: "menu.addBrand", url: "/admin/brands/create", icon: Plus },
        ],
      },
      {
        titleKey: "menu.units",
        icon: Ruler,
        children: [
          { titleKey: "menu.allUnits", url: "/admin/units", icon: Ruler },
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
          { titleKey: "menu.allCurrencies", url: "/admin/currencies", icon: Coins },
          { titleKey: "menu.addCurrency", url: "/admin/currencies/create", icon: Plus },
        ],
      },
      {
        titleKey: "menu.users",
        icon: UserCog,
        children: [
          { titleKey: "menu.allUsers", url: "/admin/users", icon: ShieldCheck },
          { titleKey: "menu.addUser", url: "/admin/users/create", icon: Plus },
        ],
      },
      {
        titleKey: "menu.suppliers",
        icon: Truck,
        children: [
          { titleKey: "menu.allSuppliers", url: "/admin/suppliers", icon: Globe },
          { titleKey: "menu.addSupplier", url: "/admin/suppliers/create", icon: Plus },
        ],
      },
    ]
  },
  {
    domainKey: "layout.reportsDomain",
    items: [
      {
        titleKey: "menu.analytics",
        icon: LineChart,
        children: [
          { titleKey: "menu.salesReport", url: "/admin/reports/sales", icon: TrendingUp },
          { titleKey: "menu.purchasesReport", url: "/admin/reports/purchases", icon: ShoppingBag },
          { titleKey: "menu.inventoryReport", url: "/admin/reports/inventory", icon: Package },
          { titleKey: "menu.plReport", url: "/admin/reports/profit-loss", icon: PieChart },
          { titleKey: "menu.topPerformers", url: "/admin/reports/top-performers", icon: BarChart3 },
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
  toast.success(t("common.logoutSuccess"));
  router.push("/login");
}

onMounted(() => {
  authStore.fetchUser();
  currencyStore.fetchCurrencies();
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
                  :default-open="item.children.some(child => route.path.startsWith(child.url))"
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
              <DropdownMenuContent side="top" class="w-64 p-2 shadow-2xl border-primary/10" align="start" :side-offset="10">
                <!-- User Profile Header -->
                <DropdownMenuLabel class="font-normal border-b pb-2 mb-1">
                  <div class="flex items-center gap-3 px-1 py-1.5">
                    <Avatar class="h-9 w-9 rounded-full border-2 border-primary/20 shadow-sm">
                      <AvatarFallback class="rounded-full bg-primary/10 text-primary font-bold">{{
                        userInitials
                      }}</AvatarFallback>
                    </Avatar>
                    <div class="flex flex-col gap-0.5 min-w-0">
                      <span class="truncate font-bold text-sm leading-none text-foreground">{{
                        formattedUsername
                      }}</span>
                      <span class="truncate text-[10px] text-muted-foreground">{{ authStore.user?.email || 'Administrator' }}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuGroup class="mt-1">
                  <DropdownMenuItem 
                    @click="toggleDark()" 
                    class="cursor-pointer flex items-center justify-between py-2 px-2.5 rounded-md transition-colors hover:bg-accent group"
                  >
                    <div class="flex items-center">
                      <Sun v-if="!isDark" class="mr-3 h-4 w-4 text-amber-500 opacity-80" />
                      <Moon v-else class="mr-3 h-4 w-4 text-indigo-400 opacity-80" />
                      <span class="text-sm font-medium text-foreground/80">{{ isDark ? $t('layout.darkMode') : $t('layout.lightMode') }}</span>
                    </div>
                    <div 
                      class="h-4 w-7 rounded-full bg-muted border p-0.5 flex items-center transition-all duration-300" 
                      :class="{ 'bg-primary/50 border-primary/30': isDark }"
                    >
                       <div 
                        class="h-2.5 w-2.5 rounded-full bg-background shadow-sm transform transition-transform duration-300" 
                        :class="{ 'translate-x-3': isDark }"
                       ></div>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator class="my-1" />

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger class="cursor-pointer py-2 px-2.5 transition-colors focus:bg-accent">
                      <Globe class="mr-3 h-4 w-4 text-muted-foreground opacity-70" />
                      <span class="text-sm font-medium text-foreground/80">{{ $t('layout.language') }}</span>
                      <div class="ml-auto flex items-center gap-1.5 opacity-60">
                        <img
                          :src="currentLocaleItem.flag"
                          class="h-3 w-4 rounded-sm object-cover opacity-80"
                        />
                        <span class="text-[10px] font-bold uppercase tracking-tight">{{ currentLocaleItem.code }}</span>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent class="w-48 p-1">
                      <DropdownMenuItem
                        v-for="lang in availableLocales"
                        :key="lang.code"
                        class="cursor-pointer flex items-center gap-3 p-2 rounded-sm"
                        @click="changeLanguage(lang.code as 'en' | 'kh')"
                      >
                        <img
                          :src="lang.flag"
                          class="h-3.5 w-5 rounded-sm object-cover shadow-sm"
                        />
                        <span class="flex-1 text-sm font-medium">{{ lang.name }}</span>
                        <div v-if="locale === lang.code" class="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger class="cursor-pointer py-2 px-2.5 transition-colors focus:bg-accent">
                      <Coins class="mr-3 h-4 w-4 text-muted-foreground opacity-70" />
                      <span class="text-sm font-medium text-foreground/80">{{ $t('layout.currency') }}</span>
                      <span class="ml-auto text-[10px] font-bold text-muted-foreground opacity-60 uppercase tracking-tight">{{ currencyStore.activeCurrency?.code }}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent class="w-48 p-1">
                      <DropdownMenuItem
                        v-for="curr in currencyStore.availableCurrencies"
                        :key="curr.id"
                        class="cursor-pointer flex items-center gap-2.5 p-2 rounded-sm"
                        @click="currencyStore.setCurrency(curr)"
                      >
                        <span class="font-mono text-xs font-bold text-muted-foreground w-4">{{ curr.symbol }}</span>
                        <span class="flex-1 text-sm">{{ curr.code }}</span>
                        <div v-if="currencyStore.activeCurrency?.id === curr.id" class="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuGroup>

                <DropdownMenuSeparator class="my-1" />
                
                <DropdownMenuItem
                  @click="handleLogout"
                  class="text-destructive focus:text-destructive cursor-pointer py-2 px-2.5 flex items-center font-medium"
                >
                  <LogOut class="mr-3 h-4 w-4" />
                  <span class="text-sm">{{ $t('common.logout') }}</span>
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
          <!-- Removed Toggles (Moved to Sidebar Footer Dropdown) -->
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
