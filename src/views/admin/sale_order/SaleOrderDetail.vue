<script setup lang="ts">
import { useAppI18n } from "@/hooks/useAppI18n";
const { t, labels, fields, crud, actions, group } = useAppI18n("saleOrder");
const productLabels = group("product");
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
import { ChevronLeft, FileText, Loader2, Package, Calendar, Users, ArrowRightCircle, CheckCircle2, Clock } from "lucide-vue-next";
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
    case OrderStatus.PENDING: return { variant: 'warning', label: fields.statusLabels.pending };
    case OrderStatus.PARTIAL: return { variant: 'default', label: fields.statusLabels.partial };
    case OrderStatus.COMPLETED: return { variant: 'success', label: fields.statusLabels.completed };
    case OrderStatus.CANCELLED: return { variant: 'destructive', label: fields.statusLabels.cancelled };
    default: return { variant: 'outline', label: crud.all };
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
      toast.error(t('crud.notFound', { module: labels.name }));
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
        <Button v-if="record && record.status !== OrderStatus.COMPLETED && (record.totalLine - record.totalCloseLine > 0)" @click="router.push(`/admin/sale-invoices/create?orderId=${record.id}`)" class="text-primary-foreground">
          {{ actions.generateInvoice }} <ArrowRightCircle class="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center p-12">
      <Loader2 class="h-8 w-8 animate-spin text-primary opacity-50" />
    </div>

    <template v-else-if="record">
      <!-- Main Grid Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Side panel for attributes -->
      <div class="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader class="pb-3 border-b">
            <CardTitle class="text-lg flex items-center gap-2">
              <FileText class="h-5 w-5 text-primary" />
              {{ crud.generalInfo }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-4 space-y-4 text-sm">
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Users class="h-3.5 w-3.5" />{{ fields.customerId }}</p>
              <p class="font-medium text-foreground">{{ record.customer?.name || `ID: ${record.customerId}` }}</p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Calendar class="h-3.5 w-3.5" />{{ fields.orderDate }}</p>
              <p class="font-medium text-foreground">{{ formatDateTime(record.orderDate) }}</p>
            </div>
            <div class="flex gap-4">
              <div>
                <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Package class="h-3.5 w-3.5" />{{ fields.totalLine }}</p>
                <p class="font-medium text-foreground">{{ Math.trunc(record.totalLine || 0) }}</p>
              </div>
              <div>
                <p class="text-muted-foreground mb-1">{{ fields.totalCloseLine }}</p>
                <p class="font-medium text-foreground">{{ Math.trunc(record.totalCloseLine || 0) }}</p>
              </div>
            </div>
            <div>
              <p class="text-muted-foreground mb-1">{{ fields.description }}</p>
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
              {{ fields.details }}
            </CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            <Table>
              <TableHeader class="bg-muted/30">
                <TableRow>
                  <TableHead class="w-8">#</TableHead>
                  <TableHead>{{ productLabels.name }}</TableHead>
                  <TableHead class="text-right">{{ fields.sellingPrice }}</TableHead>
                  <TableHead class="text-center w-20">{{ fields.quantity }}</TableHead>
                  <TableHead class="w-52">{{ fields.fulfillment }}</TableHead>
                  <TableHead class="text-right">{{ fields.rowTotal }}</TableHead>
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
                    <TableCell class="text-right">{{ formatCurrency(item.totalPrice / item.quantity) }}</TableCell>
                    <TableCell class="text-center font-medium text-foreground">{{ Math.trunc(item.quantity || 0) }}</TableCell>
                    <TableCell class="py-3 pr-4">
                      <div class="flex flex-col gap-1.5">
                        <div class="flex items-center justify-between">
                          <span
                            v-if="Number(item.invoicedQuantity || 0) >= Number(item.quantity)"
                            class="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800"
                          >
                            <CheckCircle2 class="h-3 w-3" /> {{ fields.fullyFulfilled }}
                          </span>
                          <span
                            v-else
                            class="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800"
                          >
                            <Clock class="h-3 w-3" /> {{ Math.trunc(item.quantity - (item.invoicedQuantity || 0)) }} {{ fields.remaining }}
                          </span>
                          <span class="text-xs text-muted-foreground">{{ Math.trunc(item.invoicedQuantity || 0) }}/{{ Math.trunc(item.quantity || 0) }}</span>
                        </div>
                        <div class="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            class="h-full rounded-full transition-all duration-500"
                            :class="Number(item.invoicedQuantity || 0) >= Number(item.quantity) ? 'bg-emerald-500' : 'bg-primary'"
                            :style="{ width: Math.min(100, (Number(item.invoicedQuantity || 0) / Number(item.quantity || 1)) * 100) + '%' }"
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell class="text-right font-semibold">{{ formatCurrency(item.totalPrice) }}</TableCell>
                  </TableRow>
                </template>
                <TableRow v-else>
                  <TableCell colspan="5" class="py-8 text-center text-muted-foreground italic">{{ t('common.noData') }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div class="flex justify-between items-center px-5 py-4 border-t text-sm bg-muted/10">
              <span class="font-medium text-muted-foreground">{{ fields.grandTotal }}</span>
              <span class="text-lg font-bold text-primary">{{ formatCurrency(record.totalPrice) }}</span>
            </div>
          </CardContent>
        </Card>


      </div>

    </div>
  </template>
</div>
</template>
