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
import { ChevronLeft, FileText, Loader2, Package, Calendar, History, Users } from "lucide-vue-next";
import { PurchaseReturnService } from "@/services/purchase_return/purchase_return.service";
import type { PurchaseReturn } from "@/types";
import { InvoiceStatus } from "@/types/enums";
import { toast } from "vue-sonner";

const route = useRoute();
const router = useRouter();
const prService = new PurchaseReturnService();

const record = ref<PurchaseReturn | null>(null);
const loading = ref(true);

function getStatusBadge(rec: PurchaseReturn) {
  switch (Number(rec.status)) {
    case InvoiceStatus.DRAFT:
      return { variant: "secondary", label: t("fields.statusLabels.draft") };
    case InvoiceStatus.COMPLETED:
      return { variant: "success", label: t("fields.statusLabels.completed") };
    case InvoiceStatus.CANCELLED:
      return { variant: "destructive", label: t("fields.statusLabels.cancelled") };
    default:
      return { variant: "outline", label: t("crud.all") };
  }
}

async function fetchDetail() {
  const id = Number(route.params.id);
  if (!id) return router.back();

  loading.value = true;
  try {
    const response = await prService.getDetail(id);
    if (response.success && response.data) {
      record.value = response.data;
    } else {
      toast.error(t('crud.notFound', { module: t('modules.purchaseReturn') }));
      router.back();
    }
  } catch (error) {
    toast.error(t('crud.errorGeneral'));
  } finally {
    loading.value = false;
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
          <Badge v-if="record" :variant="getStatusBadge(record).variant as any" class="ml-2 font-medium uppercase">
            {{ getStatusBadge(record).label }}
          </Badge>
        </div>
      </div>
      <div>
        <Button v-if="record && record.status === InvoiceStatus.DRAFT" @click="router.push(`/admin/purchase-returns/${record.id}/edit`)" variant="outline">
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
        <Card class="shadow-sm border-muted-foreground/10 text-card-foreground">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <FileText class="h-5 w-5 text-primary" />
              {{ $t('crud.generalInfo') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-4 space-y-4 text-sm">
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Users class="h-3.5 w-3.5" />{{ $t('fields.supplierId') }}</p>
              <p class="font-medium">{{ record.supplier?.name || `ID: ${record.supplierId}` }}</p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Calendar class="h-3.5 w-3.5" />{{ $t('fields.date') }}</p>
              <p class="font-medium">{{ formatDateTime(record.returnDate) }}</p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1">{{ $t('fields.remarks') }}</p>
              <p class="font-medium text-sm italic">{{ record.description || '---' }}</p>
            </div>
          </CardContent>
        </Card>

        <Card class="shadow-sm border-primary/20 bg-primary/5">
          <CardHeader class="pb-3 border-b border-primary/10">
            <CardTitle class="text-lg flex items-center gap-2 text-primary">
              <History class="h-5 w-5" />
              {{ $t('fields.totalPrice') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="text-center">
              <span class="text-3xl font-mono font-black text-primary">${{ formatCurrency(record.totalPrice) }}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Detail Table -->
      <div class="lg:col-span-3 space-y-6">
        <Card class="shadow-sm border-muted-foreground/10 text-card-foreground">
          <CardHeader class="pb-3 border-b bg-muted/5">
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
                  <TableHead class="text-right">{{ $t('fields.quantity') }}</TableHead>
                  <TableHead class="text-right">{{ $t('fields.unitPrice') }}</TableHead>
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
                    <TableCell class="text-right font-medium">{{ item.quantity }}</TableCell>
                    <TableCell class="text-right font-mono">{{ formatCurrency(item.unitPrice) }}</TableCell>
                    <TableCell class="text-right font-mono font-semibold">{{ formatCurrency(item.totalPrice) }}</TableCell>
                  </TableRow>
                </template>
                <TableRow v-else>
                  <TableCell colspan="5" class="py-12 text-center text-muted-foreground italic">
                    {{ $t('common.noData') }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <!-- Summary Area -->
            <div class="flex justify-end p-6 border-t bg-muted/10">
              <div class="w-full max-w-sm space-y-3">
                <div class="flex justify-between items-center text-lg font-black pt-2 border-t border-primary/10">
                  <span class="text-foreground">{{ $t('fields.totalPrice') }}:</span>
                  <span class="text-primary font-mono">${{ formatCurrency(record.totalPrice) }}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  </div>
</template>
