<script setup lang="ts">
import { useAppI18n } from "@/hooks/useAppI18n";
const { t, labels, crud } = useAppI18n("unit");
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
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
import type { Unit } from "@/types";
import { toast } from "vue-sonner";


import { useZod } from "@/hooks/useZod";
import { computed } from "vue";

const router = useRouter();
const route = useRoute();
const unitService = new UnitService();
const { z, err } = useZod();

const unitId = Number(route.params.id);
const parentUnits = ref<Unit[]>([]);
const loading = ref(true);
const submitting = ref(false);

const unitSchema = computed(() => 
  z.object({
    name: z.string().min(2, err.min("fields.name", 2)).max(60, err.max("fields.name", 60)),
    code: z.string().optional(),
    slug: z.string().optional(),
    parentId: z.string().optional(),
    symbol: z.string().optional(),
    conversionFactor: z.number().gte(0, err.gte("fields.conversionFactor", 0)).optional(),
    defaultPrice: z.number().gte(0, err.gte("fields.defaultPrice", 0)).optional(),
    isCalculateDetail: z.boolean().default(false),
    status: z.boolean().default(true),
  })
);

const formSchema = computed(() => toTypedSchema(unitSchema.value));

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
      toast.error(t('crud.notFound', { module: labels.name }));
      router.push("/admin/units");
    }

    if (listResponse.success && listResponse.data) {
      parentUnits.value = listResponse.data.filter(
        (i) => i.id !== unitId,
      );
    }
  } catch (error) {
    toast.error(t('crud.errorFetch', { module: labels.name }));
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
      toast.success(t('crud.successUpdate', { module: labels.name }));
      router.push("/admin/units");
    } else {
      toast.error(response.message || t('crud.errorUpdate', { module: labels.name }));
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
      <h2 class="text-3xl font-bold tracking-tight">{{ crud.editBtn }} {{ labels.name }}</h2>
    </div>

    <Card v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </Card>

    <Card v-else>
      <CardHeader>
        <CardTitle>{{ t('crud.info', { module: labels.name }) }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit="onSubmit" id="unitForm" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField v-slot="{ componentField }" name="code">
              <FormItem>
                <FormLabel>{{ fields.code }}</FormLabel>
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
                <FormLabel>{{ fields.slug }}</FormLabel>
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
                <FormLabel>{{ fields.name }}</FormLabel>
                <FormControl>
                  <Input
                    :placeholder="fields.enterUnitName"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ field }" name="parentId">
              <FormItem>
                <FormLabel>{{ t('fields.parentOf', { module: labels.name }) }}</FormLabel>
                <Select v-bind="field">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue :placeholder="fields.selectParentUnit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">{{ crud.none }}</SelectItem>
                    <template v-if="parentUnits.length > 0">
                      <SelectItem
                        v-for="u in parentUnits"
                        :key="u.id"
                        :value="String(u.id)"
                      >
                        {{ u.name }}
                      </SelectItem>
                    </template>
                    <SelectItem v-else disabled value="none" class="text-muted-foreground italic text-xs py-3 text-center">
                      {{ $t('common.noData') }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="symbol">
              <FormItem>
                <FormLabel>{{ fields.symbol }}</FormLabel>
                <FormControl>
                  <Input
                    :placeholder="fields.enterSymbol"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="conversionFactor">
              <FormItem>
                <FormLabel>{{ fields.conversionFactor }}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormDescription>{{ t('fields.relativeToBase', { module: labels.name }) }}</FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="defaultPrice">
              <FormItem>
                <FormLabel>{{ fields.defaultPrice }}</FormLabel>
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
                    >{{ fields.isCalculateDetail }}</FormLabel
                  >
                  <FormDescription>
                    {{ t('fields.calculateDetailInfo', { module: labels.name }) }}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch :model-value="!!value" @update:model-value="(v: boolean) => handleChange(v)" />
                </FormControl>
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="status">
              <FormItem
                class="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm md:col-span-2"
              >
                <div class="space-y-0.5">
                  <FormLabel class="text-base font-semibold">{{
                    fields.activeStatus
                  }}</FormLabel>
                  <FormDescription>
                    {{ t("fields.statusDescription", { module: labels.name }) }}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch :model-value="!!value" @update:model-value="(v: boolean) => handleChange(v)" />
                </FormControl>
              </FormItem>
            </FormField>
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex justify-end gap-2 border-t px-6 py-4">
        <Button variant="outline" @click="router.back()" :disabled="submitting">{{ crud.cancel }}</Button>
        <Button type="submit" form="unitForm" :disabled="submitting">
          <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
          {{ crud.updateBtn }} {{ labels.name }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
