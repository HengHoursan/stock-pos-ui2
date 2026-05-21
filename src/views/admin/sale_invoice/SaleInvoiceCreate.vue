<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useForm, useFieldArray } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { useZod } from "@/hooks/useZod";
import { useCurrencyStore } from "@/stores/currency";
import { toLocalISOString, formatCurrency, formatNumberInput } from "@/utils/format";
import SearchableSelect from "@/components/SearchableSelect.vue";
import CurrencyToggle from "@/components/CurrencyToggle.vue";
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
import { useAppI18n } from "@/hooks/useAppI18n";

const { t, labels, fields, crud, group, actions, common, menu } = useAppI18n("saleInvoice");
const productLabels = group("product");

const route = useRoute();
const router = useRouter();
const siService = new SaleInvoiceService();
const soService = new SaleOrderService();
const customerService = new CustomerService();
const productService = new ProductService();
const currencyStore = useCurrencyStore();
const { z, err } = useZod();

const submitting = ref(false);
const products = ref<Product[]>([]);
const customers = ref<Customer[]>([]);

const customerOptions = computed(() => 
  customers.value.map(c => ({ label: `${c.name} (${c.code})`, value: c.id }))
);

const productOptions = computed(() => 
  products.value.map(p => ({ label: `[${p.code}] ${p.name}`, value: p.id, disabled: !p.forSelling }))
);

const saleInvoiceSchema = computed(() => 
  z.object({
    code: z.string().max(50, err.max("fields.code", 50)).optional().nullable(),
    customerId: z.number().min(1, err.required("fields.customerId")),
    invoiceDate: z.string().min(1, err.required("fields.invoiceDate")),
    paidAmount: z.coerce.number().min(0, err.min("fields.paidAmount", 0)).optional(),
    description: z.string().optional().nullable(),
    details: z.array(
      z.object({
        productId: z.number().min(1, err.required("product.name")),
        quantity: z.coerce.number().min(1, err.gte("fields.quantity", 1)),
        price: z.coerce.number().min(0, err.gte("fields.price", 0)),
        isSelected: z.boolean().default(true),
        saleOrderId: z.number().optional().nullable(),
        saleOrderDetailId: z.number().optional().nullable(),
      })
    ).min(1, err.min("fields.details", 1)),
  })
);

const formSchema = computed(() => toTypedSchema(saleInvoiceSchema.value));

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
          .filter((d: any) => (Number(d.quantity) - Number(d.invoicedQuantity || 0)) > 0)
          .map((d: any) => ({
            productId: d.productId,
            quantity: Number(d.quantity) - Number(d.invoicedQuantity || 0),
            price: Number(d.totalPrice) / Number(d.quantity),
            isSelected: true,
            saleOrderId: oRes?.data?.id, 
            saleOrderDetailId: d.id
          }));
        
        form.setFieldValue("details", mappedDetails as any);
        toast.info(t('validation.loadedFromSource', { source: menu.saleOrders }));
      }
    }
  } catch (error) {
    console.error("Failed to fetch dependencies", error);
  }
});

const { remove, push, fields: detailsFields } = useFieldArray("details");

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
    localPaidAmount.value = formatNumberInput(Number((baseAmount * newCurrency.exchangeRate).toFixed(2)));
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
      toast.success(t('crud.successCreate', { module: labels.name }));

      // Fire a warning toast for each product that fell below its alert threshold
      const warnings = response.data?.lowStockWarnings ?? [];
      for (const w of warnings) {
        const stockLabels = group("stock");
        toast.warning(
          `${stockLabels.lowStockAlert}: ${w.productName} (${w.productCode})`,
          {
            description: `${stockLabels.currentStock}: ${w.afterStock} — ${stockLabels.alertThreshold}: ${w.alertQuantity}`,
            duration: 8000,
          }
        );
      }

      router.push("/admin/sale-invoices");
    } else {
      toast.error(response.message || t('crud.errorCreate', { module: labels.name }));
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || t('crud.errorGeneral'));
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
          <h2 class="text-3xl font-bold tracking-tight">{{ crud.createBtn }} {{ labels.name }}</h2>
          <p class="text-muted-foreground text-sm flex items-center mt-1">
            <CreditCard class="w-4 h-4 mr-1.5 opacity-50"/> 
            {{ fields.saleInvoiceStockDeductInfo }}
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
              {{ crud.generalInfo }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <FormField v-slot="{ componentField }" name="code">
              <FormItem>
                <FormLabel>{{ fields.code }}</FormLabel>
                <FormControl>
                  <Input :placeholder="fields.autoGenerate" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="invoiceDate">
              <FormItem>
                <FormLabel>{{ fields.invoiceDate }}</FormLabel>
                <FormControl>
                  <Input type="datetime-local" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="customerId">
              <FormItem class="md:col-span-2">
                <FormLabel>{{ fields.customerId }}</FormLabel>
                <FormControl>
                  <SearchableSelect
                    :model-value="value"
                    @update:model-value="(v) => handleChange(v ? Number(v) : null)"
                    :options="customerOptions"
                    :placeholder="crud.selectValue"
                    :empty-message="crud.noResults"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="description">
              <FormItem class="md:col-span-2">
                <FormLabel>{{ fields.description }}</FormLabel>
                <FormControl>
                  <Textarea :placeholder="fields.enterDescription" v-bind="componentField" rows="3" />
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
              {{ fields.paymentDetails }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 space-y-4">
            
            <div class="p-3 bg-muted/20 border rounded text-sm mb-4">
              <div class="flex justify-between items-center mb-1">
                <span class="text-muted-foreground">{{ fields.totalPrice }}:</span>
                <span class="font-bold text-foreground">
                  {{ formatCurrency(grandTotal) }}
                </span>
              </div>
            </div>

            <FormField v-slot="{ componentField }" name="paidAmount">
              <FormItem>
                <FormLabel>{{ fields.paidAmount }}</FormLabel>
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
              <span>{{ fields.balanceDue }}:</span>
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
              {{ fields.details }}
            </CardTitle>
            <Button type="button" size="sm" @click="addProduct" variant="default">
              <Plus class="h-4 w-4 mr-2"/> {{ actions.addProduct }}
            </Button>
          </CardHeader>
          <CardContent class="p-0">
            <Table>
              <TableHeader class="bg-muted/30">
                <TableRow>
                  <TableHead class="w-[5%]"></TableHead>
                  <TableHead class="w-[40%]">{{ productLabels.name }}</TableHead>
                  <TableHead class="w-[20%] text-right">{{ fields.sellingPrice }}</TableHead>
                  <TableHead class="w-[15%] text-right">{{ fields.quantity }}</TableHead>
                  <TableHead class="w-[15%] text-right">{{ fields.rowTotal }}</TableHead>
                  <TableHead class="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="detailsFields.length === 0">
                  <TableCell colspan="6" class="text-center py-8 text-muted-foreground italic">
                    {{ common.noData }}
                  </TableCell>
                </TableRow>
                <TableRow v-for="(field, index) in detailsFields" :key="field.key" :class="!((form.values.details || [])[index] as any).isSelected ? 'opacity-50 grayscale' : ''">
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
                            :placeholder="fields.selectOption"
                            :empty-message="crud.noResults"
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
                            :disabled="!((form.values.details || [])[index] as any).isSelected" 
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
          </CardContent>
          <CardFooter class="flex justify-end gap-2 border-t px-6 py-4 bg-muted/5 mt-4">
            <Button variant="outline" type="button" @click="router.back()" :disabled="submitting">{{ crud.cancel }}</Button>
            <Button type="submit" :disabled="submitting || detailsFields.length === 0 || !form.values.details?.some((d: any) => d.isSelected)">
              <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ crud.save }}
            </Button>
          </CardFooter>
        </Card>

      </div>
    </form>
  </div>
</template>

