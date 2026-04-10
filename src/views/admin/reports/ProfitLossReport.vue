<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ReportService } from "@/services/report/report.service";
import DateRangePicker from "@/components/DateRangePicker.vue";
import type { ProfitLossReport, PaginationRequest } from "@/types";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Target,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Search,
} from "lucide-vue-next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
const dateRange = ref<{ start: string | null; end: string | null } | null>(
  null,
);

const reportData = ref<ProfitLossReport>({
  netSales: 0,
  costOfGoodsSold: 0,
  grossProfit: 0,
  expenses: 0,
  netProfit: 0,
});

async function fetchData() {
  loading.value = true;
  try {
    const query: PaginationRequest = {
      page: 1,
      limit: 10,
      sortBy: "id",
      sortOrder: "DESC",
      filter: {},
    };
    if (dateRange.value?.start && query.filter)
      query.filter.startDate = dateRange.value.start;
    if (dateRange.value?.end && query.filter)
      query.filter.endDate = dateRange.value.end;

    const res = await reportService.getProfitAndLossReport(query);
    if (res.data) {
      reportData.value = res.data;
    }
  } catch (error: any) {
    toast.error(t("reports.failedToLoad", { module: t("menu.plReport") }));
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});

function handleDateRangeFilter(
  payload: { start: string | null; end: string | null } | null,
) {
  dateRange.value = payload;
  fetchData();
}

/* EXPORT LOGIC */
const customExportCols: ExportColumn[] = [
  { header: t("reports.revenue"), dataKey: "netSales" },
  { header: t("reports.cogs"), dataKey: "costOfGoodsSold" },
  { header: t("reports.grossProfit"), dataKey: "grossProfit" },
  { header: t("reports.otherExpenses"), dataKey: "expenses" },
  { header: t("reports.netProfit"), dataKey: "netProfit" },
];

function handleExport(formatType: "excel" | "csv" | "pdf") {
  const ds = [reportData.value];
  const timestamp = formatDateForFilename(new Date());
  const filename = `${t("menu.plReport")}_${timestamp}`;

  if (formatType === "excel") exportToExcel(filename, customExportCols, ds);
  if (formatType === "csv") exportToCSV(filename, customExportCols, ds);
  if (formatType === "pdf")
    exportToPDF(filename, customExportCols, ds, t("menu.plReport"));
}
</script>

<template>
  <div class="h-full flex flex-col gap-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <h2 class="text-3xl font-bold tracking-tight">
          {{ $t("menu.plReport") }}
        </h2>
      </div>
    </div>

    <!-- Action Bar (Filters + Exports) - Now Under Title -->
    <Card class="bg-muted/30 border-none shadow-none">
      <CardContent class="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
          <div class="flex-1 lg:min-w-[320px]">
             <p class="text-sm text-muted-foreground">{{ $t('reports.plSummary') }}</p>
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
              variant="outline"
              size="sm"
              class="gap-2 border-green-600/50 hover:bg-green-50 hover:text-green-700 transition-colors bg-background"
            >
              <FileSpreadsheet class="h-4 w-4" /> {{ $t("reports.excel") }}
            </Button>
            <Button
              @click="handleExport('csv')"
              variant="outline"
              size="sm"
              class="gap-2 border-blue-600/50 hover:bg-blue-50 hover:text-blue-700 transition-colors bg-background"
            >
              <FileText class="h-4 w-4" /> {{ $t("reports.csv") }}
            </Button>
            <Button
              @click="handleExport('pdf')"
              variant="outline"
              size="sm"
              class="gap-2 border-red-600/50 hover:bg-red-50 hover:text-red-700 transition-colors bg-background"
            >
              <FileText class="h-4 w-4" /> {{ $t("reports.pdf") }}
            </Button>
        </div>
      </CardContent>
    </Card>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center gap-2">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
        <span class="text-muted-foreground">{{ $t("crud.loading") }}</span>
      </div>
    </div>

    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <!-- Revenue & Sales -->
      <Card class="border-t-4 border-t-green-600">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">{{
            $t("reports.revenue")
          }}</CardTitle>
          <TrendingUp class="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">
            {{ formatCurrency(reportData.netSales) }}
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            {{ $t("reports.revenueDesc") }}
          </p>
        </CardContent>
      </Card>

      <!-- COGS -->
      <Card class="border-t-4 border-t-orange-600">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">{{
            $t("reports.cogs")
          }}</CardTitle>
          <TrendingDown class="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">
            {{ formatCurrency(reportData.costOfGoodsSold) }}
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            {{ $t("reports.cogsDesc") }}
          </p>
        </CardContent>
      </Card>

      <!-- Gross Profit -->
      <Card class="border-t-4 border-t-blue-600">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">{{
            $t("reports.grossProfit")
          }}</CardTitle>
          <PieChart class="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold text-blue-600 font-mono">
            {{ formatCurrency(reportData.grossProfit) }}
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            {{ $t("reports.grossProfitDesc") }}
          </p>
        </CardContent>
      </Card>

      <!-- Operating Expenses (Purchases) -->
      <Card class="border-t-4 border-t-destructive">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">{{
            $t("reports.otherExpenses")
          }}</CardTitle>
          <TrendingDown class="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">
            {{ formatCurrency(reportData.expenses) }}
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            {{ $t("reports.otherExpensesDesc") }}
          </p>
        </CardContent>
      </Card>

      <!-- Net Profit -->
      <Card
        class="border-t-4 border-t-primary bg-primary/5 md:col-span-2 lg:col-span-1 shadow-lg"
      >
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">{{
            $t("reports.netProfit")
          }}</CardTitle>
          <DollarSign class="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div class="text-4xl font-black text-primary">
            {{ formatCurrency(reportData.netProfit) }}
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            {{ $t("reports.netProfitDesc") }}
          </p>
          <div class="mt-4 flex items-center gap-2">
            <span
              class="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold"
              :class="
                reportData.netProfit >= 0
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              "
            >
              {{ reportData.netProfit >= 0 ? "Profitable" : "Deficit" }}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
