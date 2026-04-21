<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toLocalISOString } from "@/utils/format";
import SearchableSelect from "@/components/SearchableSelect.vue";

import { useForm, useFieldArray } from "vee-validate";
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
import { Textarea } from "@/components/ui/Textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, Loader2, FileText, Plus, Trash2, Package, History, Users } from "lucide-vue-next";

import { SaleReturnService } from "@/services/sale_return/sale_return.service";
import { ProductService } from "@/services/product/product.service";
import type { Product } from "@/types";
import { InvoiceStatus } from "@/types/enums";
import { toast } from "vue-sonner";

const route = useRoute();
const router = useRouter();
const srService = new SaleReturnService();
const productService = new ProductService();

const loading = ref(true);
const submitting = ref(false);
const products = ref<Product[]>([]);
const productOptions = computed(() =>
  products.value.map(p => ({ label: `[${p.code}] ${p.name}`, value: p.id }))
);

const formSchema = toTypedSchema(
  z.object({
    id: z.number(),
    code: z.string().max(50).optional().nullable(),
    customerId: z.number().min(1, t('validation.required', { field: t('modules.customer') })),
    returnDate: z.string().min(1, t('validation.required', { field: t('fields.invoiceDate') })),
    description: z.string().optional().nullable(),
    details: z.array(
      z.object({
        id: z.number().optional().nullable(),
        productId: z.number().min(1, t('validation.required', { field: t('modules.product') })),
        quantity: z.number().min(0.01, t('validation.min', { field: t('fields.quantity'), min: '0.01' })),
        unitPrice: z.number().min(0, t('validation.min', { field: t('fields.price'), min: '0' })),
        totalPrice: z.number().min(0, t('validation.min', { field: t('fields.price'), min: '0' })),
      })
    ).min(1, t('validation.atLeastOneItem')),
  })
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    id: 0,
    code: "",
    customerId: 0,
    returnDate: toLocalISOString(new Date()),
    description: "",
    details: [],
  },
});

const { remove, push, fields } = useFieldArray("details");

onMounted(async () => {
  const id = Number(route.params.id);
  if (!id) return router.back();

  try {
    const [prodRes, detailRes] = await Promise.all([
      productService.getAll(),
      srService.getDetail(id)
    ]);
    
    if (prodRes.success && prodRes.data) products.value = prodRes.data;
    
    if (detailRes.success && detailRes.data) {
      const d = detailRes.data;
      if (d.status !== InvoiceStatus.DRAFT) {
        toast.error(t('validation.onlyDraftEditable'));
        return router.push('/admin/sale-returns');
      }

      form.setValues({
        id: d.id,
        code: d.code,
        customerId: d.customerId,
        returnDate: toLocalISOString(new Date(d.returnDate)),
        description: d.description || "",
        details: (d.details || []).map(x => ({
          id: x.id,
          productId: x.productId,
          quantity: x.quantity,
          unitPrice: x.unitPrice,
          totalPrice: x.totalPrice,
        }))
      });
    } else {
      toast.error(t('crud.notFound', { module: t('modules.saleReturn') }));
      router.back();
    }
  } catch (error) {
    console.error("Failed to fetch dependencies", error);
  } finally {
    loading.value = false;
  }
});

function addProduct() {
  push({
    productId: 0,
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
  });
}

function getProductPrice(productId: number): number {
  const p = products.value.find((x) => x.id === productId);
  return p?.detail ? Number(p.detail.salePrice || 0) : 0;
}

const grandTotal = computed(() => {
  return form.values.details?.reduce((acc, curr) => {
    return acc + Number(curr.totalPrice || 0);
  }, 0) || 0;
});

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      ...values,
      returnDate: new Date(values.returnDate).toISOString(),
    };

    const response = await srService.update(payload as any);
    if (response.success) {
      toast.success(t('crud.successUpdate', { module: t('modules.saleReturn') }));
      router.push("/admin/sale-returns/" + values.id);
    } else {
      toast.error(response.message || t('crud.errorUpdate', { module: t('modules.saleReturn') }));
    }
  } catch (error) {
    toast.error(t('crud.errorGeneral'));
  } finally {
    submitting.value = false;
  }
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <Button variant="outline" size="icon" @click="router.back()">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">{{ $t('crud.editBtn') }} {{ $t('modules.saleReturn') }}</h2>
        <p class="text-muted-foreground text-sm flex items-center mt-1">
          <History class="w-4 h-4 mr-1.5 opacity-50"/> 
          {{ form.values.code }}
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center p-12">
      <Loader2 class="h-8 w-8 animate-spin text-primary opacity-50" />
    </div>

    <form v-else @submit="onSubmit">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        <!-- Document Info -->
        <Card class="md:col-span-8 shadow-sm border-muted-foreground/10 h-min text-card-foreground">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <Users class="h-5 w-5 text-primary" />
              {{ $t('crud.generalInfo') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <FormField v-slot="{ componentField }" name="code">
              <FormItem>
                <FormLabel>{{ $t('fields.code') }}</FormLabel>
                <FormControl>
                  <Input readonly v-bind="componentField" class="bg-muted text-muted-foreground" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="returnDate">
              <FormItem>
                <FormLabel>{{ $t('fields.date') }}</FormLabel>
                <FormControl>
                  <Input type="datetime-local" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="description">
              <FormItem class="md:col-span-2">
                <FormLabel>{{ $t('fields.remarks') }}</FormLabel>
                <FormControl>
                  <Textarea :placeholder="$t('fields.enterDescription')" v-bind="componentField" rows="3" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </CardContent>
        </Card>

        <!-- Summary sidebar -->
        <Card class="md:col-span-4 shadow-sm border-muted-foreground/10 h-min">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2 text-primary">
              <FileText class="h-5 w-5" />
              {{ $t('fields.totalPrice') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="text-center p-4 bg-muted/20 border rounded-lg">
              <span class="text-3xl font-mono font-bold text-primary">
                ${{ grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2}) }}
              </span>
            </div>
          </CardContent>
          <CardFooter class="flex flex-col gap-2 border-t pt-4">
            <Button type="submit" class="w-full" :disabled="submitting || fields.length === 0">
              <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ $t('crud.save') }}
            </Button>
            <Button variant="outline" type="button" class="w-full" @click="router.back()" :disabled="submitting">
              {{ $t('crud.cancel') }}
            </Button>
          </CardFooter>
        </Card>

        <!-- Product Details Table -->
        <Card class="md:col-span-12 shadow-sm border-muted-foreground/10 text-card-foreground">
          <CardHeader class="pb-3 border-b bg-muted/5 flex flex-row items-center justify-between">
            <CardTitle class="text-lg flex items-center gap-2">
              <Package class="h-5 w-5 text-primary" />
              {{ $t('fields.details') }}
            </CardTitle>
            <Button type="button" size="sm" @click="addProduct" variant="default">
              <Plus class="h-4 w-4 mr-2"/> {{ $t('actions.addProduct') }}
            </Button>
          </CardHeader>
          <CardContent class="p-0">
            <Table>
              <TableHeader class="bg-muted/30">
                <TableRow>
                  <TableHead class="w-[40%]">{{ $t('modules.product') }}</TableHead>
                  <TableHead class="w-[15%] text-right">{{ $t('fields.unitPrice') }}</TableHead>
                  <TableHead class="w-[15%] text-right">{{ $t('fields.quantity') }}</TableHead>
                  <TableHead class="w-[20%] text-right">{{ $t('fields.rowTotal') }}</TableHead>
                  <TableHead class="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="fields.length === 0">
                  <TableCell colspan="5" class="text-center py-8 text-muted-foreground italic">
                    {{ $t('common.noData') }}
                  </TableCell>
                </TableRow>
                <TableRow v-for="(field, index) in fields" :key="field.key">
                  <TableCell>
                    <FormField v-slot="{ value, handleChange }" :name="`details[${index}].productId`">
                      <FormItem class="mb-0">
                        <SearchableSelect
                          :model-value="value"
                          @update:model-value="(v) => {
                            handleChange(v ? Number(v) : 0);
                            const price = getProductPrice(Number(v));
                            const qty = form.values.details?.[index]?.quantity || 0;
                            form.setFieldValue(`details[${index}].unitPrice` as any, price);
                            form.setFieldValue(`details[${index}].totalPrice` as any, Number((price * qty).toFixed(2)));
                          }"
                          :options="productOptions"
                          :placeholder="$t('fields.selectOption')"
                          :empty-message="$t('crud.noResults')"
                          class="w-full"
                        />
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </TableCell>
                  <TableCell class="text-right font-mono">
                    <FormField v-slot="{ componentField }" :name="`details[${index}].unitPrice`">
                      <FormItem class="mb-0">
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            class="text-right" 
                            v-bind="componentField" 
                            @input="(e: any) => {
                              const price = Number(e.target.value);
                              const qty = form.values.details?.[index]?.quantity || 0;
                              form.setFieldValue(`details[${index}].totalPrice` as any, Number((price * qty).toFixed(2)));
                            }"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </TableCell>
                  <TableCell>
                    <FormField v-slot="{ componentField }" :name="`details[${index}].quantity`">
                      <FormItem class="mb-0">
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0.01" 
                            class="text-right" 
                            v-bind="componentField" 
                            @input="(e: any) => {
                              const qty = Number(e.target.value);
                              const price = form.values.details?.[index]?.unitPrice || 0;
                              form.setFieldValue(`details[${index}].totalPrice` as any, Number((price * qty).toFixed(2)));
                            }"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </TableCell>
                  <TableCell>
                    <FormField v-slot="{ componentField }" :name="`details[${index}].totalPrice`">
                      <FormItem class="mb-0">
                        <FormControl>
                          <Input type="number" step="0.01" class="text-right font-mono font-bold" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" class="text-destructive hover:bg-destructive/10" @click="remove(index)">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </form>
  </div>
</template>
