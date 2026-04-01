<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
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
import { ChevronLeft, Loader2 } from "lucide-vue-next";
import { CategoryService } from "@/services/category/category.service";
import ImageUpload from "@/components/upload/ImageUpload.vue";
import type { Category } from "@/types/category";
import { toast } from "vue-sonner";

const router = useRouter();
const route = useRoute();
const categoryService = new CategoryService();

const categoryId = Number(route.params.id);
const parentCategories = ref<Category[]>([]);
const loading = ref(true);
const submitting = ref(false);

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(6),
    code: z.string().optional(),
    slug: z.string().optional(),
    parentId: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    status: z.boolean().default(true),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: "",
    code: "",
    slug: "",
    description: "",
    imageUrl: "",
    status: true,
  },
});

async function fetchData() {
  loading.value = true;
  try {
    const [catResponse, listResponse] = await Promise.all([
      categoryService.getDetail(categoryId),
      categoryService.getAll(),
    ]);

    if (catResponse.success && catResponse.data) {
      const cat = catResponse.data;
      form.setValues({
        name: cat.name,
        code: cat.code || "",
        slug: cat.slug || "",
        parentId: cat.parentId ? String(cat.parentId) : "0",
        description: cat.description || "",
        imageUrl: cat.imageUrl || "",
        status: cat.status,
      });
    } else {
      toast.error(t('crud.notFound', { module: t('modules.category') }));
      router.push("/admin/categories");
    }

    if (listResponse.success && listResponse.data) {
      parentCategories.value = listResponse.data.filter(
        (c) => c.id !== categoryId,
      );
    }
  } catch (error) {
    toast.error(t('crud.errorFetch', { module: t('modules.category') }));
  } finally {
    loading.value = false;
  }
}

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      id: categoryId,
      ...values,
      parentId:
        values.parentId && values.parentId !== "0"
          ? Number(values.parentId)
          : undefined,
    };
    const response = await categoryService.update(payload);
    if (response.success) {
      toast.success(t('crud.successUpdate', { module: t('modules.category') }));
      router.push("/admin/categories");
    } else {
      toast.error(response.message || t('crud.errorUpdate', { module: t('modules.category') }));
    }
  } catch (error) {
    toast.error(t('crud.errorGeneral'));
  } finally {
    submitting.value = false;
  }
});

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <Button variant="outline" size="icon" @click="router.back()">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <h2 class="text-3xl font-bold tracking-tight">
        {{ $t("crud.edit", { module: $t("modules.category") }) }}
      </h2>
    </div>

    <Card v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </Card>

    <Card v-else>
      <CardHeader>
        <CardTitle>{{ $t('crud.info', { module: $t('modules.category') }) }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit="onSubmit" id="categoryForm" class="space-y-6">
          <div class="flex flex-col lg:flex-row gap-8">
            <!-- Left Side: Image Upload -->
            <div class="flex flex-col items-center gap-4 shrink-0">
              <FormField v-slot="{ value, handleChange }" name="imageUrl">
                <FormItem>
                  <FormLabel
                    class="text-sm font-bold uppercase tracking-wider text-muted-foreground/80"
                    >{{ $t("modules.category") }}
                    {{ $t("crud.image") }}</FormLabel
                  >
                  <FormControl>
                    <ImageUpload
                      :image-url="value"
                      @update:image-url="handleChange"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <!-- Right Side: Form Fields -->
            <div class="flex-1 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField v-slot="{ componentField }" name="name">
                  <FormItem>
                    <FormLabel>{{ $t("fields.name") }}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Category Name"
                        v-bind="componentField"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="code">
                  <FormItem>
                    <FormLabel>{{ $t("fields.code") }}</FormLabel>
                    <FormControl>
                      <Input
                        v-bind="componentField"
                        disabled
                        class="bg-muted/50 cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="slug">
                  <FormItem>
                    <FormLabel>{{ $t("fields.slug") }}</FormLabel>
                    <FormControl>
                      <Input
                        v-bind="componentField"
                        disabled
                        class="bg-muted/50 cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ field }" name="parentId">
                  <FormItem>
                    <FormLabel>{{ $t("fields.parentOf", { module: $t("modules.category") }) }}</FormLabel>
                    <Select v-bind="field">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a parent category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">{{ $t("crud.none") }}</SelectItem>
                        <SelectItem
                          v-for="cat in parentCategories"
                          :key="cat.id"
                          :value="String(cat.id)"
                        >
                          {{ cat.name }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <div class="md:col-span-2">
                  <FormField v-slot="{ componentField }" name="description">
                    <FormItem>
                      <FormLabel>{{ $t("fields.description") }}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter category description"
                          v-bind="componentField"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>

                <div class="md:col-span-2">
                  <FormField name="status">
                    <FormItem
                      class="flex flex-row items-center justify-between rounded-lg border p-4"
                    >
                      <div class="space-y-0.5">
                        <FormLabel class="text-base font-semibold"
                          >{{ $t('fields.activeStatus') }}</FormLabel
                        >
                        <FormDescription>
                          {{ $t('fields.statusDescription', { module: $t('modules.category') }) }}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch v-model="form.values.status" />
                      </FormControl>
                    </FormItem>
                  </FormField>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex justify-end gap-2 border-t px-6 py-4">
        <Button
          variant="outline"
          @click="router.back()"
          :disabled="submitting"
          >{{ $t("crud.cancel") }}</Button
        >
        <Button type="submit" form="categoryForm" :disabled="submitting">
          <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
          {{ $t("crud.updateBtn", { module: $t("modules.category") }) }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
