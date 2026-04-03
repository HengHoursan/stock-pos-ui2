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
  Truck,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Settings,
  AlignLeft,
} from "lucide-vue-next";
import { SupplierService } from "@/services/supplier/supplier.service";
import type { Supplier } from "@/types";
import { CustomerType } from "@/types";
import { toast } from "vue-sonner";

const router = useRouter();
const route = useRoute();
const supplierService = new SupplierService();

const supplierId = Number(route.params.id);
const supplier = ref<Supplier | null>(null);
const loading = ref(true);

async function fetchSupplier() {
  loading.value = true;
  try {
    const response = await supplierService.getDetail(supplierId);
    if (response.success && response.data) {
      supplier.value = response.data;
    } else {
      toast.error(t("crud.notFound", { module: t("modules.supplier") }));
      router.push("/admin/suppliers");
    }
  } catch (error) {
    toast.error(t("crud.errorFetch", { module: t("modules.supplier") }));
  } finally {
    loading.value = false;
  }
}

async function deleteSupplier() {
  if (!confirm(t("crud.confirmDelete"))) return;
  try {
    const response = await supplierService.softDelete(supplierId);
    if (response.success) {
      toast.success(t("crud.successDelete", { module: t("modules.supplier") }));
      router.push("/admin/suppliers");
    }
  } catch (error) {
    toast.error(t("crud.errorDelete", { module: t("modules.supplier") }));
  }
}

function getTypeLabel(type: CustomerType) {
  return type === CustomerType.DINE_IN ? t('fields.dineIn') : t('fields.dineOut');
}

onMounted(() => {
  fetchSupplier();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" @click="router.back()" class="h-10 w-10">
          <ChevronLeft class="h-5 w-5" />
        </Button>
        <div class="flex items-center gap-3">
          <h2 class="text-3xl font-bold tracking-tight">
            {{ supplier?.name || $t("crud.detail", { module: $t("modules.supplier") }) }}
          </h2>
          <Badge
            v-if="supplier"
            :variant="supplier.status ? 'success' : 'warning'"
            class="text-[10px] h-5 px-2 uppercase font-bold shadow-sm self-center mt-1"
          >
            {{ supplier.status ? $t("crud.active") : $t("crud.inactive") }}
          </Badge>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="router.push(`/admin/suppliers/${supplierId}/edit`)" class="flex-1 md:flex-none">
          <Pencil class="mr-2 h-4 w-4" />{{ $t("crud.editBtn") }}
        </Button>
        <Button variant="destructive" @click="deleteSupplier" class="flex-1 md:flex-none">
          <Trash2 class="mr-2 h-4 w-4" />{{ $t("crud.delete") }}
        </Button>
      </div>
    </div>

    <Card v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </Card>

    <div v-else-if="supplier" class="grid gap-6 grid-cols-1 lg:grid-cols-3">
      <!-- Info Summary Card -->
      <Card class="lg:col-span-1 overflow-hidden h-fit border-primary/10 shadow-sm">
        <CardHeader class="pb-3 bg-primary/5 border-b">
          <CardTitle class="text-lg flex items-center gap-2">
             <Truck class="h-5 w-5 text-primary" />
             {{ $t("crud.generalInfo") }}
          </CardTitle>
        </CardHeader>
        <CardContent class="pt-6 text-center space-y-4">
           <div class="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center text-muted-foreground border-2 border-primary/10 shadow-inner">
             <Truck class="h-12 w-12 opacity-40" />
           </div>
           <div>
             <h3 class="text-xl font-bold">{{ supplier.name }}</h3>
             <p class="text-sm text-muted-foreground font-mono">{{ supplier.code }}</p>
           </div>
           <div class="pt-4 border-t space-y-3 text-left">
             <div class="flex items-center gap-3 text-sm">
               <Settings class="h-4 w-4 text-primary opacity-70" />
               <span class="font-medium">{{ $t("fields.type") }}:</span>
               <Badge variant="outline" class="ml-auto">{{ getTypeLabel(supplier.type) }}</Badge>
             </div>
             <div class="flex items-center gap-3 text-sm">
               <User class="h-4 w-4 text-primary opacity-70" />
               <span class="font-medium">{{ $t("fields.nameLatin") }}:</span>
               <span class="ml-auto text-muted-foreground">{{ supplier.nameLatin || "-" }}</span>
             </div>
           </div>
        </CardContent>
      </Card>

      <!-- Details Sections -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Contact Information -->
        <Card class="shadow-sm border-muted-foreground/10">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <Phone class="h-5 w-5 text-primary" />
              {{ $t("fields.phoneNumber") }} & {{ $t("auth.email") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Mail class="mr-2 h-4 w-4" />{{ $t("auth.email") }}
                </div>
                <p class="font-medium text-base">{{ supplier.email || "-" }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Phone class="mr-2 h-4 w-4" />{{ $t("fields.phoneNumber") }}
                </div>
                <p class="font-medium text-base font-mono">{{ supplier.phoneNumber || "-" }}</p>
              </div>

              <div class="sm:col-span-2 space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <MapPin class="mr-2 h-4 w-4" />{{ $t("fields.address") }}
                </div>
                <p class="text-sm leading-relaxed bg-muted/20 p-3 rounded-md border italic">
                  {{ supplier.address || "-" }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Description & System Info -->
        <Card class="shadow-sm border-muted-foreground/10">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <AlignLeft class="h-5 w-5 text-primary" />
              {{ $t("fields.description") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <p class="text-sm leading-relaxed text-foreground/80 bg-muted/10 p-4 rounded-md border min-h-[80px]">
              {{ supplier.description || "-" }}
            </p>

            <div class="mt-6 pt-6 border-t grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calendar class="mr-2 h-4 w-4" />{{ $t("fields.createdAt") }}
                </div>
                <p class="font-medium text-sm">
                  {{ new Date(supplier.createdAt).toLocaleString() }}
                </p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calendar class="mr-2 h-4 w-4" />{{ $t("fields.updatedAt") }}
                </div>
                <p class="font-medium text-sm">
                  {{ new Date(supplier.updatedAt).toLocaleString() }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
