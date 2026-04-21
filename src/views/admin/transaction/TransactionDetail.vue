<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Loader2, History, Package, ArrowUpRight, ArrowDownLeft, Settings2, Calendar, Hash, FileText } from "lucide-vue-next";
import { TransactionService } from "@/services/transaction/transaction.service";
import type { Transaction } from "@/types";
import { TransactionType } from "@/types";
import { toast } from "vue-sonner";
import { formatFullDateTime } from "@/utils/format";

const route = useRoute();
const router = useRouter();
const transactionService = new TransactionService();

const transaction = ref<Transaction | null>(null);
const loading = ref(true);
const transactionId = Number(route.params.id);

async function fetchTransaction() {
  loading.value = true;
  try {
    const response = await transactionService.getDetail(transactionId);
    if (response.success && response.data) {
      transaction.value = response.data;
    } else {
      toast.error(t('crud.notFound', { module: t('modules.transaction') }));
      router.push("/admin/transactions");
    }
  } catch (error) {
    console.error("Fetch transaction error:", error);
    toast.error(t('crud.errorFetch', { module: t('modules.transaction') }));
  } finally {
    loading.value = false;
  }
}

function getTypeInfo(type: TransactionType) {
  switch (type) {
    case TransactionType.IN:
      return { label: t('fields.stockIn'), color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: ArrowUpRight };
    case TransactionType.OUT:
      return { label: t('fields.stockOut'), color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: ArrowDownLeft };
    case TransactionType.ADJUSTMENT:
      return { label: t('fields.adjustment'), color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Settings2 };
    default:
      return { label: t('common.unknown'), color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: History };
  }
}

onMounted(() => {
  fetchTransaction();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <Button variant="outline" size="icon" @click="router.back()">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <h2 class="text-3xl font-bold tracking-tight">{{ $t('crud.detail', { module: $t('modules.transaction') }) }}</h2>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center h-[400px] border rounded-lg bg-card shadow-sm">
      <Loader2 class="h-8 w-8 animate-spin text-primary mb-4" />
      <p class="text-muted-foreground">{{ $t('crud.loading') }}</p>
    </div>

    <div v-else-if="transaction" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Sidebar Info -->
      <div class="lg:col-span-1 space-y-6">
        <Card class="overflow-hidden">
            <CardHeader class="pb-3 border-b text-primary">
                <CardTitle class="text-sm uppercase tracking-wider flex items-center gap-2">
                <Package class="h-4 w-4" />
                {{ $t('modules.product') }}
                </CardTitle>
            </CardHeader>
            <CardContent class="pt-6">
                <div v-if="transaction.product" class="space-y-4">
                    <div class="flex items-center gap-4 border-b pb-4">
                        <div class="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden border text-muted-foreground font-bold">
                            <Package v-if="!transaction.product.photoPath" class="h-6 w-6" />
                            <img v-else :src="transaction.product.photoPath" class="h-full w-full object-cover" />
                        </div>
                        <div>
                            <h4 class="font-bold text-lg leading-none cursor-pointer hover:text-primary transition-colors" @click="router.push(`/admin/products/${transaction.product?.id}`)">
                                {{ transaction.product.name }}
                            </h4>
                            <p class="text-muted-foreground text-[10px] mt-1 font-bold uppercase tracking-widest">{{ transaction.product.code }}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 gap-3 mt-4">
                        <div class="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted-foreground/5 text-center">
                            <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">{{ $t('fields.beginningStock') }}</span>
                            <span class="font-mono font-bold text-lg leading-none mt-1">{{ Number(transaction.beginningStock) }}</span>
                        </div>
                        <div class="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                            <span class="text-xs font-bold text-primary uppercase tracking-wider">{{ $t('fields.afterStock') }}</span>
                            <span class="font-mono font-bold text-lg text-primary leading-none mt-1">{{ Number(transaction.afterStock) }}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
             <CardFooter class="border-t px-6 py-4 flex flex-col gap-2">
                 <p class="text-[10px] text-muted-foreground italic text-center w-full">{{ $t('fields.inventoryRecordedAt', { date: formatFullDateTime(transaction.createdAt) }) }}</p>
            </CardFooter>
        </Card>
      </div>

      <!-- Main Content -->
      <Card class="lg:col-span-2">
        <CardHeader class="pb-3 border-b">
          <div class="flex items-center justify-between">
            <CardTitle class="text-lg flex items-center gap-2">
              <History class="h-5 w-5 text-primary" />
              {{ $t('crud.generalInfo') }}
            </CardTitle>
            <Badge>
                {{ getTypeInfo(transaction.transactionType).label }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent class="pt-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-6">
              <div class="flex items-start gap-3">
                <div class="p-2 bg-muted rounded-lg"><Hash class="h-4 w-4 text-muted-foreground" /></div>
                <div>
                  <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{{ $t('fields.transactionCode') }}</p>
                  <code class="text-lg font-mono font-bold text-foreground tracking-tighter">{{ transaction.transactionCode }}</code>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="p-2 bg-muted rounded-lg"><Calendar class="h-4 w-4 text-muted-foreground" /></div>
                <div>
                  <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{{ $t('fields.transactionDate') }}</p>
                  <p class="text-base font-semibold">{{ formatFullDateTime(transaction.transactionDate) }}</p>
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <div class="bg-muted/30 rounded-xl p-4 border border-muted-foreground/5 relative overflow-hidden group">
                 <div class="relative z-10">
                    <p class="text-[10px] font-black uppercase text-muted-foreground mb-3 tracking-[0.2em]">{{ $t('fields.quantity') }}</p>
                    <div class="flex items-baseline gap-2">
                        <component :is="getTypeInfo(transaction.transactionType).icon" class="h-5 w-5" :class="transaction.transactionType === TransactionType.IN ? 'text-green-600' : 'text-red-600'" />
                        <span class="text-4xl font-mono font-black" :class="transaction.transactionType === TransactionType.IN ? 'text-green-600' : 'text-red-600'">
                            {{ transaction.transactionType === TransactionType.OUT ? '-' : '+' }}{{ Number(transaction.quantity) }}
                        </span>
                    </div>
                 </div>
                 <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                    <component :is="getTypeInfo(transaction.transactionType).icon" class="h-24 w-24" />
                 </div>
              </div>
            </div>
          </div>

          <div class="mt-8 pt-8 border-t">
              <div class="flex items-start gap-3">
                <div class="p-2 bg-muted rounded-lg"><FileText class="h-4 w-4 text-muted-foreground" /></div>
                <div class="flex-1">
                  <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{{ $t('fields.remarks') }}</p>
                  <p class="text-sm text-foreground bg-muted/20 p-4 rounded-lg border italic leading-relaxed min-h-[100px]">
                    {{ transaction.remarks || t('crud.none') }}
                  </p>
                </div>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
