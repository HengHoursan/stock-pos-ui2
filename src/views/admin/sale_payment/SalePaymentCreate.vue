<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toLocalISOString, formatCurrency, formatNumberInput } from "@/utils/format";
import CurrencyToggle from "@/components/CurrencyToggle.vue";
import SearchableSelect from "@/components/SearchableSelect.vue";
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
  ChevronLeft,
  Loader2,
  FileText,
  CreditCard,
  Banknote,
  History,
  Trash2,
  Plus
} from "lucide-vue-next";

import { SalePaymentService } from "@/services/sale_payment/sale_payment.service";
import { SaleInvoiceService } from "@/services/sale_invoice/sale_invoice.service";
import { CustomerService } from "@/services/customer/customer.service";
import type { SaleInvoice, Customer } from "@/types";
import { toast } from "vue-sonner";

const route = useRoute();
const router = useRouter();
const spService = new SalePaymentService();
const siService = new SaleInvoiceService();
const customerService = new CustomerService();
const currencyStore = useCurrencyStore();

const currencySymbol = computed(() => currencyStore.activeCurrency?.symbol ?? "$");

const submitting = ref(false);
const loadingInvoices = ref(false);
const customers = ref<Customer[]>([]);
const invoices = ref<SaleInvoice[]>([]);

const customerOptions = computed(() => 
  customers.value.map(c => ({ label: `${c.name} (${c.code})`, value: c.id }))
);

async function fetchCustomers() {
  try {
    const res = await customerService.getAll();
    if (res.success && res.data) customers.value = res.data;
  } catch (error) {
    console.error("Failed to fetch customers", error);
  }
}

async function fetchInvoices(customerId: number) {
  if (!customerId) {
    invoices.value = [];
    return;
  }
  loadingInvoices.value = true;
  try {
    const response = await siService.getList({
      page: 1,
      limit: 100,
      filter: { customerId }
    } as any);
    if (response.success && response.data) {
      invoices.value = response.data.data.filter(
        (i) => !i.isCancel,
      );
    }
  } catch (error) {
    console.error("Failed to fetch invoices", error);
  } finally {
    loadingInvoices.value = false;
  }
}

const formSchema = toTypedSchema(
  z.object({
    customerId: z.number().min(1, t("validation.required", { field: t("modules.customer") })),
    paymentDate: z.string().min(1, t("validation.required", { field: t("fields.invoiceDate") })),
    description: z.string().optional().nullable(),
    details: z.array(
      z.object({
        saleInvoiceId: z.number().min(1),
        paidAmount: z.number().min(0.01),
        balance: z.number(), // UI only helper
        invoiceCode: z.string(), // UI only helper
      })
    ).min(1, t("validation.atLeastOneItem")),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    customerId: 0,
    paymentDate: toLocalISOString(new Date()),
    description: "",
    details: [],
  },
});

const { remove, push, fields } = useFieldArray("details");

onMounted(async () => {
  await fetchCustomers();

  const qInvoiceId = Number(route.query.invoiceId);
  if (qInvoiceId) {
    const res = await siService.getDetail(qInvoiceId);
    if (res.success && res.data) {
      form.setFieldValue("customerId", res.data.customerId);
      await fetchInvoices(res.data.customerId);
      
      const balance = res.data.totalPrice - res.data.paidAmount;
      if (balance > 0) {
        const rate = currencyStore.activeCurrency?.exchangeRate || 1;
        localInputs.value[res.data.id] = formatNumberInput((balance * rate).toFixed(2));

        push({
          saleInvoiceId: res.data.id,
          paidAmount: balance,
          balance: balance,
          invoiceCode: res.data.code
        });
      }
    }
  }
});

watch(() => form.values.customerId, (newId) => {
  if (newId) {
    fetchInvoices(newId);
    // Clear details if customer changes and they don't belong
    if (form.values.details?.length > 0) {
      form.setFieldValue("details", []);
    }
  }
});

const availableInvoices = computed(() => {
  const selectedIds = new Set(form.values.details?.map((d: any) => d.saleInvoiceId));
  return invoices.value.filter(inv => !selectedIds.has(inv.id));
});

const invoiceOptions = computed(() => 
  availableInvoices.value.map(i => {
    return { 
      label: `${i.code} (${formatCurrency(i.totalPrice - i.paidAmount)})`, 
      value: i.id 
    };
  })
);

function addInvoice(invoiceId: any) {
  const inv = invoices.value.find(i => i.id === Number(invoiceId));
  if (inv) {
    const balance = inv.totalPrice - inv.paidAmount;
    const saleOrder = inv.details?.[0]?.saleOrder;
    
    const rate = currencyStore.activeCurrency?.exchangeRate || 1;
    localInputs.value[inv.id] = formatNumberInput((balance * rate).toFixed(2));

    push({
      saleInvoiceId: inv.id,
      paidAmount: balance,
      balance: balance,
      invoiceCode: inv.code,
      orderCode: saleOrder?.code,
      remainingItems: saleOrder ? (saleOrder.totalLine - saleOrder.totalCloseLine) : 0
    });
  }
}

const totalPaidAmount = computed(() => {
  return form.values.details?.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0) || 0;
});

const localInputs = ref<Record<string, string>>({});

function handleLocalInput(index: number, invoiceId: string, val: string) {
  const formatted = formatNumberInput(val);
  localInputs.value[invoiceId] = formatted;
  
  const cleanVal = formatted.replace(/,/g, '');
  const rate = currencyStore.activeCurrency?.exchangeRate || 1;
  const usdAmount = Number((Number(cleanVal) / rate).toFixed(2));
  
  form.setFieldValue(`details.${index}.paidAmount` as any, usdAmount);
}

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      customerId: values.customerId,
      paymentDate: new Date(values.paymentDate).toISOString(),
      description: values.description,
      details: values.details.map((d: any) => ({
        saleInvoiceId: d.saleInvoiceId,
        paidAmount: d.paidAmount,
      })),
    };

    const response = await spService.create(payload as any);
    if (response.success) {
      toast.success(t("crud.successCreate", { module: t("modules.salePayment") }));
      router.push("/admin/sale-payments");
    } else {
      toast.error(response.message || t("crud.errorCreate", { module: t("modules.salePayment") }));
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
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" @click="router.back()">
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <div>
          <h2 class="text-3xl font-bold tracking-tight">
            {{ $t("crud.createBtn") }} {{ $t("modules.salePayment") }}
          </h2>
          <p class="text-muted-foreground text-sm flex items-center mt-1">
            <Banknote class="w-4 h-4 mr-1.5 opacity-50" />
            {{ $t("fields.paymentStockUpdateInfo") }}
          </p>
        </div>
      </div>
      <CurrencyToggle />
    </div>

    <form @submit="onSubmit" class="w-full">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Main Form -->
        <Card class="lg:col-span-8 shadow-sm border-muted-foreground/10">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <FileText class="h-5 w-5 text-primary" />
              {{ $t("crud.generalInfo") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField v-slot="{ value, handleChange }" name="customerId">
                <FormItem class="md:col-span-2">
                  <FormLabel>{{ $t("modules.customer") }}</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      :model-value="value"
                      @update:model-value="(v) => handleChange(v ? Number(v) : 0)"
                      :options="customerOptions"
                      :placeholder="$t('fields.selectOption')"
                      :empty-message="$t('crud.noResults')"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="paymentDate">
                <FormItem class="md:col-span-2">
                  <FormLabel>{{ $t("fields.transactionDate") }}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <!-- Invoices Section -->
            <div class="pt-4 border-t space-y-3">
              <p class="text-sm font-semibold text-foreground">{{ $t("fields.invoiceSelection") }}</p>

              <!-- Add Invoice Selector (full width) -->
              <SearchableSelect
                :options="invoiceOptions"
                @update:model-value="addInvoice"
                :placeholder="form.values.customerId ? $t('actions.addInvoice') : $t('fields.selectCustomerFirst')"
                :disabled="!form.values.customerId || loadingInvoices"
                :show-all-option="false"
              />

              <!-- Selected Invoice List -->
              <div v-if="fields.length > 0" class="space-y-2 pt-1">
                <div 
                  v-for="(field, index) in fields" 
                  :key="field.key"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-md border bg-muted/30"
                >
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm">{{ (form.values.details || [])[index]?.invoiceCode }}</p>
                    <p class="text-xs text-muted-foreground">
                      {{ $t('fields.balance') }}: {{ formatCurrency((form.values.details || [])[index]?.balance || 0) }}
                    </p>
                  </div>

                  <div class="shrink-0 w-36">
                    <FormField v-slot="{ componentField }" :name="`details[${index}].paidAmount`">
                      <FormItem class="mb-0">
                        <FormControl>
                          <div class="relative">
                            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-foreground/70">{{ currencySymbol }}</span>
                            <Input 
                              type="text" 
                              class="text-right h-8 text-sm font-semibold pl-8" 
                              :model-value="localInputs[(form.values.details || [])[index]?.saleInvoiceId]"
                              @update:model-value="(val) => handleLocalInput(index, (form.values.details || [])[index]?.saleInvoiceId, String(val))"
                              @blur="componentField.onBlur"
                              :name="componentField.name"
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    </FormField>
                  </div>

                  <Button type="button" variant="ghost" size="icon" class="text-muted-foreground hover:text-destructive h-7 w-7 shrink-0" @click="remove(index)">
                    <Trash2 class="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <!-- Empty hint -->
              <p v-else-if="form.values.customerId && !loadingInvoices && invoices.length === 0" class="text-xs text-muted-foreground/60 text-center py-3">
                {{ $t('fields.noUnpaidInvoices') }}
              </p>
            </div>

            <FormField v-slot="{ componentField }" name="description">
              <FormItem>
                <FormLabel>{{ $t("fields.description") }}</FormLabel>
                <FormControl>
                  <Textarea :placeholder="$t('fields.enterDescription')" v-bind="componentField" rows="2" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </CardContent>
        </Card>

        <!-- Summary Sidebar -->
        <Card class="lg:col-span-4 shadow-sm border-muted-foreground/10 h-min sticky top-4">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <CreditCard class="h-5 w-5 text-primary" />
              {{ $t("fields.paymentSummary") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 space-y-6">
            <div class="bg-primary/5 p-6 rounded-xl border border-primary/10 flex flex-col justify-center items-center text-center">
              <p class="text-xs uppercase font-bold text-muted-foreground mb-2">
                {{ $t("fields.totalPaid") }}
              </p>
              <div class="text-4xl font-bold text-primary tracking-tight">
                {{ formatCurrency(totalPaidAmount) }}
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">{{ $t('fields.totalInvoices') }}:</span>
                <span class="font-bold">{{ fields.length }}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter class="flex flex-col gap-2 border-t pt-4">
            <Button type="submit" class="w-full" :disabled="submitting || fields.length === 0">
              <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ $t("crud.save") }}
            </Button>
            <Button variant="outline" type="button" class="w-full" @click="router.back()" :disabled="submitting">
              {{ $t("crud.cancel") }}
            </Button>
          </CardFooter>
        </Card>

      </div>
    </form>
  </div>
</template>

