<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toLocalISOString, formatNumberInput } from "@/utils/format";

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
  Users,
} from "lucide-vue-next";

import { PurchaseReturnService } from "@/services/purchase_return/purchase_return.service";
import { PurchaseInvoiceService } from "@/services/purchase_invoice/purchase_invoice.service";
import { ProductService } from "@/services/product/product.service";
import { SupplierService } from "@/services/supplier/supplier.service";
import type { PurchaseInvoice, Product, Supplier } from "@/types";
import { InvoiceStatus } from "@/types/enums";
import { toast } from "vue-sonner";

const route = useRoute();
const router = useRouter();
const prService = new PurchaseReturnService();
const piService = new PurchaseInvoiceService();
const productService = new ProductService();
const supplierService = new SupplierService();

const submitting = ref(false);
const loadingInvoices = ref(false);
const products = ref<Product[]>([]);
const invoices = ref<PurchaseInvoice[]>([]);
const suppliers = ref<Supplier[]>([]);
const selectedInvoice = ref<PurchaseInvoice | null>(null);

async function fetchDependencies() {
  loadingInvoices.value = true;
  try {
    const [prodRes, invRes, supRes] = await Promise.all([
      productService.getAll(),
      piService.getList({
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "DESC",
        filter: { status: String(InvoiceStatus.COMPLETED) },
      }),
      supplierService.getAll(),
    ]);
    if (prodRes.success && prodRes.data) products.value = prodRes.data;
    if (invRes.success && invRes.data) invoices.value = invRes.data.data;
    if (supRes.success && supRes.data) suppliers.value = supRes.data;
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
      form.setFieldValue("purchaseInvoiceId", inv.id);
      form.setFieldValue("supplierId", inv.supplierId);
      loadItemsFromInvoice(inv.id);
    }
  }
});

const formSchema = toTypedSchema(
  z.object({
    code: z.string().max(50).optional().nullable(),
    supplierId: z
      .number()
      .min(1, t("validation.required", { field: t("fields.supplierId") })),
    purchaseInvoiceId: z.number().optional().nullable(),
    returnDate: z
      .string()
      .min(1, t("validation.required", { field: t("fields.invoiceDate") })),
    description: z.string().optional().nullable(),
    details: z
      .array(
        z.object({
          productId: z
            .number()
            .min(1, t("validation.required", { field: t("modules.product") })),
          quantity: z
            .number()
            .min(
              0.01,
              t("validation.min", { field: t("fields.quantity"), min: "0.01" }),
            ),
          unitPrice: z
            .number()
            .min(
              0,
              t("validation.min", { field: t("fields.price"), min: "0" }),
            ),
          totalPrice: z
            .number()
            .min(
              0,
              t("validation.min", { field: t("fields.price"), min: "0" }),
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
    supplierId: 0,
    purchaseInvoiceId: null,
    returnDate: toLocalISOString(new Date()),
    description: "",
    details: [],
  },
});

const { remove, push, fields, replace } = useFieldArray("details");

async function loadItemsFromInvoice(invoiceId: number) {
  try {
    const res = await piService.getDetail(invoiceId);
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
        t("validation.loadedFromSource", {
          source: t("modules.purchaseInvoice"),
        }),
      );
    }
  } catch (error) {
    toast.error("Failed to load invoice items");
  }
}

watch(
  () => form.values.purchaseInvoiceId,
  (newId) => {
    if (newId) {
      loadItemsFromInvoice(newId);
      const inv = invoices.value.find((i) => i.id === newId);
      if (inv) form.setFieldValue("supplierId", inv.supplierId);
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
  return p?.detail ? Number(p.detail.purchasePrice || 0) : 0;
}

const grandTotal = computed(() => {
  return (
    form.values.details?.reduce((acc, curr) => {
      return acc + Number(curr.totalPrice || 0);
    }, 0) || 0
  );
});

const localUnitPrices = ref<Record<string, string>>({});
const localQuantities = ref<Record<string, string>>({});
const localTotalPrices = ref<Record<string, string>>({});

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      ...values,
      returnDate: new Date(values.returnDate).toISOString(),
    };

    const response = await prService.create(payload as any);
    if (response.success) {
      toast.success(
        t("crud.successCreate", { module: t("modules.purchaseReturn") }),
      );
      router.push("/admin/purchase-returns");
    } else {
      toast.error(
        response.message ||
          t("crud.errorCreate", { module: t("modules.purchaseReturn") }),
      );
    }
  } catch (error) {
    toast.error(t("crud.errorGeneral"));
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
          {{ $t("crud.createBtn") }} {{ $t("modules.purchaseReturn") }}
        </h2>
        <p class="text-muted-foreground text-sm flex items-center mt-1">
          {{ $t("fields.purchaseReturnInfo") }}
        </p>
      </div>
    </div>

    <form @submit="onSubmit">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        <!-- Document Info -->
        <Card
          class="md:col-span-8 shadow-sm border-muted-foreground/10 h-min text-card-foreground"
        >
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <Users class="h-5 w-5 text-primary" />
              {{ $t("crud.generalInfo") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField v-slot="{ componentField }" name="code">
              <FormItem>
                <FormLabel>{{ $t("fields.code") }}</FormLabel>
                <FormControl>
                  <Input
                    :placeholder="$t('fields.autoGenerate')"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="returnDate">
              <FormItem>
                <FormLabel>{{ $t("fields.date") }}</FormLabel>
                <FormControl>
                  <Input type="datetime-local" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="supplierId">
              <FormItem>
              <FormLabel>{{ $t("fields.supplierId") }}</FormLabel>
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
                    <SelectItem
                      v-for="s in suppliers"
                      :key="s.id"
                      :value="String(s.id)"
                    >
                      {{ s.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField
              v-slot="{ value, handleChange }"
              name="purchaseInvoiceId"
            >
              <FormItem>
                <FormLabel
                  >{{ $t("modules.purchaseInvoice") }} ({{
                    $t("fields.optional")
                  }})</FormLabel
                >
                <Select
                  :model-value="value ? String(value) : undefined"
                  @update:model-value="(v) => handleChange(Number(v))"
                >
                  <FormControl>
                    <SelectTrigger :disabled="loadingInvoices">
                      <SelectValue :placeholder="$t('fields.selectOption')" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem
                      v-for="i in invoices"
                      :key="i.id"
                      :value="String(i.id)"
                    >
                      {{ i.code }} - {{ i.supplier?.name }} (${{
                        i.totalPrice.toLocaleString()
                      }})
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="description">
              <FormItem class="md:col-span-2">
                <FormLabel>{{ $t("fields.remarks") }}</FormLabel>
                <FormControl>
                  <Textarea
                    :placeholder="$t('fields.enterDescription')"
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
              {{ $t("fields.totalPrice") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="text-center p-4 bg-muted/20 border rounded-lg">
              <span class="text-3xl font-bold text-primary">
                ${{
                  grandTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })
                }}
              </span>
            </div>
          </CardContent>
          <CardFooter class="flex flex-col gap-2 border-t pt-4">
            <Button
              type="submit"
              class="w-full"
              :disabled="submitting || fields.length === 0"
            >
              <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ $t("crud.save") }}
            </Button>
            <Button
              variant="outline"
              type="button"
              class="w-full"
              @click="router.back()"
              :disabled="submitting"
            >
              {{ $t("crud.cancel") }}
            </Button>
          </CardFooter>
        </Card>

        <!-- Product Details Table -->
        <Card
          class="md:col-span-12 shadow-sm border-muted-foreground/10 text-card-foreground"
        >
          <CardHeader
            class="pb-3 border-b bg-muted/5 flex flex-row items-center justify-between"
          >
            <CardTitle class="text-lg flex items-center gap-2">
              <Package class="h-5 w-5 text-primary" />
              {{ $t("fields.details") }}
            </CardTitle>
            <Button
              type="button"
              size="sm"
              @click="addProduct"
              variant="default"
            >
              <Plus class="h-4 w-4 mr-2" /> {{ $t("actions.addProduct") }}
            </Button>
          </CardHeader>
          <CardContent class="p-0">
            <Table>
              <TableHeader class="bg-muted/30">
                <TableRow>
                  <TableHead class="w-[40%]">{{
                    $t("modules.product")
                  }}</TableHead>
                  <TableHead class="w-[15%] text-right">{{
                    $t("fields.unitPrice")
                  }}</TableHead>
                  <TableHead class="w-[15%] text-right">{{
                    $t("fields.quantity")
                  }}</TableHead>
                  <TableHead class="w-[20%] text-right">{{
                    $t("fields.rowTotal")
                  }}</TableHead>
                  <TableHead class="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="fields.length === 0">
                  <TableCell
                    colspan="5"
                    class="text-center py-8 text-muted-foreground italic"
                  >
                    {{ $t("common.noData") }}
                  </TableCell>
                </TableRow>
                <TableRow v-for="(field, index) in fields" :key="field.key">
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
                                `details[${index}].unitPrice` as any,
                                price,
                              );
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
                                :placeholder="$t('fields.selectOption')"
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
                    <FormField
                      v-slot="{ componentField }"
                      :name="`details[${index}].unitPrice`"
                    >
                      <FormItem class="mb-0">
                        <FormControl>
                          <Input
                            type="text"
                            class="text-right"
                            :name="componentField.name"
                            @blur="componentField.onBlur"
                            :model-value="localUnitPrices[field.key] ?? formatNumberInput(componentField.modelValue)"
                            @input="
                              (e: any) => {
                                const val = e.target.value;
                                localUnitPrices[field.key] = formatNumberInput(String(val));
                                const price = Number(localUnitPrices[field.key].replace(/,/g, ''));
                                form.setFieldValue(`details[${index}].unitPrice` as any, price);
                                
                                const qty = form.values.details?.[index]?.quantity || 0;
                                const totalPrice = Number((price * qty).toFixed(2));
                                form.setFieldValue(`details[${index}].totalPrice` as any, totalPrice);
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
                                
                                const price = form.values.details?.[index]?.unitPrice || 0;
                                const totalPrice = Number((price * qty).toFixed(2));
                                form.setFieldValue(`details[${index}].totalPrice` as any, totalPrice);
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
