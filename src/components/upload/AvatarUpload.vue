<script setup lang="ts">
import { ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, User, X } from "lucide-vue-next";
import { uploadService } from "@/services/upload/upload.service.ts";
import { toast } from "vue-sonner";
import { cn } from "@/lib/utils.ts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const props = defineProps<{
  imageUrl?: string;
  name?: string;
  class?: string;
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
      toast.success("Profile picture updated");
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

function triggerUpload() {
  fileInput.value?.click();
}

const userInitials = props.name 
  ? props.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  : "??";
</script>

<template>
  <div :class="cn('relative group w-32 h-32 mx-auto', props.class)">
    <Avatar class="w-full h-full border-4 border-background shadow-xl">
      <AvatarImage :src="imageUrl" class="object-cover" />
      <AvatarFallback class="bg-primary/5 text-primary text-2xl font-bold">
        {{ userInitials }}
      </AvatarFallback>
    </Avatar>

    <!-- Overlay on Hover -->
    <div 
      @click="triggerUpload"
      class="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-4 border-transparent group-hover:border-primary/20 backdrop-blur-[2px]"
    >
      <Camera class="h-8 w-8 text-white mb-1" />
      <span class="text-[10px] text-white font-bold uppercase tracking-wider">Change</span>
    </div>

    <!-- Uploading State Overlay -->
    <div 
      v-if="uploading"
      class="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center z-20"
    >
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>

    <input
      ref="fileInput"
      type="file"
      class="hidden"
      accept="image/png,image/jpeg,image/jpg,image/webp"
      @change="handleFileChange"
    />
  </div>
</template>
