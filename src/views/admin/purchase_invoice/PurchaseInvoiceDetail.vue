<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { formatDateTime, formatCurrency } from "@/utils/format";
import CurrencyToggle from "@/components/CurrencyToggle.vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  FileText,
  Loader2,
  Package,
  Calendar,
  Truck,
  CreditCard,
  Ban,
  ArrowRightCircle,
} from "lucide-vue-next";
import { PurchaseInvoiceService } from "@/services/purchase_invoice/purchase_invoice.service";
import { PurchasePaymentService } from "@/services/purchase_payment/purchase_payment.service";
import type { PurchaseInvoice, PurchasePayment } from "@/types";
import { InvoiceStatus, PaymentMethod } from "@/types/enums";
import { toast } from "vue-sonner";

const route = useRoute();
const router = useRouter();
const piService = new PurchaseInvoiceService();
const ppService = new PurchasePaymentService();

const record = ref<PurchaseInvoice | null>(null);
const payments = ref<PurchasePayment[]>([]);
const loading = ref(true);

function getStatusBadge(rec: PurchaseInvoice) {
  if (rec.isCancel)
    return {
      variant: "destructive",
      label: t("fields.statusLabels.cancelled"),
    };
  switch (Number(rec.status)) {
    case InvoiceStatus.DRAFT:
      return { variant: "secondary", label: t("fields.statusLabels.draft") };
    case InvoiceStatus.COMPLETED:
      return { variant: "success", label: t("fields.statusLabels.completed") };
    default:
      return { variant: "outline", label: t("crud.all") };
  }
}

function getPaymentAmountForInvoice(pay: PurchasePayment) {
  const detail = pay.details?.find(d => d.purchaseInvoiceId === record.value?.id);
  return detail ? detail.paidAmount : 0;
}

function getPaymentMethod(pm: PaymentMethod) {
  switch (Number(pm)) {
    case PaymentMethod.CASH:
      return t("fields.paymentMethodLabels.cash");
    case PaymentMethod.TRANSFER:
      return t("fields.paymentMethodLabels.transfer");
    case PaymentMethod.OTHER:
      return t("fields.paymentMethodLabels.other");
    default:
      return "N/A";
  }
}

async function fetchDetail() {
  const id = Number(route.params.id);
  if (!id) return router.back();

  loading.value = true;
  try {
    const response = await piService.getDetail(id);
    if (response.success && response.data) {
      record.value = response.data;
    } else {
      toast.error(t("crud.notFound", { module: t("modules.purchaseInvoice") }));
      router.back();
    }
  } catch (error) {
    toast.error(t("crud.errorGeneral"));
  } finally {
    loading.value = false;
  }
}

async function fetchPayments() {
  const id = Number(route.params.id);
  if (!id) return;

  try {
    const response = await ppService.getList({
      page: 1,
      limit: 100,
      filter: { invoiceId: id },
    } as any);
    if (response.success && response.data) {
      payments.value = response.data.data;
    }
  } catch (error) {
    console.error("Failed to fetch payments", error);
  }
}

const totalPaymentsSum = computed(() => {
  return payments.value.reduce((sum, pay) => {
    const amount = getPaymentAmountForInvoice(pay);
    return sum + Number(amount || 0);
  }, 0);
});

onMounted(() => {
  fetchDetail();
  fetchPayments();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" @click="router.back()">
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <div class="flex items-center gap-3">
          <h2 class="text-3xl font-bold tracking-tight">
            {{ record ? record.code : "..." }}
          </h2>
          <Badge
            v-if="record"
            :variant="getStatusBadge(record).variant as any"
            class="ml-2 font-medium"
          >
            <Ban v-if="record.isCancel" class="w-3 h-3 mr-1 inline-block" />
            {{ getStatusBadge(record).label }}
          </Badge>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <CurrencyToggle />
        <Button
          v-if="record && record.status !== InvoiceStatus.COMPLETED"
          @click="router.push(`/admin/purchase-payments/create?invoiceId=${record.id}`)"
          class="text-primary-foreground"
        >
          {{ $t('actions.createPayment') }} <ArrowRightCircle class="ml-2 h-4 w-4" />
        </Button>
        <Button
          v-if="record && !record.isCancel"
          variant="outline"
          class="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
        >
          <Ban class="h-4 w-4 mr-2" /> {{ $t("actions.cancelInvoice") }}
        </Button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center p-12">
      <Loader2 class="h-8 w-8 animate-spin text-primary opacity-50" />
    </div>

    <div v-else-if="record" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Side panel for attributes -->
      <div class="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader class="pb-3 border-b">
            <CardTitle class="text-lg flex items-center gap-2">
              <FileText class="h-5 w-5 text-primary" />
              {{ $t("crud.generalInfo") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-4 space-y-4 text-sm">
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5">
                <Truck class="h-3.5 w-3.5" />{{ $t("fields.supplierId") }}
              </p>
              <p class="font-medium text-foreground">
                {{ record.supplier?.name || `ID: ${record.supplierId}` }}
              </p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5">
                <Calendar class="h-3.5 w-3.5" />{{ $t("fields.invoiceDate") }}
              </p>
              <p class="font-medium text-foreground">
                {{ formatDateTime(record.invoiceDate) }}
              </p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Package class="h-3.5 w-3.5" />{{ $t('fields.totalLine') }}</p>
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-bold text-foreground text-lg">{{ Math.trunc(record.totalLine || 0) }} {{ $t('fields.items') }}</p>
                <template v-if="record.details?.[0]?.purchaseOrder">
                  <span class="text-xs text-muted-foreground" v-if="(record.details[0].purchaseOrder.totalLine - record.details[0].purchaseOrder.totalCloseLine) > 0">
                    ({{ Math.trunc(record.details[0].purchaseOrder.totalLine - record.details[0].purchaseOrder.totalCloseLine) }} {{ $t('fields.remaining') }})
                  </span>
                  <span v-else class="text-xs text-emerald-600/70 font-medium italic">
                    ({{ $t('fields.fullyFulfilled') }})
                  </span>
                </template>
              </div>
            </div>
            <div v-if="record.details?.some(d => d.purchaseOrder)">
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5">
                <ArrowRightCircle class="h-3.5 w-3.5" />{{ $t("modules.purchaseOrder") }}
              </p>
              <div class="flex flex-wrap gap-1 mt-1">
                <div
                  v-for="order in Array.from(
                    new Map(
                      record.details
                        .filter((d) => d.purchaseOrder)
                        .map((d) => [d.purchaseOrder.id, d.purchaseOrder]),
                    ).values(),
                  )"
                  :key="order.id"
                  class="bg-indigo-50 px-2 py-0.5 rounded text-xs font-bold text-indigo-700 border border-indigo-200/50 uppercase cursor-pointer hover:bg-indigo-100 transition-colors shadow-sm"
                  @click="router.push(`/admin/purchase-orders/${order.id}`)"
                >
                  {{ order.code }}
                </div>
              </div>
            </div>
            <div>
              <p class="text-muted-foreground mb-1">
                {{ $t("fields.description") }}
              </p>
              <p class="font-medium text-foreground text-sm italic">
                {{ record.description || "---" }}
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- Payment Info sidebar -->
        <Card>
          <CardHeader class="pb-3 border-b">
            <CardTitle class="text-lg flex items-center gap-2">
              <CreditCard class="h-5 w-5 text-primary" />
              {{ $t("fields.paymentDetails") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-4 space-y-4 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground"
                >{{ $t("fields.totalPrice") }}:</span
              >
              <span class="font-medium">{{
                formatCurrency(record.totalPrice)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground"
                >{{ $t("fields.paidAmount") }}:</span
              >
              <span class="font-medium text-success">{{
                formatCurrency(record.paidAmount)
              }}</span>
            </div>
            <div class="py-2 border-t flex justify-between">
              <span class="text-muted-foreground"
                >{{ $t("fields.balanceDue") }}:</span
              >
              <span
                class="font-bold"
                :class="
                  record.totalPrice - record.paidAmount > 0
                    ? 'text-destructive'
                    : 'text-muted-foreground/30'
                "
              >
                {{
                  formatCurrency(
                    Math.max(0, record.totalPrice - record.paidAmount),
                  )
                }}
              </span>
            </div>
            <div class="pt-2 border-t">
              <span class="text-muted-foreground block mb-1"
                >{{ $t("fields.paymentMethod") }}:</span
              >
              <Badge variant="outline">{{
                getPaymentMethod(record.paymentMethod)
              }}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Main panel for details -->
      <div class="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader class="pb-3 border-b">
            <CardTitle class="text-lg flex items-center gap-2">
              <Package class="h-5 w-5 text-primary" />
              {{ $t("fields.details") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            <Table>
              <TableHeader class="bg-muted/30">
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{{ $t("modules.product") }}</TableHead>
                  <TableHead class="text-right">{{
                    $t("fields.unitPrice")
                  }}</TableHead>
                  <TableHead class="text-center">{{
                    $t("fields.quantity")
                  }}</TableHead>
                  <TableHead class="text-right">{{
                    $t("fields.rowTotal")
                  }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-if="record.details && record.details.length > 0">
                  <TableRow
                    v-for="(item, idx) in record.details"
                    :key="item.id"
                  >
                    <TableCell class="font-medium text-muted-foreground">{{
                      idx + 1
                    }}</TableCell>
                    <TableCell class="font-medium">
                      {{ item.product?.name || `Product ID ${item.productId}` }}
                      <div
                        v-if="item.product?.code"
                        class="text-xs text-muted-foreground mt-0.5"
                      >
                        {{ item.product.code }}
                      </div>
                      <div
                        v-if="item.purchaseOrder"
                        class="mt-1"
                      >
                        <span 
                          class="bg-indigo-50 px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold text-indigo-600 border border-indigo-200/50 uppercase cursor-pointer hover:bg-indigo-100 transition-colors"
                          @click="router.push(`/admin/purchase-orders/${item.purchaseOrder.id}`)"
                        >
                          {{ item.purchaseOrder.code }}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell class="text-right">{{
                      formatCurrency(item.totalPrice / item.quantity)
                    }}</TableCell>
                    <TableCell class="text-center font-medium">{{
                      Math.trunc(item.quantity || 0)
                    }}</TableCell>
                    <TableCell class="text-right font-semibold">{{
                      formatCurrency(item.totalPrice)
                    }}</TableCell>
                  </TableRow>
                </template>
                <TableRow v-else>
                  <TableCell
                    colspan="5"
                    class="py-8 text-center text-muted-foreground italic"
                    >{{ $t("common.noData") }}</TableCell
                  >
                </TableRow>
              </TableBody>
            </Table>

            <div class="flex justify-end p-6 border-t bg-muted/10">
              <div class="w-full max-w-sm space-y-3">
                <div class="flex justify-between items-center text-lg font-bold">
                  <span>{{ $t("fields.grandTotal") }}:</span>
                  <span class="text-primary">{{
                    formatCurrency(record.totalPrice)
                  }}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Payment History -->
        <Card>
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <CreditCard class="h-5 w-5 text-primary" />
              {{ $t("fields.paymentHistory") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{{ $t("fields.code") }}</TableHead>
                  <TableHead>{{ $t("fields.paymentDate") }}</TableHead>
                  <TableHead>{{ $t("fields.amount") }}</TableHead>
                  <TableHead class="text-right">{{
                    $t("fields.actions")
                  }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-if="payments.length > 0">
                  <TableRow v-for="pay in payments" :key="pay.id">
                    <TableCell class="font-medium">{{ pay.code }}</TableCell>
                    <TableCell>{{ formatDateTime(pay.paymentDate) }}</TableCell>
                    <TableCell class="font-bold text-success">{{
                      formatCurrency(getPaymentAmountForInvoice(pay))
                    }}</TableCell>
                    <TableCell class="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        @click="
                          router.push(`/admin/purchase-payments/${pay.id}`)
                        "
                      >
                        {{ $t("actions.view") }}
                      </Button>
                    </TableCell>
                  </TableRow>
                </template>
                <TableRow v-else>
                  <TableCell
                    colspan="4"
                    class="py-8 text-center text-muted-foreground italic"
                  >
                    {{ $t("common.noData") }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div v-if="payments.length > 0" class="flex justify-end p-6 border-t bg-muted/10">
              <div class="w-full max-w-sm space-y-3">
                <div class="flex justify-between items-center text-lg font-bold">
                  <span>{{ $t('fields.totalPaid') }}:</span>
                  <span class="text-success">{{ formatCurrency(totalPaymentsSum) }}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
