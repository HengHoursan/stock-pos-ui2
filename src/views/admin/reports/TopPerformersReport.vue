<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ReportService } from "@/services/report/report.service";
import DateRangePicker from "@/components/DateRangePicker.vue";
import type { TopPerformersReport, PaginationRequest } from "@/types";
import {
  Trophy,
  Users,
  Package,
  Star,
  ArrowUpRight,
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

const reportData = ref<TopPerformersReport>({
  bestSellingProducts: {
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
  topCustomers: {
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
      page: 1,
      limit: 10,
      sortBy: "id",
      sortOrder: "DESC",
      search: search.value || undefined,
      filter: {},
    };
    if (dateRange.value?.start && query.filter)
      query.filter.startDate = dateRange.value.start;
    if (dateRange.value?.end && query.filter)
      query.filter.endDate = dateRange.value.end;

    const res = await reportService.getTopPerformersReport(query);
    if (res.data) {
      reportData.value = res.data;
    }
  } catch (error: any) {
    toast.error(t("reports.failedToLoad", { module: t("menu.topPerformers") }));
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});

let searchTimeout: any;
watch(search, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchData();
  }, 500);
});

function handleDateRangeFilter(
  payload: { start: string | null; end: string | null } | null,
) {
  dateRange.value = payload;
  fetchData();
}

/* EXPORT LOGIC */
function handleExport(formatType: "excel" | "csv" | "pdf", target: "products" | "customers") {
  const ds = target === "products" ? reportData.value.bestSellingProducts.data : reportData.value.topCustomers.data;
  if (!ds || ds.length === 0) {
    toast.warning(t("reports.noDataToExport"));
    return;
  }

  const cols: ExportColumn[] = target === "products" ? [
    { header: t("reports.productName"), dataKey: "productName" },
    { header: t("fields.code"), dataKey: "productCode" },
    { header: t("reports.sold"), dataKey: "totalSold" },
    { header: t("reports.revenue"), dataKey: "revenueGenerated" },
  ] : [
    { header: t("reports.customer"), dataKey: "customerName" },
    { header: t("fields.phoneNumber"), dataKey: "customerPhone" },
    { header: t("reports.totalSpent"), dataKey: "totalSpent" },
  ];

  const title = target === "products" ? t("reports.bestSellingProducts") : t("reports.topCustomers");
  const timestamp = formatDateForFilename(new Date());
  const filename = `${title}_${timestamp}`;

  if (formatType === "excel") exportToExcel(filename, cols, ds);
  if (formatType === "csv") exportToCSV(filename, cols, ds);
  if (formatType === "pdf") exportToPDF(filename, cols, ds, title);
}
</script>

<template>
  <div class="h-full flex flex-col gap-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <h2 class="text-3xl font-bold tracking-tight">
          {{ $t("menu.topPerformers") }}
        </h2>
      </div>
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
            <div class="text-[10px] uppercase font-bold text-muted-foreground mr-1">{{ $t('reports.export') }}:</div>
            <Button
              @click="handleExport('excel', 'products')"
              variant="outline"
              size="sm"
              class="gap-2 border-green-600/50 hover:bg-green-50 hover:text-green-700 transition-colors bg-background"
            >
              <FileSpreadsheet class="h-4 w-4" /> {{ $t("reports.excel") }}
            </Button>
            <Button
              @click="handleExport('csv', 'products')"
              variant="outline"
              size="sm"
              class="gap-2 border-blue-600/50 hover:bg-blue-50 hover:text-blue-700 transition-colors bg-background"
            >
              <FileText class="h-4 w-4" /> {{ $t("reports.csv") }}
            </Button>
            <Button
              @click="handleExport('pdf', 'products')"
              variant="outline"
              size="sm"
              class="gap-2 border-red-600/50 hover:bg-red-50 hover:text-red-700 transition-colors bg-background"
            >
              <FileText class="h-4 w-4" /> {{ $t("reports.pdf") }}
            </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Top Grid -->
    <div class="grid gap-6 md:grid-cols-2">
      <!-- Best Selling Products -->
      <Card class="border-t-4 border-t-yellow-500 shadow-sm relative">
        <CardHeader class="pb-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Package class="h-5 w-5 text-yellow-600" />
              <CardTitle>{{ $t("reports.bestSellingProducts") }}</CardTitle>
            </div>
            <Star class="h-4 w-4 text-yellow-400 fill-yellow-400" />
          </div>
          <CardDescription>
            {{ $t("reports.bestSellingProductsDesc") }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="rounded-md border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{{ $t("reports.productName") }}</TableHead>
                  <TableHead class="text-center">{{
                    $t("reports.sold")
                  }}</TableHead>
                  <TableHead class="text-right">{{
                    $t("reports.revenue")
                  }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="loading">
                  <TableCell colspan="3" class="h-24 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <Loader2 class="h-4 w-4 animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow v-else-if="!reportData.bestSellingProducts.data.length">
                  <TableCell colspan="3" class="h-24 text-center">
                    {{ $t("common.noData") }}
                  </TableCell>
                </TableRow>
                <TableRow
                  v-else
                  v-for="(item, index) in reportData.bestSellingProducts.data"
                  :key="index"
                  class="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <div class="flex flex-col">
                      <span class="font-bold text-sm">{{
                        item.productName
                      }}</span>
                      <span class="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">{{
                        item.productCode
                      }}</span>
                    </div>
                  </TableCell>
                  <TableCell class="text-center font-bold text-amber-600">
                    {{ item.totalSold }}
                  </TableCell>
                  <TableCell class="text-right font-bold">
                    {{ formatCurrency(item.revenueGenerated) }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <!-- Top Customers -->
      <Card class="border-t-4 border-t-blue-500 shadow-sm relative">
        <CardHeader class="pb-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Users class="h-5 w-5 text-blue-600" />
              <CardTitle>{{ $t("reports.topCustomers") }}</CardTitle>
            </div>
            <div class="flex items-center gap-1">
               <Button @click="handleExport('excel', 'customers')" size="icon" variant="ghost" class="h-7 w-7 text-green-600" :title="$t('reports.excel')"><FileSpreadsheet class="h-4 w-4"/></Button>
               <ArrowUpRight class="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <CardDescription>
            {{ $t("reports.topCustomersDesc") }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="rounded-md border bg-background text-card-foreground">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{{ $t("reports.customer") }}</TableHead>
                  <TableHead class="text-right">{{
                    $t("reports.totalSpent")
                  }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="loading">
                  <TableCell colspan="2" class="h-24 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <Loader2 class="h-4 w-4 animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow v-else-if="!reportData.topCustomers.data.length">
                  <TableCell colspan="2" class="h-24 text-center">
                    {{ $t("common.noData") }}
                  </TableCell>
                </TableRow>
                <TableRow
                  v-else
                  v-for="(item, index) in reportData.topCustomers.data"
                  :key="index"
                  class="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <div class="flex flex-col">
                      <span class="font-bold mb-0.5">{{ item.customerName }}</span>
                      <span class="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                        <Users class="h-3 w-3 inline" /> {{ item.customerPhone }}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell class="text-right font-bold text-blue-700">
                    {{ formatCurrency(item.totalSpent) }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
