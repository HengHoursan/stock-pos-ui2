<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted, computed, watch } from "vue";
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
      .min(1, t("validation.required", { field: t("modules.saleInvoice") })),
    returnDate: z
      .string()
      .min(1, t("validation.required", { field: t("fields.invoiceDate") })),
    remarks: z.string().optional().nullable(),
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
    saleInvoiceId: 0,
    returnDate: toLocalISOString(new Date()),
    remarks: "",
    details: [],
  },
});

const { remove, push, fields, replace } = useFieldArray("details");

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
        t("validation.loadedFromSource", { source: t("modules.saleInvoice") }),
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
        t("crud.successCreate", { module: t("modules.saleReturn") }),
      );
      router.push("/admin/sale-returns");
    } else {
      toast.error(
        response.message ||
          t("crud.errorCreate", { module: t("modules.saleReturn") }),
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
          {{ $t("crud.createBtn") }} {{ $t("modules.saleReturn") }}
        </h2>
        <p class="text-muted-foreground text-sm flex items-center mt-1">
          <History class="w-4 h-4 mr-1.5 opacity-50" />
          {{ $t("fields.saleReturnInfo") }}
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

            <FormField v-slot="{ value, handleChange }" name="saleInvoiceId">
              <FormItem class="md:col-span-2">
                <FormLabel
                  >{{ $t("modules.saleInvoice") }} ({{
                    $t("fields.completedOnly")
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
                      {{ i.code }} - {{ i.customer?.name }} (${{
                        i.totalPrice.toLocaleString()
                      }})
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="remarks">
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
              {{ $t("fields.grandTotal") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6">
            <div class="text-center p-4 bg-muted/20 border rounded-lg">
              <span class="text-3xl font-mono font-bold text-primary">
                ${{
                  grandTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })
                }}
              </span>
            </div>

            <div
              v-if="selectedInvoice"
              class="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg text-sm space-y-2"
            >
              <p class="font-bold flex items-center gap-2 text-primary">
                <FileText class="h-4 w-4" />
                {{ $t("modules.saleInvoice") }} {{ $t("fields.details") }}
              </p>
              <div class="flex justify-between">
                <span class="text-muted-foreground"
                  >{{ $t("fields.totalPrice") }}:</span
                >
                <span class="font-mono font-bold"
                  >${{ selectedInvoice.totalPrice.toLocaleString() }}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground"
                  >{{ $t("fields.totalPaid") }}:</span
                >
                <span class="font-mono text-success font-bold"
                  >${{ selectedInvoice.paidAmount.toLocaleString() }}</span
                >
              </div>
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
        <Card class="md:col-span-12 shadow-sm border-muted-foreground/10">
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
                  <TableCell class="text-right font-mono">
                    {{
                      getProductPrice(
                        (form.values.details || [])[index]?.productId,
                      ).toLocaleString(undefined, { minimumFractionDigits: 2 })
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
                            type="number"
                            step="0.01"
                            min="0.01"
                            class="text-right"
                            v-bind="componentField"
                            @input="
                              (e: any) => {
                                const qty = Number(e.target.value);
                                const price = getProductPrice(
                                  (form.values.details || [])[index]?.productId,
                                );
                                form.setFieldValue(
                                  `details[${index}].totalPrice` as any,
                                  Number((price * qty).toFixed(2)),
                                );
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
                            type="number"
                            step="0.01"
                            class="text-right font-mono font-bold"
                            v-bind="componentField"
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
