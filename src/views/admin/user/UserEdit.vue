<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useZod } from "@/hooks/useZod";
import { userService } from "@/services/user/user.service";
import { roleService } from "@/services/role/role.service";
import type { Role } from "@/types";
import { toast } from "vue-sonner";
import ImageUpload from "@/components/upload/ImageUpload.vue";
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

const { t, labels, fields, crud, auth } = useAppI18n("user");

const router = useRouter();
const route = useRoute();
const { z, err } = useZod();

const roles = ref<Role[]>([]);
const fetchingRoles = ref(false);
const submitting = ref(false);
const fetchingData = ref(true);
const userId = Number(route.params.id);

const userSchema = computed(() => 
  z.object({
    username: z.string().min(3, err.min("auth.username", 3)).max(60, err.max("auth.username", 60)),
    email: z.string().email(err.email()),
    password: z.string().optional(),
    roleId: z.string().nullable().optional(),
    status: z.boolean().default(true),
    photo: z.string().optional(),
  })
);

const formSchema = computed(() => toTypedSchema(userSchema.value));

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    username: "",
    email: "",
    roleId: null,
    status: true,
    photo: "",
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

const fetchUser = async () => {
  if (!userId) return;
  fetchingData.value = true;
  try {
    const response = await userService.getDetail(userId);
    if (response.success && response.data) {
      const user = response.data;
      form.setValues({
        username: user.username,
        email: user.email,
        status: user.status,
        roleId: user.role ? String(user.role.id) : null,
        photo: user.photo || "",
      });
    } else {
      toast.error(t("crud.errorFetch", { module: labels.name }));
      router.push("/admin/users");
    }
  } catch (error) {
    console.error("Failed to fetch user configuration:", error);
    toast.error(t("crud.errorFetch", { module: labels.name }));
  } finally {
    fetchingData.value = false;
  }
};

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload: any = {
      id: userId,
      username: values.username,
      email: values.email,
      status: values.status,
      photo: values.photo,
    };
    if (values.roleId && values.roleId !== "null") {
      payload.roleId = Number(values.roleId);
    }

    const response = await userService.update(payload);
    if (response.success) {
      toast.success(t("crud.successUpdate", { module: labels.name }));
      router.push("/admin/users");
    } else {
      toast.error(
        response.message || t("crud.errorUpdate", { module: labels.name }),
      );
    }
  } catch (error: any) {
    console.error("Failed to update user:", error);
    toast.error(error.response?.data?.message || t("crud.errorGeneral"));
  } finally {
    submitting.value = false;
  }
});

onMounted(() => {
  Promise.all([fetchRoles(), fetchUser()]);
});
</script>

<template>
  <div class="space-y-4" v-if="!fetchingData">
    <div class="flex items-center gap-4">
      <Button variant="outline" size="icon" @click="router.back()">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <h2 class="text-3xl font-bold tracking-tight">
        {{ crud.editBtn }} {{ labels.name }}
      </h2>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>{{ t("crud.info", { module: labels.name }) }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit="onSubmit" id="userForm" class="space-y-6">
          <div class="flex-1 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField v-slot="{ componentField }" name="username">
                <FormItem>
                  <FormLabel
                    >{{ auth.username }}
                    <span class="text-destructive">*</span></FormLabel
                  >
                  <FormControl>
                    <Input placeholder="johndoe123" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="email">
                <FormItem>
                  <FormLabel
                    >{{ auth.email }}
                    <span class="text-destructive">*</span></FormLabel
                  >
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="johndoe@example.com"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ field }" name="roleId">
                <FormItem>
                  <FormLabel>{{ auth.role }}</FormLabel>
                  <Select v-bind="field" :disabled="fetchingRoles">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue :placeholder="fields.selectRole">
                          <span
                            v-if="
                              field.value &&
                              roles.find((r) => String(r.id) === field.value)
                            "
                          >
                            {{
                              roles.find((r) => String(r.id) === field.value)
                                ?.name
                            }}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">{{
                        crud.none
                      }}</SelectItem>
                      <SelectItem
                        v-for="ro in roles"
                        :key="ro.id"
                        :value="String(ro.id)"
                      >
                        {{ ro.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </FormField>

              <div class="md:col-span-2 mt-2">
                <FormField v-slot="{ value, handleChange }" name="status">
                  <FormItem
                    class="flex flex-row items-center justify-between rounded-lg border p-4 bg-background"
                  >
                    <div class="space-y-0.5">
                      <FormLabel class="text-base font-semibold">{{
                        fields.activeStatus
                      }}</FormLabel>
                      <FormDescription>
                        {{
                          t("fields.statusDescription", { module: labels.name })
                        }}
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

              <div class="md:col-span-2 space-y-4">
                <FormField v-slot="{ value, handleChange }" name="photo">
                  <FormItem class="space-y-4">
                    <FormLabel>{{ fields.photo }}</FormLabel>
                    <div class="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/10 hover:bg-muted/30 transition-all">
                      <FormControl>
                        <ImageUpload
                          :image-url="value"
                          @update:image-url="handleChange"
                          shape="circle"
                        />
                      </FormControl>
                      <div class="text-center space-y-1 mt-2">
                        <p class="text-sm font-bold tracking-tight">
                          {{ fields.userAvatar }}
                        </p>
                        <p class="text-[11px] text-muted-foreground leading-relaxed max-w-[250px] mx-auto">
                          {{ fields.userAvatarHint }}
                        </p>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex justify-end gap-2 border-t px-6 py-4">
        <Button variant="outline" @click="router.back()" :disabled="submitting">
          {{ crud.cancel }}
        </Button>
        <Button type="submit" form="userForm" :disabled="submitting">
          <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
          {{ crud.save }}
        </Button>
      </CardFooter>
    </Card>
  </div>

  <div
    v-else
    class="flex flex-col items-center justify-center min-h-[400px] gap-4"
  >
    <Loader2 class="h-8 w-8 animate-spin text-primary" />
    <p class="text-muted-foreground font-medium">
      {{ crud.fetchingData }}
    </p>
  </div>
</template>
