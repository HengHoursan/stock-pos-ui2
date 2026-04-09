<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { formatDateTime } from "@/utils/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, FileText, Loader2, Calendar, CreditCard, Banknote, History, Receipt } from "lucide-vue-next";
import { SalePaymentService } from "@/services/sale_payment/sale_payment.service";
import type { SalePayment } from "@/types";
import { PaymentMethod } from "@/types/enums";
import { toast } from "vue-sonner";

const route = useRoute();
const router = useRouter();
const spService = new SalePaymentService();

const record = ref<SalePayment | null>(null);
const loading = ref(true);

async function fetchDetail() {
  const id = Number(route.params.id);
  if (!id) return router.back();

  loading.value = true;
  try {
    const response = await spService.getDetail(id);
    if (response.success && response.data) {
      record.value = response.data;
    } else {
      toast.error(t('crud.notFound', { module: t('modules.salePayment') }));
      router.back();
    }
  } catch (error) {
    toast.error(t('crud.errorGeneral'));
  } finally {
    loading.value = false;
  }
}

function getPaymentMethodLabel(pm: PaymentMethod) {
  switch (Number(pm)) {
    case PaymentMethod.CASH: return t('fields.paymentMethodLabels.cash');
    case PaymentMethod.TRANSFER: return t('fields.paymentMethodLabels.transfer');
    case PaymentMethod.OTHER: return t('fields.paymentMethodLabels.other');
    default: return 'N/A';
  }
}

function formatCurrency(val: number) {
  return (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

onMounted(() => {
  fetchDetail();
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
          <Badge v-if="record" variant="secondary" class="ml-2 font-medium">
            {{ $t('modules.salePayment') }}
          </Badge>
        </div>
      </div>
      <div>
        <Button v-if="record" @click="router.push(`/admin/sale-payments/${record.id}/edit`)" variant="outline">
          {{ $t('crud.editBtn') }}
        </Button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center p-12">
      <Loader2 class="h-8 w-8 animate-spin text-primary opacity-50" />
    </div>

    <div v-else-if="record" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      <!-- General Info -->
      <div class="lg:col-span-1 space-y-6">
        <Card class="shadow-sm border-muted-foreground/10">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <FileText class="h-5 w-5 text-primary" />
              {{ $t('crud.generalInfo') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-4 space-y-4 text-sm">
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Receipt class="h-3.5 w-3.5" />{{ $t('modules.saleInvoice') }}</p>
              <p class="font-medium text-primary hover:underline cursor-pointer" @click="router.push(`/admin/sale-invoices/${record.saleInvoiceId}`)">
                {{ record.saleInvoice?.code || `ID: ${record.saleInvoiceId}` }}
              </p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Calendar class="h-3.5 w-3.5" />{{ $t('fields.transactionDate') }}</p>
              <p class="font-medium text-foreground">{{ formatDateTime(record.paymentDate) }}</p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><CreditCard class="h-3.5 w-3.5" />{{ $t('fields.paymentMethod') }}</p>
              <Badge variant="outline">{{ getPaymentMethodLabel(record.paymentMethod) }}</Badge>
            </div>
          </CardContent>
        </Card>

        <!-- Amount Card -->
        <Card class="shadow-sm border-success/20 bg-success/5">
          <CardHeader class="pb-3 border-b border-success/10">
            <CardTitle class="text-lg flex items-center gap-2 text-success">
              <Banknote class="h-5 w-5" />
              {{ $t('fields.paidAmount') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="text-center">
              <span class="text-3xl font-mono font-black text-success">${{ formatCurrency(record.amount) }}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Extended Details -->
      <div class="lg:col-span-3 space-y-6">
        <Card class="shadow-sm border-muted-foreground/10">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <History class="h-5 w-5 text-primary" />
              {{ $t('fields.paymentDetails') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="text-xs font-bold uppercase text-muted-foreground mb-2">{{ $t('fields.refNumber') }}</h4>
                <p class="text-lg font-medium">{{ record.referenceNumber || '---' }}</p>
              </div>
              <div>
                <h4 class="text-xs font-bold uppercase text-muted-foreground mb-2">{{ $t('fields.description') }}</h4>
                <p class="text-muted-foreground whitespace-pre-wrap">{{ record.description || '---' }}</p>
              </div>
            </div>

            <!-- Invoice Context -->
            <div v-if="record.saleInvoice" class="mt-8 p-4 rounded-lg bg-muted/30 border border-muted-foreground/10">
              <h4 class="text-sm font-bold flex items-center gap-2 mb-4">
                <Receipt class="h-4 w-4 text-primary" />
                {{ $t('fields.invoiceContext') }}
              </h4>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p class="text-xs text-muted-foreground">{{ $t('fields.totalPrice') }}</p>
                  <p class="font-mono font-bold">${{ formatCurrency(record.saleInvoice.totalPrice) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">{{ $t('fields.totalPaid') }}</p>
                  <p class="font-mono text-success font-bold">${{ formatCurrency(record.saleInvoice.paidAmount) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">{{ $t('fields.balanceDue') }}</p>
                  <p class="font-mono text-destructive font-black">${{ formatCurrency(Math.max(0, record.saleInvoice.totalPrice - record.saleInvoice.paidAmount)) }}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  </div>
</template>
