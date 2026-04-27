<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toLocalISOString, formatCurrency, formatNumberInput } from "@/utils/format";
import CurrencyToggle from "@/components/CurrencyToggle.vue";
import { useCurrencyStore } from "@/stores/currency";

import { useForm } from "vee-validate";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Loader2, FileText, CreditCard, Banknote, History } from "lucide-vue-next";

import { PurchasePaymentService } from "@/services/purchase_payment/purchase_payment.service";
import { PurchaseInvoiceService } from "@/services/purchase_invoice/purchase_invoice.service";
import type { PurchaseInvoice } from "@/types";
import { toast } from "vue-sonner";

const route = useRoute();
const router = useRouter();
const ppService = new PurchasePaymentService();
const piService = new PurchaseInvoiceService();
const currencyStore = useCurrencyStore();
const currencySymbol = computed(() => currencyStore.activeCurrency?.symbol ?? '$');

const submitting = ref(false);
const loadingInvoices = ref(false);
const invoices = ref<PurchaseInvoice[]>([]);
const selectedInvoice = ref<PurchaseInvoice | null>(null);

async function fetchInvoices() {
  loadingInvoices.value = true;
    try {
      // We only want completed invoices with balance
      const response = await piService.getList({ 
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "DESC"
      });
    if (response.success && response.data) {
      // Filter those with remaining balance
      invoices.value = response.data.data.filter(i => (i.totalPrice - i.paidAmount) > 0);
    }
  } catch (error) {
    console.error("Failed to fetch invoices", error);
  } finally {
    loadingInvoices.value = false;
  }
}

onMounted(async () => {
  await fetchInvoices();
  
  // If invoiceId is provided in query, pre-select it
  const qInvoiceId = Number(route.query.invoiceId);
  if (qInvoiceId) {
    const inv = invoices.value.find(i => i.id === qInvoiceId);
    if (inv) {
      form.setFieldValue("purchaseInvoiceId", inv.id);
      selectedInvoice.value = inv;
    } else {
      // Try fetching detail if not in the list
      const res = await piService.getDetail(qInvoiceId);
      if (res.success && res.data) {
        selectedInvoice.value = res.data;
        form.setFieldValue("purchaseInvoiceId", res.data.id);
      }
    }
  }
});

const formSchema = toTypedSchema(
  z.object({
    purchaseInvoiceId: z.number().min(1, t('validation.required', { field: t('modules.purchaseInvoice') })),
    paymentDate: z.string().min(1, t('validation.required', { field: t('fields.invoiceDate') })),
    amount: z.number().min(0.01, t('validation.min', { field: t('fields.paidAmount'), min: '0.01' })),
    description: z.string().optional().nullable(),
  })
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    purchaseInvoiceId: 0,
    paymentDate: toLocalISOString(new Date()),
    amount: 0,
    description: "",
  },
});

watch(() => form.values.purchaseInvoiceId, (newId) => {
  if (newId) {
    const inv = invoices.value.find(i => i.id === newId);
    if (inv) {
      selectedInvoice.value = inv;
      const baseAmt = Number((inv.totalPrice - inv.paidAmount).toFixed(2));
      form.setFieldValue("amount", baseAmt);
      const rate = currencyStore.activeCurrency?.exchangeRate || 1;
      localAmount.value = formatNumberInput((baseAmt * rate).toFixed(2));
    }
  } else {
    selectedInvoice.value = null;
    form.setFieldValue("amount", 0);
    localAmount.value = "";
  }
});

const remainingBalance = computed(() => {
  if (!selectedInvoice.value) return 0;
  return selectedInvoice.value.totalPrice - selectedInvoice.value.paidAmount;
});

const localAmount = ref("");

watch(localAmount, (val) => {
  const cleanVal = Number(String(val).replace(/,/g, ''));
  const rate = currencyStore.activeCurrency?.exchangeRate || 1;
  const inUsd = cleanVal === 0 ? 0 : (cleanVal / rate);
  
  if (form.values.amount !== inUsd) {
    form.setFieldValue('amount', inUsd);
  }
});

const onSubmit = form.handleSubmit(async (values) => {
  if (!selectedInvoice.value) return;
  submitting.value = true;
  try {
    const payload = {
      supplierId: selectedInvoice.value.supplierId,
      paymentDate: new Date(values.paymentDate).toISOString(),
      description: values.description,
      details: [
        {
          purchaseInvoiceId: values.purchaseInvoiceId,
          paidAmount: values.amount,
        },
      ],
    };

    const response = await ppService.create(payload as any);
    if (response.success) {
      toast.success(t('crud.successCreate', { module: t('modules.purchasePayment') }));
      router.push("/admin/purchase-payments");
    } else {
      toast.error(response.message || t('crud.errorCreate', { module: t('modules.purchasePayment') }));
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
          <h2 class="text-3xl font-bold tracking-tight">{{ $t('crud.createBtn') }} {{ $t('modules.purchasePayment') }}</h2>
          <p class="text-muted-foreground text-sm flex items-center mt-1">
            <Banknote class="w-4 h-4 mr-1.5 opacity-50"/> 
            {{ $t('fields.paymentStockUpdateInfo') }}
          </p>
        </div>
      </div>
      <CurrencyToggle />
    </div>

    <form @submit="onSubmit" class="w-full">
        
        <!-- Transaction Info -->
        <Card class="shadow-sm border-muted-foreground/10">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <FileText class="h-5 w-5 text-primary" />
              {{ $t('crud.generalInfo') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 space-y-4">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField v-slot="{ value, handleChange }" name="purchaseInvoiceId">
                <FormItem class="md:col-span-2">
                  <FormLabel>{{ $t('modules.purchaseInvoice') }}</FormLabel>
                  <Select
                    :model-value="value ? String(value) : undefined"
                    @update:model-value="(v) => handleChange(Number(v))"
                  >
                    <FormControl>
                      <SelectTrigger :disabled="loadingInvoices">
                        <SelectValue :placeholder="loadingInvoices ? $t('common.loading') : $t('fields.selectOption')" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem
                        v-for="i in invoices"
                        :key="i.id"
                        :value="String(i.id)"
                      >
                        <div class="flex justify-between w-full">
                          <div class="flex flex-col text-left">
                            <span class="font-bold">{{ i.code }} - {{ i.supplier?.name }}</span>
                            <span v-if="i.details?.[0]?.purchaseOrder?.code" class="text-[10px] text-muted-foreground mt-0.5">
                              #{{ i.details[0].purchaseOrder.code }}
                            </span>
                          </div>
                          <span class="text-muted-foreground ml-4">
                            {{ formatCurrency(i.totalPrice - i.paidAmount) }} 
                            {{ $t('fields.balance') }}
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="paymentDate">
                <FormItem class="md:col-span-2">
                  <FormLabel>{{ $t('fields.transactionDate') }}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <div class="grid grid-cols-1 gap-4 pt-4 border-t">
              <FormField v-slot="{ componentField }" name="amount">
                <FormItem>
                  <FormLabel>{{ $t('fields.paidAmount') }}</FormLabel>
                  <FormControl>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{{ currencySymbol }}</span>
                      <Input 
                        type="text" 
                        :name="componentField.name"
                        @blur="componentField.onBlur"
                        :model-value="localAmount"
                        @update:model-value="(val) => localAmount = formatNumberInput(String(val))"
                        class="pl-9 font-bold text-lg text-success" 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <FormField v-slot="{ componentField }" name="description">
              <FormItem>
                <FormLabel>{{ $t('fields.description') }}</FormLabel>
                <FormControl>
                  <Textarea :placeholder="$t('fields.enterDescription')" v-bind="componentField" rows="3" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Integrated Summary Section -->
            <div v-if="selectedInvoice" class="mt-8 pt-8 border-t space-y-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <!-- Left: Balance Info -->
                <div class="space-y-3">
                  <h3 class="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <History class="h-4 w-4" /> {{ $t('fields.balanceInfo') }}
                  </h3>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-muted-foreground">{{ $t('fields.totalPrice') }}:</span>
                      <span class="font-semibold">{{ formatCurrency(selectedInvoice.totalPrice) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-muted-foreground">{{ $t('fields.totalPaid') }}:</span>
                      <span class="font-semibold text-success">{{ formatCurrency(selectedInvoice.paidAmount) }}</span>
                    </div>
                    <div class="flex justify-between pt-2 border-t font-bold">
                      <span>{{ $t('fields.balanceDue') }}:</span>
                      <span class="font-bold text-destructive">{{ formatCurrency(remainingBalance) }}</span>
                    </div>
                    <!-- Remaining items note -->
                    <div v-if="selectedInvoice.details?.[0]?.purchaseOrder" class="pt-2">
                       <p class="text-xs text-orange-600 font-medium">
                        * {{ $t('modules.purchaseOrder') }} #{{ selectedInvoice.details[0].purchaseOrder.code }} 
                        <span v-if="(selectedInvoice.details[0].purchaseOrder.totalLine - selectedInvoice.details[0].purchaseOrder.totalCloseLine) > 0">
                           {{ $t('fields.has') }} {{ Math.trunc(selectedInvoice.details[0].purchaseOrder.totalLine - selectedInvoice.details[0].purchaseOrder.totalCloseLine) }} {{ $t('fields.remaining') }}
                        </span>
                        <span v-else>
                           {{ $t('fields.fullyFulfilled') }}
                        </span>
                       </p>
                    </div>
                  </div>
                </div>

                <!-- Right: Final Payment Preview -->
                <div class="bg-muted/30 p-6 rounded-xl border border-muted-foreground/10 flex flex-col justify-center items-center text-center">
                  <p class="text-xs uppercase font-bold text-muted-foreground mb-2">{{ $t('fields.paymentAmount') }}</p>
                  <div class="text-4xl font-bold text-primary tracking-tight">
                    {{ currencySymbol }}{{ localAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                  </div>
                  <p v-if="currencySymbol !== '$'" class="text-xs text-muted-foreground mt-1 uppercase font-bold">
                    ${{ form.values.amount.toFixed(2) }}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter class="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" type="button" @click="router.back()" :disabled="submitting">{{ $t('crud.cancel') }}</Button>
            <Button type="submit" :disabled="submitting">
              <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ $t('crud.save') }}
            </Button>
          </CardFooter>
        </Card>

      </form>
    </div>
</template>
