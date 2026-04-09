<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toLocalISOString } from "@/utils/format";

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
import { PaymentMethod, InvoiceStatus } from "@/types/enums";
import { toast } from "vue-sonner";

const route = useRoute();
const router = useRouter();
const ppService = new PurchasePaymentService();
const piService = new PurchaseInvoiceService();

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
        sortOrder: "DESC",
        filter: { status: String(InvoiceStatus.COMPLETED) } 
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
    paymentMethod: z.number(),
    referenceNumber: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
  })
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    purchaseInvoiceId: 0,
    paymentDate: toLocalISOString(new Date()),
    amount: 0,
    paymentMethod: PaymentMethod.CASH,
    referenceNumber: "",
    description: "",
  },
});

watch(() => form.values.purchaseInvoiceId, (newId) => {
  if (newId) {
    const inv = invoices.value.find(i => i.id === newId);
    if (inv) {
      selectedInvoice.value = inv;
      // Default to paying the remaining balance
      form.setFieldValue("amount", Number((inv.totalPrice - inv.paidAmount).toFixed(2)));
    }
  } else {
    selectedInvoice.value = null;
    form.setFieldValue("amount", 0);
  }
});

const remainingBalance = computed(() => {
  if (!selectedInvoice.value) return 0;
  return selectedInvoice.value.totalPrice - selectedInvoice.value.paidAmount;
});

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      ...values,
      paymentDate: new Date(values.paymentDate).toISOString(),
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

    <form @submit="onSubmit">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        <!-- Transaction Info -->
        <Card class="md:col-span-8 shadow-sm border-muted-foreground/10">
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
                      <SelectItem v-for="i in invoices" :key="i.id" :value="String(i.id)">
                        {{ i.code }} - {{ i.supplier?.name }} (${{ (i.totalPrice - i.paidAmount).toLocaleString() }} balance)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="paymentDate">
                <FormItem>
                  <FormLabel>{{ $t('fields.transactionDate') }}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" v-bind="componentField" />
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
                        <SelectValue />
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
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <FormField v-slot="{ componentField }" name="amount">
                <FormItem>
                  <FormLabel>{{ $t('fields.paidAmount') }}</FormLabel>
                  <FormControl>
                    <div class="relative">
                      <span class="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input type="number" step="0.01" min="0.01" v-bind="componentField" class="pl-7 font-mono font-bold text-lg text-success" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="referenceNumber">
                <FormItem>
                  <FormLabel>{{ $t('fields.refNumber') }}</FormLabel>
                  <FormControl>
                    <Input :placeholder="$t('fields.enterRefNumber')" v-bind="componentField" />
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
          </CardContent>
          <CardFooter class="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" type="button" @click="router.back()" :disabled="submitting">{{ $t('crud.cancel') }}</Button>
            <Button type="submit" :disabled="submitting">
              <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ $t('crud.save') }}
            </Button>
          </CardFooter>
        </Card>

        <!-- Summary sidebar -->
        <div class="md:col-span-4 space-y-6">
          <Card v-if="selectedInvoice" class="shadow-sm border-primary/20 bg-primary/5">
            <CardHeader class="pb-3 border-b border-primary/10">
              <CardTitle class="text-lg flex items-center gap-2 text-primary">
                <History class="h-5 w-5" />
                {{ $t('fields.balanceInfo') }}
              </CardTitle>
            </CardHeader>
            <CardContent class="pt-6 space-y-4 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">{{ $t('fields.totalPrice') }}:</span>
                <span class="font-mono font-bold">${{ selectedInvoice.totalPrice.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">{{ $t('fields.totalPaid') }}:</span>
                <span class="font-mono text-success font-bold">${{ selectedInvoice.paidAmount.toLocaleString() }}</span>
              </div>
              <div class="pt-4 border-t border-primary/10 flex justify-between text-lg">
                <span class="font-bold">{{ $t('fields.balanceDue') }}:</span>
                <span class="font-mono font-black text-destructive">${{ remainingBalance.toLocaleString() }}</span>
              </div>
            </CardContent>
          </Card>

          <Card class="shadow-sm border-muted-foreground/10">
            <CardHeader class="pb-3 border-b bg-muted/5">
              <CardTitle class="text-lg flex items-center gap-2">
                <CreditCard class="h-5 w-5 text-primary" />
                {{ $t('fields.newPayment') }}
              </CardTitle>
            </CardHeader>
            <CardContent class="pt-6">
              <div class="text-center p-6 bg-muted/20 border rounded-lg">
                <p class="text-xs uppercase text-muted-foreground font-bold mb-2">{{ $t('fields.paymentAmount') }}</p>
                <span class="text-4xl font-mono font-black text-success">
                  ${{ (form.values.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2}) }}
                </span>
              </div>
              
                <p>{{ $t('validation.paymentExceedsBalance') }}</p>
            </CardContent>
          </Card>
        </div>

      </div>
    </form>
  </div>
</template>
