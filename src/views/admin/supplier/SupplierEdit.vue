<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";

import {
  FormControl,
  FormDescription,
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
import { Switch } from "@/components/ui/switch";

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
  UserPlus,
  Phone,
  MapPin,
  Settings,
} from "lucide-vue-next";
import { SupplierService } from "@/services/supplier/supplier.service";
import { CustomerType } from "@/types";
import { toast } from "vue-sonner";

const router = useRouter();
const route = useRoute();
const supplierService = new SupplierService();

const loading = ref(true);
const submitting = ref(false);
const supplierId = Number(route.params.id);

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2, t("fields.enterName")).max(100),
    nameLatin: z.string().max(100).optional().nullable(),
    code: z.string().max(50).optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal("")),
    phoneNumber: z.string().max(20).optional().nullable(),
    address: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    type: z.number().default(CustomerType.DINE_IN),
    status: z.boolean().default(true),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});

async function fetchSupplier() {
  loading.value = true;
  try {
    const response = await supplierService.getDetail(supplierId);
    if (response.success && response.data) {
      form.setValues({
        ...response.data,
        email: response.data.email || "",
        nameLatin: response.data.nameLatin || "",
        phoneNumber: response.data.phoneNumber || "",
        address: response.data.address || "",
        description: response.data.description || "",
      });
    } else {
      toast.error(t("crud.notFound", { module: t("modules.supplier") }));
      router.push("/admin/suppliers");
    }
  } catch (error) {
    console.error("Fetch supplier error:", error);
    toast.error(t("crud.errorFetch", { module: t("modules.supplier") }));
  } finally {
    loading.value = false;
  }
}

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      id: supplierId,
      ...values,
      email: values.email || undefined,
      code: values.code || undefined,
    };
    const response = await supplierService.update(payload as any);
    if (response.success) {
      toast.success(t("crud.successUpdate", { module: t("modules.supplier") }));
      router.push("/admin/suppliers");
    } else {
      toast.error(
        response.message ||
          t("crud.errorUpdate", { module: t("modules.supplier") }),
      );
    }
  } catch (error) {
    toast.error(t("crud.errorGeneral"));
  } finally {
    submitting.value = false;
  }
});

onMounted(() => {
  fetchSupplier();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <Button variant="outline" size="icon" @click="router.back()">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <h2 class="text-3xl font-bold tracking-tight">
        {{ $t("crud.edit", { module: $t("modules.supplier") }) }}
      </h2>
    </div>

    <div
      v-if="loading"
      class="flex flex-col items-center justify-center h-[400px] border rounded-lg bg-card shadow-sm"
    >
      <Loader2 class="h-8 w-8 animate-spin text-primary mb-4" />
      <p class="text-muted-foreground">{{ $t("crud.loading") }}</p>
    </div>

    <form v-else @submit="onSubmit" id="supplierEditForm">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 1. General Information -->
        <Card class="lg:col-span-1 shadow-sm border-muted-foreground/10">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <UserPlus class="h-5 w-5 text-primary" />
              {{ $t("crud.generalInfo") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 space-y-4">
            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel>{{ $t("fields.name") }}</FormLabel>
                <FormControl>
                  <Input
                    :placeholder="$t('fields.enterName')"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="nameLatin">
              <FormItem>
                <FormLabel>{{ $t("fields.nameLatin") }}</FormLabel>
                <FormControl>
                  <Input
                    :placeholder="$t('fields.nameLatin')"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="code">
              <FormItem>
                <FormLabel>{{ $t("fields.code") }}</FormLabel>
                <FormControl>
                  <Input
                    :placeholder="$t('fields.code')"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </CardContent>
        </Card>

        <!-- 2. Contact Information -->
        <Card class="lg:col-span-1 shadow-sm border-muted-foreground/10">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <Phone class="h-5 w-5 text-primary" />
              {{ $t("fields.phoneNumber") }} & {{ $t("auth.email") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 space-y-4">
            <FormField v-slot="{ componentField }" name="email">
              <FormItem>
                <FormLabel>{{ $t("auth.email") }}</FormLabel>
                <FormControl>
                  <Input
                    :placeholder="$t('fields.emailPlaceholder')"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="phoneNumber">
              <FormItem>
                <FormLabel>{{ $t("fields.phoneNumber") }}</FormLabel>
                <FormControl>
                  <Input
                    :placeholder="$t('fields.phoneNumber')"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="address">
              <FormItem>
                <FormLabel class="flex items-center gap-2">
                  <MapPin class="h-4 w-4 text-muted-foreground" />
                  {{ $t("fields.address") }}
                </FormLabel>
                <FormControl>
                  <Textarea
                    :placeholder="$t('fields.address')"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </CardContent>
        </Card>

        <!-- 3. Settings & Description -->
        <Card class="lg:col-span-1 shadow-sm border-muted-foreground/10">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <Settings class="h-5 w-5 text-primary" />
              {{ $t("layout.adminPanel") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 space-y-6">
            <FormField v-slot="{ field }" name="type">
              <FormItem>
                <FormLabel>{{ $t("fields.type") }}</FormLabel>
                <Select
                  :model-value="String(field.value)"
                  @update:model-value="(v) => field.onChange(Number(v))"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue :placeholder="$t('crud.selectType')" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem :value="String(CustomerType.DINE_IN)">{{
                      $t("fields.dineIn")
                    }}</SelectItem>
                    <SelectItem :value="String(CustomerType.DINE_OUT)">{{
                      $t("fields.dineOut")
                    }}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="description">
              <FormItem>
                <FormLabel>{{ $t("fields.description") }}</FormLabel>
                <FormControl>
                  <Textarea
                    :placeholder="$t('fields.enterDescription')"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="status">
              <FormItem
                class="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/5"
              >
                <div class="space-y-0.5">
                  <FormLabel class="text-base font-semibold">{{
                    $t("fields.activeStatus")
                  }}</FormLabel>
                  <FormDescription>{{
                    $t("fields.statusDescription", {
                      module: $t("modules.supplier"),
                    })
                  }}</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    :model-value="!!value"
                    @update:model-value="(v: boolean) => handleChange(v)"
                  />
                </FormControl>
              </FormItem>
            </FormField>
          </CardContent>
          <CardFooter
            class="flex justify-end gap-2 border-t px-6 py-4 bg-muted/5"
          >
            <Button
              variant="outline"
              type="button"
              @click="router.back()"
              :disabled="submitting"
              >{{ $t("crud.cancel") }}</Button
            >
            <Button
              type="submit"
              form="supplierEditForm"
              :disabled="submitting"
            >
              <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ $t("crud.updateBtn", { module: $t("modules.supplier") }) }}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  </div>
</template>
