<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ReportService } from "@/services/report/report.service";
import type { PurchasesReport, PaginationRequest } from "@/types";
import DateRangePicker from "@/components/DateRangePicker.vue";
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  type ExportColumn,
} from "@/utils/export";
import {
  BarChart3,
  TrendingDown,
  ShoppingBag,
  History,
  Download,
  FileText,
  Loader2,
  Search,
  FileSpreadsheet,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { formatCurrency, formatDateForFilename } from "@/utils/format";
import { toast } from "vue-sonner";

const { t } = useI18n();
const reportService = new ReportService();

const loading = ref(true);
const search = ref("");
const dateRange = ref<{ start: string | null; end: string | null } | null>(
  null,
);

const pagination = reactive({
  page: 1,
  limit: 10,
  totalItems: 0,
});

const reportData = ref<PurchasesReport>({
  totalExpenses: 0,
  purchasesBySupplier: {
    data: [],
    meta: {
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 0,
      sortBy: "id",
      sortOrder: "DESC",
    },
  },
});

async function fetchData() {
  loading.value = true;
  try {
    const query: PaginationRequest = {
      page: pagination.page,
      limit: pagination.limit,
      sortBy: "id",
      sortOrder: "DESC",
      search: search.value || undefined,
      filter: {},
    };
    if (dateRange.value?.start && query.filter)
      query.filter.startDate = dateRange.value.start;
    if (dateRange.value?.end && query.filter)
      query.filter.endDate = dateRange.value.end;

    const res = await reportService.getPurchasesReport(query);
    if (res.data) {
      reportData.value = res.data;
      pagination.totalItems = res.data.purchasesBySupplier.meta.totalItems;
    }
  } catch (error: any) {
    toast.error(
      t("reports.failedToLoad", { module: t("menu.purchasesReport") }),
    );
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});

// Watchers
watch([() => pagination.page, () => pagination.limit], () => {
  fetchData();
});

let searchTimeout: any;
watch(search, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.page = 1;
    fetchData();
  }, 500);
});

function handleDateRangeFilter(
  payload: { start: string | null; end: string | null } | null,
) {
  dateRange.value = payload;
  pagination.page = 1;
  fetchData();
}

function handlePageChange(newPage: number) {
  pagination.page = newPage;
}

function getPageArray(): (number | string)[] {
  const totalPages = Math.ceil(pagination.totalItems / pagination.limit);
  const current = pagination.page;
  const delta = 2;
  const range: (number | string)[] = [];

  if (totalPages <= 1) return [1];

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    } else if (range[range.length - 1] !== "...") {
      range.push("...");
    }
  }
  return range;
}

/* EXPORT LOGIC */
const customExportCols: ExportColumn[] = [
  { header: t("reports.supplier"), dataKey: "supplierName" },
  { header: t("reports.invoicesCount"), dataKey: "totalInvoices" },
  { header: t("reports.totalSpent"), dataKey: "totalSpent" },
];

function handleExport(formatType: "excel" | "csv" | "pdf") {
  const ds = reportData.value.purchasesBySupplier.data;
  if (!ds || ds.length === 0) {
    toast.warning(t("reports.noDataToExport"));
    return;
  }

  const timestamp = formatDateForFilename(new Date());
  const filename = `${t("menu.purchasesReport")}_${timestamp}`;

  if (formatType === "excel") exportToExcel(filename, customExportCols, ds);
  if (formatType === "csv") exportToCSV(filename, customExportCols, ds);
  if (formatType === "pdf")
    exportToPDF(filename, customExportCols, ds, t("menu.purchasesReport"));
}
</script>

<template>
  <div class="h-full flex flex-col gap-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <h2 class="text-3xl font-bold tracking-tight">
        {{ $t("menu.purchasesReport") }}
      </h2>
    </div>

    <!-- Action Bar (Filters + Exports) - Now Under Title -->
    <Card class="bg-muted/30 border-none shadow-none">
      <CardContent class="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
          <div class="relative w-full md:w-[320px]">
            <Search
              class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
              v-model="search"
              type="search"
              :placeholder="$t('crud.searchPlaceholder')"
              class="pl-9 bg-background"
            />
          </div>
          <DateRangePicker
            :modelValue="dateRange"
            @update:modelValue="handleDateRangeFilter"
            class="w-full md:w-[320px] bg-background"
          />
        </div>
        <div class="flex flex-wrap items-center gap-2">
            <Button
              @click="handleExport('excel')"
              size="sm"
              class="gap-2 bg-green-600 hover:bg-green-700 text-white transition-colors cursor-pointer"
            >
              <FileSpreadsheet class="h-4 w-4" /> {{ $t("reports.excel") }}
            </Button>
            <Button
              @click="handleExport('csv')"
              size="sm"
              class="gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
            >
              <FileText class="h-4 w-4" /> {{ $t("reports.csv") }}
            </Button>
            <Button
              @click="handleExport('pdf')"
              size="sm"
              class="gap-2 bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
            >
              <FileText class="h-4 w-4" /> {{ $t("reports.pdf") }}
            </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Overview Cards -->
    <div class="grid gap-4 md:grid-cols-2">
      <Card class="border-l-4 border-l-blue-600">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">{{
            $t("reports.totalExpenses")
          }}</CardTitle>
          <TrendingDown class="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">
            {{ formatCurrency(reportData.totalExpenses) }}
          </div>
          <p class="text-xs text-muted-foreground">
            {{ $t("reports.totalExpensesDesc") }}
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Purchases By Supplier Data Table -->
    <Card>
      <CardHeader>
        <CardTitle>{{ $t("reports.purchasesBySupplier") }}</CardTitle>
        <CardDescription>{{
          $t("reports.purchasesBySupplierDesc")
        }}</CardDescription>
      </CardHeader>
      <CardContent class="px-6 pb-6 pt-0">
        <div class="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ $t("reports.supplier") }}</TableHead>
                <TableHead>{{ $t("reports.invoicesCount") }}</TableHead>
                <TableHead class="text-right">{{
                  $t("reports.totalSpent")
                }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="loading">
                <TableCell colspan="3" class="h-24 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <Loader2 class="h-4 w-4 animate-spin" />
                    <span>{{ $t("crud.loading") }}</span>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="!reportData.purchasesBySupplier.data.length">
                <TableCell colspan="3" class="h-24 text-center">
                  {{ $t("common.noData") }}
                </TableCell>
              </TableRow>
              <TableRow
                v-else
                v-for="(item, index) in reportData.purchasesBySupplier.data"
                :key="index"
              >
                <TableCell class="font-medium">{{
                  item.supplierName
                }}</TableCell>
                <TableCell>{{ item.totalInvoices }}</TableCell>
                <TableCell class="text-right font-bold text-blue-600">
                  {{ formatCurrency(item.totalSpent) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

    <!-- Pagination Component -->
    <div class="flex items-center justify-end px-4 py-4">
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
        <Pagination v-if="reportData.purchasesBySupplier.meta.totalItems > 0" :total="reportData.purchasesBySupplier.meta.totalItems" :items-per-page="pagination.limit" :sibling-count="1" :show-edges="false" v-model:page="pagination.page" @update:page="handlePageChange">
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
      </CardContent>
    </Card>
  </div>
</template>
