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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, FileText, Loader2, Package, Calendar, Users, CreditCard, Ban } from "lucide-vue-next";
import { SaleInvoiceService } from "@/services/sale_invoice/sale_invoice.service";
import type { SaleInvoice } from "@/types";
import { InvoiceStatus } from "@/types/enums";
import { toast } from "vue-sonner";

const route = useRoute();
const router = useRouter();
const siService = new SaleInvoiceService();

const record = ref<SaleInvoice | null>(null);
const loading = ref(true);

function getStatusBadge(rec: SaleInvoice) {
  if (rec.isCancel) return { variant: 'destructive', label: t('fields.statusLabels.cancelled') };
  switch(Number(rec.status)) {
    case InvoiceStatus.DRAFT: return { variant: 'secondary', label: t('fields.statusLabels.draft') };
    case InvoiceStatus.COMPLETED: return { variant: 'success', label: t('fields.statusLabels.completed') };
    default: return { variant: 'outline', label: t('crud.all') };
  }
}


async function fetchDetail() {
  const id = Number(route.params.id);
  if (!id) return router.back();

  loading.value = true;
  try {
    const response = await siService.getDetail(id);
    if (response.success && response.data) {
      record.value = response.data;
    } else {
      toast.error(t('crud.notFound', { module: t('modules.saleInvoice') }));
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
          <Badge v-if="record" :variant="getStatusBadge(record).variant as any" class="ml-2 font-medium">
            <Ban v-if="record.isCancel" class="w-3 h-3 mr-1 inline-block" />
            {{ getStatusBadge(record).label }}
          </Badge>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <CurrencyToggle />
        <Button v-if="record && !record.isCancel" variant="outline" class="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20">
          <Ban class="h-4 w-4 mr-2" /> {{ $t('actions.cancelInvoice') }}
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
              {{ $t('crud.generalInfo') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-4 space-y-4 text-sm">
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Users class="h-3.5 w-3.5" />{{ $t('fields.customerId') }}</p>
              <p class="font-medium text-foreground">{{ record.customer?.name || `ID: ${record.customerId}` }}</p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Calendar class="h-3.5 w-3.5" />{{ $t('fields.invoiceDate') }}</p>
              <p class="font-medium text-foreground">{{ formatDateTime(record.invoiceDate) }}</p>
            </div>
            <div class="flex gap-4">
              <div>
                <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Package class="h-3.5 w-3.5" />{{ $t('fields.totalLine') }}</p>
                <p class="font-medium text-foreground">{{ Math.trunc(record.totalLine || 0) }}</p>
              </div>
            </div>
            <div>
              <p class="text-muted-foreground mb-1">{{ $t('fields.description') }}</p>
              <p class="font-medium text-foreground text-sm italic">{{ record.description || '---' }}</p>
            </div>
          </CardContent>
        </Card>

        <!-- Payment Info sidebar -->
        <Card>
          <CardHeader class="pb-3 border-b">
            <CardTitle class="text-lg flex items-center gap-2">
              <CreditCard class="h-5 w-5 text-primary" />
              {{ $t('fields.paymentDetails') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-4 space-y-4 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">{{ $t('fields.totalPrice') }}:</span>
              <span class="font-mono font-medium">{{ formatCurrency(record.totalPrice) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">{{ $t('fields.paidAmount') }}:</span>
              <span class="font-mono font-medium text-success">{{ formatCurrency(record.paidAmount) }}</span>
            </div>
            <div class="py-2 border-t flex justify-between">
              <span class="text-muted-foreground">{{ $t('fields.balanceDue') }}:</span>
              <span class="font-mono font-bold" :class="(record.totalPrice - record.paidAmount) > 0 ? 'text-destructive' : 'text-success'">
                {{ formatCurrency(Math.max(0, record.totalPrice - record.paidAmount)) }}
              </span>
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
              {{ $t('fields.details') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            <Table>
              <TableHeader class="bg-muted/30">
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{{ $t('modules.product') }}</TableHead>
                  <TableHead class="text-right">{{ $t('fields.sellingPrice') }}</TableHead>
                  <TableHead class="text-center">{{ $t('fields.quantity') }}</TableHead>
                  <TableHead class="text-right">{{ $t('fields.rowTotal') }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-if="record.details && record.details.length > 0">
                  <TableRow v-for="(item, idx) in record.details" :key="item.id">
                    <TableCell class="font-medium text-muted-foreground">{{ idx + 1 }}</TableCell>
                    <TableCell class="font-medium">
                      {{ item.product?.name || `Product ID ${item.productId}` }}
                      <div v-if="item.product?.code" class="text-xs text-muted-foreground mt-0.5">{{ item.product.code }}</div>
                      <div v-if="item.saleOrderId" class="text-xs text-primary/70 mt-0.5" title="Source Order">
                        {{ $t('fields.fromOrder') }} #{{ item.saleOrderId }}
                      </div>
                    </TableCell>
                    <TableCell class="text-right font-mono">{{ formatCurrency(item.totalPrice / item.quantity) }}</TableCell>
                    <TableCell class="text-center font-medium">{{ Math.trunc(item.quantity || 0) }}</TableCell>
                    <TableCell class="text-right font-mono font-semibold">{{ formatCurrency(item.totalPrice) }}</TableCell>
                  </TableRow>
                </template>
                <TableRow v-else>
                  <TableCell colspan="5" class="py-8 text-center text-muted-foreground italic">{{ $t('common.noData') }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div class="flex justify-end p-6 border-t bg-muted/10">
              <div class="w-full max-w-sm space-y-3">
                <div class="flex justify-between items-center text-lg font-bold">
                  <span>{{ $t('fields.grandTotal') }}:</span>
                  <span class="text-primary font-mono">{{ formatCurrency(record.totalPrice) }}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  </div>
</template>
