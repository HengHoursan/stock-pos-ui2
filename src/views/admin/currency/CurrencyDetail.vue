<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { CurrencyService } from "@/services/currency/currency.service";
import type { Currency } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  Pencil,
  Calendar,
  Clock,
  Globe,
  Coins,
  BadgeCent,
  SeparatorHorizontal,
  Loader2,
} from "lucide-vue-next";
import { toast } from "vue-sonner";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const currencyService = new CurrencyService();
const currency = ref<Currency | null>(null);
const isLoading = ref(true);

async function fetchCurrency() {
  const id = parseInt(route.params.id as string);
  try {
    const response = await currencyService.getDetail(id);
    if (response.success && response.data) {
      currency.value = response.data;
    } else {
      toast.error(t("crud.errorFetch", { module: t("modules.currency") }));
      router.push("/admin/currencies");
    }
  } catch (error) {
    toast.error(t("crud.errorFetch", { module: t("modules.currency") }));
    router.push("/admin/currencies");
  } finally {
    isLoading.value = false;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

onMounted(() => {
  fetchCurrency();
});
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          @click="router.push('/admin/currencies')"
          class="rounded-full h-9 w-9 bg-background shadow-sm hover:bg-muted transition-colors"
        >
          <ChevronLeft class="h-5 w-5" />
        </Button>
        <div>
          <h2 class="text-3xl font-bold tracking-tight text-foreground/90">
            {{ $t("crud.detail", { module: $t("modules.currency") }) }}
          </h2>
          <p class="text-muted-foreground text-sm">
            Viewing detailed information for {{ currency?.currency || 'Currency' }}
          </p>
        </div>
      </div>
      <Button
        v-if="currency"
        @click="router.push(`/admin/currencies/${currency.id}/edit`)"
        class="bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-95 gap-2"
      >
        <Pencil class="h-4 w-4" />
        {{ $t("crud.editBtn") }}
      </Button>
    </div>

    <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 class="h-10 w-10 animate-spin text-primary" />
      <p class="text-muted-foreground animate-pulse">{{ $t("crud.fetchingData") }}</p>
    </div>

    <div v-else-if="currency" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Left Column: Basic Info -->
      <div class="md:col-span-2 space-y-6">
        <Card class="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader class="border-b bg-muted/20 pb-4">
            <div class="flex items-center gap-2">
              <div class="p-2 bg-primary/10 rounded-lg">
                <Coins class="h-4 w-4 text-primary" />
              </div>
              <CardTitle class="text-base font-semibold">{{ $t("crud.generalInfo") }}</CardTitle>
            </div>
          </CardHeader>
          <CardContent class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div class="space-y-1">
                <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">{{ $t("fields.code") }}</p>
                <code class="text-lg font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 uppercase">
                  {{ currency.code }}
                </code>
              </div>
              <div class="space-y-1">
                <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">{{ $t("fields.country") }}</p>
                <div class="flex items-center gap-2">
                  <Globe class="h-4 w-4 text-muted-foreground/60" />
                  <p class="text-sm font-semibold text-foreground/90">{{ currency.country }}</p>
                </div>
              </div>
              <div class="space-y-1">
                <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">{{ $t("fields.currency") }}</p>
                <p class="text-sm font-semibold text-foreground/90">{{ currency.currency }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">{{ $t("fields.symbol") }}</p>
                <div class="flex items-center gap-2">
                  <BadgeCent class="h-4 w-4 text-muted-foreground/60" />
                  <Badge variant="outline" class="font-mono bg-muted/30 text-base py-0 px-2">{{ currency.symbol || '-' }}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card class="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader class="border-b bg-muted/20 pb-4">
            <div class="flex items-center gap-2">
              <div class="p-2 bg-primary/10 rounded-lg">
                <SeparatorHorizontal class="h-4 w-4 text-primary" />
              </div>
              <CardTitle class="text-base font-semibold">Formatting Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div class="space-y-1">
                <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">{{ $t("fields.thousandSeparator") }}</p>
                <Badge variant="secondary" class="font-mono text-sm px-3 italic">"{{ currency.thousandSeparator }}"</Badge>
              </div>
              <div class="space-y-1">
                <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">{{ $t("fields.decimalSeparator") }}</p>
                <Badge variant="secondary" class="font-mono text-sm px-3 italic">"{{ currency.decimalSeparator }}"</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Right Column: System Info -->
      <div class="space-y-6">
        <Card class="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader class="border-b bg-muted/20 pb-4">
            <CardTitle class="text-base font-semibold">{{ $t("crud.systemInfo") }}</CardTitle>
          </CardHeader>
          <CardContent class="p-6 space-y-6">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">{{ $t("fields.status") }}</span>
                <Badge :variant="currency.status ? 'success' : 'warning'" class="font-bold px-3">
                  {{ currency.status ? $t("crud.active") : $t("crud.inactive") }}
                </Badge>
              </div>
              <Separator class="bg-border/40" />
              <div class="space-y-2 text-right">
                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar class="h-3.5 w-3.5" />
                    <span class="text-[10px] font-bold uppercase tracking-tighter">{{ $t("fields.createdAt") }}</span>
                  </div>
                  <span class="text-xs font-medium">{{ formatDate(currency.createdAt) }}</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-1.5 text-muted-foreground">
                    <Clock class="h-3.5 w-3.5" />
                    <span class="text-[10px] font-bold uppercase tracking-tighter">{{ $t("fields.updatedAt") }}</span>
                  </div>
                  <span class="text-xs font-medium">{{ formatDate(currency.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
