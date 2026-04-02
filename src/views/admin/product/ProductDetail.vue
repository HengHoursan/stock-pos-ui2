<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  Pencil, 
  Trash2, 
  Loader2, 
  Package, 
  Calendar, 
  Barcode, 
  Tag, 
  Bookmark, 
  Ruler, 
  DollarSign, 
  Box, 
  AlertTriangle, 
  ShieldCheck, 
  Clock 
} from "lucide-vue-next";
import { ProductService } from "@/services/product/product.service";
import type { Product } from "@/types/product";
import { toast } from "vue-sonner";

const router = useRouter();
const route = useRoute();
const productService = new ProductService();

const productId = Number(route.params.id);
const product = ref<Product | null>(null);
const loading = ref(true);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatExpiryType = (type: string | undefined | null) => {
  if (!type || type === 'None') return t('fields.expiryTypes.none');
  if (type === 'Best Before') return t('fields.expiryTypes.bestBefore');
  if (type === 'Expiry') return t('fields.expiryTypes.expiry');
  return type;
};

async function fetchProduct() {
  loading.value = true;
  try {
    const response = await productService.getDetail(productId);
    if (response.success && response.data) {
      product.value = response.data;
    } else {
      toast.error(t('crud.notFound', { module: t('modules.product') }));
      router.push("/admin/products");
    }
  } catch (error) {
    toast.error(t('crud.errorFetch', { module: t('modules.product') }));
  } finally {
    loading.value = false;
  }
}

async function deleteProduct() {
  if (!confirm("Are you sure you want to delete this product?")) return;
  try {
    const response = await productService.softDelete(productId);
    if (response.success) {
      toast.success(t('crud.successDelete', { module: t('modules.product') }));
      router.push("/admin/products");
    }
  } catch (error) {
    toast.error(t('crud.errorDelete', { module: t('modules.product') }));
  }
}

onMounted(() => {
  fetchProduct();
});
</script>

<template>
  <div class="space-y-6 pb-10">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" @click="router.back()" class="h-10 w-10">
          <ChevronLeft class="h-5 w-5" />
        </Button>
        <div class="flex flex-col">
          <div class="flex items-center gap-3">
            <h2 class="text-3xl font-bold tracking-tight">{{ product?.name || 'Product Details' }}</h2>
            <Badge v-if="product" :variant="product.status ? 'success' : 'warning'" class="text-[10px] h-5 px-2 uppercase font-bold shadow-sm self-center mt-1">
              {{ product.status ? "Active" : "Inactive" }}
            </Badge>
          </div>
          <p class="text-muted-foreground text-sm font-mono uppercase">{{ product?.code }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="router.push(`/admin/products/${productId}/edit`)" class="flex-1 md:flex-none">
          <Pencil class="mr-2 h-4 w-4" />{{ $t('crud.editBtn') }}</Button>
        <Button variant="destructive" @click="deleteProduct" class="flex-1 md:flex-none">
          <Trash2 class="mr-2 h-4 w-4" />{{ $t('crud.delete') }}</Button>
      </div>
    </div>

    <Card v-if="loading" class="flex items-center justify-center min-h-[500px]">
      <Loader2 class="h-10 w-10 animate-spin text-primary" />
    </Card>

    <div v-else-if="product" class="grid gap-6 grid-cols-1 lg:grid-cols-3">
      <!-- Left Column: Image & Quick Stats -->
      <div class="lg:col-span-1 space-y-6">
        <Card class="overflow-hidden shadow-md">
          <CardHeader class="pb-3 border-b bg-muted/20">
            <CardTitle class="text-lg flex items-center gap-2 uppercase tracking-tight font-bold">
              <Package class="h-4 w-4 text-primary" />
              {{ $t('crud.image') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="aspect-square relative rounded-xl border-2 border-dashed bg-muted/30 flex items-center justify-center overflow-hidden transition-all hover:bg-muted/50">
              <img v-if="product.photoPath" :src="product.photoPath" :alt="product.name" class="h-full w-full object-cover" />
              <div v-else class="flex flex-col items-center gap-3 text-muted-foreground/40">
                <Package class="h-20 w-20 opacity-10" />
                <span class="text-xs font-semibold uppercase tracking-widest">No Image</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card class="shadow-md">
          <CardHeader class="pb-3 border-b bg-muted/20">
            <CardTitle class="text-lg flex items-center gap-2 uppercase tracking-tight font-bold text-primary">
              <DollarSign class="h-4 w-4" />
              {{ $t('fields.salePrice') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="text-4xl font-extrabold text-primary tracking-tighter">
              {{ formatCurrency(product.detail?.salePrice || 0) }}
            </div>
            <div class="mt-2 flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
              <span>{{ $t('fields.purchasePrice') }}</span>
              <span class="font-mono font-bold">{{ formatCurrency(product.detail?.purchasePrice || 0) }}</span>
            </div>
          </CardContent>
        </Card>

        <Card class="shadow-md">
          <CardHeader class="pb-3 border-b bg-muted/20">
            <CardTitle class="text-lg flex items-center gap-2 uppercase tracking-tight font-bold">
              <Box class="h-4 w-4 text-primary" />
              {{ $t('fields.currentStock') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="flex items-end justify-between">
               <div class="text-4xl font-extrabold tracking-tighter" :class="(product.detail?.currentStock || 0) <= product.alertQuantity ? 'text-destructive' : 'text-foreground'">
                {{ product.detail?.currentStock || 0 }}
                <span class="text-sm font-medium text-muted-foreground ml-1">{{ product.unit?.name }}</span>
              </div>
              <Badge variant="outline" class="mb-1 font-mono text-[10px]">
                {{ product.detail?.stockNumber || 'NO-REF' }}
              </Badge>
            </div>
            <div class="mt-4 flex items-center gap-2 text-xs font-medium bg-red-50 text-red-700 p-2 rounded-md" v-if="(product.detail?.currentStock || 0) <= product.alertQuantity">
               <AlertTriangle class="h-3 w-3" />
               Stock Below Alert Quantity ({{ product.alertQuantity }})
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Right Column: Full Details -->
      <div class="lg:col-span-2 space-y-6">
        <Card class="shadow-md">
          <CardHeader class="pb-3 border-b bg-muted/20">
            <CardTitle class="text-lg flex items-center gap-2 uppercase tracking-tight font-bold">
              <AlignLeft class="h-4 w-4 text-primary" />
              {{ $t('crud.generalInfo') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div class="space-y-1">
                <div class="flex items-center text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <Barcode class="mr-2 h-3.5 w-3.5" />{{ $t('fields.code') }}</div>
                <p class="font-mono text-base font-bold">{{ product.code }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <Barcode class="mr-2 h-3.5 w-3.5" />{{ $t('fields.sku') }}</div>
                <p class="font-mono text-base font-bold">{{ product.skuCode || 'N/A' }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <Barcode class="mr-2 h-3.5 w-3.5" />{{ $t('fields.barcodeType') }}</div>
                <p class="font-medium text-base">{{ product.barcodeType }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <Tag class="mr-2 h-3.5 w-3.5" />{{ $t('modules.category') }}</div>
                <p class="font-medium text-base text-primary">{{ product.category?.name || 'N/A' }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <Bookmark class="mr-2 h-3.5 w-3.5" />{{ $t('modules.brand') }}</div>
                <p class="font-medium text-base text-primary">{{ product.brand?.name || 'N/A' }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <Ruler class="mr-2 h-3.5 w-3.5" />{{ $t('modules.unit') }}</div>
                <p class="font-medium text-base text-primary">{{ product.unit?.name || 'N/A' }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card class="shadow-md">
           <CardHeader class="pb-3 border-b bg-muted/20">
            <CardTitle class="text-lg flex items-center gap-2 uppercase tracking-tight font-bold">
              <ShieldCheck class="h-4 w-4 text-primary" />
              Settings & Configuration
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
               <div class="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/20 border border-dashed text-center gap-2">
                 <span class="text-[10px] uppercase font-bold text-muted-foreground">{{ $t('fields.status') }}</span>
                 <Badge :variant="product.status ? 'success' : 'warning'" class="h-5 px-3">{{ product.status ? 'Active' : 'Inactive' }}</Badge>
               </div>
               <div class="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/20 border border-dashed text-center gap-2">
                 <span class="text-[10px] uppercase font-bold text-muted-foreground">{{ $t('fields.manageStock') }}</span>
                 <Badge :variant="product.manageStock ? 'default' : 'secondary'" class="h-5 px-3">{{ product.manageStock ? 'YES' : 'NO' }}</Badge>
               </div>
               <div class="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/20 border border-dashed text-center gap-2">
                 <span class="text-[10px] uppercase font-bold text-muted-foreground">{{ $t('fields.forSelling') }}</span>
                 <Badge :variant="product.forSelling ? 'default' : 'secondary'" class="h-5 px-3">{{ product.forSelling ? 'YES' : 'NO' }}</Badge>
               </div>
               <div class="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/20 border border-dashed text-center gap-2">
                 <span class="text-[10px] uppercase font-bold text-muted-foreground">{{ $t('fields.isManufacture') }}</span>
                 <Badge :variant="product.isManufacture ? 'outline' : 'secondary'" class="h-5 px-3">{{ product.isManufacture ? 'YES' : 'NO' }}</Badge>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card v-if="product.detail?.expiryDate || product.detail?.expiryType !== 'None'" class="shadow-md border-orange-100 bg-orange-50/10">
           <CardHeader class="pb-3 border-b border-orange-100 bg-orange-50/30">
            <CardTitle class="text-lg flex items-center gap-2 uppercase tracking-tight font-bold text-orange-700">
              <Clock class="h-4 w-4" />
              {{ $t('fields.expiryDate') }} Information
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div class="space-y-1">
                <div class="flex items-center text-xs text-orange-600/70 font-bold uppercase tracking-wider">
                  <Calendar class="mr-2 h-3.5 w-3.5" />{{ $t('fields.expiryDate') }}</div>
                <p class="font-bold text-lg text-orange-950">{{ product.detail?.expiryDate ? new Date(product.detail.expiryDate).toLocaleDateString() : 'N/A' }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-xs text-orange-600/70 font-bold uppercase tracking-wider">
                  <Tag class="mr-2 h-3.5 w-3.5" />{{ $t('fields.expiryType') }}</div>
                <p class="font-bold text-lg text-orange-950">{{ formatExpiryType(product.detail?.expiryType) }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card class="shadow-md">
          <CardHeader class="pb-3 border-b bg-muted/20">
            <CardTitle class="text-lg flex items-center gap-2 uppercase tracking-tight font-bold">
              <Calendar class="h-4 w-4 text-primary" />
              {{ $t('crud.systemInfo') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-1">
                <div class="flex items-center text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <Calendar class="mr-2 h-3.5 w-3.5" />{{ $t('fields.createdAt') }}</div>
                <p class="font-medium text-sm">{{ new Date(product.createdAt).toLocaleString() }}</p>
              </div>
              
              <div class="space-y-1">
                <div class="flex items-center text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <Calendar class="mr-2 h-3.5 w-3.5" />{{ $t('fields.updatedAt') }}</div>
                <p class="font-medium text-sm">{{ new Date(product.updatedAt).toLocaleString() }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
