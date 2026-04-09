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

import { SalePaymentService } from "@/services/sale_payment/sale_payment.service";
import type { SaleInvoice } from "@/types";
import { PaymentMethod } from "@/types/enums";
import { toast } from "vue-sonner";

const route = useRoute();
const router = useRouter();
const spService = new SalePaymentService();

const initialAmount = ref(0);
const loading = ref(true);
const submitting = ref(false);
const invoices = ref<SaleInvoice[]>([]);
const selectedInvoice = ref<SaleInvoice | null>(null);

const formSchema = toTypedSchema(
  z.object({
    id: z.number(),
    saleInvoiceId: z.number().min(1, t('validation.required', { field: t('modules.saleInvoice') })),
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
    id: 0,
    saleInvoiceId: 0,
    paymentDate: toLocalISOString(new Date()),
    amount: 0,
    paymentMethod: PaymentMethod.CASH,
    referenceNumber: "",
    description: "",
  },
});

onMounted(async () => {
  const id = Number(route.params.id);
  if (!id) return router.back();

  try {
    const [detailRes] = await Promise.all([
      spService.getDetail(id)
    ]);
    
    if (detailRes.success && detailRes.data) {
      const d = detailRes.data;
      invoices.value = d.saleInvoice ? [d.saleInvoice] : [];
      initialAmount.value = d.amount;
      form.setValues({
        id: d.id,
        saleInvoiceId: d.saleInvoiceId,
        paymentDate: toLocalISOString(new Date(d.paymentDate)),
        amount: d.amount,
        paymentMethod: d.paymentMethod,
        referenceNumber: d.referenceNumber || "",
        description: d.description || "",
      });
      selectedInvoice.value = d.saleInvoice || null;
    } else {
      toast.error(t('crud.notFound', { module: t('modules.salePayment') }));
      router.back();
    }
  } catch (error) {
    console.error("Failed to fetch dependencies", error);
  } finally {
    loading.value = false;
  }
});

watch(() => form.values.saleInvoiceId, (newId) => {
  if (newId) {
    const inv = invoices.value.find(i => i.id === newId);
    if (inv) selectedInvoice.value = inv;
  }
});

const remainingBalanceExcludingThis = computed(() => {
  if (!selectedInvoice.value || !form.values.id) return 0;
  const totalPrice = Number(selectedInvoice.value.totalPrice || 0);
  const paidAmount = Number(selectedInvoice.value.paidAmount || 0);
  return totalPrice - (paidAmount - initialAmount.value);
});

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      ...values,
      paymentDate: new Date(values.paymentDate).toISOString(),
    };

    const response = await spService.update(payload as any);
    if (response.success) {
      toast.success(t('crud.successUpdate', { module: t('modules.salePayment') }));
      router.push("/admin/sale-payments/" + values.id);
    } else {
      toast.error(response.message || t('crud.errorUpdate', { module: t('modules.salePayment') }));
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
        <h2 class="text-3xl font-bold tracking-tight">{{ $t('crud.editBtn') }} {{ $t('modules.salePayment') }}</h2>
        <p class="text-muted-foreground text-sm flex items-center mt-1">
          <Banknote class="w-4 h-4 mr-1.5 opacity-50"/> 
          {{ form.values.id ? `${$t('fields.paymentId')}: ${form.values.id}` : '...' }}
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center p-12">
      <Loader2 class="h-8 w-8 animate-spin text-primary opacity-50" />
    </div>

    <form v-else @submit="onSubmit">
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
              <FormField v-slot="{ value, handleChange }" name="saleInvoiceId">
                <FormItem class="md:col-span-2">
                  <FormLabel>{{ $t('modules.saleInvoice') }}</FormLabel>
                  <Select
                    :model-value="value ? String(value) : undefined"
                    @update:model-value="(v) => handleChange(Number(v))"
                  >
                    <FormControl>
                      <SelectTrigger disabled>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem v-for="i in invoices" :key="i.id" :value="String(i.id)">
                        {{ i.code }}
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
                <span class="font-bold">{{ $t('fields.adjBalance') }}:</span>
                <span class="font-mono font-black text-destructive">${{ remainingBalanceExcludingThis.toLocaleString() }}</span>
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
            </CardContent>
          </Card>
        </div>

      </div>
    </form>
  </div>
</template>
