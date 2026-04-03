<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Loader2, Package, Tag, Camera } from "lucide-vue-next";
import { ProductService } from "@/services/product/product.service";
import { CategoryService } from "@/services/category/category.service";
import { BrandService } from "@/services/brand/brand.service";
import { UnitService } from "@/services/unit/unit.service";
import DatePicker from "@/components/DatePicker.vue";
import ImageUpload from "@/components/upload/ImageUpload.vue";
import type { Category } from "@/types/category";
import type { Brand } from "@/types/brand";
import type { Unit } from "@/types/unit";
import { toast } from "vue-sonner";

const router = useRouter();
const productService = new ProductService();
const categoryService = new CategoryService();
const brandService = new BrandService();
const unitService = new UnitService();

const categories = ref<Category[]>([]);
const brands = ref<Brand[]>([]);
const units = ref<Unit[]>([]);
const loading = ref(false);
const submitting = ref(false);

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(200),
    code: z.string().optional(),
    skuCode: z.string().optional(),
    categoryId: z.string().min(1, "Category is required"),
    brandId: z.string().optional(),
    unitId: z.string().min(1, "Unit is required"),
    barcodeType: z.string().default("CODE128"),
    alertQuantity: z.number().default(0),
    photoPath: z.string().optional(),
    status: z.boolean().default(true),
    forSelling: z.boolean().default(true),
    isManufacture: z.boolean().default(true),
    manageStock: z.boolean().default(true),
    // Detail fields
    purchasePrice: z.number().default(0),
    salePrice: z.number().default(0),
    currentStock: z.number().default(0),
    stockNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    expiryType: z.string().optional(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: "",
    code: "",
    skuCode: "",
    barcodeType: "CODE128",
    alertQuantity: 0,
    status: true,
    forSelling: true,
    isManufacture: true,
    manageStock: true,
    purchasePrice: 0,
    salePrice: 0,
    currentStock: 0,
    stockNumber: "",
    expiryDate: "",
    expiryType: "None",
  },
});

async function fetchData() {
  loading.value = true;
  try {
    const [catRes, brandRes, unitRes] = await Promise.all([
      categoryService.getAll(),
      brandService.getAll(),
      unitService.getAll(),
    ]);
    if (catRes.success) categories.value = catRes.data || [];
    if (brandRes.success) brands.value = brandRes.data || [];
    if (unitRes.success) units.value = unitRes.data || [];
  } catch (error) {
    console.error("Failed to fetch dependencies", error);
    toast.error(t("crud.errorGeneral"));
  } finally {
    loading.value = false;
  }
}

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      ...values,
      categoryId: Number(values.categoryId),
      brandId: values.brandId ? Number(values.brandId) : undefined,
      unitId: Number(values.unitId),
    };
    const response = await productService.create(payload as any);
    if (response.success) {
      toast.success(t("crud.successCreate", { module: t("modules.product") }));
      router.push("/admin/products");
    } else {
      toast.error(
        response.message ||
          t("crud.errorCreate", { module: t("modules.product") }),
      );
    }
  } catch (error) {
    toast.error(t("crud.errorGeneral"));
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
    <!-- Header -->
    <div class="flex items-center gap-4">
      <Button variant="outline" size="icon" @click="router.back()">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <h2 class="text-3xl font-bold tracking-tight">
        {{ $t("crud.create", { module: $t("modules.product") }) }}
      </h2>
    </div>

    <form @submit="onSubmit" id="productForm" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Primary Details -->
        <div class="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Package class="h-5 w-5 text-primary" />
                {{ $t("crud.generalInfo") }}
              </CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField v-slot="{ componentField }" name="name">
                <FormItem class="md:col-span-2">
                  <FormLabel>{{ $t("fields.name") }}</FormLabel>
                  <FormControl>
                    <Input
                      :placeholder="$t('fields.enterProductName')"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="skuCode">
                <FormItem>
                  <FormLabel>{{ $t('fields.sku') }}</FormLabel>
                  <FormControl>
                    <Input :placeholder="$t('fields.autoGenerate')" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="code">
                <FormItem>
                  <FormLabel>{{ $t('fields.code') }}</FormLabel>
                  <FormControl>
                    <Input :placeholder="$t('fields.autoGenerate')" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ field }" name="categoryId">
                <FormItem>
                  <FormLabel>{{ $t("modules.category") }}</FormLabel>
                  <Select v-bind="field">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue :placeholder="$t('crud.selectType')" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem
                        v-for="cat in categories"
                        :key="cat.id"
                        :value="String(cat.id)"
                      >
                        {{ cat.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ field }" name="brandId">
                <FormItem>
                  <FormLabel>{{ $t("modules.brand") }}</FormLabel>
                  <Select v-bind="field">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue :placeholder="$t('crud.none')" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">{{ $t("crud.none") }}</SelectItem>
                      <SelectItem
                        v-for="brand in brands"
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

              <FormField v-slot="{ field }" name="unitId">
                <FormItem>
                  <FormLabel>{{ $t("modules.unit") }}</FormLabel>
                  <Select v-bind="field">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue :placeholder="$t('crud.selectType')" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem
                        v-for="u in units"
                        :key="u.id"
                        :value="String(u.id)"
                      >
                        {{ u.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ field }" name="barcodeType">
                <FormItem>
                  <FormLabel>{{ $t("fields.barcodeType") }}</FormLabel>
                  <Select v-bind="field">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue :placeholder="$t('fields.selectBarcodeType')" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CODE128">CODE128</SelectItem>
                      <SelectItem value="CODE39">CODE39</SelectItem>
                      <SelectItem value="EAN8">EAN8</SelectItem>
                      <SelectItem value="EAN13">EAN13</SelectItem>
                      <SelectItem value="UPC">UPC</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Tag class="h-5 w-5 text-primary" />
                {{ $t("fields.salePrice") }} & {{ $t("fields.currentStock") }}
              </CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField v-slot="{ componentField }" name="purchasePrice">
                <FormItem>
                  <FormLabel>{{ $t("fields.purchasePrice") }}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      v-bind="componentField"
                      @input="
                        form.setFieldValue(
                          'purchasePrice',
                          Number($event.target.value),
                        )
                      "
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="salePrice">
                <FormItem>
                  <FormLabel>{{ $t("fields.salePrice") }}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      v-bind="componentField"
                      @input="
                        form.setFieldValue(
                          'salePrice',
                          Number($event.target.value),
                        )
                      "
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="currentStock">
                <FormItem>
                  <FormLabel>{{ $t("fields.currentStock") }}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      v-bind="componentField"
                      @input="
                        form.setFieldValue(
                          'currentStock',
                          Number($event.target.value),
                        )
                      "
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="alertQuantity">
                <FormItem>
                  <FormLabel>{{ $t("fields.alertQuantity") }}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      v-bind="componentField"
                      @input="
                        form.setFieldValue(
                          'alertQuantity',
                          Number($event.target.value),
                        )
                      "
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </CardContent>
          </Card>
        </div>

        <!-- Right Column: Settings & Photo -->
        <div class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Camera class="h-5 w-5 text-primary" />
                {{ $t("fields.photo") }}
              </CardTitle>
            </CardHeader>
            <CardContent class="flex justify-center py-4">
              <FormField v-slot="{ value, handleChange }" name="photoPath">
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

          <Card>
            <CardHeader>
              <CardTitle
                >{{ $t("fields.status") }} &
                {{ $t("layout.mainMenu") }}</CardTitle
              >
            </CardHeader>
            <CardContent class="space-y-4">
              <FormField v-slot="{ value, handleChange }" name="status">
                <FormItem
                  class="flex flex-row items-center justify-between rounded-lg border p-3"
                >
                  <FormLabel class="text-sm font-medium">{{
                    $t("fields.activeStatus")
                  }}</FormLabel>
                   <FormControl>
                    <Switch :model-value="!!value" @update:model-value="(v: boolean) => handleChange(v)" />
                  </FormControl>
                </FormItem>
              </FormField>

              <FormField v-slot="{ value, handleChange }" name="manageStock">
                <FormItem
                  class="flex flex-row items-center justify-between rounded-lg border p-3"
                >
                  <FormLabel class="text-sm font-medium">{{
                    $t("fields.manageStock")
                  }}</FormLabel>
                   <FormControl>
                    <Switch :model-value="!!value" @update:model-value="(v: boolean) => handleChange(v)" />
                  </FormControl>
                </FormItem>
              </FormField>

              <FormField v-slot="{ value, handleChange }" name="forSelling">
                <FormItem
                  class="flex flex-row items-center justify-between rounded-lg border p-3"
                >
                  <FormLabel class="text-sm font-medium">{{
                    $t("fields.forSelling")
                  }}</FormLabel>
                   <FormControl>
                    <Switch :model-value="!!value" @update:model-value="(v: boolean) => handleChange(v)" />
                  </FormControl>
                </FormItem>
              </FormField>

              <FormField v-slot="{ value, handleChange }" name="isManufacture">
                <FormItem
                  class="flex flex-row items-center justify-between rounded-lg border p-3"
                >
                  <FormLabel class="text-sm font-medium">{{
                    $t("fields.isManufacture")
                  }}</FormLabel>
                   <FormControl>
                    <Switch :model-value="!!value" @update:model-value="(v: boolean) => handleChange(v)" />
                  </FormControl>
                </FormItem>
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{{ $t("fields.expiryDate") }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
               <FormField v-slot="{ field }" name="expiryDate">
                <FormItem>
                  <FormLabel>{{ $t('fields.expiryDate') }}</FormLabel>
                  <FormControl>
                    <DatePicker v-bind="field" :placeholder="$t('fields.selectDate')" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ field }" name="expiryType">
                <FormItem>
                  <FormLabel>{{ $t("fields.expiryType") }}</FormLabel>
                  <Select v-bind="field">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue :placeholder="$t('fields.selectOption')" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="None">{{ $t('fields.expiryTypes.none') }}</SelectItem>
                      <SelectItem value="Best Before">{{ $t('fields.expiryTypes.bestBefore') }}</SelectItem>
                      <SelectItem value="Expiry">{{ $t('fields.expiryTypes.expiry') }}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </FormField>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>

    <div class="flex justify-end gap-2 fixed bottom-6 right-6 lg:static">
      <Button
        variant="outline"
        @click="router.back()"
        :disabled="submitting"
        size="lg"
        class="bg-card"
      >
        {{ $t("crud.cancel") }}
      </Button>
      <Button
        type="submit"
        form="productForm"
        :disabled="submitting"
        size="lg"
        class="px-8 shadow-lg"
      >
        <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
        {{ $t("crud.createBtn") }} {{ $t("modules.product") }}
      </Button>
    </div>
  </div>
</template>
