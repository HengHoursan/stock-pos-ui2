<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Textarea from "@/components/ui/textarea/Textarea.vue";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ChevronLeft, Loader2, Camera } from "lucide-vue-next";
import { BrandService } from "@/services/brand/brand.service";
import ImageUpload from "@/components/upload/ImageUpload.vue";
import type { Brand } from "@/types/brand";
import { toast } from "vue-sonner";


const router = useRouter();
const route = useRoute();
const brandService = new BrandService();

const brandId = Number(route.params.id);
const parentBrands = ref<Brand[]>([]);
const loading = ref(true);
const submitting = ref(false);

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(60),
    code: z.string().optional(),
    slug: z.string().optional(),
    parentId: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    status: z.boolean().default(true),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: "",
    code: "",
    slug: "",
    description: "",
    imageUrl: "",
    status: true,
  },
});

async function fetchData() {
  loading.value = true;
  try {
    const [brandResponse, listResponse] = await Promise.all([
      brandService.getDetail(brandId),
      brandService.getAll(),
    ]);

    if (brandResponse.success && brandResponse.data) {
      const brand = brandResponse.data;
      form.setValues({
        name: brand.name,
        code: brand.code || "",
        slug: brand.slug || "",
        parentId: brand.parentId ? String(brand.parentId) : "0",
        description: brand.description || "",
        imageUrl: brand.imageUrl || "",
        status: brand.status,
      });
    } else {
      toast.error(t('crud.notFound', { module: t('modules.brand') }));
      router.push("/admin/brands");
    }

    if (listResponse.success && listResponse.data) {
      parentBrands.value = listResponse.data.filter(
        (b) => b.id !== brandId,
      );
    }
  } catch (error) {
    toast.error(t('crud.errorFetch', { module: t('modules.brand') }));
  } finally {
    loading.value = false;
  }
}

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      id: brandId,
      ...values,
      parentId:
        values.parentId && values.parentId !== "0"
          ? Number(values.parentId)
          : undefined,
    };
    const response = await brandService.update(payload);
    if (response.success) {
      toast.success(t('crud.successUpdate', { module: t('modules.brand') }));
      router.push("/admin/brands");
    } else {
      toast.error(response.message || t('crud.errorUpdate', { module: t('modules.brand') }));
    }
  } catch (error) {
    toast.error(t('crud.errorGeneral'));
  } finally {
    submitting.value = false;
  }
});

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <Button variant="outline" size="icon" @click="router.back()">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <h2 class="text-3xl font-bold tracking-tight">{{ $t('crud.edit', { module: $t('modules.brand') }) }}</h2>
    </div>

    <Card v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </Card>

    <Card v-else>
      <CardHeader>
        <CardTitle>{{ $t('crud.info', { module: $t('modules.brand') }) }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit="onSubmit" id="brandForm" class="space-y-6">
          <div class="flex flex-col lg:flex-row gap-8">
            <!-- Left Side: Image Upload -->
            <div class="w-full lg:w-72 shrink-0">
              <Card>
                <CardHeader>
                  <CardTitle class="flex items-center gap-2">
                    <Camera class="h-5 w-5 text-primary" />
                    {{ $t('fields.photo') }}
                  </CardTitle>
                </CardHeader>
                <CardContent class="flex justify-center py-4">
                  <FormField v-slot="{ value, handleChange }" name="imageUrl">
                    <FormItem>
                      <FormControl>
                        <ImageUpload
                          :image-url="value"
                          @update:image-url="handleChange"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </CardContent>
              </Card>
            </div>

            <!-- Right Side: Form Fields -->
            <div class="flex-1 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField v-slot="{ componentField }" name="name">
                  <FormItem>
                    <FormLabel>{{ $t('fields.name') }}</FormLabel>
                    <FormControl>
                      <Input
                        :placeholder="$t('fields.enterBrandName')"
                        v-bind="componentField"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="code">
                  <FormItem>
                    <FormLabel>{{ $t('fields.code') }}</FormLabel>
                    <FormControl>
                      <Input
                        v-bind="componentField"
                        disabled
                        class="bg-muted/50 cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="slug">
                  <FormItem>
                    <FormLabel>{{ $t('fields.slug') }}</FormLabel>
                    <FormControl>
                      <Input
                        v-bind="componentField"
                        disabled
                        class="bg-muted/50 cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ field }" name="parentId">
                  <FormItem>
                    <FormLabel>{{ $t('fields.parentOf', { module: $t('modules.brand') }) }}</FormLabel>
                    <Select v-bind="field">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue :placeholder="$t('fields.selectParentBrand')" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">{{ $t('crud.none') }}</SelectItem>
                        <SelectItem
                          v-for="brand in parentBrands"
                          :key="brand.id"
                          :value="String(brand.id)"
                        >
                          {{ brand.name }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <div class="md:col-span-2">
                  <FormField v-slot="{ componentField }" name="description">
                    <FormItem>
                      <FormLabel>{{ $t('fields.description') }}</FormLabel>
                      <FormControl>
                      <Textarea
                        :placeholder="$t('fields.enterDescription')"
                        v-bind="componentField"
                      />
                    </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>

                <div class="md:col-span-2">
                  <FormField v-slot="{ value, handleChange }" name="status">
                    <FormItem
                      class="flex flex-row items-center justify-between rounded-lg border p-4"
                    >
                      <div class="space-y-0.5">
                        <FormLabel class="text-base font-semibold"
                          >{{ $t('fields.activeStatus') }}</FormLabel
                        >
                        <FormDescription>
                          {{ $t('fields.statusDescription', { module: $t('modules.brand') }) }}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch :model-value="!!value" @update:model-value="(v: boolean) => handleChange(v)" />
                      </FormControl>
                    </FormItem>
                  </FormField>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex justify-end gap-2 border-t px-6 py-4">
        <Button variant="outline" @click="router.back()" :disabled="submitting">{{ $t('crud.cancel') }}</Button>
        <Button type="submit" form="brandForm" :disabled="submitting">
          <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
          {{ $t('crud.updateBtn', { module: $t('modules.brand') }) }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
