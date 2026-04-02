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
import { ChevronLeft, Loader2 } from "lucide-vue-next";
import { UnitService } from "@/services/unit/unit.service";
import type { Unit } from "@/types/unit";
import { toast } from "vue-sonner";


const router = useRouter();
const route = useRoute();
const unitService = new UnitService();

const unitId = Number(route.params.id);
const parentUnits = ref<Unit[]>([]);
const loading = ref(true);
const submitting = ref(false);

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(60),
    code: z.string().optional(),
    slug: z.string().optional(),
    parentId: z.string().optional(),
    symbol: z.string().optional(),
    conversionFactor: z.number().min(0).optional(),
    defaultPrice: z.number().min(0).optional(),
    isCalculateDetail: z.boolean().default(false),
    status: z.boolean().default(true),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: "",
    code: "",
    slug: "",
    symbol: "",
    conversionFactor: 1,
    defaultPrice: 0,
    isCalculateDetail: false,
    status: true,
  },
});

async function fetchData() {
  loading.value = true;
  try {
    const [unitResponse, listResponse] = await Promise.all([
      unitService.getDetail(unitId),
      unitService.getAll(),
    ]);

    if (unitResponse.success && unitResponse.data) {
      const u = unitResponse.data;
      form.setValues({
        name: u.name,
        code: u.code || "",
        slug: u.slug || "",
        parentId: u.parentId ? String(u.parentId) : "0",
        symbol: u.symbol || "",
        conversionFactor: u.conversionFactor || 1,
        defaultPrice: u.defaultPrice || 0,
        isCalculateDetail: u.isCalculateDetail || false,
        status: u.status,
      });
    } else {
      toast.error(t('crud.notFound', { module: t('modules.unit') }));
      router.push("/admin/units");
    }

    if (listResponse.success && listResponse.data) {
      parentUnits.value = listResponse.data.filter(
        (i) => i.id !== unitId,
      );
    }
  } catch (error) {
    toast.error(t('crud.errorFetch', { module: t('modules.unit') }));
  } finally {
    loading.value = false;
  }
}

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      id: unitId,
      ...values,
      parentId:
        values.parentId && values.parentId !== "0"
          ? Number(values.parentId)
          : undefined,
    };
    const response = await unitService.update(payload);
    if (response.success) {
      toast.success(t('crud.successUpdate', { module: t('modules.unit') }));
      router.push("/admin/units");
    } else {
      toast.error(response.message || t('crud.errorUpdate', { module: t('modules.unit') }));
    }
  } catch (error) {
    toast.error(t('crud.errorGeneral'));
  } finally {
    submitting.value = false;
  }
});

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <Button variant="outline" size="icon" @click="router.back()">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <h2 class="text-3xl font-bold tracking-tight">{{ $t('crud.edit', { module: $t('modules.unit') }) }}</h2>
    </div>

    <Card v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </Card>

    <Card v-else>
      <CardHeader>
        <CardTitle>{{ $t('crud.info', { module: $t('modules.unit') }) }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit="onSubmit" id="unitForm" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField v-slot="{ componentField }" name="code">
              <FormItem>
                <FormLabel>{{ $t('fields.code') }}</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    disabled
                    class="bg-muted/50 cursor-not-allowed"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="slug">
              <FormItem>
                <FormLabel>{{ $t('fields.slug') }}</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    disabled
                    class="bg-muted/50 cursor-not-allowed"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel>{{ $t('fields.name') }}</FormLabel>
                <FormControl>
                  <Input
                    :placeholder="$t('fields.enterUnitName')"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ field }" name="parentId">
              <FormItem>
                <FormLabel>{{ $t('fields.parentOf', { module: $t('modules.unit') }) }}</FormLabel>
                <Select v-bind="field">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue :placeholder="$t('fields.selectParentUnit')" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">{{ $t('crud.none') }}</SelectItem>
                    <SelectItem
                      v-for="u in parentUnits"
                      :key="u.id"
                      :value="String(u.id)"
                    >
                      {{ u.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="symbol">
              <FormItem>
                <FormLabel>{{ $t('fields.symbol') }}</FormLabel>
                <FormControl>
                  <Input
                    :placeholder="$t('fields.enterSymbol')"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="conversionFactor">
              <FormItem>
                <FormLabel>{{ $t('fields.conversionFactor') }}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormDescription>{{ $t('fields.relativeToBase', { module: $t('modules.unit') }) }}</FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="defaultPrice">
              <FormItem>
                <FormLabel>{{ $t('fields.defaultPrice') }}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="isCalculateDetail">
              <FormItem
                class="flex flex-row items-center justify-between rounded-lg border p-4"
              >
                <div class="space-y-0.5">
                  <FormLabel class="text-base font-semibold"
                    >{{ $t('fields.isCalculateDetail') }}</FormLabel
                  >
                  <FormDescription>
                    {{ $t('fields.calculateDetailInfo', { module: $t('modules.unit') }) }}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch :checked="value" @update:checked="handleChange" />
                </FormControl>
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="status">
              <FormItem
                class="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm md:col-span-2"
              >
                <div class="space-y-0.5">
                  <FormLabel class="text-base font-semibold">{{
                    $t("fields.activeStatus")
                  }}</FormLabel>
                  <FormDescription>
                    {{ $t("fields.statusDescription", { module: $t("modules.unit") }) }}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch :checked="value" @update:checked="handleChange" />
                </FormControl>
              </FormItem>
            </FormField>
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex justify-end gap-2 border-t px-6 py-4">
        <Button variant="outline" @click="router.back()" :disabled="submitting">{{ $t('crud.cancel') }}</Button>
        <Button type="submit" form="unitForm" :disabled="submitting">
          <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
          {{ $t('crud.updateBtn', { module: $t('modules.unit') }) }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
