<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted, computed,watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toLocalISOString, formatCurrency, formatNumberInput } from "@/utils/format";
import SearchableSelect from "@/components/SearchableSelect.vue";
import CurrencyToggle from "@/components/CurrencyToggle.vue";
import { useCurrencyStore } from "@/stores/currency";

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
import { ChevronLeft, Loader2, FileText, Plus, Trash2, CreditCard } from "lucide-vue-next";

import { SaleInvoiceService } from "@/services/sale_invoice/sale_invoice.service";
import { SaleOrderService } from "@/services/sale_order/sale_order.service";
import { CustomerService } from "@/services/customer/customer.service";
import { ProductService } from "@/services/product/product.service";
import type { Product, Customer } from "@/types";
import { toast } from "vue-sonner";

const route = useRoute();
const router = useRouter();
const siService = new SaleInvoiceService();
const soService = new SaleOrderService();
const customerService = new CustomerService();
const productService = new ProductService();
const currencyStore = useCurrencyStore();

const submitting = ref(false);
const products = ref<Product[]>([]);
const customers = ref<Customer[]>([]);

const customerOptions = computed(() => 
  customers.value.map(c => ({ label: `${c.name} (${c.code})`, value: c.id }))
);

const productOptions = computed(() => 
  products.value.map(p => ({ label: `[${p.code}] ${p.name}`, value: p.id, disabled: !p.forSelling }))
);

onMounted(async () => {
  try {
    const [prodRes, custRes] = await Promise.all([
      productService.getAll(),
      customerService.getAll()
    ]);
    if (prodRes.success && prodRes.data) products.value = prodRes.data;
    if (custRes.success && custRes.data) customers.value = custRes.data;

    // Load from Order
    const orderId = Number(route.query.orderId);
    if (orderId) {
      const oRes = await soService.getDetail(orderId);
      if (oRes.success && oRes.data) {
        form.setFieldValue("customerId", oRes.data.customerId);
        
        const mappedDetails = (oRes.data.details || [])
          .filter((d: any) => !d.isInvoiced)
          .map((d: any) => ({
            productId: d.productId,
            quantity: Number(d.quantity),
            price: Number(d.totalPrice) / Number(d.quantity),
            isSelected: true,
            saleOrderId: oRes.data.id, // Explicitly use parent order ID
            saleOrderDetailId: d.id
          }));
        
        form.setFieldValue("details", mappedDetails as any);
        toast.info(t('validation.loadedFromSource', { source: t('modules.saleOrder') }));
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
    invoiceDate: z.string().min(1, t('validation.required', { field: t('fields.invoiceDate') })),
    paidAmount: z.coerce.number().min(0, t('validation.paidAmountNegative')).optional(),
    description: z.string().optional().nullable(),
    details: z.array(
      z.object({
        productId: z.number().min(1, t('validation.required', { field: t('modules.product') })),
        quantity: z.coerce.number().min(0.01, t('validation.min', { field: t('fields.quantity'), min: '0.01' })),
        price: z.coerce.number().min(0, t('validation.min', { field: t('fields.price'), min: '0' })),
        isSelected: z.boolean().default(true),
        saleOrderId: z.number().optional().nullable(),
        saleOrderDetailId: z.number().optional().nullable(),
      })
    ).min(1, t('validation.atLeastOneItem')),
  })
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    code: "",
    customerId: 0,
    invoiceDate: toLocalISOString(new Date()),
    paidAmount: 0,
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
    isSelected: true,
  });
}

function getProductPrice(productId: number): number {
  const p = products.value.find((x) => x.id === productId);
  return p?.detail ? Number(p.detail.salePrice || 0) : 0;
}

const grandTotal = computed(() => {
  return form.values.details?.reduce((acc, curr) => {
    if (!curr.isSelected) return acc;
    return acc + (curr.quantity * curr.price);
  }, 0) || 0;
});

const currencySymbol = computed(() => currencyStore.activeCurrency?.symbol ?? '$');
const localPaidAmount = ref("");
const localPrices = ref<Record<string, string>>({});
const localQuantities = ref<Record<string, string>>({});

// Watch for manual local amount changes
watch(localPaidAmount, (val) => {
  const cleanVal = Number(String(val).replace(/,/g, ''));
  const rate = currencyStore.activeCurrency?.exchangeRate || 1;
  const inUsd = cleanVal === 0 ? 0 : (cleanVal / rate);
  
  if (Math.abs((form.values.paidAmount || 0) - inUsd) > 0.001) {
    form.setFieldValue('paidAmount', inUsd);
  }
});

// Watch for base currency changes (e.g. from loading from source)
watch(() => form.values.paidAmount, (newVal) => {
  const rate = currencyStore.activeCurrency?.exchangeRate || 1;
  const expectedLocal = Number(((newVal || 0) * rate).toFixed(2));
  const currentClean = Number(localPaidAmount.value.replace(/,/g, ''));
  if (Math.abs(currentClean - expectedLocal) > 0.01) {
    localPaidAmount.value = formatNumberInput(expectedLocal);
  }
});

// Watch for active currency toggle
watch(() => currencyStore.activeCurrency, (newCurrency) => {
  if (newCurrency) {
    const baseAmount = form.values.paidAmount || 0;
    localPaidAmount.value = Number((baseAmount * newCurrency.exchangeRate).toFixed(2));
  }
});

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      code: values.code || undefined,
      customerId: values.customerId,
      invoiceDate: new Date(values.invoiceDate).toISOString(),
      paidAmount: values.paidAmount,
      description: values.description,
      details: (values.details as any[]).filter(d => d.isSelected).map((d: any) => ({
        productId: d.productId,
        quantity: Number(d.quantity),
        totalPrice: Math.round(Number(d.quantity) * Number(d.price) * 100) / 100,
        saleOrderId: d.saleOrderId,
        saleOrderDetailId: d.saleOrderDetailId
      }))
    };

    const response = await siService.create(payload as any);
    if (response.success) {
      toast.success(t('crud.successCreate', { module: t('modules.saleInvoice') }));

      // Fire a warning toast for each product that fell below its alert threshold
      const warnings = response.data?.lowStockWarnings ?? [];
      for (const w of warnings) {
        toast.warning(
          `${t('stock.lowStockAlert')}: ${w.productName} (${w.productCode})`,
          {
            description: `${t('stock.currentStock')}: ${w.afterStock} — ${t('stock.alertThreshold')}: ${w.alertQuantity}`,
            duration: 8000,
          }
        );
      }

      router.push("/admin/sale-invoices");
    } else {
      toast.error(response.message || t('crud.errorCreate', { module: t('modules.saleInvoice') }));
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
          <h2 class="text-3xl font-bold tracking-tight">{{ $t('crud.createBtn') }} {{ $t('modules.saleInvoice') }}</h2>
          <p class="text-muted-foreground text-sm flex items-center mt-1">
            <CreditCard class="w-4 h-4 mr-1.5 opacity-50"/> 
            {{ $t('fields.saleInvoiceStockDeductInfo') }}
          </p>
        </div>
      </div>
      <CurrencyToggle />
    </div>

    <form @submit="onSubmit">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        <!-- Document Info -->
        <Card class="md:col-span-8 shadow-sm border-muted-foreground/10 h-min">
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

            <FormField v-slot="{ componentField }" name="invoiceDate">
              <FormItem>
                <FormLabel>{{ $t('fields.invoiceDate') }}</FormLabel>
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
                    @update:model-value="(v) => handleChange(v ? Number(v) : null)"
                    :options="customerOptions"
                    :placeholder="$t('crud.selectValue', { module: $t('modules.customer') })"
                    :empty-message="$t('crud.noResults')"
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

        <!-- Payment Info sidebar -->
        <Card class="md:col-span-4 shadow-sm border-muted-foreground/10 h-min">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <CreditCard class="h-5 w-5 text-primary" />
              {{ $t('fields.paymentDetails') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 space-y-4">
            
            <div class="p-3 bg-muted/20 border rounded text-sm mb-4">
              <div class="flex justify-between items-center mb-1">
                <span class="text-muted-foreground">{{ $t('fields.totalPrice') }}:</span>
                <span class="font-bold text-foreground">
                  {{ formatCurrency(grandTotal) }}
                </span>
              </div>
            </div>

            <FormField v-slot="{ componentField }" name="paidAmount">
              <FormItem>
                <FormLabel>{{ $t('fields.paidAmount') }}</FormLabel>
                <FormControl>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{{ currencySymbol }}</span>
                      <Input 
                        type="text" 
                        :name="componentField.name"
                        @blur="componentField.onBlur"
                        :model-value="localPaidAmount"
                        @update:model-value="(val) => localPaidAmount = formatNumberInput(String(val))"
                        class="pl-9 font-bold text-lg text-success" 
                      />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>


            <div class="flex justify-between items-center pt-2 text-sm text-muted-foreground border-t mt-4">
              <span>{{ $t('fields.balanceDue') }}:</span>
              <span class="" :class="(grandTotal - (form.values.paidAmount || 0)) > 0 ? 'text-destructive font-bold' : 'text-success'">
                {{ formatCurrency(Math.max(0, grandTotal - (form.values.paidAmount || 0))) }}
              </span>
            </div>

          </CardContent>
        </Card>

        <!-- Product Details Table -->
        <Card class="md:col-span-12 shadow-sm border-muted-foreground/10">
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
                  <TableHead class="w-[5%]"></TableHead>
                  <TableHead class="w-[40%]">{{ $t('modules.product') }}</TableHead>
                  <TableHead class="w-[20%] text-right">{{ $t('fields.sellingPrice') }}</TableHead>
                  <TableHead class="w-[15%] text-right">{{ $t('fields.quantity') }}</TableHead>
                  <TableHead class="w-[15%] text-right">{{ $t('fields.rowTotal') }}</TableHead>
                  <TableHead class="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="fields.length === 0">
                  <TableCell colspan="6" class="text-center py-8 text-muted-foreground italic">
                    {{ $t('common.noData') }}
                  </TableCell>
                </TableRow>
                <TableRow v-for="(field, index) in fields" :key="field.key" :class="!((form.values.details || [])[index] as any).isSelected ? 'opacity-50 grayscale' : ''">
                  <TableCell>
                    <FormField v-slot="{ value, handleChange }" :name="`details[${index}].isSelected`">
                      <FormItem class="mb-0">
                        <FormControl>
                          <input 
                            type="checkbox" 
                            :checked="value" 
                            @change="handleChange(!value)"
                            class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </FormControl>
                      </FormItem>
                    </FormField>
                  </TableCell>
                  <TableCell>
                    <FormField v-slot="{ value, handleChange }" :name="`details[${index}].productId`">
                      <FormItem class="mb-0">
                        <FormControl>
                          <SearchableSelect
                            :model-value="value"
                            @update:model-value="(v) => {
                              const id = v ? Number(v) : null;
                              handleChange(id);
                              if (id) form.setFieldValue(`details[${index}].price` as any, getProductPrice(id));
                            }"
                            :options="productOptions"
                            :placeholder="$t('fields.selectOption')"
                            :empty-message="$t('crud.noResults')"
                            :disabled="!((form.values.details || [])[index] as any).isSelected"
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
                            :disabled="!((form.values.details || [])[index] as any).isSelected" 
                            :model-value="localPrices[field.key] ?? formatNumberInput(componentField.modelValue)"
                            @update:model-value="(val) => {
                              localPrices[field.key] = formatNumberInput(String(val));
                              const clean = Number(localPrices[field.key].replace(/,/g, ''));
                              form.setFieldValue(`details[${index}].price`, clean);
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
                            :disabled="!((form.values.details || [])[index] as any).isSelected" 
                            :model-value="localQuantities[field.key] ?? formatNumberInput(componentField.modelValue)"
                            @update:model-value="(val) => {
                              localQuantities[field.key] = formatNumberInput(String(val));
                              const clean = Number(localQuantities[field.key].replace(/,/g, ''));
                              form.setFieldValue(`details[${index}].quantity`, clean);
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
          </CardContent>
          <CardFooter class="flex justify-end gap-2 border-t px-6 py-4 bg-muted/5 mt-4">
            <Button variant="outline" type="button" @click="router.back()" :disabled="submitting">{{ $t('crud.cancel') }}</Button>
            <Button type="submit" :disabled="submitting || fields.length === 0 || !form.values.details?.some((d: any) => d.isSelected)">
              <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ $t('crud.save') }}
            </Button>
          </CardFooter>
        </Card>

      </div>
    </form>
  </div>
</template>

