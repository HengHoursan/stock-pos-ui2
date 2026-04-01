<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Pencil, Trash2, Loader2, Ruler, Calendar, Globe, AlignLeft, Barcode, Folder, Calculator, Coins, Type } from "lucide-vue-next";
import { UnitService } from "@/services/unit/unit.service";
import type { Unit } from "@/types/unit";
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
      toast.error(t('crud.notFound', { module: t('modules.unit') }));
      router.push("/admin/units");
    }
  } catch (error) {
    toast.error(t('crud.errorFetch', { module: t('modules.unit') }));
  } finally {
    loading.value = false;
  }
}

async function deleteUnit() {
  if (!confirm("Are you sure you want to delete this unit?")) return;
  try {
    const response = await unitService.softDelete(unitId);
    if (response.success) {
      toast.success(t('crud.successDelete', { module: t('modules.unit') }));
      router.push("/admin/units");
    }
  } catch (error) {
    toast.error(t('crud.errorDelete', { module: t('modules.unit') }));
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
          <Pencil class="mr-2 h-4 w-4" />{{ $t('crud.editBtn') }}</Button>
        <Button variant="destructive" @click="deleteUnit" class="flex-1 md:flex-none">
          <Trash2 class="mr-2 h-4 w-4" />{{ $t('crud.delete') }}</Button>
      </div>
    </div>

    <Card v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </Card>

    <div v-else-if="unit" class="grid gap-6 grid-cols-1">
      <!-- Details Section -->
      <div class="space-y-6">
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-lg">{{ $t('crud.generalInfo') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Type class="mr-2 h-4 w-4" />{{ $t('fields.name') }}</div>
                <p class="font-medium text-base">{{ unit.name }}</p>
              </div>
              
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Barcode class="mr-2 h-4 w-4" />{{ $t('fields.code') }}</div>
                <p class="font-medium text-base">{{ unit.code || 'N/A' }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Globe class="mr-2 h-4 w-4" />{{ $t('fields.slug') }}</div>
                <p class="font-medium text-base">{{ unit.slug }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Ruler class="mr-2 h-4 w-4" />{{ $t('fields.symbol') }}</div>
                <p class="font-medium text-base">{{ unit.symbol || 'N/A' }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calculator class="mr-2 h-4 w-4" />{{ $t('fields.conversionFactor') }}</div>
                <p class="font-medium text-base">{{ unit.conversionFactor || 1 }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Coins class="mr-2 h-4 w-4" />{{ $t('fields.defaultPrice') }}</div>
                <p class="font-medium text-base">{{ unit.defaultPrice || 0 }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Folder class="mr-2 h-4 w-4" />{{ $t('fields.parentOf', { module: $t('modules.unit') }) }}</div>
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
                  <AlignLeft class="mr-2 h-4 w-4" />{{ $t('fields.isCalculateDetail') }}</div>
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
            <CardTitle class="text-lg">{{ $t('crud.systemInfo') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calendar class="mr-2 h-4 w-4" />{{ $t('fields.createdAt') }}</div>
                <p class="font-medium text-base">{{ new Date(unit.createdAt).toLocaleString() }}</p>
              </div>
              
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calendar class="mr-2 h-4 w-4" />{{ $t('fields.updatedAt') }}</div>
                <p class="font-medium text-base">{{ new Date(unit.updatedAt).toLocaleString() }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
