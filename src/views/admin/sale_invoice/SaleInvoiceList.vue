<script setup lang="ts">
import { useAppI18n } from "@/hooks/useAppI18n";
const { t, labels, fields, crud, actions } = useAppI18n("saleInvoice");
import { ref, onMounted, reactive, watch,computed } from "vue";



import { useRouter } from "vue-router";
import { formatDateTime, formatCurrency } from "@/utils/format";

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
  Ban,
  CreditCard,
} from "lucide-vue-next";
import DateRangePicker from "@/components/DateRangePicker.vue";
import CurrencyToggle from "@/components/CurrencyToggle.vue";
import { SaleInvoiceService } from "@/services/sale_invoice/sale_invoice.service";
import { CustomerService } from "@/services/customer/customer.service";
import type { SaleInvoice, PaginationMeta, Customer } from "@/types";
import { InvoiceStatus } from "@/types/enums";
import { toast } from "vue-sonner";
import { useDebounceFn } from "@vueuse/core";
import SearchableSelect from "@/components/SearchableSelect.vue";
import ClearableSelect from "@/components/ClearableSelect.vue";

const router = useRouter();
const siService = new SaleInvoiceService();
const customerService = new CustomerService();

const records = ref<SaleInvoice[]>([]);
const customers = ref<Customer[]>([]);
const loading = ref(true);
const filters = reactive({
  search: "",
  status: "",
  customerId: "",
  startDate: "",
  endDate: "",
});

const customerOptions = computed(() => 
  customers.value.map(c => ({ label: c.name, value: c.id }))
);

const pagination = reactive<PaginationMeta>({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0,
  sortBy: "createdAt",
  sortOrder: "DESC",
});

const statusOptions = computed(() => [
  { label: fields.statusLabels.draft, value: String(InvoiceStatus.DRAFT) },
  { label: fields.statusLabels.confirmed, value: "2" },
  { label: fields.statusLabels.completed, value: String(InvoiceStatus.COMPLETED) },
]);

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
    if (filters.search.trim()) {
      payload.search = filters.search.trim();
    }
    
    payload.filter = {};
    if (filters.status) {
      payload.filter.status = filters.status;
    }
    if (filters.customerId) {
      payload.filter.customerId = filters.customerId;
    }
    if (filters.startDate) {
      payload.filter.startDate = filters.startDate;
    }
    if (filters.endDate) {
      payload.filter.endDate = filters.endDate;
    }

    const response = await siService.getList(payload);
    if (response.success && response.data) {
      records.value = response.data.data;
      Object.assign(pagination, response.data.meta);
    }
  } catch (error) {
    console.error("Fetch error:", error);
    toast.error(t('crud.errorFetch', { module: labels.name }));
  } finally {
    loading.value = false;
  }
}

async function fetchCustomers() {
  try {
    const response = await customerService.getAll();
    if (response.success && response.data) {
      customers.value = response.data;
    }
  } catch (error) {
    console.error("Fetch customers error:", error);
  }
}

const debouncedFetch = useDebounceFn(() => {
  pagination.page = 1;
  fetchData();
}, 500);

watch(
  () => filters.search,
  () => debouncedFetch()
);
watch(
  () => [filters.status, filters.customerId, filters.startDate, filters.endDate],
  () => { pagination.page = 1; fetchData(); }
);
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
    const response = await siService.delete(recordToDelete.value);
    if (response.success) {
      toast.success(t('crud.successDelete', { module: labels.name }));
      fetchData();
    }
  } catch (error) {
    toast.error(t('crud.errorDelete', { module: labels.name }));
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

function getStatusBadge(record: SaleInvoice) {
  if (record.isCancel || Number(record.status) === InvoiceStatus.CANCELLED) 
    return { variant: 'destructive', label: fields.statusLabels.cancelled };
    
  switch(Number(record.status)) {
    case InvoiceStatus.DRAFT: return { variant: 'secondary', label: fields.statusLabels.draft };
    case InvoiceStatus.CONFIRMED: return { variant: 'warning', label: fields.statusLabels.confirmed };
    case InvoiceStatus.COMPLETED: return { variant: 'success', label: fields.statusLabels.completed };
    default: return { variant: 'outline', label: crud.all };
  }
}

onMounted(() => {
  fetchData();
  fetchCustomers();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold tracking-tight text-foreground">{{ labels.title }}</h2>
      <div class="flex items-center gap-2">
        <CurrencyToggle />
        <Button variant="outline" size="icon" @click="fetchData" :disabled="loading">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
        <Button v-permission="'sale_invoice:create'" @click="router.push('/admin/sale-invoices/create')">
          <Plus class="mr-2 h-4 w-4" />{{ crud.createBtn }} {{ labels.name }}
        </Button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          :placeholder="crud.search"
          class="pl-8 bg-background/50 border-border/60 shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
          v-model="filters.search"
        />
      </div>

      <DateRangePicker 
        :model-value="{ start: filters.startDate, end: filters.endDate }"
        @update:model-value="(val) => { filters.startDate = val?.start || ''; filters.endDate = val?.end || ''; }"
        class="w-full sm:w-[260px] shadow-sm"
        :placeholder="crud.filterByDate"
      />

      <SearchableSelect
        v-model="filters.customerId"
        :options="customerOptions"
        :placeholder="crud.filterByCustomer"
        :empty-message="crud.noResults"
        class="w-full sm:w-[250px]"
      />

      <ClearableSelect
        v-model="filters.status"
        :options="statusOptions"
        :placeholder="crud.filterByStatus"
        class="w-full sm:w-[250px]"
      />

      <Button 
        v-if="filters.search || filters.status || filters.customerId || filters.startDate || filters.endDate"
        variant="ghost" 
        size="sm"
        @click="Object.assign(filters, { search: '', status: '', customerId: '', startDate: '', endDate: '' })"
        class="h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <RefreshCw class="mr-2 h-4 w-4" />
        {{ crud.resetFilters }}
      </Button>
    </div>

    <div class="rounded-md border bg-card overflow-auto shadow-sm max-h-[700px] scrollbar-thin scrollbar-thumb-muted-foreground/20">
      <Table class="min-w-[1500px]">
        <TableHeader>
          <TableRow>
            <TableHead class="w-[50px]">#</TableHead>
            <TableHead class="w-[150px]">{{ fields.code }}</TableHead>
            <TableHead>{{ fields.customerId }}</TableHead>
            <TableHead>
              <Button variant="ghost" @click="handleSort('invoiceDate')" class="-ml-4 h-8 font-medium">
                {{ fields.date }}<ArrowUpDown class="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead class="text-center">{{ fields.totalLine }}</TableHead>
            <TableHead class="text-right">{{ fields.totalPrice }}</TableHead>
            <TableHead class="text-center">{{ fields.status }}</TableHead>
            <TableHead class="text-right">{{ crud.actions }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading && records.length === 0">
            <TableCell colspan="8" class="h-24 text-center">
              <div class="flex items-center justify-center text-muted-foreground italic text-sm">
                <Loader2 class="h-4 w-4 animate-spin mr-2" />
                <span>{{ crud.fetchingData }}</span>
              </div>
            </TableCell>
          </TableRow>
          <template v-else-if="records.length > 0">
            <TableRow v-for="(record, index) in records" :key="record.id" :class="{'opacity-75 bg-muted/20': record.isCancel}">
              <TableCell class="font-medium text-muted-foreground">
                {{ (pagination.page - 1) * pagination.limit + index + 1 }}
              </TableCell>
              <TableCell>
                <code class="bg-muted px-2 py-0.5 rounded text-xs font-bold text-foreground/70 border border-muted-foreground/10 uppercase">
                  {{ record.code }}
                </code>
              </TableCell>
              <TableCell class="font-medium">
                {{ record.customer?.name || `Customer ID ${record.customerId}` }}
              </TableCell>
              <TableCell class="text-foreground/90">
                {{ formatDateTime(record.invoiceDate) }}
              </TableCell>
              <TableCell class="text-center">
                <div class="flex flex-col items-center">
                  <span class="font-bold">{{ Math.trunc(record.totalLine || 0) }} {{ fields.items }}</span>
                </div>
              </TableCell>
              <TableCell class="text-right text-primary font-semibold">
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
                      {{ crud.editBtn }}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="router.push(`/admin/sale-invoices/${record.id}`)" class="cursor-pointer">
                      <Eye class="mr-2 h-4 w-4 opacity-70" />{{ crud.viewBtn }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      v-permission="'sale_payment:create'"
                      v-if="!record.isCancel && (record.totalPrice - record.paidAmount) > 0"
                      @click="router.push(`/admin/sale-payments/create?invoiceId=${record.id}`)"
                      class="cursor-pointer"
                    >
                      <CreditCard class="mr-2 h-4 w-4 opacity-70" />{{ actions.createPayment }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator v-permission="'sale_invoice:delete'" />
                    <DropdownMenuItem
                      v-permission="'sale_invoice:delete'"
                      class="text-destructive focus:text-destructive cursor-pointer font-medium"
                      @click="openDeleteDialog(record.id)"
                    >
                      <Trash2 class="mr-2 h-4 w-4" />{{ crud.delete }}
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
                <p class="font-medium">{{ crud.noRecords }}</p>
                <Button
                  v-if="filters.search || filters.status || filters.customerId || filters.startDate || filters.endDate"
                  variant="outline"
                  size="sm"
                  @click="Object.assign(filters, { search: '', status: '', customerId: '', startDate: '', endDate: '' })"
                  class="h-8"
                >
                  {{ crud.resetFilters }}
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
          <span class="text-sm font-medium text-muted-foreground whitespace-nowrap">{{ crud.rowsPerPage }}</span>
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
          <AlertDialogTitle>{{ crud.confirmDelete }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ crud.confirmDeleteDesc }}
            <br/><br/>
            <strong class="text-destructive">{{ fields.saleInvoiceDeleteWarning }}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false">{{ crud.cancel }}</AlertDialogCancel>
          <AlertDialogAction @click="confirmDelete" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {{ crud.delete }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
