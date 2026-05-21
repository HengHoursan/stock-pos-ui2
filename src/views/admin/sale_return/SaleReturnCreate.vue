<script setup lang="ts">
import { useAppI18n } from "@/hooks/useAppI18n";
const { t, labels, fields, crud, group } = useAppI18n("saleReturn");
const productLabels = group("product");
const saleInvoiceLabels = group("saleInvoice");
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toLocalISOString, formatNumberInput, formatCurrency } from "@/utils/format";

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
import {
  ChevronLeft,
  Loader2,
  FileText,
  Plus,
  Trash2,
  Package,
  History,
  Users,
} from "lucide-vue-next";

import { SaleReturnService } from "@/services/sale_return/sale_return.service";
import { SaleInvoiceService } from "@/services/sale_invoice/sale_invoice.service";
import { ProductService } from "@/services/product/product.service";
import type { SaleInvoice, Product } from "@/types";
import { InvoiceStatus } from "@/types/enums";
import { toast } from "vue-sonner";

const route = useRoute();
const router = useRouter();
const srService = new SaleReturnService();
const siService = new SaleInvoiceService();
const productService = new ProductService();

const submitting = ref(false);
const loadingInvoices = ref(false);
const products = ref<Product[]>([]);
const invoices = ref<SaleInvoice[]>([]);
const selectedInvoice = ref<SaleInvoice | null>(null);

async function fetchDependencies() {
  loadingInvoices.value = true;
  try {
    const [prodRes, invRes] = await Promise.all([
      productService.getAll(),
      siService.getList({
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "DESC",
        filter: { status: String(InvoiceStatus.COMPLETED) },
      }),
    ]);
    if (prodRes.success && prodRes.data) products.value = prodRes.data;
    if (invRes.success && invRes.data) invoices.value = invRes.data.data;
  } catch (error) {
    console.error("Failed to fetch dependencies", error);
  } finally {
    loadingInvoices.value = false;
  }
}

onMounted(async () => {
  await fetchDependencies();

  const qInvoiceId = Number(route.query.invoiceId);
  if (qInvoiceId) {
    const inv = invoices.value.find((i) => i.id === qInvoiceId);
    if (inv) {
      form.setFieldValue("saleInvoiceId", inv.id);
      loadItemsFromInvoice(inv.id);
    }
  }
});

const formSchema = toTypedSchema(
  z.object({
    code: z.string().max(50).optional().nullable(),
    saleInvoiceId: z
      .number()
      .min(1, t("validation.required", { field: saleInvoiceLabels.name })),
    returnDate: z
      .string()
      .min(1, t("validation.required", { field: fields.date })),
    remarks: z.string().optional().nullable(),
    details: z
      .array(
        z.object({
          productId: z
            .number()
            .min(1, t("validation.required", { field: productLabels.name })),
          quantity: z
            .number()
            .min(
              1,
              t("validation.min", { field: fields.quantity, min: "1" }),
            ),
          totalPrice: z
            .number()
            .min(
              0,
              t("validation.min", { field: fields.price, min: "0" }),
            ),
        }),
      )
      .min(1, t("validation.atLeastOneItem")),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    code: "",
    saleInvoiceId: 0,
    returnDate: toLocalISOString(new Date()),
    remarks: "",
    details: [],
  },
});

const { remove, push, fields: detailFields, replace } = useFieldArray("details");


async function loadItemsFromInvoice(invoiceId: number) {
  try {
    const res = await siService.getDetail(invoiceId);
    if (res.success && res.data) {
      selectedInvoice.value = res.data;
      const invoiceItems = res.data.details || [];
      const returnItems = invoiceItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: getProductPrice(item.productId),
        totalPrice: item.totalPrice,
      }));
      replace(returnItems);
      toast.info(
        t("validation.loadedFromSource", { source: saleInvoiceLabels.name }),
      );
    }
  } catch (error) {
    toast.error("Failed to load invoice items");
  }
}

watch(
  () => form.values.saleInvoiceId,
  (newId) => {
    if (newId) {
      loadItemsFromInvoice(newId);
    } else {
      selectedInvoice.value = null;
      replace([]);
    }
  },
);

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
  return (
    form.values.details?.reduce((acc, curr) => {
      return acc + Number(curr.totalPrice);
    }, 0) || 0
  );
});

const localQuantities = ref<Record<string, string>>({});
const localTotalPrices = ref<Record<string, string>>({});

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      ...values,
      returnDate: new Date(values.returnDate).toISOString(),
      details: values.details.map((d) => ({
        productId: d.productId,
        quantity: Number(d.quantity),
        unitPrice: getProductPrice(d.productId),
        totalPrice: Number(d.totalPrice),
      })),
    };

    const response = await srService.create(payload as any);
    if (response.success) {
      toast.success(
        t("crud.successCreate", { module: labels.name }),
      );
      router.push("/admin/sale-returns");
    } else {
      toast.error(
        response.message ||
          t("crud.errorCreate", { module: labels.name }),
      );
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
    <div class="flex items-center gap-4">
      <Button variant="outline" size="icon" @click="router.back()">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">
          {{ crud.createBtn }} {{ labels.name }}
        </h2>
        <p class="text-muted-foreground text-sm flex items-center mt-1">
          <History class="w-4 h-4 mr-1.5 opacity-50" />
          {{ labels.description }}
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
                  <Input
                    :placeholder="fields.autoGenerate"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="returnDate">
              <FormItem>
                <FormLabel>{{ fields.date }}</FormLabel>
                <FormControl>
                  <Input type="datetime-local" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="saleInvoiceId">
              <FormItem class="md:col-span-2">
                <FormLabel
                  >{{ saleInvoiceLabels.name }} ({{
                    fields.completedOnly
                  }})</FormLabel
                >
                <Select
                  :model-value="value ? String(value) : undefined"
                  @update:model-value="(v) => handleChange(Number(v))"
                >
                  <FormControl>
                    <SelectTrigger :disabled="loadingInvoices">
                      <SelectValue :placeholder="fields.selectOption" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem
                      v-for="i in invoices"
                      :key="i.id"
                      :value="String(i.id)"
                    >
                      {{ i.code }} - {{ i.customer?.name }} ({{
                        formatCurrency(i.totalPrice)
                      }})
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="remarks">
              <FormItem class="md:col-span-2">
                <FormLabel>{{ fields.remarks }}</FormLabel>
                <FormControl>
                  <Textarea
                    :placeholder="fields.enterDescription"
                    v-bind="componentField"
                    rows="3"
                  />
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

            <div
              v-if="selectedInvoice"
              class="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg text-sm space-y-2"
            >
              <p class="font-bold flex items-center gap-2 text-primary">
                <FileText class="h-4 w-4" />
                {{ saleInvoiceLabels.name }} {{ fields.details }}
              </p>
              <div class="flex justify-between">
                <span class="text-muted-foreground"
                  >{{ fields.totalPrice }}:</span
                >
                <span class="font-bold"
                  >{{ formatCurrency(selectedInvoice.totalPrice) }}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground"
                  >{{ fields.totalPaid }}:</span
                >
                <span class="text-success font-bold"
                  >{{ formatCurrency(selectedInvoice.paidAmount) }}</span
                >
              </div>
            </div>
          </CardContent>
          <CardFooter class="flex flex-col gap-2 border-t pt-4">
            <Button
              type="submit"
              class="w-full"
              :disabled="submitting || detailFields.length === 0"
            >
              <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ crud.save }}
            </Button>
            <Button
              variant="outline"
              type="button"
              class="w-full"
              @click="router.back()"
              :disabled="submitting"
            >
              {{ crud.cancel }}
            </Button>
          </CardFooter>
        </Card>

        <!-- Product Details Table -->
        <Card class="md:col-span-12 shadow-sm border-muted-foreground/10">
          <CardHeader
            class="pb-3 border-b bg-muted/5 flex flex-row items-center justify-between"
          >
            <CardTitle class="text-lg flex items-center gap-2">
              <Package class="h-5 w-5 text-primary" />
              {{ fields.details }}
            </CardTitle>
            <Button
              type="button"
              size="sm"
              @click="addProduct"
              variant="default"
            >
              <Plus class="h-4 w-4 mr-2" /> {{ t("actions.addProduct") }}
            </Button>
          </CardHeader>
          <CardContent class="p-0">
            <Table>
              <TableHeader class="bg-muted/30">
                <TableRow>
                  <TableHead class="w-[40%]">{{
                    productLabels.name
                  }}</TableHead>
                  <TableHead class="w-[15%] text-right">{{
                    fields.unitPrice
                  }}</TableHead>
                  <TableHead class="w-[15%] text-right">{{
                    fields.quantity
                  }}</TableHead>
                  <TableHead class="w-[20%] text-right">{{
                    fields.rowTotal
                  }}</TableHead>
                  <TableHead class="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="detailFields.length === 0">
                  <TableCell
                    colspan="5"
                    class="text-center py-8 text-muted-foreground italic"
                  >
                    {{ t("common.noData") }}
                  </TableCell>
                </TableRow>
                <TableRow v-for="(field, index) in detailFields" :key="field.key">
                  <TableCell>
                    <FormField
                      v-slot="{ value, handleChange }"
                      :name="`details[${index}].productId`"
                    >
                      <FormItem class="mb-0">
                        <Select
                          :model-value="value ? String(value) : undefined"
                          @update:model-value="
                            (v) => {
                              handleChange(Number(v));
                              const price = getProductPrice(Number(v));
                              const qty =
                                form.values.details?.[index]?.quantity || 0;
                              form.setFieldValue(
                                `details[${index}].totalPrice` as any,
                                Number((price * qty).toFixed(2)),
                              );
                            }
                          "
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                :placeholder="fields.selectOption"
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem
                              v-for="p in products"
                              :key="p.id"
                              :value="String(p.id)"
                            >
                              [{{ p.code }}] {{ p.name }}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </TableCell>
                  <TableCell class="text-right">
                    {{
                      formatCurrency(getProductPrice(
                        (form.values.details || [])[index]?.productId,
                      ))
                    }}
                  </TableCell>
                  <TableCell>
                    <FormField
                      v-slot="{ componentField }"
                      :name="`details[${index}].quantity`"
                    >
                      <FormItem class="mb-0">
                        <FormControl>
                          <Input
                            type="text"
                            class="text-right"
                            :name="componentField.name"
                            @blur="componentField.onBlur"
                            :model-value="localQuantities[field.key] ?? formatNumberInput(componentField.modelValue)"
                            @input="
                              (e: any) => {
                                const val = e.target.value;
                                localQuantities[field.key] = formatNumberInput(String(val));
                                const qty = Number(localQuantities[field.key].replace(/,/g, ''));
                                form.setFieldValue(`details[${index}].quantity` as any, qty);
                                
                                const price = getProductPrice(
                                  (form.values.details || [])[index]?.productId,
                                );
                                const totalPrice = Number((price * qty).toFixed(2));
                                form.setFieldValue(
                                  `details[${index}].totalPrice` as any,
                                  totalPrice,
                                );
                                // Sync localTotalPrice too
                                localTotalPrices[field.key] = formatNumberInput(totalPrice);
                              }
                            "
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </TableCell>
                  <TableCell>
                    <FormField
                      v-slot="{ componentField }"
                      :name="`details[${index}].totalPrice`"
                    >
                      <FormItem class="mb-0">
                        <FormControl>
                          <Input
                            type="text"
                            class="text-right font-bold"
                            :name="componentField.name"
                            @blur="componentField.onBlur"
                            :model-value="localTotalPrices[field.key] ?? formatNumberInput(componentField.modelValue)"
                            @update:model-value="(val) => {
                              localTotalPrices[field.key] = formatNumberInput(String(val));
                              const clean = Number(localTotalPrices[field.key].replace(/,/g, ''));
                              form.setFieldValue(`details[${index}].totalPrice` as any, clean);
                            }"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      class="text-destructive hover:bg-destructive/10"
                      @click="remove(index)"
                    >
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
