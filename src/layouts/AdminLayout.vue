<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterView, RouterLink, useRoute, useRouter } from "vue-router";
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

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  {
    title: "Categories",
    icon: Tag,
    children: [
      { title: "All Categories", url: "/admin/categories", icon: List },
      {
        title: "Add New Category",
        url: "/admin/categories/create",
        icon: Plus,
      },
    ],
  },
  {
    title: "Brands",
    icon: Bookmark,
    children: [
      { title: "All Brands", url: "/admin/brands", icon: List },
      {
        title: "Add New Brand",
        url: "/admin/brands/create",
        icon: Plus,
      },
    ],
  },
  {
    title: "Units",
    icon: Ruler,
    children: [
      { title: "All Units", url: "/admin/units", icon: List },
      {
        title: "Add New Unit",
        url: "/admin/units/create",
        icon: Plus,
      },
    ],
  },
];

const currentPageTitle = computed(() => String(route.name ?? "Page"));

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
            <span class="truncate text-xs text-muted-foreground"
              >Admin Panel</span
            >
          </div>
        </div>
      </SidebarHeader>

      <!-- Navigation -->
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="item in navItems" :key="item.title">
                <Collapsible
                  v-if="item.children"
                  as-child
                  class="group/collapsible"
                >
                  <div>
                    <CollapsibleTrigger as-child>
                      <SidebarMenuButton :tooltip="item.title">
                        <component :is="item.icon" />
                        <span>{{ item.title }}</span>
                        <ChevronRight
                          class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem
                          v-for="subItem in item.children"
                          :key="subItem.title"
                        >
                          <SidebarMenuSubButton as-child>
                            <RouterLink :to="subItem.url">
                              <component
                                :is="subItem.icon"
                                v-if="subItem.icon"
                                class="size-4"
                              />
                              <span>{{ subItem.title }}</span>
                            </RouterLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
                <SidebarMenuButton v-else as-child :tooltip="item.title">
                  <RouterLink :to="item.url">
                    <component :is="item.icon" />
                    <span>{{ item.title }}</span>
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
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>

    <!-- Main content area -->
    <SidebarInset>
      <!-- Header with breadcrumb -->
      <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink as-child>
                <RouterLink to="/">Home</RouterLink>
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
      </header>

      <main class="flex flex-1 flex-col gap-4 p-4 w-full">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
