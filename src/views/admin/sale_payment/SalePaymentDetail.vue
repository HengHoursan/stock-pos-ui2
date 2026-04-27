<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { formatDateTime, formatCurrency } from "@/utils/format";
import CurrencyToggle from "@/components/CurrencyToggle.vue";
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
      <div class="flex items-center gap-2">
        <CurrencyToggle />
        <Button v-if="record" @click="router.push(`/admin/sale-payments/${record.id}/edit`)" variant="outline">
          {{ $t('crud.editBtn') }}
        </Button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center p-12">
      <Loader2 class="h-8 w-8 animate-spin text-primary opacity-50" />
    </div>

    <div v-else-if="record" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- General Info -->
      <div class="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader class="pb-3 border-b">
            <CardTitle class="text-lg flex items-center gap-2">
              <FileText class="h-5 w-5 text-primary" />
              {{ $t('crud.generalInfo') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-4 space-y-4 text-sm">
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Receipt class="h-3.5 w-3.5" />{{ $t('modules.saleInvoices') }}</p>
              <div class="flex flex-wrap gap-1">
                <Badge v-for="d in record.details" :key="d.id" variant="secondary" class="text-[10px] cursor-pointer hover:bg-muted transition-colors" @click="router.push(`/admin/sale-invoices/${d.saleInvoiceId}`)">
                  {{ d.saleInvoice?.code || `ID: ${d.saleInvoiceId}` }}
                </Badge>
              </div>
            </div>
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Calendar class="h-3.5 w-3.5" />{{ $t('fields.transactionDate') }}</p>
              <p class="font-medium text-foreground">{{ formatDateTime(record.paymentDate) }}</p>
            </div>
          </CardContent>
        </Card>

        <!-- Amount Card -->
        <Card>
          <CardHeader class="pb-3 border-b">
            <CardTitle class="text-lg flex items-center gap-2 text-success">
              <Banknote class="h-5 w-5" />
              {{ $t('fields.paidAmount') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="text-center">
               <span class="text-3xl font-black text-success">{{ formatCurrency(record.paidAmount) }}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Extended Details -->
      <div class="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader class="pb-3 border-b">
            <CardTitle class="text-lg flex items-center gap-2">
              <History class="h-5 w-5 text-primary" />
              {{ $t('fields.paymentDetails') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 space-y-6">
            <div class="grid grid-cols-1 gap-6">
              <div>
                <h4 class="text-xs font-bold uppercase text-muted-foreground mb-2">{{ $t('fields.description') }}</h4>
                <p class="text-muted-foreground whitespace-pre-wrap">{{ record.description || '---' }}</p>
              </div>
            </div>

            <!-- Invoice Context -->
            <div v-if="record.details && record.details.length > 0" class="mt-8">
              <h4 class="text-sm font-bold flex items-center gap-2 mb-4">
                <Receipt class="h-4 w-4 text-primary" />
                {{ $t('fields.associatedInvoices') }}
              </h4>
              <div class="rounded-md border overflow-hidden">
                <table class="w-full text-xs">
                  <thead class="bg-muted text-muted-foreground">
                    <tr>
                      <th class="px-4 py-2 text-left font-medium">{{ $t('fields.code') }}</th>
                      <th class="px-4 py-2 text-left font-medium">{{ $t('modules.product') }}</th>
                      <th class="px-4 py-2 text-right font-medium">{{ $t('fields.totalPrice') }}</th>
                      <th class="px-4 py-2 text-right font-medium">{{ $t('fields.paidAmount') }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    <tr v-for="d in record.details" :key="d.id" class="hover:bg-muted/50 transition-colors">
                      <td class="px-4 py-2 text-primary cursor-pointer hover:underline" @click="router.push(`/admin/sale-invoices/${d.saleInvoiceId}`)">
                        {{ d.saleInvoice?.code || `ID: ${d.saleInvoiceId}` }}
                      </td>
                      <td class="px-4 py-2">
                        <div class="flex flex-wrap gap-1.5" v-if="d.saleInvoice?.details?.length">
                          <Badge v-for="invDetail in d.saleInvoice.details" :key="invDetail.id" variant="secondary" class="font-medium text-xs py-0.5 px-2 border border-border/50 shadow-sm">
                            {{ invDetail.product?.name || 'Unknown' }} 
                            <span class="text-muted-foreground ml-1.5 border-l pl-1.5 border-muted-foreground/30">x{{ invDetail.quantity }}</span>
                          </Badge>
                        </div>
                        <span v-else class="text-muted-foreground text-xs">---</span>
                      </td>
                      <td class="px-4 py-2 text-right">{{ formatCurrency(d.saleInvoice?.totalPrice) }}</td>
                      <td class="px-4 py-2 text-right text-success font-bold">{{ formatCurrency(d.paidAmount) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  </div>
</template>
