<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
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
import { ArrowLeft, Loader2 } from "lucide-vue-next";
import { userService } from "@/services/user/user.service";
import { roleService } from "@/services/role/role.service";
import type { Role } from "@/types";
import { toast } from "vue-sonner";

const router = useRouter();

const roles = ref<Role[]>([]);
const fetchingRoles = ref(false);
const submitting = ref(false);

const formSchema = toTypedSchema(
  z.object({
    username: z.string().min(3, "Username must be at least 3 characters").max(60),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    roleId: z.string().nullable().optional(),
    status: z.boolean().default(true),
  })
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    username: "",
    email: "",
    password: "",
    roleId: null,
    status: true,
  },
});

const fetchRoles = async () => {
  fetchingRoles.value = true;
  try {
    const response = await roleService.getAll();
    if (response.success && response.data) {
      roles.value = response.data;
    }
  } catch (error) {
    console.error("Failed to fetch roles:", error);
  } finally {
    fetchingRoles.value = false;
  }
};

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload: any = {
      username: values.username,
      email: values.email,
      password: values.password,
      status: values.status,
    };
    if (values.roleId && values.roleId !== "null") {
      payload.roleId = Number(values.roleId);
    }

    const response = await userService.create(payload);
    if (response.success) {
      toast.success(t("crud.successCreate", { module: t("modules.user") }));
      router.push("/admin/users");
    } else {
      toast.error(
        response.message || t("crud.errorCreate", { module: t("modules.user") })
      );
    }
  } catch (error) {
    console.error("Failed to create user:", error);
    toast.error(t("crud.errorGeneral"));
  } finally {
    submitting.value = false;
  }
});

onMounted(() => {
  fetchRoles();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <Button variant="outline" size="icon" @click="router.back()">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <h2 class="text-3xl font-bold tracking-tight">
        {{ $t("crud.create", { module: $t("modules.user") }) }}
      </h2>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>{{ $t('crud.info', { module: $t('modules.user') }) }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit="onSubmit" id="userForm" class="space-y-6">
          <div class="flex-1 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <FormField v-slot="{ componentField }" name="username">
                <FormItem>
                  <FormLabel>{{ $t("auth.username") }} <span class="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe123" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="email">
                <FormItem>
                  <FormLabel>{{ $t("auth.email") }} <span class="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="johndoe@example.com" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="password">
                <FormItem>
                  <FormLabel>{{ $t("auth.password") }} <span class="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ field }" name="roleId">
                <FormItem>
                  <FormLabel>{{ $t('auth.role') }}</FormLabel>
                  <Select v-bind="field" :disabled="fetchingRoles">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue :placeholder="$t('fields.selectRole')">
                          <span v-if="field.value && roles.find((r) => String(r.id) === field.value)">
                            {{ roles.find((r) => String(r.id) === field.value)?.name }}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">{{ $t('crud.none') }}</SelectItem>
                      <SelectItem v-for="ro in roles" :key="ro.id" :value="String(ro.id)">
                        {{ ro.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </FormField>

              <div class="md:col-span-2 mt-2">
                <FormField v-slot="{ value, handleChange }" name="status">
                  <FormItem class="flex flex-row items-center justify-between rounded-lg border p-4 bg-background">
                    <div class="space-y-0.5">
                      <FormLabel class="text-base font-semibold">{{ $t('fields.activeStatus') }}</FormLabel>
                      <FormDescription>
                        {{ $t('fields.statusDescription', { module: $t('modules.user') }) }}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        :model-value="!!value"
                        @update:model-value="(v: boolean) => handleChange(v)"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>

            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex justify-end gap-2 border-t px-6 py-4">
        <Button variant="outline" @click="router.back()" :disabled="submitting">
          {{ $t("crud.cancel") }}
        </Button>
        <Button type="submit" form="userForm" :disabled="submitting">
          <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
          {{ $t("crud.create", { module: $t("modules.user") }) }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
