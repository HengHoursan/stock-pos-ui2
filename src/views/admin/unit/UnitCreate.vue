<script setup lang="ts">
import { useAppI18n } from "@/hooks/useAppI18n";
const { t, labels, fields, crud } = useAppI18n("unit");
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
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
const unitService = new UnitService();
const { z, err } = useZod();

const parentUnits = ref<Unit[]>([]);
const loading = ref(false);
const submitting = ref(false);

const unitSchema = computed(() => 
  z.object({
    name: z.string().min(2, err.min("fields.name", 2)).max(60, err.max("fields.name", 60)),
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
    symbol: "",
    conversionFactor: 1,
    defaultPrice: 0,
    isCalculateDetail: false,
    status: true,
  },
});

async function fetchParentUnits() {
  loading.value = true;
  try {
    const response = await unitService.getAll();
    if (response.success && response.data) {
      parentUnits.value = response.data;
    }
  } catch (error) {
    console.error("Failed to fetch units", error);
  } finally {
    loading.value = false;
  }
}

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      ...values,
      latinName: (values as any).latinName || "",
      parentId:
        values.parentId && values.parentId !== "0"
          ? Number(values.parentId)
          : undefined,
    };
    const response = await unitService.create(payload);
    if (response.success) {
      toast.success(t('crud.successCreate', { module: labels.name }));
      router.push("/admin/units");
    } else {
      toast.error(response.message || t('crud.errorCreate', { module: labels.name }));
    }
  } catch (error) {
    toast.error(t('crud.errorGeneral'));
  } finally {
    submitting.value = false;
  }
});

onMounted(() => {
  fetchParentUnits();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <Button variant="outline" size="icon" @click="router.back()">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <h2 class="text-3xl font-bold tracking-tight">{{ crud.createBtn }} {{ labels.name }}</h2>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>{{ t('crud.info', { module: labels.name }) }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit="onSubmit" id="unitForm" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4">
                <div class="space-y-0.5">
                  <FormLabel class="text-base font-semibold">{{ fields.activeStatus }}</FormLabel>
                  <FormDescription>{{ t('fields.statusDescription', { module: labels.name }) }}</FormDescription>
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
          <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />{{ crud.createBtn }} {{ labels.name }}</Button>
      </CardFooter>
    </Card>
  </div>
</template>
