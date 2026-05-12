<script setup lang="ts">
import { useAppI18n } from "@/hooks/useAppI18n";
const { t, labels, fields, crud } = useAppI18n("unit");
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { formatDateTime } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Pencil, Trash2, Loader2, Ruler, Calendar, Globe, AlignLeft, Barcode, Folder, Calculator, Coins, Type } from "lucide-vue-next";
import { UnitService } from "@/services/unit/unit.service";
import type { Unit } from "@/types";
import { toast } from "vue-sonner";


const router = useRouter();
const route = useRoute();
const unitService = new UnitService();

const unitId = Number(route.params.id);
const unit = ref<Unit | null>(null);
const parentUnit = ref<Unit | null>(null);
const loading = ref(true);

async function fetchUnit() {
  loading.value = true;
  try {
    const response = await unitService.getDetail(unitId);
    if (response.success && response.data) {
      unit.value = response.data;
      
      if (unit.value.parentId) {
        const parentResponse = await unitService.getDetail(unit.value.parentId);
        if (parentResponse.success) {
          parentUnit.value = parentResponse.data;
        }
      }
    } else {
      toast.error(t('crud.notFound', { module: labels.name }));
      router.push("/admin/units");
    }
  } catch (error) {
    toast.error(t('crud.errorFetch', { module: labels.name }));
  } finally {
    loading.value = false;
  }
}

async function deleteUnit() {
  if (!confirm("Are you sure you want to delete this unit?")) return;
  try {
    const response = await unitService.softDelete(unitId);
    if (response.success) {
      toast.success(t('crud.successDelete', { module: labels.name }));
      router.push("/admin/units");
    }
  } catch (error) {
    toast.error(t('crud.errorDelete', { module: labels.name }));
  }
}

onMounted(() => {
  fetchUnit();
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
          <h2 class="text-3xl font-bold tracking-tight">{{ unit?.name || 'Unit Details' }}</h2>
          <Badge v-if="unit" :variant="unit.status ? 'success' : 'warning'" class="text-[10px] h-5 px-2 uppercase font-bold shadow-sm self-center mt-1">
            {{ unit.status ? "Active" : "Inactive" }}
          </Badge>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="router.push(`/admin/units/${unitId}/edit`)" class="flex-1 md:flex-none">
          <Pencil class="mr-2 h-4 w-4" />{{ crud.editBtn }}</Button>
        <Button variant="destructive" @click="deleteUnit" class="flex-1 md:flex-none">
          <Trash2 class="mr-2 h-4 w-4" />{{ crud.delete }}</Button>
      </div>
    </div>

    <Card v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </Card>

    <div v-else-if="unit" class="grid gap-6 grid-cols-1 lg:grid-cols-3">
      <!-- Image Section -->
      <Card class="lg:col-span-1 overflow-hidden h-fit">
        <CardHeader class="pb-3">
          <CardTitle class="text-lg">{{ crud.image }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="aspect-square relative rounded-lg border bg-muted/50 flex items-center justify-center overflow-hidden">
            <div class="flex flex-col items-center gap-2 text-muted-foreground">
              <Type class="h-12 w-12 opacity-20" />
              <span class="text-xs">No image available</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Details Section -->
      <div class="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-lg">{{ crud.generalInfo }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Type class="mr-2 h-4 w-4" />{{ fields.name }}</div>
                <p class="font-medium text-base">{{ unit.name }}</p>
              </div>
              
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Barcode class="mr-2 h-4 w-4" />{{ fields.code }}</div>
                <p class="font-medium text-base">{{ unit.code || 'N/A' }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Globe class="mr-2 h-4 w-4" />{{ fields.slug }}</div>
                <p class="font-medium text-base">{{ unit.slug }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Ruler class="mr-2 h-4 w-4" />{{ fields.symbol }}</div>
                <p class="font-medium text-base">{{ unit.symbol || 'N/A' }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calculator class="mr-2 h-4 w-4" />{{ fields.conversionFactor }}</div>
                <p class="font-medium text-base">{{ unit.conversionFactor || 1 }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Coins class="mr-2 h-4 w-4" />{{ fields.defaultPrice }}</div>
                <p class="font-medium text-base">{{ unit.defaultPrice || 0 }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Folder class="mr-2 h-4 w-4" />{{ t('fields.parentOf', { module: labels.name }) }}</div>
                <p class="font-medium text-base">
                  <template v-if="parentUnit">
                    <router-link :to="`/admin/units/${parentUnit.id}`" class="text-primary hover:underline inline-flex items-center">
                      {{ parentUnit.name }}
                    </router-link>
                  </template>
                  <template v-else>None (Base Unit)</template>
                </p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <AlignLeft class="mr-2 h-4 w-4" />{{ fields.isCalculateDetail }}</div>
                <div class="mt-1">
                  <Badge :variant="unit.isCalculateDetail ? 'success' : 'secondary'" class="text-[10px] h-5 px-2 uppercase font-bold shadow-sm">
                    {{ unit.isCalculateDetail ? "Yes" : "No" }}
                  </Badge>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-lg">{{ crud.systemInfo }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calendar class="mr-2 h-4 w-4" />{{ fields.createdAt }}</div>
                <p class="font-medium text-base">{{ formatDateTime(unit.createdAt) }}</p>
              </div>
              
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calendar class="mr-2 h-4 w-4" />{{ fields.updatedAt }}</div>
                <p class="font-medium text-base">{{ formatDateTime(unit.updatedAt) }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
