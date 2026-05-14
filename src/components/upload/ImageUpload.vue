<script setup lang="ts">
import { ref } from "vue";
import { Loader2, X, ImageIcon, Camera, User } from "lucide-vue-next";
import { uploadService } from "@/services/upload/upload.service.ts";
import { toast } from "vue-sonner";
import { cn } from "@/lib/utils.ts";
import { useI18n } from "vue-i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const { t } = useI18n();

const props = defineProps<{
  imageUrl?: string;
  label?: string;
  class?: string;
  shape?: "square" | "circle";
  name?: string;
}>();

const emit = defineEmits<{
  (e: "update:imageUrl", value: string): void;
}>();

const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

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
      toast.success(t("crud.uploadSuccess") || "Image uploaded successfully");
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
}

function triggerUpload() {
  fileInput.value?.click();
}

// const userInitials = props.name
//   ? props.name
//       .split(" ")
//       .map((n) => n[0])
//       .join("")
//       .toUpperCase()
//       .slice(0, 2)
//   : "??";
</script>

<template>
  <div :class="cn('w-full', props.class)">
    <label
      v-if="label"
      class="text-sm font-semibold text-foreground/80 mb-4 block"
    >
      {{ label }}
    </label>

    <!-- Circular Avatar Mode -->
    <template v-if="shape === 'circle'">
      <div class="relative group w-44 h-44 mx-auto">
        <Avatar class="w-full h-full border-4 border-background shadow-xl">
          <AvatarImage :src="imageUrl" class="object-cover" />
          <AvatarFallback class="bg-primary/5 text-primary">
            <User class="w-1/3 h-1/3 opacity-50" />
          </AvatarFallback>
        </Avatar>

        <!-- Overlay on Hover -->
        <div
          @click="triggerUpload"
          class="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-4 border-transparent group-hover:border-primary/20 backdrop-blur-[2px] z-10"
        >
          <Camera class="h-8 w-8 text-white mb-1" />
          <span
            class="text-[10px] text-white font-bold uppercase tracking-wider"
            >{{ t("crud.changeImage") || "Change" }}</span
          >
        </div>

        <!-- Remove Button (Top Right) -->
        <button
          v-if="imageUrl"
          @click.stop="removeImage"
          type="button"
          class="absolute -top-1 -right-1 p-1.5 bg-destructive text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"
        >
          <X class="h-3 w-3" />
        </button>

        <!-- Uploading State Overlay -->
        <div
          v-if="uploading"
          class="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center z-30"
        >
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    </template>

    <!-- Standard Square/Rect Mode -->
    <template v-else>
      <div
        class="relative flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-2xl p-4 transition-all hover:border-primary/40 hover:bg-muted/30 group aspect-square w-full overflow-hidden bg-muted/20 shadow-inner"
      >
        <template v-if="imageUrl">
          <img
            :src="imageUrl"
            class="h-full w-full object-cover rounded-xl shadow-lg border bg-background"
            alt="Preview"
            @error="(e: any) => (e.target.src = '/placeholder-image.png')"
          />
          <button
            @click="removeImage"
            type="button"
            class="absolute top-3 right-3 p-2 bg-destructive/90 text-white rounded-full shadow-xl hover:bg-destructive transition-all hover:rotate-90 z-20"
          >
            <X class="h-4 w-4" />
          </button>
          <div
            class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
          >
            <span
              class="text-white text-xs font-bold uppercase tracking-wider"
              >{{ t("crud.changeImage") }}</span
            >
          </div>
          <div
            class="absolute inset-0 cursor-pointer z-10"
            @click="triggerUpload"
          ></div>
        </template>

        <template v-else>
          <div
            class="flex flex-col items-center gap-4 text-muted-foreground transition-all group-hover:text-primary/70"
          >
            <div
              class="p-5 rounded-full bg-background/80 shadow-md transition-transform group-hover:scale-110 border"
            >
              <ImageIcon
                v-if="!uploading"
                class="h-10 w-10 text-muted-foreground/40"
              />
              <Loader2 v-else class="h-10 w-10 animate-spin text-primary" />
            </div>
            <div class="text-center px-4">
              <span
                class="block text-sm font-bold text-foreground/60 uppercase tracking-tight"
                >{{
                  uploading ? t("crud.uploading") : t("crud.clickToUpload")
                }}</span
              >
              <span
                v-if="!uploading"
                class="text-[10px] opacity-50 block mt-1"
                >{{ t("crud.uploadHint") }}</span
              >
            </div>
          </div>
          <div
            class="absolute inset-0 cursor-pointer"
            @click="triggerUpload"
          ></div>
        </template>
      </div>
    </template>

    <input
      ref="fileInput"
      type="file"
      class="hidden"
      accept="image/png,image/jpeg,image/jpg,image/webp"
      @change="handleFileChange"
    />
  </div>
</template>
