<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toLocalISOString, formatCurrency, formatNumberInput } from "@/utils/format";
import SearchableSelect from "@/components/SearchableSelect.vue";
import CurrencyToggle from "@/components/CurrencyToggle.vue";

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
import { ChevronLeft, Loader2, FileText, Plus, Trash2} from "lucide-vue-next";

import { SaleOrderService } from "@/services/sale_order/sale_order.service";
import { SaleQuotationService } from "@/services/sale_quotation/sale_quotation.service";
import { CustomerService } from "@/services/customer/customer.service";
import { ProductService } from "@/services/product/product.service";
import type { Product, Customer } from "@/types";
import { toast } from "vue-sonner";


const route = useRoute();
const router = useRouter();
const soService = new SaleOrderService();
const sqService = new SaleQuotationService();
const customerService = new CustomerService();
const productService = new ProductService();

const submitting = ref(false);
const products = ref<Product[]>([]);
const customers = ref<Customer[]>([]);
const customerOptions = computed(() =>
  customers.value.map(c => ({ label: `${c.name} (${c.code})`, value: c.id }))
);
const productOptions = computed(() =>
  products.value
    .filter(p => p.forSelling)
    .map(p => ({ label: `[${p.code}] ${p.name}`, value: p.id }))
);

onMounted(async () => {
  try {
    const [prodRes, custRes] = await Promise.all([
      productService.getAll(),
      customerService.getAll()
    ]);
    if (prodRes.success && prodRes.data) products.value = prodRes.data;
    if (custRes.success && custRes.data) customers.value = custRes.data;
    // Load from Quotation
    const quotationId = Number(route.query.quotationId);
    if (quotationId) {
      const qRes = await sqService.getDetail(quotationId);
      if (qRes.success && qRes.data) {
        form.setFieldValue("customerId", qRes.data.customerId);
        const mappedDetails = (qRes.data.details || []).map(d => ({
          productId: d.productId,
          quantity: d.quantity,
          price: d.totalPrice / d.quantity
        }));
        form.setFieldValue("details", mappedDetails as any);
        toast.info(t('validation.loadedFromSource', { source: t('modules.saleQuotation') }));
      }
    }
  } catch (error) {
    console.error("Failed to fetch dependencies", error);
  }
});

const formSchema = toTypedSchema(
  z.object({
    code: z.string().max(50).optional().nullable(),
    customerId: z.number().min(1, t('validation.required', { field: t('fields.customerId') })),
    orderDate: z.string().min(1, t('validation.required', { field: t('fields.orderDate') })),
    description: z.string().optional().nullable(),
    details: z.array(
      z.object({
        productId: z.number().min(1, t('validation.required', { field: t('modules.product') })),
        quantity: z.number().min(0.01, t('validation.min', { field: t('fields.quantity'), min: '0.01' })),
        price: z.number().min(0, t('validation.min', { field: t('fields.price'), min: '0' })),
      })
    ).min(1, t('validation.atLeastOneItem')),
  })
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    code: "",
    customerId: undefined,
    orderDate: toLocalISOString(new Date()),
    description: "",
    details: [],
  },
});

const { remove, push, fields } = useFieldArray("details");

function addProduct() {
  push({
    productId: 0,
    quantity: 1,
    price: 0,
  });
}

function getProductPrice(productId: number): number {
  const p = products.value.find((x) => x.id === productId);
  return p?.detail ? Number(p.detail.salePrice || 0) : 0;
}

const grandTotal = computed(() => {
  return form.values.details?.reduce((acc, curr) => {
    return acc + (curr.quantity * curr.price);
  }, 0) || 0;
});

const localPrices = ref<Record<string, string>>({});
const localQuantities = ref<Record<string, string>>({});

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      code: values.code || undefined,
      customerId: values.customerId,
      orderDate: new Date(values.orderDate).toISOString(),
      description: values.description,
      details: values.details.map((d: any) => ({
        productId: d.productId,
        quantity: Number(d.quantity),
        totalPrice: Number(d.quantity) * Number(d.price)
      }))
    };

    const response = await soService.create(payload as any);
    if (response.success) {
      toast.success(t('crud.successCreate', { module: t('modules.saleOrder') }));
      router.push("/admin/sale-orders");
    } else {
      toast.error(response.message || t('crud.errorCreate', { module: t('modules.saleOrder') }));
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
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" @click="router.back()">
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <div>
          <h2 class="text-3xl font-bold tracking-tight">{{ $t('crud.createBtn') }} {{ $t('modules.saleOrder') }}</h2>
          <p class="text-muted-foreground text-sm">{{ $t('fields.saleOrderInfo') }}</p>
        </div>
      </div>
      <CurrencyToggle />
    </div>

    <form @submit="onSubmit" class="space-y-6">
      
      <!-- General Info -->
      <Card class="shadow-sm border-muted-foreground/10">
        <CardHeader class="pb-3 border-b bg-muted/5">
          <CardTitle class="text-lg flex items-center gap-2">
            <FileText class="h-5 w-5 text-primary" />
            {{ $t('crud.generalInfo') }}
          </CardTitle>
        </CardHeader>
        <CardContent class="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <FormField v-slot="{ componentField }" name="code">
            <FormItem>
              <FormLabel>{{ $t('fields.code') }}</FormLabel>
              <FormControl>
                <Input :placeholder="$t('fields.autoGenerate')" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="orderDate">
            <FormItem>
              <FormLabel>{{ $t('fields.orderDate') }}</FormLabel>
              <FormControl>
                <Input type="datetime-local" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ value, handleChange }" name="customerId">
            <FormItem class="md:col-span-2">
              <FormLabel>{{ $t('fields.customerId') }}</FormLabel>
              <FormControl>
                <SearchableSelect
                  :model-value="value"
                  @update:model-value="(v) => handleChange(v ? Number(v) : undefined)"
                  :options="customerOptions"
                  :placeholder="$t('crud.selectValue', { module: $t('modules.customer') })"
                  :empty-message="$t('crud.noResults')"
                  class="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="description">
            <FormItem class="md:col-span-2">
              <FormLabel>{{ $t('fields.description') }}</FormLabel>
              <FormControl>
                <Textarea :placeholder="$t('fields.enterDescription')" v-bind="componentField" rows="3" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          
        </CardContent>
      </Card>

      <!-- Details Table -->
      <Card class="shadow-sm border-muted-foreground/10">
        <CardHeader class="pb-3 border-b bg-muted/5 flex flex-row items-center justify-between">
          <CardTitle class="text-lg flex items-center gap-2">
            <FileText class="h-5 w-5 text-primary" />
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
                <TableHead class="w-[45%]">{{ $t('modules.product') }}</TableHead>
                <TableHead class="w-[20%] text-right">{{ $t('fields.sellingPrice') }}</TableHead>
                <TableHead class="w-[15%] text-right">{{ $t('fields.quantity') }}</TableHead>
                <TableHead class="w-[15%] text-right">{{ $t('fields.rowTotal') }}</TableHead>
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
                      <FormControl>
                        <SearchableSelect
                          :model-value="value"
                          @update:model-value="(v) => {
                            handleChange(v ? Number(v) : 0);
                            form.setFieldValue(`details[${index}].price` as any, getProductPrice(Number(v)));
                          }"
                          :options="productOptions"
                          :placeholder="$t('fields.selectOption')"
                          :empty-message="$t('crud.noResults')"
                          class="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </TableCell>
                <TableCell>
                  <FormField v-slot="{ componentField }" :name="`details[${index}].price`">
                    <FormItem class="mb-0">
                      <FormControl>
                        <Input 
                          type="text" 
                          class="text-right" 
                          :name="componentField.name"
                          @blur="componentField.onBlur"
                          :model-value="localPrices[field.key] ?? formatNumberInput(componentField.modelValue)"
                          @update:model-value="(val) => {
                            localPrices[field.key] = formatNumberInput(String(val));
                            const clean = Number(localPrices[field.key].replace(/,/g, ''));
                            form.setFieldValue(`details[${index}].price` as any, clean);
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
                          type="text" 
                          class="text-right" 
                          :name="componentField.name"
                          @blur="componentField.onBlur"
                          :model-value="localQuantities[field.key] ?? formatNumberInput(componentField.modelValue)"
                          @update:model-value="(val) => {
                            localQuantities[field.key] = formatNumberInput(String(val));
                            const clean = Number(localQuantities[field.key].replace(/,/g, ''));
                            form.setFieldValue(`details[${index}].quantity` as any, clean);
                          }"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </TableCell>
                <TableCell class="text-right font-medium">
                  {{ formatCurrency(((form.values.details || [])[index]?.quantity || 0) * ((form.values.details || [])[index]?.price || 0)) }}
                </TableCell>
                <TableCell>
                  <Button type="button" variant="ghost" size="icon" class="text-destructive hover:bg-destructive/10" @click="remove(index)">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <div class="flex justify-end p-6 border-t bg-muted/10">
            <div class="w-full max-w-sm space-y-3">
              <div class="flex justify-between items-center text-lg font-bold">
                <span>{{ $t('fields.grandTotal') }}:</span>
                <span class="text-primary">{{ formatCurrency(grandTotal) }}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter class="flex justify-end gap-2 border-t px-6 py-4 bg-muted/5">
          <Button variant="outline" type="button" @click="router.back()" :disabled="submitting">{{ $t('crud.cancel') }}</Button>
          <Button type="submit" :disabled="submitting || fields.length === 0">
            <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
            {{ $t('crud.save') }}
          </Button>
        </CardFooter>
      </Card>
      
    </form>
  </div>
</template>
