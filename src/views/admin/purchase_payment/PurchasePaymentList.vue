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
  CreditCard
} from "lucide-vue-next";

import { PurchasePaymentService } from "@/services/purchase_payment/purchase_payment.service";
import type { PurchasePayment, PaginationMeta } from "@/types";
import { PaymentMethod } from "@/types/enums";
import { toast } from "vue-sonner";
import { useDebounceFn } from "@vueuse/core";

const router = useRouter();
const ppService = new PurchasePaymentService();

const records = ref<PurchasePayment[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const methodFilter = ref<string | undefined>(undefined);

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
    if (methodFilter.value && methodFilter.value !== "all") {
      payload.filter = { paymentMethod: methodFilter.value };
    }
    const response = await ppService.getList(payload);
    if (response.success && response.data) {
      records.value = response.data.data;
      Object.assign(pagination, response.data.meta);
    }
  } catch (error) {
    console.error("Fetch error:", error);
    toast.error(t('crud.errorFetch', { module: t('modules.purchasePayment') }));
  } finally {
    loading.value = false;
  }
}

const debouncedFetch = useDebounceFn(() => {
  pagination.page = 1;
  fetchData();
}, 500);

watch(searchQuery, () => debouncedFetch());
watch(methodFilter, () => { pagination.page = 1; fetchData(); });
watch(() => pagination.limit, () => { pagination.page = 1; fetchData(); });

function handlePageChange(page: number) {
  pagination.page = page;
  fetchData();
}

function openDeleteDialog(id: number) {
  recordToDelete.value = id;
  isDeleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!recordToDelete.value) return;
  try {
    const response = await ppService.softDelete(recordToDelete.value);
    if (response.success) {
      toast.success(t('crud.successDelete', { module: t('modules.purchasePayment') }));
      fetchData();
    } else {
      toast.error(response.message || t('crud.errorDelete', { module: t('modules.purchasePayment') }));
    }
  } catch (error) {
    toast.error(t('crud.errorDelete', { module: t('modules.purchasePayment') }));
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
  return (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getPaymentMethodLabel(pm: PaymentMethod) {
  switch (Number(pm)) {
    case PaymentMethod.CASH: return t('fields.paymentMethodLabels.cash');
    case PaymentMethod.TRANSFER: return t('fields.paymentMethodLabels.transfer');
    case PaymentMethod.OTHER: return t('fields.paymentMethodLabels.other');
    default: return 'N/A';
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
        {{ $t("menu.purchasePayments") }}
      </h2>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="icon" @click="fetchData" :disabled="loading">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
        <Button @click="router.push('/admin/purchase-payments/create')">
          <Plus class="mr-2 h-4 w-4" />{{ $t("crud.createBtn") }}
        </Button>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row items-center gap-4">
      <div class="relative flex-1 w-full max-w-sm">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          :placeholder="$t('crud.search', { module: $t('modules.purchasePayment') })"
          class="pl-8"
          v-model="searchQuery"
        />
      </div>

      <Select v-model="methodFilter">
        <SelectTrigger class="w-full sm:w-[180px]">
          <SelectValue :placeholder="$t('fields.paymentMethod')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ $t("crud.all") }}</SelectItem>
          <SelectItem :value="String(PaymentMethod.CASH)">{{ $t("fields.paymentMethodLabels.cash") }}</SelectItem>
          <SelectItem :value="String(PaymentMethod.TRANSFER)">{{ $t("fields.paymentMethodLabels.transfer") }}</SelectItem>
          <SelectItem :value="String(PaymentMethod.OTHER)">{{ $t("fields.paymentMethodLabels.other") }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="rounded-md border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[50px]">#</TableHead>
            <TableHead class="w-[150px]">{{ $t("fields.code") }}</TableHead>
            <TableHead>{{ $t("modules.purchaseInvoice") }}</TableHead>
            <TableHead>
              <Button variant="ghost" @click="handleSort('paymentDate')" class="-ml-4 h-8 font-medium">
                {{ $t("fields.transactionDate") }}<ArrowUpDown class="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead class="text-right">{{ $t("fields.paymentMethod") }}</TableHead>
            <TableHead class="text-right">{{ $t("fields.paidAmount") }}</TableHead>
            <TableHead class="text-right">{{ $t("crud.actions") }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading && records.length === 0">
            <TableCell colspan="7" class="h-24 text-center">
              <div class="flex items-center justify-center text-muted-foreground italic text-sm">
                <Loader2 class="h-4 w-4 animate-spin mr-2" />
                <span>{{ $t('crud.fetchingData') }}</span>
              </div>
            </TableCell>
          </TableRow>
          <template v-else-if="records.length > 0">
            <TableRow v-for="(record, index) in records" :key="record.id">
              <TableCell class="font-medium text-muted-foreground">
                {{ (pagination.page - 1) * pagination.limit + index + 1 }}
              </TableCell>
              <TableCell>
                <code class="bg-muted px-2 py-0.5 rounded text-xs font-mono font-bold text-foreground/70 border border-muted-foreground/10 uppercase">
                  {{ record.code }}
                </code>
              </TableCell>
              <TableCell class="font-medium">
                {{ record.purchaseInvoice?.code || `Invoice ID ${record.purchaseInvoiceId}` }}
              </TableCell>
              <TableCell class="text-foreground/90">
                {{ formatDateTime(record.paymentDate) }}
              </TableCell>
              <TableCell class="text-right">
                <Badge variant="outline" class="font-medium">
                  {{ getPaymentMethodLabel(record.paymentMethod) }}
                </Badge>
              </TableCell>
              <TableCell class="text-right font-mono text-success font-semibold">
                + {{ formatCurrency(record.amount) }}
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
                    <DropdownMenuItem @click="router.push(`/admin/purchase-payments/${record.id}`)" class="cursor-pointer">
                      <Eye class="mr-2 h-4 w-4 opacity-70" />{{ $t("crud.viewBtn") }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="router.push(`/admin/purchase-payments/${record.id}/edit`)" class="cursor-pointer">
                      {{ $t("crud.editBtn") }}
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
            <TableCell colspan="7" class="h-32 text-center text-muted-foreground">
              <div class="flex flex-col items-center justify-center gap-3">
                <CreditCard class="h-10 w-10 opacity-10" />
                <p class="font-medium">{{ $t("crud.noRecords", { module: $t("modules.purchasePayments") }) }}</p>
                <Button
                  v-if="searchQuery || (methodFilter && methodFilter !== 'all')"
                  variant="outline"
                  size="sm"
                  @click="searchQuery = ''; methodFilter = undefined;"
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
            {{ $t('crud.confirmDeleteDesc', { module: $t('modules.purchasePayment') }) }}
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
