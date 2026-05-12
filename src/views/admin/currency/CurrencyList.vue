<script setup lang="ts">
import { useAppI18n } from "@/hooks/useAppI18n";
const { t, labels, fields, crud } = useAppI18n("currency");
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
  Coins,
  RefreshCw,
  Loader2,
} from "lucide-vue-next";
import { CurrencyService } from "@/services/currency/currency.service";
import type { Currency, PaginationMeta } from "@/types";
import { formatRate } from "@/utils/format";
import { toast } from "vue-sonner";
import { useDebounceFn } from "@vueuse/core";
import ClearableSelect from "@/components/ClearableSelect.vue";
import { computed } from "vue";

const router = useRouter();
const currencyService = new CurrencyService();

const currencies = ref<Currency[]>([]);
const loading = ref(true);
const filters = reactive({
  search: "",
  status: "",
});

const pagination = reactive<PaginationMeta>({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0,
  sortBy: "createdAt",
  sortOrder: "DESC",
});

const statusOptions = computed(() => [
  { label: crud.active, value: "active" },
  { label: crud.inactive, value: "inactive" },
]);

const isDeleteDialogOpen = ref(false);
const currencyToDelete = ref<number | null>(null);

async function fetchCurrencies() {
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

    if (filters.search.trim()) {
      payload.search = filters.search.trim();
    }

    if (filters.status) {
      payload.filter = { status: filters.status };
    }

    const response = await currencyService.getList(payload);
    if (response.success && response.data) {
      currencies.value = response.data.data;
      Object.assign(pagination, response.data.meta);
    }
  } catch (error) {
    console.error("Fetch currencies error:", error);
    toast.error(t('crud.errorFetch', { module: labels.title }));
  } finally {
    loading.value = false;
  }
}

const debouncedFetch = useDebounceFn(() => {
  pagination.page = 1;
  fetchCurrencies();
}, 500);

watch(
  () => filters.search,
  () => {
    debouncedFetch();
  }
);

watch(
  () => filters.status,
  () => {
    pagination.page = 1;
    fetchCurrencies();
  }
);

watch(
  () => pagination.limit,
  () => {
    pagination.page = 1;
    fetchCurrencies();
  },
);

function handlePageChange(page: number) {
  pagination.page = page;
  fetchCurrencies();
}

async function toggleStatus(currency: Currency) {
  try {
    const newStatus = !currency.status;
    const response = await currencyService.updateStatus({
      id: currency.id,
      status: newStatus,
    });
    if (response.success) {
      currency.status = newStatus;
      toast.success(t('crud.successUpdate', { module: labels.name }));
    }
  } catch (error) {
    toast.error(t('crud.errorUpdate', { module: labels.name }));
  }
}

function openDeleteDialog(id: number) {
  currencyToDelete.value = id;
  isDeleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!currencyToDelete.value) return;

  try {
    const response = await currencyService.softDelete(currencyToDelete.value);
    if (response.success) {
      toast.success(t('crud.successDelete', { module: labels.name }));
      fetchCurrencies();
    } else {
      toast.error(response.message || t('crud.errorDelete', { module: labels.name }));
    }
  } catch (error) {
    toast.error(t('crud.errorDelete', { module: labels.name }));
  } finally {
    isDeleteDialogOpen.value = false;
    currencyToDelete.value = null;
  }
}

function handleSort(column: string) {
  if (pagination.sortBy === column) {
    pagination.sortOrder = pagination.sortOrder === "ASC" ? "DESC" : "ASC";
  } else {
    pagination.sortBy = column;
    pagination.sortOrder = "ASC";
  }
  fetchCurrencies();
}

onMounted(() => {
  fetchCurrencies();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold tracking-tight text-foreground">{{ labels.title }}</h2>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          @click="fetchCurrencies"
          :disabled="loading"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
        <Button @click="router.push('/admin/currencies/create')">
          <Plus class="mr-2 h-4 w-4" />{{ crud.createBtn }} {{ labels.title }}</Button>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row items-center gap-4">
      <div class="relative flex-1 w-full max-w-sm">
        <Search
          class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
        />
        <Input
          type="search"
          :placeholder="t('crud.search', { module: labels.title })"
          class="pl-8"
          v-model="filters.search"
        />
      </div>

      <ClearableSelect
        v-model="filters.status"
        :options="statusOptions"
        :placeholder="crud.filterByStatus"
        class="w-full sm:w-[220px]"
      />
    </div>

    <div class="rounded-md border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[40px]">#</TableHead>
            <TableHead class="w-[120px]">{{ fields.code }}</TableHead>
            <TableHead>
              <Button variant="ghost" @click="handleSort('currency')" class="-ml-4 h-8 font-medium"
              >{{ fields.currency }}<ArrowUpDown class="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>{{ fields.country }}</TableHead>
            <TableHead>{{ fields.symbol }}</TableHead>
            <TableHead>{{ fields.exchangeRate }}</TableHead>
            <TableHead class="text-center">{{ fields.isDefault }}</TableHead>
            <TableHead>{{ fields.status }}</TableHead>
            <TableHead class="text-right">{{ crud.actions }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading && currencies.length === 0">
            <TableCell colspan="7" class="h-24 text-center">
              <div
                class="flex items-center justify-center text-muted-foreground italic text-sm"
              >
                <Loader2 class="h-4 w-4 animate-spin mr-2" />
                <span>{{ crud.fetchingData }}</span>
              </div>
            </TableCell>
          </TableRow>
          <template v-else-if="currencies.length > 0">
            <TableRow
              v-for="(currency, index) in currencies"
              :key="currency.id"
            >
              <TableCell class="font-medium text-muted-foreground">
                {{ (pagination.page - 1) * pagination.limit + index + 1 }}
              </TableCell>
              <TableCell>
                <code
                  class="bg-muted px-2 py-0.5 rounded text-xs font-bold text-foreground/70 border border-muted-foreground/10 uppercase"
                  >
                  {{ currency.code }}
                </code>
              </TableCell>
              <TableCell class="font-bold text-base text-foreground/90">
                {{ currency.currency }}
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">
                {{ currency.country }}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" class="bg-primary/10 text-primary border-primary/20 font-bold text-base px-2.5 rounded-lg shadow-sm">
                  {{ currency.symbol }}
                </Badge>
              </TableCell>
              <TableCell class="text-sm font-bold">
                {{ formatRate(currency.exchangeRate) }}
              </TableCell>
              <TableCell class="text-center">
                <div v-if="currency.isDefault" class="flex justify-center">
                  <Badge variant="success" class="font-semibold">{{ fields.isDefault }}</Badge>
                </div>
                <span v-else class="text-muted-foreground/30 px-3">-</span>
              </TableCell>
              <TableCell class="w-[100px]">
                <Badge
                  :variant="currency.status ? 'success' : 'warning'"
                  class="cursor-pointer font-bold px-3 transition-all hover:opacity-80 active:scale-95"
                  @click="toggleStatus(currency)"
                >
                  {{ currency.status ? crud.active : crud.inactive }}
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
                    >{{ crud.actions }}</DropdownMenuLabel
                    >
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="router.push(`/admin/currencies/${currency.id}`)" class="cursor-pointer">
                      <Eye class="mr-2 h-4 w-4 opacity-70" /> {{ crud.viewBtn }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="router.push(`/admin/currencies/${currency.id}/edit`)" class="cursor-pointer">
                      <Pencil class="mr-2 h-4 w-4 opacity-70" />{{ crud.editBtn }}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="text-destructive focus:text-destructive cursor-pointer font-medium" @click="openDeleteDialog(currency.id)">
                      <Trash2 class="mr-2 h-4 w-4" />{{ crud.delete }}</DropdownMenuItem>
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
                <Coins class="h-10 w-10 opacity-10" />
                <p class="font-medium">{{ t('crud.noRecords', { module: labels.title }) }}</p>
                <Button v-if="filters.search || filters.status" variant="outline" size="sm"
                  @click="Object.assign(filters, { search: '', status: '' })" class="h-8"
                >
                  {{ crud.resetFilters }}
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
          <span class="text-sm font-medium text-muted-foreground whitespace-nowrap"
            >{{ crud.rowsPerPage }}</span
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
            <PaginationPrevious class="h-8 px-2 text-foreground font-medium border-0 hover:bg-muted/50 bg-transparent" />
            
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
            
            <PaginationNext class="h-8 px-2 text-foreground font-medium border-0 hover:bg-muted/50 bg-transparent" />
          </PaginationContent>
        </Pagination>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ crud.confirmDelete }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t("crud.confirmDeleteDesc", { module: labels.name }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false">{{ crud.cancel }}</AlertDialogCancel>
          <AlertDialogAction @click="confirmDelete" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">{{ crud.delete }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
