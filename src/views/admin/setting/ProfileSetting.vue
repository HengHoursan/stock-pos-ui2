<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { useRouter } from "vue-router";
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
import { Loader2, User, Camera, ShieldCheck } from "lucide-vue-next";
import { userService } from "@/services/user/user.service";
import { useAuthStore } from "@/stores/auth";
import { toast } from "vue-sonner";
import { useAppI18n } from "@/hooks/useAppI18n";
import ImageUpload from "@/components/upload/ImageUpload.vue";

const { t, crud, auth, fields } = useAppI18n();
const authStore = useAuthStore();
const router = useRouter();
const submitting = ref(false);

const formSchema = toTypedSchema(
  z.object({
    username: z.string().min(3, t("validation.min", { field: auth.username, min: 3 })).max(60),
    email: z.string().min(1, t("validation.required", { field: auth.email })).email(t("validation.email")),
    photo: z.string().optional(),
  })
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    username: authStore.user?.username || "",
    email: authStore.user?.email || "",
    photo: authStore.user?.photo || "",
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const response = await userService.updateProfile(values);
    if (response.success && response.data) {
      toast.success(t("crud.successProfileUpdate"));
      authStore.setUser(response.data);
    } else {
      toast.error(response.message || t("crud.errorProfileUpdate"));
    }
  } catch (error) {
    toast.error(t("crud.errorProfileUpdate"));
  } finally {
    submitting.value = false;
  }
});

onMounted(() => {
  if (authStore.user) {
    form.setValues({
      username: authStore.user.username,
      email: authStore.user.email,
      photo: authStore.user.photo || "",
    });
  }
});
</script>

<template>
<div class="space-y-6">
  <Card class="w-full border-none shadow-xl bg-card/60 backdrop-blur-md">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <User class="h-5 w-5 text-primary" />
        {{ crud.profileInfo }}
      </CardTitle>
    </CardHeader>
    
    <CardContent>
      <form @submit="onSubmit" id="profileForm" class="space-y-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <!-- Photo Section -->
          <div class="lg:col-span-4 space-y-4">
            <FormField v-slot="{ value, handleChange }" name="photo">
              <FormItem class="space-y-4">
                <FormLabel class="flex items-center gap-2">
                  <Camera class="h-4 w-4 text-muted-foreground" />
                  {{ t("fields.photo") }}
                </FormLabel>
                <div class="flex flex-col items-center gap-6">
                  <FormControl>
                    <ImageUpload
                      :image-url="value"
                      @update:image-url="handleChange"
                      shape="circle"
                      class="w-full"
                    />
                  </FormControl>
                  <div class="text-center space-y-1.5">
                    <p class="text-sm font-bold tracking-tight">{{ fields.userAvatar }}</p>
                    <p class="text-[10px] text-muted-foreground leading-relaxed max-w-[200px]">
                      {{ fields.userAvatarHint }}
                    </p>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <!-- Fields Section -->
          <div class="lg:col-span-8 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField v-slot="{ componentField }" name="username">
                <FormItem>
                  <FormLabel>{{ auth.username }}</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" class="h-11 bg-background/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="email">
                <FormItem>
                  <FormLabel>{{ auth.email }}</FormLabel>
                  <FormControl>
                    <Input type="email" v-bind="componentField" class="h-11 bg-background/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
            
            <div class="p-6 rounded-2xl bg-muted/20 border border-muted-foreground/5 space-y-2">
              <p class="text-sm font-bold">{{ fields.profileVisibility }}</p>
              <p class="text-xs text-muted-foreground leading-relaxed">
                {{ fields.profileVisibilityDesc }}
              </p>
            </div>
          </div>
        </div>
      </form>
    </CardContent>

    <CardFooter class="flex justify-end gap-4 border-t border-muted-foreground/5 px-8 py-6">
      <Button 
        type="button" 
        variant="outline"
        class="h-11 px-6 font-medium"
        @click="router.push('/admin/settings/security')"
      >
        <ShieldCheck class="mr-2 h-4 w-4" />
        {{ auth.changePassword }}
      </Button>

      <Button 
        type="submit" 
        form="profileForm" 
        :disabled="submitting"
        class="h-11 px-10 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
      >
        <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
        {{ crud.updateProfile }}
      </Button>
    </CardFooter>
  </Card>
</div>
</template>
