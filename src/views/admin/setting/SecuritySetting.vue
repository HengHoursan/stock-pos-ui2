<script setup lang="ts">
import { ref } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-vue-next";
import { userService } from "@/services/user/user.service";
import { toast } from "vue-sonner";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useAuthStore } from "@/stores/auth";

const { t, auth, crud } = useAppI18n();
const submitting = ref(false);

const formSchema = toTypedSchema(
  z.object({
    currentPassword: z.string().min(1, t("validation.required", { field: auth.currentPassword })),
    newPassword: z.string().min(6, t("validation.min", { field: auth.newPassword, min: 6 })),
    confirmPassword: z.string().min(1, t("validation.required", { field: auth.confirmPassword })),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: auth.passwordMismatch,
    path: ["confirmPassword"],
  })
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const response = await userService.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    if (response.success) {
      toast.success(crud.successPasswordChange);
      
      // Clear the forced password change flag
      const authStore = useAuthStore();
      if (authStore.user && authStore.user.must_change_password) {
        const updatedUser = { ...authStore.user, must_change_password: false };
        authStore.setUser(updatedUser);
        toast.info("Security requirement met. You now have full access.");
      }
      
      form.resetForm();
    } else {
      toast.error(response.message || crud.errorPasswordChange);
    }
  } catch (error) {
    toast.error(crud.errorPasswordChange);
  } finally {
    submitting.value = false;
  }
});
</script>

<template>
  <Card class="w-full border-none shadow-xl bg-card/60 backdrop-blur-md">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <ShieldCheck class="h-5 w-5 text-primary" />
        {{ crud.securitySettings }}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <form @submit="onSubmit" id="securityForm" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField v-slot="{ componentField }" name="currentPassword">
            <FormItem>
              <FormLabel>{{ auth.currentPassword }}</FormLabel>
              <FormControl>
                <Input type="password" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <div class="hidden md:block"></div>

          <FormField v-slot="{ componentField }" name="newPassword">
            <FormItem>
              <FormLabel>{{ auth.newPassword }}</FormLabel>
              <FormControl>
                <Input type="password" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="confirmPassword">
            <FormItem>
              <FormLabel>{{ auth.confirmPassword }}</FormLabel>
              <FormControl>
                <Input type="password" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>
      </form>
    </CardContent>
    <CardFooter class="flex justify-end border-t px-6 py-4">
      <Button type="submit" form="securityForm" :disabled="submitting">
        <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
        {{ auth.changePassword }}
      </Button>
    </CardFooter>
  </Card>
</template>
