<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";

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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, Loader2, Coins, Check, Search } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import { CurrencyService } from "@/services/currency/currency.service";
import { toast } from "vue-sonner";

import { useAppI18n } from "@/hooks/useAppI18n";
import { useZod } from "@/hooks/useZod";

const { t, labels, fields, crud } = useAppI18n("currency");
const router = useRouter();
const route = useRoute();
const currencyService = new CurrencyService();
const { z, err } = useZod();
const isSubmitting = ref(false);
const isLoading = ref(true);

const countries = [
  "United States",
  "Cambodia",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "China",
  "India",
  "Brazil",
  "Russia",
  "South Africa",
  "Thailand",
  "Vietnam",
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Philippines",
  "South Korea",
];

const searchTerm = ref("");
const isDropdownOpen = ref(false);

const filteredCountries = computed(() => {
  if (!searchTerm.value) return countries;
  return countries.filter((c) =>
    c.toLowerCase().includes(searchTerm.value.toLowerCase()),
  );
});

function selectCountry(country: string) {
  form.setFieldValue("country", country);
  searchTerm.value = country;
  isDropdownOpen.value = false;
}

const currencySchema = computed(() => 
  z.object({
    code: z.string().min(1, err.required("fields.code")).max(10, err.max("fields.code", 10)),
    country: z.string().min(1, err.required("fields.country")),
    currency: z.string().min(1, err.required("fields.currency")),
    symbol: z.string().max(10, err.max("fields.symbol", 10)).optional().default(""),
    thousandSeparator: z.string().max(5, err.max("fields.thousandSeparator", 5)).optional().default(","),
    decimalSeparator: z.string().max(5, err.max("fields.decimalSeparator", 5)).optional().default("."),
    exchangeRate: z.coerce.number().gte(0, err.gte("fields.exchangeRate", 0)).default(1),
    isDefault: z.boolean().default(false),
    status: z.boolean().default(true),
  })
);

const formSchema = computed(() => toTypedSchema(currencySchema.value));

const form = useForm({
  validationSchema: formSchema,
});

const formattedPreview = computed(() => {
  const symbol = form.values.symbol || "";
  const thousand = form.values.thousandSeparator || ",";
  const decimal = form.values.decimalSeparator || ".";

  return `${symbol} 1${thousand}234${decimal}56`;
});

async function fetchCurrency() {
  const id = parseInt(route.params.id as string);
  try {
    const response = await currencyService.getDetail(id);
    if (response.success && response.data) {
      form.setValues({
        code: response.data.code,
        country: response.data.country,
        currency: response.data.currency,
        symbol: response.data.symbol || "",
        thousandSeparator: response.data.thousandSeparator || ",",
        decimalSeparator: response.data.decimalSeparator || ".",
        exchangeRate: response.data.exchangeRate || (response.data.code === 'KHR' ? 4100 : 1),
        isDefault: response.data.isDefault || false,
        status: response.data.status,
      });
      searchTerm.value = response.data.country;
    } else {
      toast.error(t("crud.errorFetch", { module: labels.name }));
      router.push("/admin/currencies");
    }
  } catch (error) {
    toast.error(t("crud.errorFetch", { module: labels.name }));
    router.push("/admin/currencies");
  } finally {
    isLoading.value = false;
  }
}

const onSubmit = form.handleSubmit(async (values: any) => {
  isSubmitting.value = true;
  try {
    const id = parseInt(route.params.id as string);
    const response = await currencyService.update({ ...values, id });
    if (response.success) {
      toast.success(t("crud.successUpdate", { module: labels.name }));
      router.push("/admin/currencies");
    } else {
      toast.error(
        response.message ||
          t("crud.errorUpdate", { module: labels.name }),
      );
    }
  } catch (error) {
    toast.error(t("crud.errorUpdate", { module: labels.name }));
  } finally {
    isSubmitting.value = false;
  }
});

onMounted(() => {
  fetchCurrency();
});
</script>

<template>
  <div class="space-y-6 pb-8">
    <!-- Header Section -->
    <div class="flex items-center justify-between gap-4">
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
            {{ crud.editBtn }} {{ labels.name }}
          </h2>
        </div>
      </div>

    </div>

    <!-- Mobile Preview -->
    <div
      v-if="!isLoading"
      class="md:hidden flex items-center justify-between px-4 py-2 bg-muted/30 rounded-md border text-sm"
    >
      <span class="text-muted-foreground font-medium"
        >{{ fields.formatPreview }}:</span
      >
      <span class="text-foreground">{{ formattedPreview }}</span>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center min-h-[400px] gap-4 border border-dashed rounded-lg"
    >
      <Loader2 class="h-10 w-10 animate-spin text-primary" />
      <p class="text-muted-foreground animate-pulse">
        {{ crud.fetchingData }}
      </p>
    </div>

    <form @submit="onSubmit" id="currencyEditForm" v-else>
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Coins class="h-5 w-5" />
              {{ t("crud.info", { module: labels.name }) }}
            </CardTitle>
          </CardHeader>
          <CardContent
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <FormField v-slot="{ componentField }" name="code">
              <FormItem>
                <FormLabel>{{ fields.code }}</FormLabel>
                <FormControl>
                  <Input
                    :placeholder="fields.enterCurrencyCode"
                    v-bind="componentField"
                    class="uppercase"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- Searchable Country Dropdown -->
            <FormField v-slot="{ value }" name="country">
              <FormItem class="flex flex-col">
                <FormLabel>{{ fields.country }}</FormLabel>
                <Popover v-model:open="isDropdownOpen">
                  <PopoverTrigger as-child>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        :class="
                          cn(
                            'w-full justify-between font-normal h-11',
                            !value && 'text-muted-foreground',
                          )
                        "
                      >
                        {{ value || crud.selectCountry }}
                        <Search class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent class="w-[300px] p-0" align="start">
                    <div
                      class="flex flex-col overflow-hidden bg-popover rounded-md shadow-md border"
                    >
                      <div class="flex items-center px-3 border-b">
                        <Search class="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          v-model="searchTerm"
                          class="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          :placeholder="crud.typeToSearch"
                        />
                      </div>
                      <div class="max-h-[300px] overflow-y-auto p-1">
                        <div
                          v-for="country in filteredCountries"
                          :key="country"
                          @click="selectCountry(country)"
                          class="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                        >
                          <Check
                            :class="
                              cn(
                                'mr-2 h-4 w-4',
                                value === country ? 'opacity-100' : 'opacity-0',
                              )
                            "
                          />
                          {{ country }}
                        </div>
                        <div
                          v-if="filteredCountries.length === 0"
                          class="py-6 text-center text-sm text-muted-foreground"
                        >
                          {{ crud.noCountryFound }}
                        </div>
                      </div>
                      <!-- Allow typing custom if not found -->
                      <div class="p-1 border-t mt-1 bg-muted/20">
                        <Button
                          v-if="searchTerm && !countries.includes(searchTerm)"
                          variant="ghost"
                          size="sm"
                          class="w-full justify-start text-xs italic"
                          @click="selectCountry(searchTerm)"
                        >
                          {{ crud.useCustom }}: "{{ searchTerm }}"
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="currency">
              <FormItem>
                <FormLabel>{{ fields.currency }}</FormLabel>
                <FormControl>
                  <Input
                    :placeholder="fields.enterCurrencyName"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="symbol">
              <FormItem>
                <FormLabel>{{ fields.symbol }}</FormLabel>
                <FormControl>
                  <Input placeholder="$, ៛..." v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="thousandSeparator">
              <FormItem>
                <FormLabel>{{ fields.thousandSeparator }}</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" maxlength="5" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="exchangeRate">
              <FormItem>
                <FormLabel class="text-primary font-bold underline decoration-primary/30">
                  {{ fields.exchangeRate }} (Base: USD)
                </FormLabel>
                <FormControl>
                  <div class="relative group">
                    <div class="absolute left-0 top-0 bottom-0 flex items-center px-3 bg-muted border-r rounded-l-md text-xs font-bold text-muted-foreground pointer-events-none group-focus-within:border-primary/50 transition-colors">
                      1 USD =
                    </div>
                    <Input 
                      type="number" 
                      step="0.0001" 
                      v-bind="componentField" 
                      @input="form.setFieldValue('exchangeRate', Number($event.target.value))"
                      class="pl-20 font-bold text-primary border-primary/20 focus:border-primary transition-all h-11" 
                    />
                  </div>
                </FormControl>
                <FormDescription class="text-[10px] italic">
                  Multiply USD values by this rate for display.
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <div class="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
              <FormField v-slot="{ value, handleChange }" name="isDefault">
                <FormItem
                  class="flex flex-row items-center justify-between rounded-lg border p-4 bg-primary/5 border-primary/20"
                >
                  <div class="space-y-0.5">
                    <FormLabel class="text-base font-semibold text-primary">
                      {{ fields.defaultCurrency }}
                    </FormLabel>
                    <FormDescription class="text-xs">
                      Make this the system's preferred currency.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch :model-value="!!value" @update:model-value="(v: boolean) => handleChange(v)" />
                  </FormControl>
                </FormItem>
              </FormField>

              <FormField v-slot="{ value, handleChange }" name="status">
                <FormItem
                  class="flex flex-row items-center justify-between rounded-lg border p-4"
                >
                  <div class="space-y-0.5">
                    <FormLabel class="text-base font-semibold">
                      {{ fields.activeStatus }}
                    </FormLabel>
                    <FormDescription class="text-xs">
                      Enable or disable this currency.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch :model-value="!!value" @update:model-value="(v: boolean) => handleChange(v)" />
                  </FormControl>
                </FormItem>
              </FormField>
            </div>
          </CardContent>
          <CardFooter class="flex justify-end gap-3 border-t pt-6 pb-6 bg-muted/5">
            <Button
              type="button"
              variant="outline"
              size="lg"
              @click="router.push('/admin/currencies')"
              :disabled="isSubmitting"
              class="px-8"
            >
              {{ crud.cancel }}
            </Button>
            <Button
              type="submit"
              form="currencyEditForm"
              size="lg"
              class="min-w-[140px] px-8 shadow-md"
              :disabled="isSubmitting"
            >
              <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ crud.updateBtn }} {{ labels.name }}
            </Button>
          </CardFooter>
        </Card>
      </form>
  </div>
</template>
