<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { DiscountService } from "@/services/discount/discount.service";
import type { Discount } from "@/types/discount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  Pencil,
  Calendar,
  Clock,
  TicketPercent,
  Percent,
  Banknote,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-vue-next";
import { toast } from "vue-sonner";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const discountService = new DiscountService();
const discount = ref<Discount | null>(null);
const isLoading = ref(true);

async function fetchDiscount() {
  const id = parseInt(route.params.id as string);
  try {
    const response = await discountService.getDetail(id);
    if (response.success && response.data) {
      discount.value = response.data;
    } else {
      toast.error(t("crud.errorFetch", { module: t("modules.discount") }));
      router.push("/admin/discounts");
    }
  } catch (error) {
    toast.error(t("crud.errorFetch", { module: t("modules.discount") }));
    router.push("/admin/discounts");
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

function getDiscountStatus() {
  if (!discount.value) return { label: 'Unknown', variant: 'outline' as const };
  const now = new Date();
  const start = new Date(discount.value.discountStartDate);
  const end = new Date(discount.value.discountEndDate);

  if (!discount.value.status) return { label: t('crud.inactive'), variant: 'warning' as const };
  if (now < start) return { label: 'Upcoming', variant: 'outline' as const };
  if (now > end) return { label: 'Expired', variant: 'destructive' as const };
  return { label: 'Active', variant: 'success' as const };
}

onMounted(() => {
  fetchDiscount();
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
          @click="router.push('/admin/discounts')"
          class="rounded-full h-9 w-9 bg-background shadow-sm hover:bg-muted transition-colors"
        >
          <ChevronLeft class="h-5 w-5" />
        </Button>
        <div>
          <h2 class="text-3xl font-bold tracking-tight text-foreground/90">
            {{ $t("crud.detail", { module: $t("modules.discount") }) }}
          </h2>
          <p class="text-muted-foreground text-sm">
            Viewing details for discount code {{ discount?.code || '' }}
          </p>
        </div>
      </div>
      <Button
        v-if="discount"
        @click="router.push(`/admin/discounts/${discount.id}/edit`)"
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

    <div v-else-if="discount" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Left Column: Basic Info -->
      <div class="md:col-span-2 space-y-6">
        <Card class="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader class="border-b bg-muted/20 pb-4">
            <div class="flex items-center gap-2">
              <div class="p-2 bg-primary/10 rounded-lg">
                <TicketPercent class="h-4 w-4 text-primary" />
              </div>
              <CardTitle class="text-base font-semibold">{{ $t("crud.generalInfo") }}</CardTitle>
            </div>
          </CardHeader>
          <CardContent class="p-6 space-y-8">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div class="space-y-1">
                <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">{{ $t("fields.code") }}</p>
                <code class="text-lg font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 uppercase">
                  {{ discount.code }}
                </code>
              </div>
              <div class="space-y-1">
                <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">{{ $t("fields.discountType") }}</p>
                <Badge variant="secondary" class="capitalize">
                  <component :is="discount.discountType === 'percentage' ? Percent : Banknote" class="h-3 w-3 mr-1" />
                  {{ $t(`fields.${discount.discountType}`) }}
                </Badge>
              </div>
            </div>

            <Separator class="bg-border/40" />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div class="space-y-1">
                <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">{{ $t("fields.discountAmount") }}</p>
                <p class="text-3xl font-black text-foreground/90 font-mono">
                  {{ discount.discountAmount }}{{ discount.discountType === 'percentage' ? '%' : '' }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card class="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader class="border-b bg-muted/20 pb-4">
            <div class="flex items-center gap-2">
              <div class="p-2 bg-primary/10 rounded-lg">
                <Calendar class="h-4 w-4 text-primary" />
              </div>
              <CardTitle class="text-base font-semibold">Validity Period</CardTitle>
            </div>
          </CardHeader>
          <CardContent class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 relative">
              <div class="space-y-1 relative z-10">
                <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">{{ $t("fields.startDate") }}</p>
                <div class="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/40">
                  <CheckCircle2 class="h-4 w-4 text-emerald-500" />
                  <p class="text-sm font-semibold">{{ formatDate(discount.discountStartDate) }}</p>
                </div>
              </div>
              <div class="space-y-1 relative z-10">
                <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">{{ $t("fields.endDate") }}</p>
                <div class="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/40">
                  <XCircle class="h-4 w-4 text-destructive" />
                  <p class="text-sm font-semibold">{{ formatDate(discount.discountEndDate) }}</p>
                </div>
              </div>
              <div class="hidden sm:block absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] h-[2px] bg-linear-to-r from-emerald-500/20 via-primary/20 to-destructive/20 opacity-50"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Right Column: System Info -->
      <div class="space-y-6">
        <Card class="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader class="border-b bg-muted/20 pb-4">
            <CardTitle class="text-base font-semibold">Current Availability</CardTitle>
          </CardHeader>
          <CardContent class="p-6 space-y-6">
            <div class="space-y-4">
              <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Operational Status</span>
                  <Badge :variant="getDiscountStatus().variant" class="font-bold px-4 py-1 uppercase text-[10px]">
                    {{ getDiscountStatus().label }}
                  </Badge>
                </div>
                <div class="p-4 rounded-xl bg-muted/30 border border-border/30 flex items-start gap-3">
                  <AlertCircle class="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p class="text-xs leading-relaxed text-muted-foreground italic">
                    This discount is currently {{ getDiscountStatus().label.toLowerCase() }} based on the defined date range and master status.
                  </p>
                </div>
              </div>
              
              <Separator class="bg-border/40" />
              
              <div class="space-y-2 text-right">
                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar class="h-3.5 w-3.5" />
                    <span class="text-[10px] font-bold uppercase tracking-tighter">{{ $t("fields.createdAt") }}</span>
                  </div>
                  <span class="text-xs font-medium">{{ formatDate(discount.createdAt) }}</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-1.5 text-muted-foreground">
                    <Clock class="h-3.5 w-3.5" />
                    <span class="text-[10px] font-bold uppercase tracking-tighter">{{ $t("fields.updatedAt") }}</span>
                  </div>
                  <span class="text-xs font-medium">{{ formatDate(discount.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
