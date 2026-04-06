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
  Eye,
  Pencil,
  Trash2,
  ArrowUpDown,
  Truck,
  RefreshCw,
  Loader2,
} from "lucide-vue-next";
import { SupplierService } from "@/services/supplier/supplier.service";
import type { Supplier, PaginationMeta } from "@/types";
import { CustomerType } from "@/types";
import { toast } from "vue-sonner";
import { useDebounceFn } from "@vueuse/core";

const router = useRouter();
const supplierService = new SupplierService();

const suppliers = ref<Supplier[]>([]);
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
const supplierToDelete = ref<number | null>(null);

async function fetchSuppliers() {
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

    const response = await supplierService.getList(payload);
    if (response.success && response.data) {
      suppliers.value = response.data.data;
      Object.assign(pagination, response.data.meta);
    }
  } catch (error) {
    console.error("Fetch suppliers error:", error);
    toast.error(t('crud.errorFetch', { module: t('modules.suppliers') }));
  } finally {
    loading.value = false;
  }
}

const debouncedFetch = useDebounceFn(() => {
  pagination.page = 1;
  fetchSuppliers();
}, 500);

watch(searchQuery, () => {
  debouncedFetch();
});

watch(statusFilter, () => {
  pagination.page = 1;
  fetchSuppliers();
});

watch(
  () => pagination.limit,
  () => {
    pagination.page = 1;
    fetchSuppliers();
  },
);

function handlePageChange(page: number) {
  pagination.page = page;
  fetchSuppliers();
}

async function toggleStatus(supplier: Supplier) {
  try {
    const newStatus = !supplier.status;
    const response = await supplierService.updateStatus({
      id: supplier.id,
      status: newStatus,
    });
    if (response.success) {
      supplier.status = newStatus;
      toast.success(t('crud.successUpdate', { module: t('modules.supplier') }));
    }
  } catch (error) {
    toast.error(t('crud.errorUpdate', { module: t('modules.supplier') }));
  }
}

function openDeleteDialog(id: number) {
  supplierToDelete.value = id;
  isDeleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!supplierToDelete.value) return;

  try {
    const response = await supplierService.softDelete(supplierToDelete.value);
    if (response.success) {
      toast.success(t('crud.successDelete', { module: t('modules.supplier') }));
      fetchSuppliers();
    } else {
      toast.error(response.message || t('crud.errorDelete', { module: t('modules.supplier') }));
    }
  } catch (error) {
    toast.error(t('crud.errorDelete', { module: t('modules.supplier') }));
  } finally {
    isDeleteDialogOpen.value = false;
    supplierToDelete.value = null;
  }
}

function handleSort(column: string) {
  if (pagination.sortBy === column) {
    pagination.sortOrder = pagination.sortOrder === "asc" ? "desc" : "asc";
  } else {
    pagination.sortBy = column;
    pagination.sortOrder = "asc";
  }
  fetchSuppliers();
}

function getTypeLabel(type: CustomerType) {
  return type === CustomerType.DINE_IN ? t('fields.dineIn') : t('fields.dineOut');
}

onMounted(() => {
  fetchSuppliers();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold tracking-tight text-foreground">
        {{ $t("modules.suppliers") }}
      </h2>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          @click="fetchSuppliers"
          :disabled="loading"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
        <Button @click="router.push('/admin/suppliers/create')">
          <Plus class="mr-2 h-4 w-4" />{{ $t("crud.createBtn") }}
          {{ $t("modules.supplier") }}</Button
        >
      </div>
    </div>

    <div class="flex flex-col sm:flex-row items-center gap-4">
      <div class="relative flex-1 w-full max-w-sm">
        <Search
          class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
        />
        <Input
          type="search"
          :placeholder="$t('crud.search', { module: $t('modules.supplier') })"
          class="pl-8"
          v-model="searchQuery"
        />
      </div>

      <Select v-model="statusFilter">
        <SelectTrigger class="w-full sm:w-[180px]">
          <SelectValue :placeholder="$t('crud.filterByStatus')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ $t("crud.allStatus") }}</SelectItem>
          <SelectItem value="active">{{ $t("crud.active") }}</SelectItem>
          <SelectItem value="inactive">{{ $t("crud.inactive") }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="rounded-md border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[20px]">#</TableHead>
            <TableHead class="w-[120px]">{{ $t("fields.code") }}</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                @click="handleSort('name')"
                class="-ml-4 h-8 font-medium"
                >{{ $t("fields.name") }}<ArrowUpDown class="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>{{ $t("fields.nameLatin") }}</TableHead>
            <TableHead>{{ $t("auth.email") }}</TableHead>
            <TableHead>{{ $t("fields.phoneNumber") }}</TableHead>
            <TableHead>{{ $t("fields.type") }}</TableHead>
            <TableHead>{{ $t("fields.status") }}</TableHead>
            <TableHead class="text-right">{{ $t("crud.actions") }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading && suppliers.length === 0">
            <TableCell colspan="9" class="h-24 text-center">
              <div
                class="flex items-center justify-center text-muted-foreground italic text-sm"
              >
                <Loader2 class="h-4 w-4 animate-spin mr-2" />
                <span>{{ $t('crud.fetchingData') }}</span>
              </div>
            </TableCell>
          </TableRow>
          <template v-else-if="suppliers.length > 0">
            <TableRow v-for="(supplier, index) in suppliers" :key="supplier.id">
              <TableCell class="font-medium text-muted-foreground">
                {{ (pagination.page - 1) * pagination.limit + index + 1 }}
              </TableCell>
              <TableCell>
                <code
                  class="bg-muted px-2 py-0.5 rounded text-xs font-mono font-bold text-foreground/70 border border-muted-foreground/10 uppercase"
                  >{{ supplier.code }}</code
                >
              </TableCell>
              <TableCell class="font-semibold text-base text-foreground/90">{{
                supplier.name
              }}</TableCell>
              <TableCell class="text-muted-foreground text-sm">{{
                supplier.nameLatin || "-"
              }}</TableCell>
              <TableCell class="text-muted-foreground text-sm">{{
                supplier.email || "-"
              }}</TableCell>
              <TableCell class="text-muted-foreground text-sm font-mono italic">{{
                supplier.phoneNumber || "-"
              }}</TableCell>
              <TableCell>
                <Badge variant="outline" class="font-medium px-2 py-0 border-primary/20 text-primary bg-primary/5">
                  {{ getTypeLabel(supplier.type) }}
                </Badge>
              </TableCell>
              <TableCell class="w-[100px]">
                <Badge
                  :variant="supplier.status ? 'success' : 'warning'"
                  class="cursor-pointer font-bold px-3 transition-all hover:opacity-80 active:scale-95"
                  @click="toggleStatus(supplier)"
                >
                  {{ supplier.status ? $t('crud.active') : $t('crud.inactive') }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                      variant="ghost"
                      class="h-8 w-8 p-0 hover:bg-muted/80 rounded-full"
                    >
                      <span class="sr-only">Open menu</span>
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-[180px]">
                    <DropdownMenuLabel
                      class="text-xs uppercase text-muted-foreground font-bold"
                      >{{ $t("crud.actions") }}</DropdownMenuLabel
                    >
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      @click="router.push(`/admin/suppliers/${supplier.id}`)"
                      class="cursor-pointer"
                    >
                      <Eye class="mr-2 h-4 w-4 opacity-70" />{{
                        $t("crud.viewBtn")
                      }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="router.push(`/admin/suppliers/${supplier.id}/edit`)"
                      class="cursor-pointer"
                    >
                      <Pencil class="mr-2 h-4 w-4 opacity-70" />{{
                        $t("crud.editBtn")
                      }}</DropdownMenuItem
                    >
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      class="text-destructive focus:text-destructive cursor-pointer font-medium"
                      @click="openDeleteDialog(supplier.id)"
                    >
                      <Trash2 class="mr-2 h-4 w-4" />{{
                        $t("crud.delete")
                      }}</DropdownMenuItem
                    >
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell
              colspan="9"
              class="h-32 text-center text-muted-foreground"
            >
              <div class="flex flex-col items-center justify-center gap-3">
                <Truck class="h-10 w-10 opacity-10" />
                <p class="font-medium">
                  {{ $t("crud.noRecords", { module: $t("modules.suppliers") }) }}
                </p>
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
            {{ $t('crud.confirmDeleteDesc', { module: $t('modules.supplier') }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false">{{
            $t("crud.cancel")
          }}</AlertDialogCancel>
          <AlertDialogAction
            @click="confirmDelete"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >{{ $t("crud.delete") }}</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
