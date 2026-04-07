<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toLocalISOString } from "@/utils/format";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Loader2, FileText, Plus, Trash2, Truck, CreditCard } from "lucide-vue-next";

import { PurchaseInvoiceService } from "@/services/purchase_invoice/purchase_invoice.service";
import { PurchaseOrderService } from "@/services/purchase_order/purchase_order.service";
import { SupplierService } from "@/services/supplier/supplier.service";
import { ProductService } from "@/services/product/product.service";
import type { Product, Supplier } from "@/types";
import { PaymentMethod } from "@/types/enums";
import { toast } from "vue-sonner";

const route = useRoute();
const router = useRouter();
const piService = new PurchaseInvoiceService();
const poService = new PurchaseOrderService();
const supplierService = new SupplierService();
const productService = new ProductService();

const submitting = ref(false);
const products = ref<Product[]>([]);
const suppliers = ref<Supplier[]>([]);

onMounted(async () => {
  try {
    const [prodRes, supRes] = await Promise.all([
      productService.getAll(),
      supplierService.getAll()
    ]);
    if (prodRes.success && prodRes.data) products.value = prodRes.data;
    if (supRes.success && supRes.data) suppliers.value = supRes.data;

    // Load from Order
    const orderId = Number(route.query.orderId);
    if (orderId) {
      const oRes = await poService.getDetail(orderId);
      if (oRes.success && oRes.data) {
        form.setFieldValue("supplierId", oRes.data.supplierId);
        
        const mappedDetails = (oRes.data.details || []).map(d => ({
          productId: d.productId,
          quantity: d.quantity,
          price: d.totalPrice / d.quantity,
          purchaseOrderId: d.purchaseOrderId,
          purchaseOrderDetailId: d.id
        }));
        
        form.setFieldValue("details" as any, mappedDetails);
        toast.info(t('validation.loadedFromSource', { source: t('modules.purchaseOrder') }));
      }
    }
  } catch (error) {
    console.error("Failed to fetch dependencies", error);
  }
});

const formSchema = toTypedSchema(
  z.object({
    code: z.string().max(50).optional().nullable(),
    supplierId: z.number().min(1, t('validation.required', { field: t('fields.supplierId') })),
    invoiceDate: z.string().min(1, t('validation.required', { field: t('fields.invoiceDate') })),
    paidAmount: z.number().min(0, t('validation.paidAmountNegative')).optional(),
    paymentMethod: z.number().optional(),
    description: z.string().optional().nullable(),
    details: z.array(
      z.object({
        productId: z.number().min(1, t('validation.required', { field: t('modules.product') })),
        quantity: z.number().min(0.01, t('validation.min', { field: t('fields.quantity'), min: '0.01' })),
        price: z.number().min(0, t('validation.min', { field: t('fields.price'), min: '0' })),
        purchaseOrderId: z.number().optional().nullable(),
        purchaseOrderDetailId: z.number().optional().nullable(),
      })
    ).min(1, t('validation.atLeastOneItem')),
  })
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    code: "",
    supplierId: 0,
    invoiceDate: toLocalISOString(new Date()),
    paidAmount: 0,
    paymentMethod: PaymentMethod.CASH,
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

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      code: values.code || undefined,
      supplierId: values.supplierId,
      invoiceDate: new Date(values.invoiceDate).toISOString(),
      paidAmount: values.paidAmount,
      paymentMethod: values.paymentMethod,
      description: values.description,
      details: values.details.map((d: any) => ({
        productId: d.productId,
        quantity: Number(d.quantity),
        totalPrice: Number(d.quantity) * Number(d.price),
        purchaseOrderId: d.purchaseOrderId,
        purchaseOrderDetailId: d.purchaseOrderDetailId
      }))
    };

    const response = await piService.create(payload as any);
    if (response.success) {
      toast.success(t('crud.successCreate', { module: t('modules.purchaseInvoice') }));
      router.push("/admin/purchase-invoices");
    } else {
      toast.error(response.message || t('crud.errorCreate', { module: t('modules.purchaseInvoice') }));
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
        <h2 class="text-3xl font-bold tracking-tight">{{ $t('crud.createBtn') }} {{ $t('modules.purchaseInvoice') }}</h2>
        <p class="text-muted-foreground text-sm flex items-center mt-1">
          <Truck class="w-4 h-4 mr-1.5 opacity-50"/> 
          {{ $t('fields.invoiceStockUpdateInfo') }}
        </p>
      </div>
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

            <FormField v-slot="{ value, handleChange }" name="supplierId">
              <FormItem class="md:col-span-2">
                <FormLabel>{{ $t('fields.supplierId') }}</FormLabel>
                <Select
                  :model-value="value ? String(value) : undefined"
                  @update:model-value="(v) => handleChange(Number(v))"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue :placeholder="$t('fields.selectOption')" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem v-for="s in suppliers" :key="s.id" :value="String(s.id)">
                      {{ s.name }} ({{ s.code }})
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                <span class="font-mono font-bold text-foreground">
                  ${{ grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2}) }}
                </span>
              </div>
            </div>

            <FormField v-slot="{ componentField }" name="paidAmount">
              <FormItem>
                <FormLabel>{{ $t('fields.paidAmount') }}</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="paymentMethod">
              <FormItem>
                <FormLabel>{{ $t('fields.paymentMethod') }}</FormLabel>
                <Select
                  :model-value="value ? String(value) : undefined"
                  @update:model-value="(v) => handleChange(Number(v))"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue :placeholder="$t('fields.selectOption')" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem :value="String(PaymentMethod.CASH)">{{ $t('fields.paymentMethodLabels.cash') }}</SelectItem>
                    <SelectItem :value="String(PaymentMethod.TRANSFER)">{{ $t('fields.paymentMethodLabels.transfer') }}</SelectItem>
                    <SelectItem :value="String(PaymentMethod.OTHER)">{{ $t('fields.paymentMethodLabels.other') }}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <div class="flex justify-between items-center pt-2 text-sm text-muted-foreground border-t mt-4">
              <span>{{ $t('fields.balanceDue') }}:</span>
              <span class="font-mono" :class="(grandTotal - (form.values.paidAmount || 0)) > 0 ? 'text-destructive font-bold' : 'text-success'">
                ${{ Math.max(0, grandTotal - (form.values.paidAmount || 0)).toLocaleString(undefined, {minimumFractionDigits: 2}) }}
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
                  <TableHead class="w-[40%]">{{ $t('modules.product') }}</TableHead>
                  <TableHead class="w-[20%] text-right">{{ $t('fields.unitPrice') }}</TableHead>
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
                        <Select 
                          :model-value="value ? String(value) : undefined" 
                          @update:model-value="(v) => {
                            handleChange(Number(v));
                            form.setFieldValue(`details[${index}].price` as any, getProductPrice(Number(v)));
                          }"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue :placeholder="$t('fields.selectOption')" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem v-for="p in products" :key="p.id" :value="String(p.id)">
                              [{{ p.code }}] {{ p.name }}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </TableCell>
                  <TableCell>
                    <FormField v-slot="{ componentField }" :name="`details[${index}].price`">
                      <FormItem class="mb-0">
                        <FormControl>
                          <Input type="number" step="0.01" min="0" class="text-right" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </TableCell>
                  <TableCell>
                    <FormField v-slot="{ componentField }" :name="`details[${index}].quantity`">
                      <FormItem class="mb-0">
                        <FormControl>
                          <Input type="number" step="0.01" min="0.01" class="text-right" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </TableCell>
                  <TableCell class="text-right font-mono font-medium">
                    {{ (((form.values.details || [])[index]?.quantity || 0) * ((form.values.details || [])[index]?.price || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}
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
            <Button type="submit" :disabled="submitting || fields.length === 0">
              <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ $t('crud.save') }}
            </Button>
          </CardFooter>
        </Card>

      </div>
    </form>
  </div>
</template>
