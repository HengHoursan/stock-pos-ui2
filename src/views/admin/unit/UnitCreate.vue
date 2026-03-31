<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
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
const unitService = new UnitService();

const parentUnits = ref<Unit[]>([]);
const loading = ref(false);
const submitting = ref(false);

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(60),
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
      parentId:
        values.parentId && values.parentId !== "0"
          ? Number(values.parentId)
          : undefined,
    };
    const response = await unitService.create(payload);
    if (response.success) {
      toast.success("Unit created successfully");
      router.push("/admin/units");
    } else {
      toast.error(response.message || "Failed to create unit");
    }
  } catch (error) {
    toast.error("An error occurred while creating the unit");
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
      <h2 class="text-3xl font-bold tracking-tight">Create Unit</h2>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Unit Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit="onSubmit" id="unitForm" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Kilogram, Box, Piece"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ field }" name="parentId">
              <FormItem>
                <FormLabel>Parent Unit</FormLabel>
                <Select v-bind="field">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a parent unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
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
                <FormLabel>Symbol</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. kg, box, pcs"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="conversionFactor">
              <FormItem>
                <FormLabel>Conversion Factor</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormDescription>Relative to base unit.</FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="defaultPrice">
              <FormItem>
                <FormLabel>Default Price</FormLabel>
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

            <FormField name="isCalculateDetail">
              <FormItem
                class="flex flex-row items-center justify-between rounded-lg border p-4"
              >
                <div class="space-y-0.5">
                  <FormLabel class="text-base font-semibold"
                    >Calculate Details</FormLabel
                  >
                  <FormDescription>
                    Enable detail calculation for this unit.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch v-model="form.values.isCalculateDetail" />
                </FormControl>
              </FormItem>
            </FormField>

            <FormField name="status">
              <FormItem
                class="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2"
              >
                <div class="space-y-0.5">
                  <FormLabel class="text-base font-semibold"
                    >Active Status</FormLabel
                  >
                  <FormDescription>
                    Enable or disable this unit.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch v-model="form.values.status" />
                </FormControl>
              </FormItem>
            </FormField>
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex justify-end gap-2 border-t px-6 py-4">
        <Button variant="outline" @click="router.back()" :disabled="submitting">
          Cancel
        </Button>
        <Button type="submit" form="unitForm" :disabled="submitting">
          <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
          Create Unit
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
