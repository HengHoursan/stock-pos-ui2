<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ReportService } from "@/services/report/report.service";
import DateRangePicker from "@/components/DateRangePicker.vue";
import type { InventoryReport, PaginationRequest } from "@/types";
import {
  PackageSearch,
  AlertTriangle,
  History,
  TrendingDown,
  Warehouse,
  Loader2,
  Search,
  FileSpreadsheet,
  FileText,
} from "lucide-vue-next";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateForFilename } from "@/utils/format";
import { toast } from "vue-sonner";
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  type ExportColumn,
} from "@/utils/export";

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

const reportData = ref<InventoryReport>({
  currentStockLevels: 0,
  stockValuation: 0,
  lowStockAlerts: {
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

    const res = await reportService.getInventoryReport(query);
    if (res.data) {
      reportData.value = res.data;
      pagination.totalItems = res.data.lowStockAlerts.meta.totalItems;
    }
  } catch (error: any) {
    toast.error(
      t("reports.failedToLoad", { module: t("menu.inventoryReport") }),
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
  const totalItems = reportData.value.lowStockAlerts.meta.totalItems;
  const totalPages = Math.ceil(totalItems / pagination.limit);
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
  { header: t("reports.productName"), dataKey: "name" },
  { header: t("fields.code"), dataKey: "code" },
  { header: t("fields.currentStock"), dataKey: "currentStock" },
  { header: t("reports.alertQty"), dataKey: "alertQuantity" },
];

function handleExport(formatType: "excel" | "csv" | "pdf") {
  const ds = reportData.value.lowStockAlerts.data;
  if (!ds || ds.length === 0) {
    toast.warning(t("reports.noDataToExport"));
    return;
  }

  const timestamp = formatDateForFilename(new Date());
  const filename = `${t("menu.inventoryReport")}_${timestamp}`;

  if (formatType === "excel") exportToExcel(filename, customExportCols, ds);
  if (formatType === "csv") exportToCSV(filename, customExportCols, ds);
  if (formatType === "pdf")
    exportToPDF(filename, customExportCols, ds, t("menu.inventoryReport"));
}
</script>

<template>
  <div class="h-full flex flex-col gap-6">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <h2 class="text-3xl font-bold tracking-tight">
        {{ $t("menu.inventoryReport") }}
      </h2>
    </div>

    <!-- Action Bar (Filters + Exports) - Now Under Title -->
    <Card class="bg-muted/30 border-none shadow-none">
      <CardContent
        class="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div
          class="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto"
        >
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
            $t("reports.currentStockLevels")
          }}</CardTitle>
          <Warehouse class="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">
            {{ reportData.currentStockLevels }} {{ $t("reports.units") }}
          </div>
          <p class="text-xs text-muted-foreground">
            {{ $t("reports.stockLevelsDesc") }}
          </p>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-green-600">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">{{
            $t("reports.totalValuation")
          }}</CardTitle>
          <History class="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold text-green-700">
            {{ formatCurrency(reportData.stockValuation) }}
          </div>
          <p class="text-xs text-muted-foreground">
            {{ $t("reports.valuationDesc") }}
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Low Stock Alerts -->
    <Card
      class="border-l-4 border-l-destructive shadow-sm overflow-hidden mb-6"
    >
      <CardHeader class="pb-3 px-6 pt-6">
        <div class="flex items-center gap-2 text-destructive">
          <AlertTriangle class="h-5 w-5" />
          <CardTitle class="text-xl font-bold">{{
            $t("reports.lowStockAlerts")
          }}</CardTitle>
        </div>
        <CardDescription class="text-sm">
          {{ $t("reports.lowStockAlertsDesc") }}
        </CardDescription>
      </CardHeader>
      <CardContent class="px-6 pb-6 pt-0">
        <div class="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ $t("reports.productName") }}</TableHead>
                <TableHead>{{ $t("fields.code") }}</TableHead>
                <TableHead class="text-center">{{
                  $t("fields.currentStock")
                }}</TableHead>
                <TableHead class="text-center">{{
                  $t("reports.alertQty")
                }}</TableHead>
                <TableHead class="text-right">{{
                  $t("reports.status")
                }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="loading">
                <TableCell colspan="5" class="h-24 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <Loader2 class="h-4 w-4 animate-spin" />
                    <span>{{ $t("crud.loading") }}</span>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="!reportData.lowStockAlerts.data.length">
                <TableCell colspan="5" class="h-24 text-center">
                  {{ $t("reports.stockHealthy") }}
                </TableCell>
              </TableRow>
              <TableRow
                v-else
                v-for="item in reportData.lowStockAlerts.data"
                :key="item.id"
              >
                <TableCell class="font-medium">{{ item.name }}</TableCell>
                <TableCell>{{ item.code }}</TableCell>
                <TableCell class="text-center font-bold text-destructive">
                  {{ Math.trunc(item.currentStock || 0) }}
                </TableCell>
                <TableCell class="text-center">{{
                  Math.trunc(item.alertQuantity || 0)
                }}</TableCell>
                <TableCell class="text-right">
                  <span
                    class="px-2 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20"
                  >
                    {{ $t("reports.critical") }}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Pagination Component -->
        <div
          class="flex items-center justify-end px-4 py-4"
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
              <PaginationContent
                v-slot="{ items }"
                class="flex items-center gap-1"
              >
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
      </CardContent>
    </Card>
  </div>
</template>
