<script setup lang="ts">
import { ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, ImageIcon, Link, Globe } from "lucide-vue-next";
import { uploadService } from "@/services/upload/upload.service.ts";
import { toast } from "vue-sonner";
import { cn } from "@/lib/utils.ts";
import { useI18n } from "vue-i18n";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const { t } = useI18n();

const props = defineProps<{
  imageUrl?: string;
  label?: string;
  class?: string;
}>();

const emit = defineEmits<{
  (e: "update:imageUrl", value: string): void;
}>();

const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const urlInput = ref(props.imageUrl || "");
const activeTab = ref(props.imageUrl?.startsWith("http") ? "url" : "upload");

watch(() => props.imageUrl, (newVal) => {
  if (newVal !== urlInput.value) {
    urlInput.value = newVal || "";
  }
});

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (!file.type.match(/image\/(png|jpeg|jpg|webp)/)) {
    toast.error("Please upload a valid image file (png, jpeg, jpg, webp)");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.error("File size must be less than 5MB");
    return;
  }

  uploading.value = true;
  try {
    const response = await uploadService.uploadImage(file);
    if (response.success && response.data) {
      emit("update:imageUrl", response.data.image_url);
      toast.success("Image uploaded successfully");
    } else {
      toast.error(response.message || "Failed to upload image");
    }
  } catch (error) {
    toast.error("An error occurred during upload");
    console.error(error);
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
}

function removeImage() {
  emit("update:imageUrl", "");
  urlInput.value = "";
}

function triggerUpload() {
  fileInput.value?.click();
}

function applyUrl() {
  if (!urlInput.value) return;
  emit("update:imageUrl", urlInput.value);
  toast.success("Image URL applied");
}
</script>

<template>
  <div :class="cn('space-y-4 w-full max-w-sm', props.class)">
    <label
      v-if="label"
      class="text-sm font-semibold text-foreground/80"
    >
      {{ label }}
    </label>

    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-2 mb-4 bg-muted/30 p-1 border rounded-lg">
        <TabsTrigger value="upload" class="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-xs">
          <Upload class="mr-2 h-3.5 w-3.5" />
          {{ t("crud.uploadImage") }}
        </TabsTrigger>
        <TabsTrigger value="url" class="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-xs">
          <Globe class="mr-2 h-3.5 w-3.5" />
          {{ t("fields.imageUrl") || "Image URL" }}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload" class="mt-0">
        <div
          class="relative flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-2xl p-4 transition-all hover:border-primary/40 hover:bg-muted/30 group h-64 w-full overflow-hidden bg-muted/20 shadow-inner"
        >
          <template v-if="imageUrl">
            <img
              :src="imageUrl"
              class="h-full w-full object-cover rounded-xl shadow-lg border bg-background"
              alt="Preview"
              @error="(e: any) => e.target.src = '/placeholder-image.png'"
            />
            <button
              @click="removeImage"
              type="button"
              class="absolute top-3 right-3 p-2 bg-destructive/90 text-white rounded-full shadow-xl hover:bg-destructive transition-all hover:rotate-90 z-20"
            >
              <X class="h-4 w-4" />
            </button>
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
               <span class="text-white text-xs font-bold uppercase tracking-wider">{{ t("crud.changeImage") }}</span>
            </div>
            <div class="absolute inset-0 cursor-pointer z-10" @click="triggerUpload"></div>
          </template>

          <template v-else>
            <div
              class="flex flex-col items-center gap-4 text-muted-foreground transition-all group-hover:text-primary/70"
            >
              <div
                class="p-5 rounded-full bg-background/80 shadow-md transition-transform group-hover:scale-110 border"
              >
                <ImageIcon v-if="!uploading" class="h-10 w-10 text-muted-foreground/40" />
                <Loader2 v-else class="h-10 w-10 animate-spin text-primary" />
              </div>
              <div class="text-center">
                <span class="block text-sm font-bold text-foreground/60 uppercase tracking-tight">{{
                  uploading ? "Uploading..." : "Click to Upload"
                }}</span>
                <span v-if="!uploading" class="text-[10px] opacity-50 block mt-1"
                  >PNG, JPG, WEBP (Max 5MB)</span
                >
              </div>
            </div>
            <div
              class="absolute inset-0 cursor-pointer"
              @click="triggerUpload"
            ></div>
          </template>
        </div>
      </TabsContent>

      <TabsContent value="url" class="mt-0 space-y-4">
        <div
          class="relative flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-2xl p-4 transition-all hover:border-primary/40 hover:bg-muted/30 h-64 w-full overflow-hidden bg-muted/20 shadow-inner"
        >
          <template v-if="imageUrl">
            <img
              :src="imageUrl"
              class="h-full w-full object-cover rounded-xl shadow-lg border bg-background"
              alt="Preview"
              @error="(e: any) => e.target.src = '/placeholder-image.png'"
            />
            <button
              @click="removeImage"
              type="button"
              class="absolute top-3 right-3 p-2 bg-destructive/90 text-white rounded-full shadow-xl hover:bg-destructive transition-all hover:rotate-90 z-20"
            >
              <X class="h-4 w-4" />
            </button>
          </template>
          <template v-else>
             <div class="flex flex-col items-center gap-3 text-muted-foreground p-6 text-center">
                <div class="p-4 rounded-full bg-background/50 border mb-2">
                   <Link class="h-10 w-10 opacity-20" />
                </div>
                <p class="text-xs font-medium">{{ t("fields.enterUrlPrompt") || "Enter an external image URL below to preview it here" }}</p>
             </div>
          </template>
        </div>
        
        <div class="flex gap-2 p-1 bg-muted/30 border rounded-lg">
          <Input
            v-model="urlInput"
            :placeholder="t('fields.enterImageUrl') || 'https://example.com/image.jpg'"
            class="h-9 bg-background border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
            @keyup.enter="applyUrl"
          />
          <Button type="button" size="sm" @click="applyUrl" class="h-9 px-4">
            {{ t("crud.apply") || "Apply" }}
          </Button>
        </div>
      </TabsContent>
    </Tabs>

    <input
      ref="fileInput"
      type="file"
      class="hidden"
      accept="image/png,image/jpeg,image/jpg,image/webp"
      @change="handleFileChange"
    />
  </div>
</template>
