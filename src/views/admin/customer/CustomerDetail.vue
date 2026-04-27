<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Loader2,
  Users,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Settings,
  AlignLeft,
} from "lucide-vue-next";
import { CustomerService } from "@/services/customer/customer.service";
import type { Customer } from "@/types";
import { CustomerType } from "@/types";
import { toast } from "vue-sonner";

const router = useRouter();
const route = useRoute();
const customerService = new CustomerService();

const customerId = Number(route.params.id);
const customer = ref<Customer | null>(null);
const loading = ref(true);

async function fetchCustomer() {
  loading.value = true;
  try {
    const response = await customerService.getDetail(customerId);
    if (response.success && response.data) {
      customer.value = response.data;
    } else {
      toast.error(t("crud.notFound", { module: t("modules.customer") }));
      router.push("/admin/customers");
    }
  } catch (error) {
    toast.error(t("crud.errorFetch", { module: t("modules.customer") }));
  } finally {
    loading.value = false;
  }
}



function getTypeLabel(type: CustomerType) {
  return type === CustomerType.DINE_IN
    ? t("fields.dineIn")
    : t("fields.dineOut");
}

onMounted(() => {
  fetchCustomer();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div class="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          @click="router.back()"
          class="h-10 w-10"
        >
          <ChevronLeft class="h-5 w-5" />
        </Button>
        <div class="flex items-center gap-3">
          <h2 class="text-3xl font-bold tracking-tight">
            {{
              customer?.name ||
              $t("crud.detail", { module: $t("modules.customer") })
            }}
          </h2>
          <Badge
            v-if="customer"
            :variant="customer.status ? 'success' : 'warning'"
            class="text-[10px] h-5 px-2 uppercase font-bold shadow-sm self-center mt-1"
          >
            {{ customer.status ? $t("crud.active") : $t("crud.inactive") }}
          </Badge>
        </div>
      </div>
      <!-- <div class="flex items-center gap-2">
        <Button variant="outline" @click="router.push(`/admin/customers/${customerId}/edit`)" class="flex-1 md:flex-none">
          <Pencil class="mr-2 h-4 w-4" />{{ $t("crud.editBtn") }}
        </Button>
        <Button variant="destructive" @click="deleteCustomer" class="flex-1 md:flex-none">
          <Trash2 class="mr-2 h-4 w-4" />{{ $t("crud.delete") }}
        </Button>
      </div> -->
    </div>

    <Card v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </Card>

    <div v-else-if="customer" class="grid gap-6 grid-cols-1 lg:grid-cols-3">
      <!-- Image Section -->
      <Card class="lg:col-span-1 overflow-hidden h-fit">
        <CardHeader class="pb-3">
          <CardTitle class="text-lg">{{ $t("crud.image") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="aspect-square relative rounded-lg border bg-muted/50 flex items-center justify-center overflow-hidden">
            <div class="flex flex-col items-center gap-2 text-muted-foreground">
              <Users class="h-12 w-12 opacity-20" />
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
                  <User class="mr-2 h-4 w-4" />{{ $t("fields.name") }}
                </div>
                <p class="font-medium text-base">{{ customer.name }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Settings class="mr-2 h-4 w-4" />{{ $t("fields.code") }}
                </div>
                <p class="font-medium text-base">{{ customer.code || "N/A" }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Settings class="mr-2 h-4 w-4" />{{ $t("fields.type") }}
                </div>
                <p class="font-medium text-base">{{ getTypeLabel(customer.type) }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <User class="mr-2 h-4 w-4" />{{ $t("fields.nameLatin") }}
                </div>
                <p class="font-medium text-base">{{ customer.nameLatin || "-" }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Mail class="mr-2 h-4 w-4" />{{ $t("auth.email") }}
                </div>
                <p class="font-medium text-base">{{ customer.email || "-" }}</p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Phone class="mr-2 h-4 w-4" />{{ $t("fields.phoneNumber") }}
                </div>
                <p class="font-medium text-base">{{ customer.phoneNumber || "-" }}</p>
              </div>

              <div class="sm:col-span-2 space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <MapPin class="mr-2 h-4 w-4" />{{ $t("fields.address") }}
                </div>
                <p class="text-sm leading-relaxed text-foreground/80 bg-muted/30 p-3 rounded-md">
                  {{ customer.address || "-" }}
                </p>
              </div>
            </div>

            <div class="mt-6 pt-6 border-t space-y-2">
              <div class="flex items-center text-sm text-muted-foreground">
                <AlignLeft class="mr-2 h-4 w-4" />{{ $t("fields.description") }}
              </div>
              <p class="text-sm leading-relaxed text-foreground/80 bg-muted/30 p-4 rounded-md">
                {{ customer.description || "-" }}
              </p>
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
                  {{ new Date(customer.createdAt).toLocaleString() }}
                </p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Calendar class="mr-2 h-4 w-4" />{{ $t("fields.updatedAt") }}
                </div>
                <p class="font-medium text-base">
                  {{ new Date(customer.updatedAt).toLocaleString() }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
