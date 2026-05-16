<script setup lang="ts">
import { useAppI18n } from "@/hooks/useAppI18n";
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { toLocalISOString, formatNumberInput, formatCurrency } from "@/utils/format";
import SearchableSelect from "@/components/SearchableSelect.vue";

import { useForm, useFieldArray } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { useZod } from "@/hooks/useZod";

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
import { ChevronLeft, Loader2, FileText, Plus, Trash2, Package, Users } from "lucide-vue-next";

import { SaleQuotationService } from "@/services/sale_quotation/sale_quotation.service";
import { CustomerService } from "@/services/customer/customer.service";
import { ProductService } from "@/services/product/product.service";
import type { Product, Customer } from "@/types";
import { toast } from "vue-sonner";

const { t, labels, fields, crud, common, actions, group } = useAppI18n("saleQuotation");
const { z, err } = useZod();
const productLabels = group("product");
const router = useRouter();
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
  products.value.map(p => ({ label: `[${p.code}] ${p.name}`, value: p.id }))
);

onMounted(async () => {
  try {
    const [prodRes, custRes] = await Promise.all([
      productService.getAll(),
      customerService.getAll()
    ]);
    if (prodRes.success && prodRes.data) products.value = prodRes.data;
    if (custRes.success && custRes.data) customers.value = custRes.data;
  } catch (error) {
    console.error("Failed to fetch dependencies", error);
  }
});

const formSchema = toTypedSchema(
  z.object({
    code: z.string().max(50, err.max("fields.code", 50)).optional().nullable(),
    customerId: z.coerce.number().min(1, err.required("fields.customerId")),
    quotationDate: z.string().min(1, err.required("fields.date")),
    description: z.string().optional().nullable(),
    details: z
      .array(
        z.object({
          productId: z.coerce.number().min(1, err.required("product.name")),
          quantity: z.coerce.number().min(0.01, err.min("fields.quantity", 0.01)),
          price: z.coerce.number().min(0, err.min("fields.price", 0)),
        }),
      )
      .min(1, err.min("fields.details", 1)),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    code: "",
    customerId: 0,
    quotationDate: toLocalISOString(new Date()),
    description: "",
    details: [],
  },
});

const { remove, push, fields: detailsFields } = useFieldArray("details");

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
      quotationDate: new Date(values.quotationDate).toISOString(),
      description: values.description,
      details: values.details.map((d: any) => ({
        productId: d.productId,
        quantity: Number(d.quantity),
        totalPrice: Number(d.quantity) * Number(d.price),
      }))
    };

    const response = await sqService.create(payload as any);
    if (response.success) {
      toast.success(t('crud.successCreate', { module: labels.name }));
      router.push("/admin/sale-quotations");
    } else {
      toast.error(response.message || t('crud.errorCreate', { module: labels.name }));
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
        <h2 class="text-3xl font-bold tracking-tight">{{ crud.createBtn }} {{ labels.name }}</h2>
        <p class="text-muted-foreground text-sm flex items-center mt-1">
          <FileText class="w-4 h-4 mr-1.5 opacity-50"/> 
          {{ labels.quotationInfo }}
        </p>
      </div>
    </div>

    <form @submit="onSubmit">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        <!-- Document Info -->
        <Card class="md:col-span-8 shadow-sm border-muted-foreground/10 h-min">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <Users class="h-5 w-5 text-primary" />
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

            <FormField v-slot="{ componentField }" name="quotationDate">
              <FormItem>
                <FormLabel>{{ fields.date }}</FormLabel>
                <FormControl>
                  <Input type="datetime-local" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="customerId">
              <FormItem class="md:col-span-2">
                <FormLabel>{{ fields.customerId }}</FormLabel>
                <SearchableSelect
                  :model-value="value"
                  @update:model-value="(v) => handleChange(v ? Number(v) : undefined)"
                  :options="customerOptions"
                  :placeholder="fields.selectOption"
                  :empty-message="crud.noResults"
                  class="w-full"
                />
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

        <!-- Summary sidebar -->
        <Card class="md:col-span-4 shadow-sm border-muted-foreground/10 h-min">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2 text-primary">
              <FileText class="h-5 w-5" />
              {{ fields.grandTotal }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="text-center p-4 bg-muted/20 border rounded-lg">
              <span class="text-3xl font-bold text-primary">
                {{ formatCurrency(grandTotal) }}
              </span>
            </div>
          </CardContent>
          <CardFooter class="flex flex-col gap-2 border-t pt-4">
            <Button type="submit" class="w-full" :disabled="submitting || detailsFields.length === 0">
              <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ crud.save }}
            </Button>
            <Button variant="outline" type="button" class="w-full" @click="router.back()" :disabled="submitting">
              {{ crud.cancel }}
            </Button>
          </CardFooter>
        </Card>

        <!-- Product Details Table -->
        <Card class="md:col-span-12 shadow-sm border-muted-foreground/10">
          <CardHeader class="pb-3 border-b bg-muted/5 flex flex-row items-center justify-between">
            <CardTitle class="text-lg flex items-center gap-2">
              <Package class="h-5 w-5 text-primary" />
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
                  <TableHead class="w-[40%]">{{ productLabels.name }}</TableHead>
                  <TableHead class="w-[20%] text-right">{{ fields.unitPrice }}</TableHead>
                  <TableHead class="w-[15%] text-right">{{ fields.quantity }}</TableHead>
                  <TableHead class="w-[20%] text-right">{{ fields.rowTotal }}</TableHead>
                  <TableHead class="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="fields.length === 0">
                  <TableCell colspan="5" class="text-center py-8 text-muted-foreground italic">
                    {{ common.noData }}
                  </TableCell>
                </TableRow>
                <TableRow v-for="(field, index) in detailsFields" :key="field.key">
                  <TableCell>
                    <FormField v-slot="{ value, handleChange }" :name="`details[${index}].productId`">
                      <FormItem class="mb-0">
                        <SearchableSelect
                          :model-value="value"
                          @update:model-value="(v) => {
                            handleChange(v ? Number(v) : 0);
                            form.setFieldValue(`details[${index}].price` as any, getProductPrice(Number(v)));
                          }"
                          :options="productOptions"
                          :placeholder="fields.selectOption"
                          :empty-message="crud.noResults"
                          class="w-full"
                        />
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
          </CardContent>
        </Card>

      </div>
    </form>
  </div>
</template>
