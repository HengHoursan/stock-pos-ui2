import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useZod } from "@/hooks/useZod";
import { SupplierService } from "@/services/supplier/supplier.service";
import { CustomerType } from "@/types";
import { toast } from "vue-sonner";
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
import { ChevronLeft, Loader2, UserPlus, Phone, MapPin, Settings } from "lucide-vue-next";

const { t, labels, fields, crud, auth, layout } = useAppI18n("supplier");

const router = useRouter();
const supplierService = new SupplierService();
const { z, err } = useZod();
const submitting = ref(false);

const supplierSchema = computed(() => 
  z.object({
    name: z.string().min(2, err.min("fields.name", 2)).max(100, err.max("fields.name", 100)),
    nameLatin: z.string().max(100, err.max("fields.nameLatin", 100)).optional().nullable(),
    code: z.string().max(50, err.max("fields.code", 50)).optional().nullable(),
    email: z.string().email(err.email()).optional().nullable().or(z.literal("")),
    phoneNumber: z.string().max(20, err.max("fields.phoneNumber", 20)).optional().nullable(),
    address: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    type: z.number().default(CustomerType.DINE_IN),
    status: z.boolean().default(true),
  })
);

const formSchema = computed(() => toTypedSchema(supplierSchema.value));

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: "",
    nameLatin: "",
    code: "",
    email: "",
    phoneNumber: "",
    address: "",
    description: "",
    type: CustomerType.DINE_IN,
    status: true,
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      ...values,
      email: values.email || undefined,
      code: values.code || undefined,
    };
    const response = await supplierService.create(payload as any);
    if (response.success) {
      toast.success(t('crud.successCreate', { module: labels.name }));
      router.push("/admin/suppliers");
    } else {
      toast.error(response.message || t('crud.errorCreate', { module: labels.name }));
    }
  } catch (error) {
    toast.error(t('crud.errorGeneral'));
  } finally {
    submitting.value = false;
  }
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

    <form @submit="onSubmit" id="supplierForm">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 1. General Information -->
        <Card class="lg:col-span-1 shadow-sm border-muted-foreground/10">
          <CardHeader class="pb-3 border-b bg-muted/5">
            <CardTitle class="text-lg flex items-center gap-2">
              <UserPlus class="h-5 w-5 text-primary" />
              {{ crud.generalInfo }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 space-y-4">
            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel>{{ fields.name }}</FormLabel>
                <FormControl>
                  <Input :placeholder="fields.enterName" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="nameLatin">
              <FormItem>
                <FormLabel>{{ fields.nameLatin }}</FormLabel>
                <FormControl>
                  <Input :placeholder="fields.nameLatin" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="code">
              <FormItem>
                <FormLabel>{{ fields.code }}</FormLabel>
                <FormControl>
                  <Input :placeholder="fields.autoGenerate" v-bind="componentField" />
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
              {{ fields.phoneNumber }} & {{ auth.email }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 space-y-4">
            <FormField v-slot="{ componentField }" name="email">
              <FormItem>
                <FormLabel>{{ auth.email }}</FormLabel>
                <FormControl>
                  <Input :placeholder="fields.emailPlaceholder" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="phoneNumber">
              <FormItem>
                <FormLabel>{{ fields.phoneNumber }}</FormLabel>
                <FormControl>
                  <Input :placeholder="fields.phoneNumber" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="address">
              <FormItem>
                <FormLabel class="flex items-center gap-2">
                  <MapPin class="h-4 w-4 text-muted-foreground" />
                  {{ fields.address }}
                </FormLabel>
                <FormControl>
                  <Textarea :placeholder="fields.address" v-bind="componentField" />
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
              {{ layout.adminPanel }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-6 space-y-6">
            <FormField v-slot="{ field }" name="type">
              <FormItem>
                <FormLabel>{{ fields.type }}</FormLabel>
                <Select
                  :model-value="String(field.value)"
                  @update:model-value="(v) => field.onChange(Number(v))"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue :placeholder="crud.selectType" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem :value="String(CustomerType.DINE_IN)">{{ fields.dineIn }}</SelectItem>
                    <SelectItem :value="String(CustomerType.DINE_OUT)">{{ fields.dineOut }}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="description">
              <FormItem>
                <FormLabel>{{ fields.description }}</FormLabel>
                <FormControl>
                  <Textarea :placeholder="fields.enterDescription" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="status">
              <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/5">
                <div class="space-y-0.5">
                  <FormLabel class="text-base font-semibold">{{ fields.activeStatus }}</FormLabel>
                  <FormDescription>{{ t('fields.statusDescription', { module: labels.name }) }}</FormDescription>
                </div>
                <FormControl>
                  <Switch :model-value="!!value" @update:model-value="(v: boolean) => handleChange(v)" />
                </FormControl>
              </FormItem>
            </FormField>
          </CardContent>
          <CardFooter class="flex justify-end gap-2 border-t px-6 py-4 bg-muted/5">
            <Button variant="outline" type="button" @click="router.back()" :disabled="submitting">{{ crud.cancel }}</Button>
            <Button type="submit" :disabled="submitting">
              <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ crud.createBtn }} {{ labels.name }}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  </div>
</template>
