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
  Trash2,
  ArrowUpDown,
  History,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Settings2,
} from "lucide-vue-next";
import { TransactionService } from "@/services/transaction/transaction.service";
import { ProductService } from "@/services/product/product.service";
import type { Transaction, PaginationMeta } from "@/types";
import { TransactionType } from "@/types";
import { toast } from "vue-sonner";
import { useDebounceFn } from "@vueuse/core";
import { formatDateTime } from "@/utils/format";

const router = useRouter();
const transactionService = new TransactionService();
const productService = new ProductService();

const transactions = ref<Transaction[]>([]);
const products = ref<any[]>([]); // Using any for simplicity as we only need id/name

const loading = ref(true);
const searchQuery = ref("");
const typeFilter = ref<string | undefined>(undefined);
const productIdFilter = ref<string | undefined>(undefined);

const pagination = reactive<PaginationMeta>({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0,
  sortBy: "transactionDate",
  sortOrder: "desc",
});

const isDeleteDialogOpen = ref(false);
const transactionToDelete = ref<number | null>(null);

async function fetchTransactions() {
  loading.value = true;
  try {
    const payload: any = {
      page: pagination.page,
      limit: pagination.limit,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
    };

    if (searchQuery.value.trim()) {
      payload.search = searchQuery.value.trim();
    }

    const filters: Record<string, string> = {};
    if (typeFilter.value && typeFilter.value !== "all") {
      filters.transactionType = typeFilter.value;
    }
    if (productIdFilter.value && productIdFilter.value !== "all") {
      filters.productId = productIdFilter.value;
    }

    if (Object.keys(filters).length > 0) {
      payload.filter = filters;
    }

    const response = await transactionService.getList(payload);
    if (response.success && response.data) {
      transactions.value = response.data.data;
      Object.assign(pagination, response.data.meta);
    }
  } catch (error) {
    console.error("Fetch transactions error:", error);
    toast.error(t("crud.errorFetch", { module: t("modules.transactions") }));
  } finally {
    loading.value = false;
  }
}

const debouncedFetch = useDebounceFn(() => {
  pagination.page = 1;
  fetchTransactions();
}, 500);

watch(searchQuery, () => {
  debouncedFetch();
});

watch([typeFilter, productIdFilter], () => {
  pagination.page = 1;
  fetchTransactions();
});

watch(
  () => pagination.limit,
  () => {
    pagination.page = 1;
    fetchTransactions();
  },
);

function handlePageChange(page: number) {
  pagination.page = page;
  fetchTransactions();
}

function openDeleteDialog(id: number) {
  transactionToDelete.value = id;
  isDeleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!transactionToDelete.value) return;

  try {
    const response = await transactionService.delete(transactionToDelete.value);
    if (response.success) {
      toast.success(
        t("crud.successDelete", { module: t("modules.transaction") }),
      );
      fetchTransactions();
    } else {
      toast.error(
        response.message ||
          t("crud.errorDelete", { module: t("modules.transaction") }),
      );
    }
  } catch (error) {
    toast.error(t("crud.errorDelete", { module: t("modules.transaction") }));
  } finally {
    isDeleteDialogOpen.value = false;
    transactionToDelete.value = null;
  }
}

function handleSort(column: string) {
  if (pagination.sortBy === column) {
    pagination.sortOrder = pagination.sortOrder === "asc" ? "desc" : "asc";
  } else {
    pagination.sortBy = column;
    pagination.sortOrder = "asc";
  }
  fetchTransactions();
}

function getTypeInfo(type: TransactionType) {
  switch (type) {
    case TransactionType.IN:
      return {
        label: t("fields.stockIn"),
        color: "bg-green-500/10 text-green-600 border-green-500/20",
        icon: ArrowUpRight,
      };
    case TransactionType.OUT:
      return {
        label: t("fields.stockOut"),
        color: "bg-red-500/10 text-red-600 border-red-500/20",
        icon: ArrowDownLeft,
      };
    case TransactionType.ADJUSTMENT:
      return {
        label: t("fields.adjustment"),
        color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        icon: Settings2,
      };
    default:
      return {
        label: "Unknown",
        color: "bg-gray-500/10 text-gray-600 border-gray-500/20",
        icon: History,
      };
  }
}

async function fetchFilterOptions() {
  try {
    const response = await productService.getAll();
    if (response.success) {
      products.value = response.data || [];
    }
  } catch (error) {
    console.error("Fetch filter options error:", error);
  }
}

onMounted(() => {
  fetchTransactions();
  fetchFilterOptions();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold tracking-tight text-foreground">
        {{ $t("modules.transactions") }}
      </h2>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          @click="fetchTransactions"
          :disabled="loading"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
        <Button @click="router.push('/admin/transactions/create')">
          <Plus class="mr-2 h-4 w-4" />{{ $t("crud.createBtn") }}
          {{ $t("modules.transaction") }}</Button
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
          :placeholder="
            $t('crud.search', { module: $t('modules.transaction') })
          "
          class="pl-8"
          v-model="searchQuery"
        />
      </div>

      <Select v-model="typeFilter">
        <SelectTrigger class="w-full sm:w-[180px]">
          <SelectValue :placeholder="$t('crud.filterByType')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ $t("crud.allTypes") }}</SelectItem>
          <SelectItem :value="String(TransactionType.IN)">{{
            $t("fields.stockIn")
          }}</SelectItem>
          <SelectItem :value="String(TransactionType.OUT)">{{
            $t("fields.stockOut")
          }}</SelectItem>
          <SelectItem :value="String(TransactionType.ADJUSTMENT)">{{
            $t("fields.adjustment")
          }}</SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="productIdFilter">
        <SelectTrigger class="w-full sm:w-[220px]">
          <SelectValue :placeholder="$t('crud.filterByProduct')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ $t("modules.products") }}</SelectItem>
          <SelectItem v-for="product in products" :key="product.id" :value="String(product.id)">
            {{ product.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="rounded-md border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[20px]">#</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                @click="handleSort('transactionDate')"
                class="-ml-4 h-8 font-medium"
                >{{ $t("fields.transactionDate")
                }}<ArrowUpDown class="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>{{ $t("fields.transactionCode") }}</TableHead>
            <TableHead>{{ $t("fields.transactionType") }}</TableHead>
            <TableHead>{{ $t("modules.product") }}</TableHead>
            <TableHead class="text-right">{{
              $t("fields.beginningStock")
            }}</TableHead>
            <TableHead class="text-right">{{
              $t("fields.quantity")
            }}</TableHead>
            <TableHead class="text-right">{{
              $t("fields.afterStock")
            }}</TableHead>
            <TableHead class="text-right">{{ $t("crud.actions") }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading && transactions.length === 0">
            <TableCell colspan="9" class="h-24 text-center">
              <div
                class="flex items-center justify-center text-muted-foreground italic text-sm"
              >
                <Loader2 class="h-4 w-4 animate-spin mr-2" />
                <span>{{ $t("crud.fetchingData") }}</span>
              </div>
            </TableCell>
          </TableRow>
          <template v-else-if="transactions.length > 0">
            <TableRow
              v-for="(transaction, index) in transactions"
              :key="transaction.id"
            >
              <TableCell class="font-medium text-muted-foreground">
                {{ (pagination.page - 1) * pagination.limit + index + 1 }}
              </TableCell>
              <TableCell class="text-sm font-medium">
                {{ formatDateTime(transaction.transactionDate) }}
              </TableCell>
              <TableCell>
                <code
                  class="bg-muted px-2 py-0.5 rounded text-[10px] font-mono font-bold text-foreground/70 border border-muted-foreground/10 uppercase"
                  >{{ transaction.transactionCode }}</code
                >
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  :class="[
                    getTypeInfo(transaction.transactionType).color,
                    'font-bold px-2 py-0 border italic text-[10px] uppercase tracking-wider',
                  ]"
                >
                  {{ getTypeInfo(transaction.transactionType).label }}
                </Badge>
              </TableCell>
              <TableCell class="font-semibold text-foreground/90">
                {{ transaction.product?.name || "-" }}
              </TableCell>
              <TableCell class="text-right text-muted-foreground font-mono">
                {{ transaction.beginningStock }}
              </TableCell>
              <TableCell
                class="text-right font-bold font-mono"
                :class="
                  transaction.transactionType === TransactionType.IN
                    ? 'text-green-600'
                    : transaction.transactionType === TransactionType.OUT
                      ? 'text-red-600'
                      : 'text-blue-600'
                "
              >
                {{
                  transaction.transactionType === TransactionType.OUT
                    ? "-"
                    : "+"
                }}{{ transaction.quantity }}
              </TableCell>
              <TableCell class="text-right font-bold text-foreground font-mono">
                {{ transaction.afterStock }}
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
                      @click="
                        router.push(`/admin/transactions/${transaction.id}`)
                      "
                      class="cursor-pointer"
                    >
                      <Eye class="mr-2 h-4 w-4 opacity-70" />{{
                        $t("crud.viewBtn")
                      }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      class="text-destructive focus:text-destructive cursor-pointer font-medium"
                      @click="openDeleteDialog(transaction.id)"
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
                <History class="h-10 w-10 opacity-10" />
                <p class="font-medium">
                  {{
                    $t("crud.noRecords", { module: $t("modules.transactions") })
                  }}
                </p>
                <Button
                  v-if="searchQuery || (typeFilter && typeFilter !== 'all') || (productIdFilter && productIdFilter !== 'all')"
                  variant="outline"
                  size="sm"
                  @click="
                    searchQuery = '';
                    typeFilter = undefined;
                    productIdFilter = undefined;
                  "
                  class="h-8"
                >
                  {{ $t("crud.resetFilters") }}
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
            >{{ $t("crud.rowsPerPage") }}</span
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

    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ $t("crud.confirmDelete") }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{
              $t("crud.confirmDeleteDesc", {
                module: $t("modules.transaction"),
              })
            }}
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
