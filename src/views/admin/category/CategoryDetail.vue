<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Pencil, Trash2, Loader2, Tag, Calendar, Globe, AlignLeft, Barcode, Folder } from "lucide-vue-next";
import { CategoryService } from "@/services/category/category.service";
import type { Category } from "@/types/category";
import { toast } from "vue-sonner";

const router = useRouter();
const route = useRoute();
const categoryService = new CategoryService();

const categoryId = Number(route.params.id);
const category = ref<Category | null>(null);
const parentCategory = ref<Category | null>(null);
const loading = ref(true);

async function fetchCategory() {
  loading.value = true;
  try {
    const response = await categoryService.getDetail(categoryId);
    if (response.success && response.data) {
      category.value = response.data;
      
      if (category.value.parentId) {
        const parentResponse = await categoryService.getDetail(category.value.parentId);
        if (parentResponse.success) {
          parentCategory.value = parentResponse.data;
        }
      }
    } else {
      toast.error("Category not found");
      router.push("/admin/categories");
    }
  } catch (error) {
    toast.error("Failed to fetch category details");
  } finally {
    loading.value = false;
  }
}

async function deleteCategory() {
  if (!confirm("Are you sure you want to delete this category?")) return;
  try {
    const response = await categoryService.softDelete(categoryId);
    if (response.success) {
      toast.success("Category deleted successfully");
      router.push("/admin/categories");
    }
  } catch (error) {
    toast.error("Failed to delete category");
  }
}

onMounted(() => {
  fetchCategory();
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
          <h2 class="text-3xl font-bold tracking-tight">{{ category?.name || 'Category Details' }}</h2>
          <Badge v-if="category" :variant="category.status ? 'success' : 'warning'" class="text-[10px] h-5 px-2 uppercase font-bold shadow-sm self-center mt-1">
            {{ category.status ? "Active" : "Inactive" }}
          </Badge>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="router.push(`/admin/categories/${categoryId}/edit`)" class="flex-1 md:flex-none">
          <Pencil class="mr-2 h-4 w-4" /> Edit
        </Button>
        <Button variant="destructive" @click="deleteCategory" class="flex-1 md:flex-none">
          <Trash2 class="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>
    </div>

    <Card v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </Card>

    <div v-else-if="category" class="grid gap-6 grid-cols-1 lg:grid-cols-3">
      <!-- Image Section -->
      <Card class="lg:col-span-1 overflow-hidden h-fit">
        <CardHeader class="pb-3">
          <CardTitle class="text-lg">Category Image</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="aspect-square relative rounded-lg border bg-muted/50 flex items-center justify-center overflow-hidden">
            <img v-if="category.imageUrl" :src="category.imageUrl" :alt="category.name" class="h-full w-full object-cover" />
            <div v-else class="flex flex-col items-center gap-2 text-muted-foreground">
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
            <CardTitle class="text-lg">General Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Tag class="mr-2 h-4 w-4" /> Name
                </div>
                <p class="font-medium text-base">{{ category.name }}</p>
              </div>
              
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Barcode class="mr-2 h-4 w-4" /> Code
                </div>
                <p class="font-medium text-base">{{ category.code || 'N/A' }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Globe class="mr-2 h-4 w-4" /> Slug
                </div>
                <p class="font-medium text-base">{{ category.slug }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Folder class="mr-2 h-4 w-4" /> Parent Category
                </div>
                <p class="font-medium text-base">
                  <template v-if="parentCategory">
                    <router-link :to="`/admin/categories/${parentCategory.id}`" class="text-primary hover:underline inline-flex items-center">
                      {{ parentCategory.name }}
                    </router-link>
                  </template>
                  <template v-else>None</template>
                </p>
              </div>
            </div>

            <div class="mt-6 pt-6 border-t space-y-2">
              <div class="flex items-center text-sm text-muted-foreground">
                <AlignLeft class="mr-2 h-4 w-4" /> Description
              </div>
              <p class="text-sm leading-relaxed text-foreground/80 bg-muted/30 p-4 rounded-md">
                {{ category.description || 'No description provided for this category.' }}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-lg">System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calendar class="mr-2 h-4 w-4" /> Created Date
                </div>
                <p class="font-medium text-base">{{ new Date(category.createdAt).toLocaleString() }}</p>
              </div>
              
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calendar class="mr-2 h-4 w-4" /> Last Modified
                </div>
                <p class="font-medium text-base">{{ new Date(category.updatedAt).toLocaleString() }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
