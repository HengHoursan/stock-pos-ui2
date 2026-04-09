<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { formatDateTime } from "@/utils/format";

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
  Trash2,
  ArrowUpDown,
  RefreshCw,
  Loader2,
  FileText,
  Ban
} from "lucide-vue-next";

import { PurchaseInvoiceService } from "@/services/purchase_invoice/purchase_invoice.service";
import type { PurchaseInvoice, PaginationMeta } from "@/types";
import { InvoiceStatus } from "@/types/enums";
import { toast } from "vue-sonner";
import { useDebounceFn } from "@vueuse/core";

const router = useRouter();
const piService = new PurchaseInvoiceService();

const records = ref<PurchaseInvoice[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const statusFilter = ref<string | undefined>(undefined);

const pagination = reactive<PaginationMeta>({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0,
  sortBy: "createdAt",
  sortOrder: "DESC",
});

const isDeleteDialogOpen = ref(false);
const recordToDelete = ref<number | null>(null);

async function fetchData() {
  loading.value = true;
  try {
    const payload: any = {
      page: Number(pagination.page) || 1,
      limit: Number(pagination.limit) || 10,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
    };
    if (searchQuery.value.trim()) {
      payload.search = searchQuery.value.trim();
    }
    if (statusFilter.value && statusFilter.value !== "all") {
      payload.filter = { status: statusFilter.value };
    }
    const response = await piService.getList(payload);
    if (response.success && response.data) {
      records.value = response.data.data;
      Object.assign(pagination, response.data.meta);
    }
  } catch (error) {
    console.error("Fetch error:", error);
    toast.error(t('crud.errorFetch', { module: t('modules.purchaseInvoice') }));
  } finally {
    loading.value = false;
  }
}

const debouncedFetch = useDebounceFn(() => {
  pagination.page = 1;
  fetchData();
}, 500);

watch(searchQuery, () => debouncedFetch());
watch(statusFilter, () => { pagination.page = 1; fetchData(); });
watch(() => pagination.limit, () => { pagination.page = 1; fetchData(); });

function handlePageChange(page: number) {
  pagination.page = page;
  fetchData();
}

function openDeleteDialog(id: number) {
  recordToDelete.value = id;
  isDeleteDialogOpen.value = true;
}

// NOTE: Usually invoices shouldn't be fully deleted if they affect stock, they get cancelled or reversed. 
// The API delete endpoint usually handles reversal implicitly if written that way, or we just call full cancellation. 
async function confirmDelete() {
  if (!recordToDelete.value) return;
  try {
    const response = await piService.delete(recordToDelete.value);
    if (response.success) {
      toast.success(t('crud.successDelete', { module: t('modules.purchaseInvoice') }));
      fetchData();
    } else {
      toast.error(response.message || t('crud.errorDelete', { module: t('modules.purchaseInvoice') }));
    }
  } catch (error) {
    toast.error(t('crud.errorDelete', { module: t('modules.purchaseInvoice') }));
  } finally {
    isDeleteDialogOpen.value = false;
    recordToDelete.value = null;
  }
}

function handleSort(column: string) {
  if (pagination.sortBy === column) {
    pagination.sortOrder = pagination.sortOrder === "ASC" ? "DESC" : "ASC";
  } else {
    pagination.sortBy = column;
    pagination.sortOrder = "ASC";
  }
  fetchData();
}

function formatCurrency(val: number) {
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getStatusBadge(record: PurchaseInvoice) {
  if (record.isCancel) return { variant: 'destructive', label: t('fields.statusLabels.cancelled') };
  switch(Number(record.status)) {
    case InvoiceStatus.DRAFT: return { variant: 'secondary', label: t('fields.statusLabels.draft') };
    case InvoiceStatus.COMPLETED: return { variant: 'success', label: t('fields.statusLabels.completed') };
    default: return { variant: 'outline', label: t('crud.all') };
  }
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold tracking-tight text-foreground">
        {{ $t("menu.purchaseInvoices") }}
      </h2>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="icon" @click="fetchData" :disabled="loading">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
        <Button @click="router.push('/admin/purchase-invoices/create')">
          <Plus class="mr-2 h-4 w-4" />{{ $t("menu.addPurchaseInvoice") }}
        </Button>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row items-center gap-4">
      <div class="relative flex-1 w-full max-w-sm">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          :placeholder="$t('crud.search', { module: $t('modules.purchaseInvoice') })"
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
          <SelectItem :value="String(InvoiceStatus.DRAFT)">{{ $t("fields.statusLabels.draft") }}</SelectItem>
          <SelectItem :value="String(InvoiceStatus.COMPLETED)">{{ $t("fields.statusLabels.completed") }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="rounded-md border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[50px]">#</TableHead>
            <TableHead class="w-[120px]">{{ $t("fields.code") }}</TableHead>
            <TableHead>{{ $t("fields.supplierId") }}</TableHead>
            <TableHead>
              <Button variant="ghost" @click="handleSort('invoiceDate')" class="-ml-4 h-8 font-medium">
                {{ $t("fields.invoiceDate") }}<ArrowUpDown class="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead class="text-center">{{ $t("fields.totalLine") }}</TableHead>
            <TableHead class="text-right">{{ $t("fields.totalPrice") }}</TableHead>
            <TableHead class="text-center">{{ $t("fields.status") }}</TableHead>
            <TableHead class="text-right">{{ $t("crud.actions") }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading && records.length === 0">
            <TableCell colspan="8" class="h-24 text-center">
              <div class="flex items-center justify-center text-muted-foreground italic text-sm">
                <Loader2 class="h-4 w-4 animate-spin mr-2" />
                <span>{{ $t('crud.fetchingData') }}</span>
              </div>
            </TableCell>
          </TableRow>
          <template v-else-if="records.length > 0">
            <TableRow v-for="(record, index) in records" :key="record.id" :class="{'opacity-75 bg-muted/20': record.isCancel}">
              <TableCell class="font-medium text-muted-foreground">
                {{ (pagination.page - 1) * pagination.limit + index + 1 }}
              </TableCell>
              <TableCell>
                <code class="bg-muted px-2 py-0.5 rounded text-xs font-mono font-bold text-foreground/70 border border-muted-foreground/10 uppercase">
                  {{ record.code }}
                </code>
              </TableCell>
              <TableCell class="font-medium">
                {{ record.supplier?.name || `Supplier ID ${record.supplierId}` }}
              </TableCell>
              <TableCell class="text-foreground/90">
                {{ formatDateTime(record.invoiceDate) }}
              </TableCell>
              <TableCell class="text-center">
                {{ record.totalLine }} {{ $t('fields.items') }}
              </TableCell>
              <TableCell class="text-right font-mono text-primary font-semibold">
                {{ formatCurrency(record.totalPrice) }}
              </TableCell>
              <TableCell class="text-center">
                <Badge :variant="getStatusBadge(record).variant as any" class="font-medium text-xs px-2 py-0">
                  <Ban v-if="record.isCancel" class="w-3 h-3 mr-1 inline-block" />
                  {{ getStatusBadge(record).label }}
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
                  <DropdownMenuContent align="end" class="w-[180px]">
                    <DropdownMenuLabel class="text-xs uppercase text-muted-foreground font-bold">
                      {{ $t("crud.actions") }}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="router.push(`/admin/purchase-invoices/${record.id}`)" class="cursor-pointer">
                      <Eye class="mr-2 h-4 w-4 opacity-70" />{{ $t("crud.viewBtn") }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="text-destructive focus:text-destructive cursor-pointer font-medium" @click="openDeleteDialog(record.id)">
                      <Trash2 class="mr-2 h-4 w-4" />{{ $t("crud.delete") }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell colspan="8" class="h-32 text-center text-muted-foreground">
              <div class="flex flex-col items-center justify-center gap-3">
                <FileText class="h-10 w-10 opacity-10" />
                <p class="font-medium">{{ $t("crud.noRecords", { module: $t("modules.purchaseInvoices") }) }}</p>
                <Button
                  v-if="searchQuery || (statusFilter && statusFilter !== 'all')"
                  variant="outline"
                  size="sm"
                  @click="searchQuery = ''; statusFilter = undefined;"
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

    <!-- Pagination -->
    <div class="flex items-center justify-end px-4 py-4 border-t bg-muted/5 rounded-b-lg">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-muted-foreground whitespace-nowrap">{{ $t('crud.rowsPerPage') }}</span>
          <Select :model-value="pagination.limit.toString()" @update:model-value="(v) => (pagination.limit = parseInt(v as string))">
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
        <Pagination v-if="pagination.totalItems > 0" :total="pagination.totalItems" :items-per-page="pagination.limit" :sibling-count="1" :show-edges="false" v-model:page="pagination.page" @update:page="handlePageChange">
          <PaginationContent v-slot="{ items }" class="flex items-center gap-1">
            <PaginationPrevious class="h-8 px-2 text-foreground font-medium border-0 hover:bg-muted/50 bg-transparent" />
            <template v-for="(item, index) in items">
              <PaginationItem v-if="item.type === 'page'" :key="index" :value="item.value" :is-active="item.value === pagination.page" class="w-8 h-8 p-0 font-medium">
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else :key="item.type" :index="index" />
            </template>
            <PaginationNext class="h-8 px-2 text-foreground font-medium border-0 hover:bg-muted/50 bg-transparent" />
          </PaginationContent>
        </Pagination>
      </div>
    </div>

    <!-- Delete Alert -->
    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ $t('crud.confirmDelete') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ $t('crud.confirmDeleteDesc', { module: $t('modules.purchaseInvoice') }) }}
            <br/><br/>
            <strong class="text-destructive">{{ $t('fields.invoiceDeleteWarning') }}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false">{{ $t("crud.cancel") }}</AlertDialogCancel>
          <AlertDialogAction @click="confirmDelete" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {{ $t("crud.delete") }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
