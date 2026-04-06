<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  MoreHorizontal,
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowUpDown,
  UserCog,
  RefreshCw,
  Loader2,
} from "lucide-vue-next";
import { userService } from "@/services/user/user.service";
import type { User, PaginationMeta } from "@/types";
import { toast } from "vue-sonner";
import { useDebounceFn } from "@vueuse/core";

const router = useRouter();

const users = ref<User[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const statusFilter = ref<string | undefined>(undefined);

const pagination = reactive<PaginationMeta>({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0,
  sortBy: "createdAt",
  sortOrder: "desc",
});

const isDeleteDialogOpen = ref(false);
const userToDelete = ref<number | null>(null);

async function fetchUsers() {
  loading.value = true;
  try {
    const pageNum = Number(pagination.page) || 1;
    const limitNum = Number(pagination.limit) || 10;

    const payload: any = {
      page: pageNum,
      limit: limitNum,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
    };

    if (searchQuery.value.trim()) {
      payload.search = searchQuery.value.trim();
    }

    if (statusFilter.value && statusFilter.value !== "all") {
      payload.filter = { status: statusFilter.value };
    }

    const response = await userService.getList(payload);
    if (response.success && response.data) {
      users.value = response.data.data;
      Object.assign(pagination, response.data.meta);
    }
  } catch (error) {
    console.error("Fetch users error:", error);
    toast.error(t('crud.errorFetch', { module: t('modules.users') }));
  } finally {
    loading.value = false;
  }
}

const debouncedFetch = useDebounceFn(() => {
  pagination.page = 1;
  fetchUsers();
}, 500);

watch(searchQuery, () => {
  debouncedFetch();
});

watch(statusFilter, () => {
  pagination.page = 1;
  fetchUsers();
});

watch(
  () => pagination.limit,
  () => {
    pagination.page = 1;
    fetchUsers();
  },
);

function handlePageChange(page: number) {
  pagination.page = page;
  fetchUsers();
}

async function toggleStatus(user: User) {
  try {
    const newStatus = !user.status;
    const response = await userService.updateStatus({
      id: user.id,
      status: newStatus,
    });
    if (response.success) {
      user.status = newStatus;
      toast.success(t('crud.successUpdate', { module: t('modules.user') }));
    }
  } catch (error) {
    toast.error(t('crud.errorUpdate', { module: t('modules.user') }));
  }
}

function openDeleteDialog(id: number) {
  userToDelete.value = id;
  isDeleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!userToDelete.value) return;

  try {
    const response = await userService.softDelete(userToDelete.value);
    if (response.success) {
      toast.success(t('crud.successDelete', { module: t('modules.user') }));
      fetchUsers();
    } else {
      toast.error(response.message || t('crud.errorDelete', { module: t('modules.user') }));
    }
  } catch (error) {
    toast.error(t('crud.errorDelete', { module: t('modules.user') }));
  } finally {
    isDeleteDialogOpen.value = false;
    userToDelete.value = null;
  }
}

function handleSort(column: string) {
  if (pagination.sortBy === column) {
    pagination.sortOrder = pagination.sortOrder === "asc" ? "desc" : "asc";
  } else {
    pagination.sortBy = column;
    pagination.sortOrder = "asc";
  }
  fetchUsers();
}

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold tracking-tight text-foreground">{{ $t('modules.users') }}</h2>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          @click="fetchUsers"
          :disabled="loading"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
        <Button @click="router.push('/admin/users/create')">
          <Plus class="mr-2 h-4 w-4" />{{ $t('crud.createBtn') }} {{ $t('modules.user') }}</Button>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row items-center gap-4">
      <div class="relative flex-1 w-full max-w-sm">
        <Search
          class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
        />
        <Input
          type="search"
          :placeholder="$t('crud.search', { module: $t('modules.user') })"
          class="pl-8"
          v-model="searchQuery"
        />
      </div>

      <Select v-model="statusFilter">
        <SelectTrigger class="w-full sm:w-[180px]">
          <SelectValue :placeholder="$t('crud.filterByStatus')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ $t('crud.allStatus') }}</SelectItem>
          <SelectItem value="active">{{ $t('crud.active') }}</SelectItem>
          <SelectItem value="inactive">{{ $t('crud.inactive') }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="rounded-md border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[20px]">#</TableHead>
            <TableHead class="w-[60px]"></TableHead>
            <TableHead>
              <Button
                variant="ghost"
                @click="handleSort('username')"
                class="-ml-4 h-8 font-medium"
              >{{ $t('auth.username') }}<ArrowUpDown class="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>{{ $t('auth.email') }}</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>{{ $t('fields.status') }}</TableHead>
            <TableHead class="text-right">{{ $t('crud.actions') }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading && users.length === 0">
            <TableCell colspan="7" class="h-24 text-center">
              <div
                class="flex items-center justify-center text-muted-foreground italic text-sm"
              >
                <Loader2 class="h-4 w-4 animate-spin mr-2" />
                <span>{{ $t('crud.fetchingData') }}</span>
              </div>
            </TableCell>
          </TableRow>
          <template v-else-if="users.length > 0">
            <TableRow
              v-for="(user, index) in users"
              :key="user.id"
            >
              <TableCell class="font-medium text-muted-foreground">
                {{ (pagination.page - 1) * pagination.limit + index + 1 }}
              </TableCell>
              <TableCell>
                <Avatar class="h-8 w-8">
                  <AvatarFallback class="bg-primary/10 text-primary font-bold">
                    {{ user.username.slice(0, 2).toUpperCase() }}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell class="font-semibold text-foreground/90">
                {{ user.username }}
              </TableCell>
              <TableCell class="text-muted-foreground">{{ user.email }}</TableCell>
              <TableCell>
                <Badge variant="outline" v-if="user.role">{{ user.role.name }}</Badge>
                <span v-else class="text-muted-foreground italic text-xs">No Role</span>
              </TableCell>
              <TableCell class="w-[100px]">
                <Badge
                  :variant="user.status ? 'success' : 'warning'"
                  class="cursor-pointer font-bold px-3 transition-all hover:opacity-80 active:scale-95"
                  @click="toggleStatus(user)"
                >
                  {{ user.status ? $t('crud.active') : $t('crud.inactive') }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" class="h-8 w-8 p-0 hover:bg-muted/80 rounded-full">
                      <span class="sr-only">Open menu</span>
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-[160px]">
                    <DropdownMenuLabel class="text-xs uppercase text-muted-foreground font-bold">{{ $t('crud.actions') }}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="router.push(`/admin/users/${user.id}/edit`)" class="cursor-pointer">
                      <Pencil class="mr-2 h-4 w-4 opacity-70" />{{ $t('crud.editBtn') }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="text-destructive focus:text-destructive cursor-pointer font-medium" @click="openDeleteDialog(user.id)">
                      <Trash2 class="mr-2 h-4 w-4" />{{ $t('crud.delete') }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell
              colspan="7"
              class="h-32 text-center text-muted-foreground"
            >
              <div class="flex flex-col items-center justify-center gap-3">
                <UserCog class="h-10 w-10 opacity-10" />
                <p class="font-medium">{{ $t('crud.noRecords', { module: $t('modules.users') }) }}</p>
                <Button
                  v-if="searchQuery || (statusFilter && statusFilter !== 'all')"
                  variant="outline"
                  size="sm"
                  @click="
                    searchQuery = '';
                    statusFilter = undefined;
                  "
                  class="h-8"
                >
                  {{ $t('crud.resetFilters') }}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div
      class="flex items-center justify-end px-4 py-4 border-t bg-muted/5 rounded-b-lg"
    >
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span
            class="text-sm font-medium text-muted-foreground whitespace-nowrap"
            >{{ $t('crud.rowsPerPage') }}</span
          >
          <Select
            :model-value="pagination.limit.toString()"
            @update:model-value="
              (v) => (pagination.limit = parseInt(v as string))
            "
          >
            <SelectTrigger class="h-8 w-[70px] bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Pagination
          v-if="pagination.totalItems > 0"
          :total="pagination.totalItems"
          :items-per-page="pagination.limit"
          :sibling-count="1"
          :show-edges="false"
          v-model:page="pagination.page"
          @update:page="handlePageChange"
        >
          <PaginationContent v-slot="{ items }" class="flex items-center gap-1">
            <PaginationPrevious
              class="h-8 px-2 text-foreground font-medium border-0 hover:bg-muted/50 bg-transparent"
            />

            <template v-for="(item, index) in items">
              <PaginationItem
                v-if="item.type === 'page'"
                :key="index"
                :value="item.value"
                :is-active="item.value === pagination.page"
                class="w-8 h-8 p-0 font-medium"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else :key="item.type" :index="index" />
            </template>

            <PaginationNext
              class="h-8 px-2 text-foreground font-medium border-0 hover:bg-muted/50 bg-transparent"
            />
          </PaginationContent>
        </Pagination>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ $t('crud.confirmDelete') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ $t('crud.confirmDeleteDesc', { module: $t('modules.user') }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false"
            >{{ $t('crud.cancel') }}</AlertDialogCancel
          >
          <AlertDialogAction
            @click="confirmDelete"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >{{ $t('crud.delete') }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
