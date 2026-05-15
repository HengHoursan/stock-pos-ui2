<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterView, RouterLink, useRoute, useRouter } from "vue-router";
import { useAppI18n } from "@/hooks/useAppI18n";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  BarChart3,
  Sun,
  Moon,
  Settings,
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
const { locale, t, layout, common } = useAppI18n();
const isDark = useDark();
const toggleDark = useToggle(isDark);

interface NavItem {
  titleKey: string;
  icon: any;
  url?: string;
  permission?: string | string[];
  children?: {
    titleKey: string;
    url: string;
    icon: any;
    permission?: string | string[];
  }[];
}

interface NavDomain {
  domainKey: string;
  permission?: string | string[];
  items: NavItem[];
}

const navDomains: NavDomain[] = [
  {
    domainKey: "layout.posDomain",
    items: [
      { titleKey: "menu.dashboard", url: "/dashboard", icon: LayoutDashboard },
      {
        titleKey: "menu.customers",
        url: "/admin/customers",
        icon: Users,
        permission: "customer:view",
      },
      {
        titleKey: "menu.sales",
        icon: Coins,
        permission: [
          "sale_order:view",
          "sale_invoice:view",
          "sale_payment:view",
          "sale_return:view",
        ],
        children: [
          {
            titleKey: "menu.saleOrders",
            url: "/admin/sale-orders",
            icon: Package,
            permission: "sale_order:view",
          },
          {
            titleKey: "menu.saleQuotations",
            url: "/admin/sale-quotations",
            icon: FileText,
            permission: "sale_quotation:view",
          },
          {
            titleKey: "menu.saleInvoices",
            url: "/admin/sale-invoices",
            icon: CreditCard,
            permission: "sale_invoice:view",
          },
          {
            titleKey: "menu.salePayments",
            url: "/admin/sale-payments",
            icon: Banknote,
            permission: "sale_payment:view",
          },
          {
            titleKey: "menu.saleReturns",
            url: "/admin/sale-returns",
            icon: RotateCcw,
            permission: "sale_return:view",
          },
        ],
      },
    ],
  },
  {
    domainKey: "layout.stockDomain",
    items: [
      {
        titleKey: "menu.transactions",
        icon: History,
        permission: "transaction:view",
        children: [
          {
            titleKey: "menu.allTransactions",
            url: "/admin/transactions",
            icon: ArrowRightLeft,
            permission: "transaction:view",
          },
          {
            titleKey: "menu.addTransaction",
            url: "/admin/transactions/create",
            icon: Plus,
            permission: "transaction:create",
          },
        ],
      },
      {
        titleKey: "menu.purchases",
        icon: Truck,
        permission: [
          "purchase_order:view",
          "purchase_invoice:view",
          "purchase_payment:view",
          "purchase_return:view",
        ],
        children: [
          {
            titleKey: "menu.purchaseQuotations",
            url: "/admin/purchase-quotations",
            icon: FileText,
            permission: "purchase_quotation:view",
          },
          {
            titleKey: "menu.purchaseOrders",
            url: "/admin/purchase-orders",
            icon: ShoppingBag,
            permission: "purchase_order:view",
          },
          {
            titleKey: "menu.purchaseInvoices",
            url: "/admin/purchase-invoices",
            icon: Receipt,
            permission: "purchase_invoice:view",
          },
          {
            titleKey: "menu.purchasePayments",
            url: "/admin/purchase-payments",
            icon: Banknote,
            permission: "purchase_payment:view",
          },
          {
            titleKey: "menu.purchaseReturns",
            url: "/admin/purchase-returns",
            icon: RotateCcw,
            permission: "purchase_return:view",
          },
        ],
      },
    ],
  },
  {
    domainKey: "layout.inventoryDomain",
    items: [
      {
        titleKey: "menu.products",
        icon: Package,
        permission: "product:view",
        children: [
          {
            titleKey: "menu.allProducts",
            url: "/admin/products",
            icon: Package,
            permission: "product:all",
          },
          {
            titleKey: "menu.addProduct",
            url: "/admin/products/create",
            icon: Plus,
            permission: "product:create",
          },
        ],
      },
      {
        titleKey: "menu.categories",
        icon: Tag,
        permission: "category:view",
        children: [
          {
            titleKey: "menu.allCategories",
            url: "/admin/categories",
            icon: Layers,
            permission: "category:view",
          },
          {
            titleKey: "menu.addCategory",
            url: "/admin/categories/create",
            icon: Plus,
            permission: "category:create",
          },
        ],
      },
      {
        titleKey: "menu.brands",
        icon: Bookmark,
        permission: "brand:view",
        children: [
          {
            titleKey: "menu.allBrands",
            url: "/admin/brands",
            icon: Bookmark,
            permission: "brand:view",
          },
          {
            titleKey: "menu.addBrand",
            url: "/admin/brands/create",
            icon: Plus,
            permission: "brand:create",
          },
        ],
      },
      {
        titleKey: "menu.units",
        icon: Ruler,
        permission: "unit:view",
        children: [
          {
            titleKey: "menu.allUnits",
            url: "/admin/units",
            icon: Ruler,
            permission: "unit:view",
          },
          {
            titleKey: "menu.addUnit",
            url: "/admin/units/create",
            icon: Plus,
            permission: "unit:create",
          },
        ],
      },
    ],
  },
  {
    domainKey: "layout.settingsDomain",
    items: [
      {
        titleKey: "layout.settingsDomain",
        url: "/admin/settings",
        icon: Settings,
      },
      {
        titleKey: "menu.currencies",
        icon: Coins,
        permission: "currency:view",
        children: [
          {
            titleKey: "menu.allCurrencies",
            url: "/admin/currencies",
            icon: Coins,
            permission: "currency:view",
          },
          {
            titleKey: "menu.addCurrency",
            url: "/admin/currencies/create",
            icon: Plus,
            permission: "currency:create",
          },
        ],
      },
      {
        titleKey: "menu.users",
        icon: UserCog,
        permission: "user:view",
        children: [
          {
            titleKey: "menu.allUsers",
            url: "/admin/users",
            icon: ShieldCheck,
            permission: "user:view",
          },
          {
            titleKey: "menu.addUser",
            url: "/admin/users/create",
            icon: Plus,
            permission: "user:create",
          },
        ],
      },
      {
        titleKey: "menu.suppliers",
        icon: Truck,
        permission: "supplier:view",
        children: [
          {
            titleKey: "menu.allSuppliers",
            url: "/admin/suppliers",
            icon: Globe,
            permission: "supplier:view",
          },
          {
            titleKey: "menu.addSupplier",
            url: "/admin/suppliers/create",
            icon: Plus,
            permission: "supplier:create",
          },
        ],
      },
    ],
  },
  {
    domainKey: "layout.reportsDomain",
    permission: [
      "report:view_sales",
      "report:view_purchases",
      "report:view_inventory",
      "report:view_profit_loss",
      "report:view_top_performers",
    ],
    items: [
      {
        titleKey: "layout.reportsDomain",
        url: "/admin/reports",
        icon: BarChart3,
      },
    ],
  },
];

const filteredNavDomains = computed(() => {
  const userPermissions = authStore.user?.permissions || [];
  const roleName = authStore.user?.role?.name?.toLowerCase() || "";
  const isSuperAdmin = roleName === "superadmin";

  const checkPerm = (p?: string | string[]) => {
    if (isSuperAdmin || !p) return true;
    if (Array.isArray(p))
      return p.some((perm) => userPermissions.includes(perm));
    return userPermissions.includes(p);
  };

  return navDomains
    .filter((domain) => checkPerm(domain.permission))
    .map((domain) => {
      const filteredItems = domain.items
        .filter((item) => checkPerm(item.permission))
        .map((item) => {
          if (item.children) {
            const filteredChildren = item.children.filter((child) =>
              checkPerm(child.permission),
            );
            return {
              ...item,
              children:
                filteredChildren.length > 0 ? filteredChildren : undefined,
            };
          }
          return item;
        })
        .filter((item) => {
          // If it had children but they are all filtered out, hide the item itself
          // unless it has a URL (meaning it's clickable on its own)
          if (item.children === undefined && !item.url) return false;
          return true;
        });

      return { ...domain, items: filteredItems };
    })
    .filter((domain) => domain.items.length > 0);
});

const currentLocaleItem = computed(() => {
  return (
    availableLocales.find((l) => l.code === locale.value) || availableLocales[0]
  );
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
  toast.success(common.logoutSuccess);
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
            <span class="truncate text-xs text-muted-foreground">{{
              layout.adminPanel
            }}</span>
          </div>
        </div>
      </SidebarHeader>

      <!-- Navigation -->
      <SidebarContent>
        <SidebarGroup
          v-for="domain in filteredNavDomains"
          :key="domain.domainKey"
        >
          <SidebarGroupLabel>{{ $t(domain.domainKey) }}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem
                v-for="item in domain.items"
                :key="item.titleKey"
              >
                <Collapsible
                  v-if="item.children"
                  as-child
                  :default-open="
                    item.children.some((child) =>
                      route.path.startsWith(child.url),
                    )
                  "
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
                          <SidebarMenuSubButton
                            as-child
                            :class="{
                              'bg-primary/10 text-primary font-semibold ring-1 ring-primary/20':
                                route.path === subItem.url,
                            }"
                          >
                            <RouterLink :to="subItem.url">
                              <component
                                :is="subItem.icon"
                                v-if="subItem.icon"
                                :class="[
                                  'size-4',
                                  route.path === subItem.url
                                    ? 'text-primary'
                                    : 'text-muted-foreground',
                                ]"
                              />
                              <span>{{ $t(subItem.titleKey) }}</span>
                            </RouterLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
                <SidebarMenuButton
                  v-else
                  as-child
                  :tooltip="$t(item.titleKey)"
                  :class="{
                    'bg-primary/10 text-primary font-semibold ring-1 ring-primary/20':
                      item.url && route.path === item.url,
                  }"
                >
                  <RouterLink :to="item.url || ''">
                    <component
                      :is="item.icon"
                      :class="
                        item.url && route.path === item.url
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      "
                    />
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
                    <AvatarImage
                      v-if="authStore.user?.photo"
                      :src="authStore.user.photo"
                    />
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
              <DropdownMenuContent
                side="top"
                class="w-64 p-2 shadow-2xl border-primary/10"
                align="start"
                :side-offset="10"
              >
                <!-- User Profile Header -->
                <DropdownMenuLabel class="font-normal border-b pb-2 mb-1">
                  <div class="flex items-center gap-3 px-1 py-1.5">
                    <Avatar
                      class="h-9 w-9 rounded-full border-2 border-primary/20 shadow-sm"
                    >
                      <AvatarImage
                        v-if="authStore.user?.photo"
                        :src="authStore.user.photo"
                      />
                      <AvatarFallback
                        class="rounded-full bg-primary/10 text-primary font-bold"
                        >{{ userInitials }}</AvatarFallback
                      >
                    </Avatar>
                    <div class="flex flex-col gap-0.5 min-w-0">
                      <span
                        class="truncate font-bold text-sm leading-none text-foreground"
                        >{{ formattedUsername }}</span
                      >
                      <span
                        class="truncate text-[10px] text-muted-foreground"
                        >{{ authStore.user?.email || "Administrator" }}</span
                      >
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    @click="router.push('/admin/settings')"
                    class="cursor-pointer py-2 px-2.5"
                  >
                    <Settings
                      class="mr-3 h-4 w-4 text-muted-foreground opacity-70"
                    />
                    <span class="text-sm font-medium text-foreground/80">{{
                      t("layout.settingsDomain")
                    }}</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator class="my-1" />

                <DropdownMenuGroup class="mt-1">
                  <DropdownMenuItem
                    @click="toggleDark()"
                    class="cursor-pointer flex items-center justify-between py-2 px-2.5 rounded-md transition-colors hover:bg-accent group"
                  >
                    <div class="flex items-center">
                      <Sun
                        v-if="!isDark"
                        class="mr-3 h-4 w-4 text-amber-500 opacity-80"
                      />
                      <Moon
                        v-else
                        class="mr-3 h-4 w-4 text-indigo-400 opacity-80"
                      />
                      <span class="text-sm font-medium text-foreground/80">{{
                        isDark ? layout.darkMode : layout.lightMode
                      }}</span>
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
                    <DropdownMenuSubTrigger
                      class="cursor-pointer py-2 px-2.5 transition-colors focus:bg-accent"
                    >
                      <Globe
                        class="mr-3 h-4 w-4 text-muted-foreground opacity-70"
                      />
                      <span class="text-sm font-medium text-foreground/80">{{
                        layout.language
                      }}</span>
                      <div class="ml-auto flex items-center gap-1.5 opacity-60">
                        <img
                          :src="currentLocaleItem.flag"
                          class="h-3 w-4 rounded-sm object-cover opacity-80"
                        />
                        <span
                          class="text-[10px] font-bold uppercase tracking-tight"
                          >{{ currentLocaleItem.code }}</span
                        >
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
                        <span class="flex-1 text-sm font-medium">{{
                          lang.name
                        }}</span>
                        <div
                          v-if="locale === lang.code"
                          class="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                        ></div>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                      class="cursor-pointer py-2 px-2.5 transition-colors focus:bg-accent"
                    >
                      <Coins
                        class="mr-3 h-4 w-4 text-muted-foreground opacity-70"
                      />
                      <span class="text-sm font-medium text-foreground/80">{{
                        layout.currency
                      }}</span>
                      <span
                        class="ml-auto text-[10px] font-bold text-muted-foreground opacity-60 uppercase tracking-tight"
                        >{{ currencyStore.activeCurrency?.code }}</span
                      >
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent class="w-48 p-1">
                      <DropdownMenuItem
                        v-for="curr in currencyStore.availableCurrencies"
                        :key="curr.id"
                        class="cursor-pointer flex items-center gap-2.5 p-2 rounded-sm"
                        @click="currencyStore.setCurrency(curr)"
                      >
                        <span
                          class="text-xs font-bold text-muted-foreground w-4"
                          >{{ curr.symbol }}</span
                        >
                        <span class="flex-1 text-sm">{{ curr.code }}</span>
                        <div
                          v-if="currencyStore.activeCurrency?.id === curr.id"
                          class="h-1.5 w-1.5 rounded-full bg-primary"
                        ></div>
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
                  <span class="text-sm">{{ common.logout }}</span>
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
      <header
        class="flex h-16 shrink-0 items-center border-b px-4 justify-between w-full bg-background/80 backdrop-blur-sm sticky top-0 z-10"
      >
        <div class="flex items-center gap-2">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink as-child>
                  <RouterLink
                    to="/"
                    class="hover:text-primary transition-colors"
                    >{{ common.home }}</RouterLink
                  >
                </BreadcrumbLink>
              </BreadcrumbItem>
              <template v-if="route.name !== 'Dashboard'">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage class="text-primary font-semibold">{{
                    currentPageTitle
                  }}</BreadcrumbPage>
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

<style scoped></style>
