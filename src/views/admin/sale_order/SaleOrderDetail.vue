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
import { ChevronLeft, FileText, Loader2, Package, Calendar, Users, ArrowRightCircle } from "lucide-vue-next";
import { SaleOrderService } from "@/services/sale_order/sale_order.service";
import type { SaleOrder } from "@/types";
import { OrderStatus } from "@/types/enums";
import { toast } from "vue-sonner";

const route = useRoute();
const router = useRouter();
const soService = new SaleOrderService();

const record = ref<SaleOrder | null>(null);
const loading = ref(true);

function getStatusBadge(status: OrderStatus) {
  switch(Number(status)) {
    case OrderStatus.PENDING: return { variant: 'warning', label: t('fields.statusLabels.pending') };
    case OrderStatus.PARTIAL: return { variant: 'default', label: t('fields.statusLabels.partial') };
    case OrderStatus.COMPLETED: return { variant: 'success', label: t('fields.statusLabels.completed') };
    default: return { variant: 'outline', label: t('crud.all') };
  }
}

async function fetchDetail() {
  const id = Number(route.params.id);
  if (!id) return router.back();

  loading.value = true;
  try {
    const response = await soService.getDetail(id);
    if (response.success && response.data) {
      record.value = response.data;
    } else {
      toast.error(t('crud.notFound', { module: t('modules.saleOrder') }));
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
          <Badge v-if="record" :variant="getStatusBadge(record.status).variant as any" class="ml-2 font-medium">
            {{ getStatusBadge(record.status).label }}
          </Badge>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <CurrencyToggle />
        <Button v-if="record && record.status !== OrderStatus.COMPLETED" @click="router.push(`/admin/sale-invoices/create?orderId=${record.id}`)" class="text-primary-foreground">
          {{ $t('actions.generateInvoice') }} <ArrowRightCircle class="ml-2 h-4 w-4" />
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
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Calendar class="h-3.5 w-3.5" />{{ $t('fields.orderDate') }}</p>
              <p class="font-medium text-foreground">{{ formatDateTime(record.orderDate) }}</p>
            </div>
            <div class="flex gap-4">
              <div>
                <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Package class="h-3.5 w-3.5" />{{ $t('fields.totalLine') }}</p>
                <p class="font-medium text-foreground">{{ Math.trunc(record.totalLine || 0) }}</p>
              </div>
              <div>
                <p class="text-muted-foreground mb-1">{{ $t('fields.totalCloseLine') }}</p>
                <p class="font-medium text-foreground">{{ Math.trunc(record.totalCloseLine || 0) }}</p>
              </div>
            </div>
            <div>
              <p class="text-muted-foreground mb-1">{{ $t('fields.description') }}</p>
              <p class="font-medium text-foreground text-sm italic">{{ record.description || '---' }}</p>
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
