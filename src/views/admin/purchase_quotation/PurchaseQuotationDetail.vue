<script setup lang="ts">
import { useAppI18n } from "@/hooks/useAppI18n";
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { formatDateTime, formatCurrency } from "@/utils/format";
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
import { ChevronLeft, FileText, Loader2, Package, Calendar, ArrowRightCircle } from "lucide-vue-next";
import { PurchaseQuotationService } from "@/services/purchase_quotation/purchase_quotation.service";
import type { PurchaseQuotation } from "@/types";
import { toast } from "vue-sonner";

const { t, labels, fields, crud, common, actions, group } = useAppI18n("purchaseQuotation");
const productLabels = group("product");
const route = useRoute();
const router = useRouter();
const pqService = new PurchaseQuotationService();

const record = ref<PurchaseQuotation | null>(null);
const loading = ref(true);

async function fetchDetail() {
  const id = Number(route.params.id);
  if (!id) return router.back();

  loading.value = true;
  try {
    const response = await pqService.getDetail(id);
    if (response.success && response.data) {
      record.value = response.data;
    } else {
      toast.error(t('crud.notFound', { module: labels.name }));
      router.back();
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || t('crud.errorGeneral'));
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
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" @click="router.back()">
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <div class="flex items-center gap-3">
          <h2 class="text-3xl font-bold tracking-tight">
            {{ record ? record.code : "..." }}
          </h2>
          <span class="text-sm text-muted-foreground mt-1">{{ labels.name }}</span>
        </div>
      </div>
      <div>
        <Button v-if="record" @click="router.push(`/admin/purchase-orders/create?quotationId=${record.id}`)" class="text-primary-foreground">
          {{ actions.generateOrder }} <ArrowRightCircle class="ml-2 h-4 w-4" />
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
              {{ crud.generalInfo }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-4 space-y-4 text-sm">
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Calendar class="h-3.5 w-3.5" />{{ fields.quotationDate }}</p>
              <p class="font-medium text-foreground">{{ formatDateTime(record.quotationDate) }}</p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1 flex items-center gap-1.5"><Package class="h-3.5 w-3.5" />{{ fields.totalLine }}</p>
              <p class="font-medium text-foreground">{{ Math.trunc(record.totalLine || 0) }}</p>
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
                  <TableHead>#</TableHead>
                  <TableHead>{{ productLabels.name }}</TableHead>
                  <TableHead class="text-right">{{ fields.price }}</TableHead>
                  <TableHead class="text-center">{{ fields.quantity }}</TableHead>
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
                    <TableCell class="text-center font-medium">{{ Math.trunc(item.quantity || 0) }}</TableCell>
                    <TableCell class="text-right font-semibold">{{ formatCurrency(item.totalPrice) }}</TableCell>
                  </TableRow>
                </template>
                <TableRow v-else>
                  <TableCell colspan="5" class="py-8 text-center text-muted-foreground italic">{{ common.noData }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div class="flex justify-end p-6 border-t bg-muted/10">
              <div class="w-full max-w-sm space-y-3">
                <div class="flex justify-between items-center text-lg font-bold">
                  <span>{{ fields.grandTotal }}:</span>
                  <span class="text-primary">{{ formatCurrency(record.totalPrice) }}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  </div>
</template>
