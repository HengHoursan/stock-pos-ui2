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
  ChevronLeft,
  Loader2,
  Coins,
} from "lucide-vue-next";
import { CurrencyService } from "@/services/currency/currency.service";
import { toast } from "vue-sonner";

const { t } = useI18n();
const router = useRouter();
const currencyService = new CurrencyService();
const isSubmitting = ref(false);

const formSchema = toTypedSchema(
  zod.object({
    code: zod.string().min(1, t("auth.usernameRequired")).max(10),
    country: zod.string().min(1, t("auth.usernameRequired")),
    currency: zod.string().min(1, t("auth.usernameRequired")),
    symbol: zod.string().max(10).optional().default(""),
    thousandSeparator: zod.string().max(5).optional().default(","),
    decimalSeparator: zod.string().max(5).optional().default("."),
    status: zod.boolean().default(true),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    status: true,
    thousandSeparator: ",",
    decimalSeparator: ".",
  },
});

async function onSubmit(values: any) {
  isSubmitting.value = true;
  try {
    const response = await currencyService.create(values);
    if (response.success) {
      toast.success(t("crud.successCreate", { module: t("modules.currency") }));
      router.push("/admin/currencies");
    } else {
      toast.error(response.message || t("crud.errorCreate", { module: t("modules.currency") }));
    }
  } catch (error) {
    toast.error(t("crud.errorCreate", { module: t("modules.currency") }));
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
        @click="router.push('/admin/currencies')"
        class="rounded-full shadow-sm"
      >
        <ChevronLeft class="h-6 w-6" />
      </Button>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">
          {{ $t("crud.create", { module: $t("modules.currency") }) }}
        </h2>
      </div>
    </div>

    <Form v-slot="{ handleSubmit }" :validation-schema="formSchema" as="div">
      <form @submit="handleSubmit($event, onSubmit)" id="currencyForm">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Coins class="h-5 w-5" />
              {{ $t("crud.info", { module: $t("modules.currency") }) }}
            </CardTitle>
          </CardHeader>
          <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField v-slot="{ componentField }" name="code">
              <FormItem>
                <FormLabel>{{ $t("fields.code") }}</FormLabel>
                <FormControl>
                  <Input placeholder="USD, KHR..." v-bind="componentField" class="uppercase" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="country">
              <FormItem>
                <FormLabel>{{ $t("fields.country") }}</FormLabel>
                <FormControl>
                  <Input placeholder="Cambodia, USA..." v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="currency">
              <FormItem>
                <FormLabel>{{ $t("fields.currency") }}</FormLabel>
                <FormControl>
                  <Input placeholder="US Dollar, Riel..." v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="symbol">
              <FormItem>
                <FormLabel>{{ $t("fields.symbol") }}</FormLabel>
                <FormControl>
                  <Input placeholder="$, ៛..." v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="thousandSeparator">
              <FormItem>
                <FormLabel>{{ $t("fields.thousandSeparator") }}</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="decimalSeparator">
              <FormItem>
                <FormLabel>{{ $t("fields.decimalSeparator") }}</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <div class="md:col-span-2">
              <FormField name="status">
                <FormItem
                  class="flex flex-row items-center justify-between rounded-lg border p-4"
                >
                  <div class="space-y-0.5">
                    <FormLabel class="text-base">
                      {{ $t("fields.activeStatus") }}
                    </FormLabel>
                    <FormDescription>
                      {{ $t("fields.statusDescription", { module: $t("modules.currency") }) }}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      v-model="form.values.status"
                    />
                  </FormControl>
                </FormItem>
              </FormField>
            </div>
          </CardContent>
          <CardFooter class="flex justify-end gap-2 border-t pt-6 pb-6">
            <Button
              type="button"
              variant="outline"
              @click="router.push('/admin/currencies')"
              :disabled="isSubmitting"
            >
              {{ $t("crud.cancel") }}
            </Button>
            <Button
              type="submit"
              form="currencyForm"
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
