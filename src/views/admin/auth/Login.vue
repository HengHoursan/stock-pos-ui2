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
import { Eye, EyeOff } from "lucide-vue-next";
import { toast } from "vue-sonner";
import { useI18n } from "vue-i18n";

type LoginForm = zod.infer<typeof loginSchema>;

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();
const isLoading = ref(false);
const showPassword = ref(false);

const loginSchema = zod.object({
  email: zod.string().email("Invalid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
});

const formSchema = toTypedSchema(loginSchema);

const form = useForm<LoginForm>({
  validationSchema: formSchema,
  initialValues: {
    email: "superadmin@gmail.com",
    password: "superadmin123",
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true;
  try {
    const response = await authStore.login(values);
    if (response.success) {
      toast.success(t("auth.loginSuccess"));
      router.push("/dashboard");
    } else {
      toast.error(response.message || t("auth.loginFailed"));
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || t("auth.loginError"),
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
          <CardTitle class="text-xl">{{ $t('auth.welcomeBack') }}</CardTitle>
          <CardDescription>{{ $t('auth.loginDescription') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit="onSubmit" class="grid gap-6">
            <FormField v-slot="{ componentField }" name="email">
              <FormItem>
                <FormLabel>{{ $t('auth.email') }}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="m@example.com"
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
                  <div class="relative">
                    <Input
                      :type="showPassword ? 'text' : 'password'"
                      v-bind="componentField"
                      :disabled="isLoading"
                      class="pr-10"
                    />
                    <button
                      type="button"
                      class="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      @click="showPassword = !showPassword"
                    >
                      <Eye v-if="!showPassword" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <Button type="submit" class="w-full" :disabled="isLoading">
              {{ isLoading ? $t('auth.loggingIn') : $t('auth.login') }}
            </Button>

            <div class="text-center text-sm">
              {{ $t('auth.noAccount') }}
              <RouterLink to="/register" class="underline underline-offset-4"
                >{{ $t('auth.signup') }}</RouterLink
              >
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
