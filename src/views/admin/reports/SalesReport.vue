<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import { useAppI18n } from "@/hooks/useAppI18n";
import { ReportService } from "@/services/report/report.service";
import { userService } from "@/services/user/user.service";
import type { SalesReport, PaginationRequest, User } from "@/types";
import DateRangePicker from "@/components/DateRangePicker.vue";
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  type ExportColumn,
} from "@/utils/export";
import {
  LineChart,
  TrendingUp,
  PieChart,
  FileText,
  Search,
  Loader2,
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

const { labels, fields, crud, menu, common } = useAppI18n("reports");
const reportService = new ReportService();

const loading = ref(true);
const search = ref("");
const dateRange = ref<{ start: string | null; end: string | null } | null>(
  null,
);
const cashiers = ref<User[]>([]);
const selectedCashier = ref<string>("all");

const pagination = reactive({
  page: 1,
  limit: 10,
  totalItems: 0,
});

const reportData = ref<SalesReport>({
  totalRevenue: 0,
  netSales: 0,
  totalReturns: 0,
  salesByPaymentMethod: [],
  salesByCashier: [],
  salesByCustomer: {
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
    if (selectedCashier.value && selectedCashier.value !== "all" && query.filter)
      query.filter.createdBy = selectedCashier.value;

    const res = await reportService.getSalesReport(query);
    if (res.data) {
      reportData.value = res.data;
      pagination.totalItems = res.data.salesByCustomer.meta.totalItems;
    }
  } catch (error: any) {
    toast.error(labels.failedToLoad.replace('{module}', menu.salesReport));
  } finally {
    loading.value = false;
  }
}

async function fetchCashiers() {
  try {
    const res = await userService.getAll();
    if (res.data) {
      cashiers.value = res.data;
    }
  } catch (error) {
    console.error("Failed to fetch cashiers");
  }
}

onMounted(() => {
  fetchCashiers();
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



/* EXPORT LOGIC */
const customExportCols: ExportColumn[] = [
  { header: labels.customer, dataKey: "customerName" },
  { header: fields.phoneNumber, dataKey: "customerPhone" },
  { header: labels.invoicesCount, dataKey: "totalInvoices" },
  { header: labels.totalSpent, dataKey: "totalSpent" },
];

function handleExport(formatType: "excel" | "csv" | "pdf") {
  const ds = reportData.value.salesByCustomer.data;
  if (!ds || ds.length === 0) {
    toast.warning(labels.noDataToExport);
    return;
  }

  const timestamp = formatDateForFilename(new Date());
  const filename = `${menu.salesReport}_${timestamp}`;

  if (formatType === "excel") exportToExcel(filename, customExportCols, ds, menu.salesReport);
  if (formatType === "csv") exportToCSV(filename, customExportCols, ds);
    exportToPDF(filename, customExportCols, ds, menu.salesReport);
}
</script>

<template>
  <div class="h-full flex flex-col gap-6">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <h2 class="text-3xl font-bold tracking-tight">
        {{ menu.salesReport }}
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
              :placeholder="crud.searchPlaceholder"
              class="pl-9 bg-background"
            />
          </div>
          <DateRangePicker
            :modelValue="dateRange"
            @update:modelValue="handleDateRangeFilter"
            class="w-full md:w-[320px] bg-background"
          />
          <Select v-model="selectedCashier" @update:model-value="() => { pagination.page = 1; fetchData(); }">
            <SelectTrigger class="w-full md:w-[200px] bg-background">
              <SelectValue placeholder="All Cashiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cashiers</SelectItem>
              <SelectItem v-for="cashier in cashiers" :key="cashier.id" :value="cashier.id.toString()">
                {{ cashier.username }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Button
            @click="handleExport('excel')"
            size="sm"
            class="gap-2 bg-green-600 hover:bg-green-700 text-white transition-colors cursor-pointer"
          >
            <FileSpreadsheet class="h-4 w-4" /> {{ labels.excel }}
          </Button>
          <Button
            @click="handleExport('csv')"
            size="sm"
            class="gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
          >
            <FileText class="h-4 w-4" /> {{ labels.csv }}
          </Button>
          <Button
            @click="handleExport('pdf')"
            size="sm"
            class="gap-2 bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
          >
            <FileText class="h-4 w-4" /> {{ labels.pdf }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Overview Cards -->
    <div class="grid gap-4 md:grid-cols-3">
      <Card class="border-l-4 border-l-blue-600">
        <CardHeader
          class="flex flex-row items-center justify-between pb-2"
        >
          <CardTitle class="text-sm font-medium">{{
            labels.totalRevenue
          }}</CardTitle>
          <TrendingUp class="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">
            {{ formatCurrency(reportData.totalRevenue) }}
          </div>
          <p class="text-xs text-muted-foreground">
            {{ labels.totalRevenueDesc }}
          </p>
        </CardContent>
      </Card>
      <Card class="border-l-4 border-l-green-600">
        <CardHeader
          class="flex flex-row items-center justify-between pb-2"
        >
          <CardTitle class="text-sm font-medium">{{
            labels.netSales
          }}</CardTitle>
          <LineChart class="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold text-green-700">
            {{ formatCurrency(reportData.netSales) }}
          </div>
          <p class="text-xs text-muted-foreground">
            {{ labels.netSalesDesc }}
          </p>
        </CardContent>
      </Card>
      <Card class="border-l-4 border-l-red-600">
        <CardHeader
          class="flex flex-row items-center justify-between pb-2"
        >
          <CardTitle class="text-sm font-medium">{{
            labels.totalReturns
          }}</CardTitle>
          <PieChart class="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold text-destructive">
            {{ formatCurrency(reportData.totalReturns) }}
          </div>
          <p class="text-xs text-muted-foreground">
            {{ labels.totalReturnsDesc }}
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Sales By Cashier Data Table -->
    <Card v-if="reportData.salesByCashier && reportData.salesByCashier.length > 0">
      <CardHeader>
        <CardTitle>Sales By Cashier</CardTitle>
        <CardDescription>Breakdown of sales and revenue per cashier.</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cashier Name</TableHead>
                <TableHead>Invoices Count</TableHead>
                <TableHead class="text-right">Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="(item, index) in reportData.salesByCashier"
                :key="index"
              >
                <TableCell class="font-medium">{{ item.cashierName }}</TableCell>
                <TableCell>{{ item.totalInvoices }}</TableCell>
                <TableCell class="text-right font-medium text-green-600">{{ formatCurrency(item.totalRevenue) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <!-- Sales By Customer Data Table -->
    <Card>
      <CardHeader>
        <CardTitle>{{ labels.salesByCustomer }}</CardTitle>
        <CardDescription>{{
          labels.salesByCustomerDesc
        }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ labels.customer }}</TableHead>
                <TableHead>{{ fields.phoneNumber }}</TableHead>
                <TableHead>{{ labels.invoicesCount }}</TableHead>
                <TableHead class="text-right">{{
                  labels.totalSpent
                }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="loading">
                <TableCell colspan="4" class="h-24 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <Loader2 class="h-4 w-4 animate-spin" />
                    <span>{{ crud.loading }}</span>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="!reportData.salesByCustomer.data.length">
                <TableCell colspan="4" class="h-24 text-center">{{
                  common.noData
                }}</TableCell>
              </TableRow>
              <TableRow
                v-else
                v-for="(item, index) in reportData.salesByCustomer.data"
                :key="index"
              >
                <TableCell class="font-medium">{{
                  item.customerName
                }}</TableCell>
                <TableCell>{{ item.customerPhone }}</TableCell>
                <TableCell>{{ item.totalInvoices }}</TableCell>
                <TableCell class="text-right font-medium text-green-600">{{
                  formatCurrency(item.totalSpent)
                }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Pagination Component -->
        <div class="flex items-center justify-end px-4 py-4">
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
