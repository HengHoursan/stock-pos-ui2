<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useForm } from "vee-validate";
import * as zod from "zod";
import { toTypedSchema } from "@vee-validate/zod";
import { useI18n } from "vue-i18n";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Loader2,
  TicketPercent,
} from "lucide-vue-next";
import { DiscountService } from "@/services/discount/discount.service";
import { toast } from "vue-sonner";
import DatePicker from "@/components/DatePicker.vue";

const { t } = useI18n();
const router = useRouter();
const discountService = new DiscountService();
const isSubmitting = ref(false);

const formSchema = toTypedSchema(
  zod.object({
    code: zod.string().min(1, t("auth.usernameRequired")).max(50),
    discountType: zod.enum(["percentage", "fixed"]),
    discountAmount: zod.number().min(0),
    discountStartDate: zod.string().min(1, t("fields.selectStartDate")),
    discountEndDate: zod.string().min(1, t("fields.selectEndDate")),
    status: zod.boolean().default(true),
  }).refine((data) => new Date(data.discountEndDate) > new Date(data.discountStartDate), {
    message: "End date must be after start date",
    path: ["discountEndDate"],
  })
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    status: true,
    discountType: "percentage",
    discountStartDate: new Date().toISOString().slice(0, 16),
    discountEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  },
});

async function onSubmit(values: any) {
  isSubmitting.value = true;
  try {
    const response = await discountService.create(values);
    if (response.success) {
      toast.success(t("crud.successCreate", { module: t("modules.discount") }));
      router.push("/admin/discounts");
    } else {
      toast.error(response.message || t("crud.errorCreate", { module: t("modules.discount") }));
    }
  } catch (error) {
    toast.error(t("crud.errorCreate", { module: t("modules.discount") }));
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        @click="router.push('/admin/discounts')"
        class="rounded-full shadow-sm"
      >
        <ChevronLeft class="h-6 w-6" />
      </Button>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">
          {{ $t("crud.create", { module: $t("modules.discount") }) }}
        </h2>
      </div>
    </div>

    <Form v-slot="{ handleSubmit }" :validation-schema="formSchema" as="div">
      <form @submit="handleSubmit($event, onSubmit)" id="discountForm">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <TicketPercent class="h-5 w-5" />
              {{ $t("crud.info", { module: $t("modules.discount") }) }}
            </CardTitle>
          </CardHeader>
          <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField v-slot="{ componentField }" name="code">
              <FormItem class="md:col-span-2">
                <FormLabel>{{ $t("fields.code") }}</FormLabel>
                <FormControl>
                  <Input placeholder="SUMMER2025, OFF50..." v-bind="componentField" class="uppercase" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="discountType">
              <FormItem>
                <FormLabel>{{ $t("fields.discountType") }}</FormLabel>
                <Select :model-value="value" @update:model-value="handleChange">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">{{ $t("fields.percentage") }}</SelectItem>
                    <SelectItem value="fixed">{{ $t("fields.fixed") }}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="discountAmount">
              <FormItem>
                <FormLabel>{{ $t("fields.discountAmount") }}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    v-bind="componentField"
                    @input="form.setFieldValue('discountAmount', parseFloat($event.target.value))"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="discountStartDate">
              <FormItem>
                <FormLabel>{{ $t("fields.startDate") }}</FormLabel>
                <FormControl>
                  <DatePicker
                    :model-value="value"
                    @update:model-value="handleChange"
                    :placeholder="$t('fields.selectStartDate')"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="discountEndDate">
              <FormItem>
                <FormLabel>{{ $t("fields.endDate") }}</FormLabel>
                <FormControl>
                  <DatePicker
                    :model-value="value"
                    @update:model-value="handleChange"
                    :placeholder="$t('fields.selectEndDate')"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <div class="md:col-span-2">
              <FormField v-slot="{ value, handleChange }" name="status">
                <FormItem
                  class="flex flex-row items-center justify-between rounded-lg border p-4"
                >
                  <div class="space-y-0.5">
                    <FormLabel class="text-base">
                      {{ $t("fields.activeStatus") }}
                    </FormLabel>
                    <FormDescription>
                      {{ $t("fields.statusDescription", { module: $t("modules.discount") }) }}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      :checked="value"
                      @update:checked="handleChange"
                    />
                  </FormControl>
                </FormItem>
              </FormField>
            </div>
          </CardContent>
          <CardFooter class="flex justify-end gap-2 border-t pt-6 pb-6 mt-4">
            <Button
              type="button"
              variant="outline"
              @click="router.push('/admin/discounts')"
              :disabled="isSubmitting"
            >
              {{ $t("crud.cancel") }}
            </Button>
            <Button
              type="submit"
              form="discountForm"
              class="min-w-[100px]"
              :disabled="isSubmitting"
            >
              <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ $t("crud.createBtn") }}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  </div>
</template>
