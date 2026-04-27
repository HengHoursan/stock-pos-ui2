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
import type { Product } from "@/types";
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
          <p class="text-muted-foreground text-sm uppercase">{{ product?.code }}</p>
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
      <!-- Image Section -->
      <Card class="lg:col-span-1 overflow-hidden h-fit">
        <CardHeader class="pb-3">
          <CardTitle class="text-lg">{{ $t("crud.image") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="aspect-square relative rounded-lg border bg-muted/50 flex items-center justify-center overflow-hidden">
            <img v-if="product.photoPath" :src="product.photoPath" :alt="product.name" class="h-full w-full object-cover" />
            <div v-else class="flex flex-col items-center gap-2 text-muted-foreground">
              <Package class="h-12 w-12 opacity-20" />
              <span class="text-xs">No image available</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Details Section -->
      <div class="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-lg">{{ $t("crud.generalInfo") }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Package class="mr-2 h-4 w-4" />{{ $t("fields.name") }}
                </div>
                <p class="font-medium text-base">{{ product.name }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Barcode class="mr-2 h-4 w-4" />{{ $t("fields.code") }}
                </div>
                <p class="font-medium text-base">{{ product.code || "N/A" }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Barcode class="mr-2 h-4 w-4" />{{ $t("fields.sku") }}
                </div>
                <p class="font-medium text-base">{{ product.skuCode || "N/A" }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Barcode class="mr-2 h-4 w-4" />{{ $t("fields.barcodeType") }}
                </div>
                <p class="font-medium text-base">{{ product.barcodeType }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Tag class="mr-2 h-4 w-4" />{{ $t("modules.category") }}
                </div>
                <p class="font-medium text-base">
                  <span v-if="product.category" class="text-primary hover:underline cursor-pointer" @click="router.push(`/admin/categories/${product.category.id}`)">
                    {{ product.category.name }}
                  </span>
                  <span v-else>{{ $t("crud.none") }}</span>
                </p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Bookmark class="mr-2 h-4 w-4" />{{ $t("modules.brand") }}
                </div>
                <p class="font-medium text-base">
                  <span v-if="product.brand" class="text-primary hover:underline cursor-pointer" @click="router.push(`/admin/brands/${product.brand.id}`)">
                    {{ product.brand.name }}
                  </span>
                  <span v-else>{{ $t("crud.none") }}</span>
                </p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Ruler class="mr-2 h-4 w-4" />{{ $t("modules.unit") }}
                </div>
                <p class="font-medium text-base">
                  <span v-if="product.unit" class="text-primary hover:underline cursor-pointer" @click="router.push(`/admin/units/${product.unit.id}`)">
                    {{ product.unit.name }}
                  </span>
                  <span v-else>{{ $t("crud.none") }}</span>
                </p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <DollarSign class="mr-2 h-4 w-4" />{{ $t("fields.salePrice") }}
                </div>
                <p class="font-medium text-base text-primary">{{ formatCurrency(product.detail?.salePrice || 0) }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <DollarSign class="mr-2 h-4 w-4" />{{ $t("fields.purchasePrice") }}
                </div>
                <p class="font-medium text-base">{{ formatCurrency(product.detail?.purchasePrice || 0) }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Box class="mr-2 h-4 w-4" />{{ $t("fields.currentStock") }}
                </div>
                <p class="font-medium text-base" :class="(product.detail?.currentStock || 0) <= product.alertQuantity ? 'text-destructive' : ''">
                  {{ product.detail?.currentStock || 0 }} 
                  <span class="text-xs text-muted-foreground ml-1">({{ product.detail?.stockNumber || 'NO-REF' }})</span>
                </p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <AlertTriangle class="mr-2 h-4 w-4" />Alert Quantity
                </div>
                <p class="font-medium text-base">{{ Math.trunc(product.alertQuantity || 0) }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Clock class="mr-2 h-4 w-4" />{{ $t("fields.expiryDate") }}
                </div>
                <p class="font-medium text-base">
                  {{ product.detail?.expiryDate ? new Date(product.detail.expiryDate).toLocaleDateString() : 'N/A' }} 
                  <span v-if="product.detail?.expiryType !== 'None'" class="text-xs text-muted-foreground ml-1">({{ formatExpiryType(product.detail?.expiryType) }})</span>
                </p>
              </div>
            </div>

            <div class="mt-6 pt-6 border-t">
              <h4 class="text-sm font-medium mb-4 text-muted-foreground">Settings</h4>
              <div class="flex flex-wrap gap-4">
                <div class="flex items-center gap-2">
                  <span class="text-xs">{{ $t("fields.manageStock") }}:</span>
                  <Badge :variant="product.manageStock ? 'success' : 'secondary'" class="text-[10px] h-5 px-2 uppercase shadow-sm">
                    {{ product.manageStock ? 'Yes' : 'No' }}
                  </Badge>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs">{{ $t("fields.forSelling") }}:</span>
                  <Badge :variant="product.forSelling ? 'success' : 'secondary'" class="text-[10px] h-5 px-2 uppercase shadow-sm">
                    {{ product.forSelling ? 'Yes' : 'No' }}
                  </Badge>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs">{{ $t("fields.isManufacture") }}:</span>
                  <Badge :variant="product.isManufacture ? 'success' : 'secondary'" class="text-[10px] h-5 px-2 uppercase shadow-sm">
                    {{ product.isManufacture ? 'Yes' : 'No' }}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-lg">{{ $t("crud.systemInfo") }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calendar class="mr-2 h-4 w-4" />{{ $t("fields.createdAt") }}
                </div>
                <p class="font-medium text-base">
                  {{ new Date(product.createdAt).toLocaleString() }}
                </p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calendar class="mr-2 h-4 w-4" />{{ $t("fields.updatedAt") }}
                </div>
                <p class="font-medium text-base">
                  {{ new Date(product.updatedAt).toLocaleString() }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
