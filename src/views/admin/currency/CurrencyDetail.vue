<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { formatRate } from "@/utils/format";
import { CurrencyService } from "@/services/currency/currency.service";
import type { Currency } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  Pencil,
  Calendar,
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
        <div class="space-y-1">
          <div class="flex items-center gap-3">
            <h2 class="text-3xl font-bold tracking-tight text-foreground/90">
              {{ $t("crud.detail", { module: $t("modules.currency") }) }}
            </h2>
            <Badge v-if="currency?.isDefault" variant="secondary" class="bg-primary/10 text-primary border-primary/20 px-3 py-0.5">
              Default System Currency
            </Badge>
          </div>
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

    <div v-else-if="currency" class="grid gap-6 grid-cols-1 lg:grid-cols-3">
      <!-- Image Section -->
      <Card class="lg:col-span-1 overflow-hidden h-fit">
        <CardHeader class="pb-3">
          <CardTitle class="text-lg">{{ $t("crud.image") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="aspect-square relative rounded-lg border bg-muted/50 flex items-center justify-center overflow-hidden">
            <div class="flex flex-col items-center gap-2 text-muted-foreground">
              <Coins class="h-12 w-12 opacity-20" />
              <span class="text-xs">No image available</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Details Section -->
      <div class="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-lg">{{ $t("crud.generalInfo") }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Coins class="mr-2 h-4 w-4" />{{ $t("fields.currency") }}
                </div>
                <p class="font-medium text-base">{{ currency.currency }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Globe class="mr-2 h-4 w-4" />{{ $t("fields.country") }}
                </div>
                <p class="font-medium text-base">{{ currency.country }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <BadgeCent class="mr-2 h-4 w-4" />{{ $t("fields.code") }}
                </div>
                <p class="font-medium text-base">{{ currency.code }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <BadgeCent class="mr-2 h-4 w-4" />{{ $t("fields.symbol") }}
                </div>
                <p class="font-medium text-base">{{ currency.symbol || "-" }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-primary font-bold">
                  <Coins class="mr-2 h-4 w-4" />{{ $t("fields.exchangeRate") || 'Exchange Rate' }}
                </div>
                <p class="font-bold text-lg text-primary decoration-primary/20 underline">1 USD = {{ formatRate(currency.exchangeRate || (currency.code === 'KHR' ? 4100 : 1)) }} {{ currency.code }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <SeparatorHorizontal class="mr-2 h-4 w-4" />{{ $t("fields.thousandSeparator") }}
                </div>
                <p class="font-medium text-base">"{{ currency.thousandSeparator }}"</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <SeparatorHorizontal class="mr-2 h-4 w-4" />{{ $t("fields.decimalSeparator") }}
                </div>
                <p class="font-medium text-base">"{{ currency.decimalSeparator }}"</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-lg">{{ $t("crud.systemInfo") }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calendar class="mr-2 h-4 w-4" />{{ $t("fields.createdAt") }}
                </div>
                <p class="font-medium text-base">
                  {{ formatDate(currency.createdAt) }}
                </p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calendar class="mr-2 h-4 w-4" />{{ $t("fields.updatedAt") }}
                </div>
                <p class="font-medium text-base">
                  {{ formatDate(currency.updatedAt) }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
