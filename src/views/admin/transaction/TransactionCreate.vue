<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ChevronLeft, Loader2, History, Package, Settings2, Info } from "lucide-vue-next";
import { TransactionService } from "@/services/transaction/transaction.service";
import { ProductService } from "@/services/product/product.service";
import type { Product } from "@/types";
import { TransactionType } from "@/types";
import DatePicker from "@/components/DatePicker.vue";
import { toast } from "vue-sonner";
import { toLocalISOString } from "@/utils/format";
import SearchableSelect from "@/components/SearchableSelect.vue";
import { computed } from "vue";

const router = useRouter();
const transactionService = new TransactionService();
const productService = new ProductService();

const products = ref<Product[]>([]);
const loadingProducts = ref(true);
const submitting = ref(false);

const formSchema = toTypedSchema(
  z.object({
    productId: z.number({ required_error: t('fields.enterProductName') }),
    transactionType: z.number().default(TransactionType.IN),
    transactionDate: z.string().default(new Date().toISOString()),
    transactionCode: z.string().optional().nullable(),
    quantity: z.number().min(0.01, t('crud.errorGeneral')),
    remarks: z.string().optional().nullable(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    transactionType: TransactionType.IN,
    transactionDate: toLocalISOString(new Date()),
    quantity: 0,
    remarks: "",
  },
});

async function fetchProducts() {
  loadingProducts.value = true;
  try {
    const response = await productService.getAll();
    if (response.success && response.data) {
      products.value = response.data;
    }
  } catch (error) {
    console.error("Fetch products error:", error);
  } finally {
    loadingProducts.value = false;
  }
}

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const response = await transactionService.create(values as any);
    if (response.success) {
      toast.success(t('crud.successCreate', { module: t('modules.transaction') }));
      router.push("/admin/transactions");
    } else {
      toast.error(response.message || t('crud.errorCreate', { module: t('modules.transaction') }));
    }
  } catch (error) {
    toast.error(t('crud.errorGeneral'));
  } finally {
    submitting.value = false;
  }
});

const selectedProduct = ref<Product | null>(null);

const productOptions = computed(() => 
    products.value.map(p => ({ label: `${p.name} (${p.code})`, value: p.id }))
);

function onProductChange(id: any) {
    const prodId = id === null ? undefined : Number(id);
    form.setFieldValue('productId', prodId as any);
    selectedProduct.value = products.value.find(p => p.id === prodId) || null;
}

onMounted(() => {
  fetchProducts();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <Button variant="outline" size="icon" @click="router.back()">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <h2 class="text-3xl font-bold tracking-tight">{{ $t('crud.create', { module: $t('modules.transaction') }) }}</h2>
    </div>

    <form @submit="onSubmit" id="transactionForm">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 1. Transaction Details -->
        <Card class="lg:col-span-2 shadow-sm border-muted-foreground/10">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <History class="h-5 w-5 text-primary" />
              {{ $t('crud.generalInfo') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Product Selection -->
                <FormField v-slot="{ field }" name="productId">
                <FormItem>
                    <FormLabel>{{ $t('modules.product') }}</FormLabel>
                    <FormControl>
                        <SearchableSelect
                            :model-value="field.value"
                            @update:model-value="onProductChange"
                            :options="productOptions"
                            :placeholder="$t('fields.enterProductName')"
                            :empty-message="$t('crud.noResults')"
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                </FormField>

                <!-- Transaction Type -->
                <FormField v-slot="{ field }" name="transactionType">
                <FormItem>
                    <FormLabel>{{ $t('fields.transactionType') }}</FormLabel>
                    <Select :model-value="String(field.value)" @update:model-value="(v) => field.onChange(Number(v))">
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem :value="String(TransactionType.IN)">{{ $t('fields.stockIn') }}</SelectItem>
                        <SelectItem :value="String(TransactionType.OUT)">{{ $t('fields.stockOut') }}</SelectItem>
                        <SelectItem :value="String(TransactionType.ADJUSTMENT)">{{ $t('fields.adjustment') }}</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                </FormField>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Quantity -->
                <FormField v-slot="{ componentField }" name="quantity">
                <FormItem>
                    <FormLabel>{{ $t('fields.quantity') }}</FormLabel>
                    <FormControl>
                    <Input type="number" step="0.01" :placeholder="$t('fields.quantity')" v-bind="componentField" @update:model-value="(v) => form.setFieldValue('quantity', Number(v))" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                </FormField>

                <!-- Transaction Date -->
                <FormField v-slot="{ field }" name="transactionDate">
                <FormItem>
                    <FormLabel>{{ $t('fields.transactionDate') }}</FormLabel>
                    <FormControl>
                        <DatePicker v-bind="field" :placeholder="$t('fields.selectDate')" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                </FormField>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Transaction Code (Optional) -->
                <FormField v-slot="{ componentField }" name="transactionCode">
                <FormItem>
                    <FormLabel>{{ $t('fields.transactionCode') }}</FormLabel>
                    <FormControl>
                    <Input :placeholder="$t('fields.autoGenerate')" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                </FormField>
            </div>

            <!-- Remarks -->
            <FormField v-slot="{ componentField }" name="remarks">
              <FormItem>
                <FormLabel>{{ $t('fields.remarks') }}</FormLabel>
                <FormControl>
                  <Textarea :placeholder="$t('fields.remarks')" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </CardContent>
          <CardFooter class="flex justify-end gap-2 border-t px-6 py-4 bg-muted/5">
            <Button variant="outline" type="button" @click="router.back()" :disabled="submitting">{{ $t('crud.cancel') }}</Button>
            <Button type="submit" form="transactionForm" :disabled="submitting">
              <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ $t('crud.createBtn') }}
            </Button>
          </CardFooter>
        </Card>

        <!-- 2. Product Summary / Preview -->
        <div class="space-y-6">
            <Card class="shadow-sm border-muted-foreground/10 overflow-hidden">
            <CardHeader class="pb-3 border-b bg-muted/5 text-primary">
                <CardTitle class="text-sm uppercase tracking-wider flex items-center gap-2">
                <Package class="h-4 w-4" />
                {{ $t('modules.product') }}
                </CardTitle>
            </CardHeader>
            <CardContent class="pt-6">
                <div v-if="selectedProduct" class="space-y-4">
                    <div class="flex items-center gap-4 border-b pb-4">
                        <div class="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden border text-muted-foreground">
                            <Package v-if="!selectedProduct.photoPath" class="h-6 w-6" />
                            <img v-else :src="selectedProduct.photoPath" class="h-full w-full object-cover" />
                        </div>
                        <div>
                            <h4 class="font-bold text-lg leading-none">{{ selectedProduct.name }}</h4>
                            <p class="text-muted-foreground text-xs mt-1">{{ selectedProduct.code }}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-muted/30 p-3 rounded-lg border border-muted-foreground/5 text-center">
                            <p class="text-[10px] uppercase text-muted-foreground font-bold mb-1">{{ $t('fields.currentStock') }}</p>
                            <p class="text-xl font-mono font-bold">{{ selectedProduct.detail?.currentStock || 0 }}</p>
                        </div>
                        <div class="bg-primary/5 p-3 rounded-lg border border-primary/10 text-center">
                            <p class="text-[10px] uppercase text-primary font-bold mb-1">{{ $t('fields.afterStock') }}</p>
                            <p class="text-xl font-mono font-bold text-primary">
                                {{ 
                                    form.values.transactionType === TransactionType.IN 
                                    ? (Number(selectedProduct.detail?.currentStock || 0) + Number(form.values.quantity || 0))
                                    : (form.values.transactionType === TransactionType.OUT 
                                       ? (Number(selectedProduct.detail?.currentStock || 0) - Number(form.values.quantity || 0))
                                       : Number(form.values.quantity || 0))
                                }}
                            </p>
                        </div>
                    </div>
                </div>
                <div v-else class="flex flex-col items-center justify-center py-10 text-muted-foreground italic text-sm text-center">
                    <Info class="h-8 w-8 mb-2 opacity-20" />
                    <p>{{ $t('crud.selectParent') }} {{ $t('modules.product') }}</p>
                </div>
            </CardContent>
            </Card>

            <Card class="shadow-sm bg-primary/5 border-primary/20">
                <CardHeader class="pb-2">
                    <CardTitle class="text-[10px] uppercase tracking-widest text-primary flex items-center gap-2">
                        <Settings2 class="h-3 w-3" />
                        {{ $t('fields.internalMemo') }}
                    </CardTitle>
                </CardHeader>
                <CardContent class="text-[11px] text-muted-foreground leading-relaxed italic">
                    {{ $t('fields.internalMemoDescription') }}
                </CardContent>
            </Card>
        </div>
      </div>
    </form>
  </div>
</template>
