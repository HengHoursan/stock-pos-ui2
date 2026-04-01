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
  Tag,
  Calendar,
  Globe,
  AlignLeft,
  Barcode,
  Folder,
} from "lucide-vue-next";
import { BrandService } from "@/services/brand/brand.service";
import type { Brand } from "@/types/brand";
import { toast } from "vue-sonner";

const router = useRouter();
const route = useRoute();
const brandService = new BrandService();

const brandId = Number(route.params.id);
const brand = ref<Brand | null>(null);
const parentBrand = ref<Brand | null>(null);
const loading = ref(true);

async function fetchBrand() {
  loading.value = true;
  try {
    const response = await brandService.getDetail(brandId);
    if (response.success && response.data) {
      brand.value = response.data;

      if (brand.value.parentId) {
        const parentResponse = await brandService.getDetail(
          brand.value.parentId,
        );
        if (parentResponse.success) {
          parentBrand.value = parentResponse.data;
        }
      }
    } else {
      toast.error(t("crud.notFound", { module: t("modules.brand") }));
      router.push("/admin/brands");
    }
  } catch (error) {
    toast.error(t("crud.errorFetch", { module: t("modules.brand") }));
  } finally {
    loading.value = false;
  }
}

async function deleteBrand() {
  if (!confirm("Are you sure you want to delete this brand?")) return;
  try {
    const response = await brandService.softDelete(brandId);
    if (response.success) {
      toast.success(t("crud.successDelete", { module: t("modules.brand") }));
      router.push("/admin/brands");
    }
  } catch (error) {
    toast.error(t("crud.errorDelete", { module: t("modules.brand") }));
  }
}

onMounted(() => {
  fetchBrand();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div class="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          @click="router.back()"
          class="h-10 w-10"
        >
          <ChevronLeft class="h-5 w-5" />
        </Button>
        <div class="flex items-center gap-3">
          <h2 class="text-3xl font-bold tracking-tight">
            {{ brand?.name || "Brand Details" }}
          </h2>
          <Badge
            v-if="brand"
            :variant="brand.status ? 'success' : 'warning'"
            class="text-[10px] h-5 px-2 uppercase font-bold shadow-sm self-center mt-1"
          >
            {{ brand.status ? "Active" : "Inactive" }}
          </Badge>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          @click="router.push(`/admin/brands/${brandId}/edit`)"
          class="flex-1 md:flex-none"
        >
          <Pencil class="mr-2 h-4 w-4" />{{ $t("crud.editBtn") }}</Button
        >
        <Button
          variant="destructive"
          @click="deleteBrand"
          class="flex-1 md:flex-none"
        >
          <Trash2 class="mr-2 h-4 w-4" />{{ $t("crud.delete") }}</Button
        >
      </div>
    </div>

    <Card v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </Card>

    <div v-else-if="brand" class="grid gap-6 grid-cols-1 lg:grid-cols-3">
      <!-- Image Section -->
      <Card class="lg:col-span-1 overflow-hidden h-fit">
        <CardHeader class="pb-3">
          <CardTitle class="text-lg">{{ $t("crud.image") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            class="aspect-square relative rounded-lg border bg-muted/50 flex items-center justify-center overflow-hidden"
          >
            <img
              v-if="brand.imageUrl"
              :src="brand.imageUrl"
              :alt="brand.name"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="flex flex-col items-center gap-2 text-muted-foreground"
            >
              <Tag class="h-12 w-12 opacity-20" />
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
                  <Tag class="mr-2 h-4 w-4" />{{ $t("fields.name") }}
                </div>
                <p class="font-medium text-base">{{ brand.name }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Barcode class="mr-2 h-4 w-4" />{{ $t("fields.code") }}
                </div>
                <p class="font-medium text-base">{{ brand.code || "N/A" }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Globe class="mr-2 h-4 w-4" />{{ $t("fields.slug") }}
                </div>
                <p class="font-medium text-base">{{ brand.slug }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Folder class="mr-2 h-4 w-4" />{{ $t("fields.parentOf", { module: $t("modules.brand") }) }}
                </div>
                <p class="font-medium text-base">
                  <template v-if="parentBrand">
                    <router-link
                      :to="`/admin/brands/${parentBrand.id}`"
                      class="text-primary hover:underline inline-flex items-center"
                    >
                      {{ parentBrand.name }}
                    </router-link>
                  </template>
                  <template v-else>{{ $t("crud.none") }}</template>
                </p>
              </div>
            </div>

            <div class="mt-6 pt-6 border-t space-y-2">
              <div class="flex items-center text-sm text-muted-foreground">
                <AlignLeft class="mr-2 h-4 w-4" />{{ $t("fields.description") }}
              </div>
              <p
                class="text-sm leading-relaxed text-foreground/80 bg-muted/30 p-4 rounded-md"
              >
                {{
                  brand.description || "No description provided for this brand."
                }}
              </p>
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
                  {{ new Date(brand.createdAt).toLocaleString() }}
                </p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calendar class="mr-2 h-4 w-4" />{{ $t("fields.updatedAt") }}
                </div>
                <p class="font-medium text-base">
                  {{ new Date(brand.updatedAt).toLocaleString() }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
