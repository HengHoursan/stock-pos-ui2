<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as zod from "zod";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RouterLink } from "vue-router";
import { ref } from "vue";
import { toast } from "vue-sonner";
import { useI18n } from "vue-i18n";

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();
const isLoading = ref(false);

const formSchema = toTypedSchema(
  zod.object({
    username: zod.string().min(2, "Username must be at least 2 characters"),
    email: zod.string().email("Invalid email address"),
    password: zod.string().min(6, "Password must be at least 6 characters"),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});

const onSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true;
  try {
    // Note: Backend might expect roleId, setting a default for now or adding to form
    const response = await authStore.register({ ...values, roleId: 3 });
    if (response.success) {
      toast.success(t("auth.registerSuccess"));
      router.push("/dashboard");
    } else {
      toast.error(response.message || t("auth.registerFailed"));
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || t("auth.registerError")
    );
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="flex min-h-svh items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm">
      <Card>
        <CardHeader class="text-center">
          <CardTitle class="text-xl">{{ $t('auth.createAccount') }}</CardTitle>
          <CardDescription>
            {{ $t('auth.registerDescription') }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit="onSubmit" class="grid gap-6">
            <FormField v-slot="{ componentField }" name="username">
              <FormItem>
                <FormLabel>{{ $t('auth.username') }}</FormLabel>
                <FormControl>
                  <Input
                    :placeholder="$t('fields.namePlaceholder')"
                    v-bind="componentField"
                    :disabled="isLoading"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="email">
              <FormItem>
                <FormLabel>{{ $t('auth.email') }}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    :placeholder="$t('fields.emailPlaceholder')"
                    v-bind="componentField"
                    :disabled="isLoading"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="password">
              <FormItem>
                <FormLabel>{{ $t('auth.password') }}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    v-bind="componentField"
                    :disabled="isLoading"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <Button type="submit" class="w-full" :disabled="isLoading">
              {{ isLoading ? $t('auth.creatingAccount') : $t('auth.signUpButton') }}
            </Button>

            <div class="text-center text-sm">
              {{ $t('auth.hasAccount') }}
              <RouterLink to="/login" class="underline underline-offset-4">
                {{ $t('auth.login') }}
              </RouterLink>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
