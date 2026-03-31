<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, ImageIcon } from "lucide-vue-next";
import { uploadService } from "@/services/upload/upload.service.ts";
import { toast } from "vue-sonner";
import { cn } from "@/lib/utils.ts";

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

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  // Validate file type
  if (!file.type.match(/image\/(png|jpeg|jpg|webp)/)) {
    toast.error("Please upload a valid image file (png, jpeg, jpg, webp)");
    return;
  }

  // Validate file size (5MB)
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
}

function triggerUpload() {
  fileInput.value?.click();
}
</script>

<template>
  <div :class="cn('space-y-2', props.class)">
    <label v-if="label" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {{ label }}
    </label>
    
    <div class="relative flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl p-4 transition-all hover:border-primary/50 hover:bg-muted/30 group h-64 w-64 overflow-hidden bg-muted/50 shadow-inner">
      <template v-if="imageUrl">
        <img :src="imageUrl" class="h-full w-full object-cover rounded-lg shadow-sm" alt="Preview" />
        <button 
          @click="removeImage" 
          type="button"
          class="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:bg-destructive/90 transition-all hover:scale-110 active:scale-95 z-10"
        >
          <X class="h-4 w-4" />
        </button>
      </template>
      
      <template v-else>
        <div class="flex flex-col items-center gap-3 text-muted-foreground transition-all group-hover:text-primary/70">
          <div class="p-4 rounded-full bg-background/50 shadow-sm transition-transform group-hover:scale-110">
            <ImageIcon v-if="!uploading" class="h-12 w-12" />
            <Loader2 v-else class="h-12 w-12 animate-spin text-primary" />
          </div>
          <div class="text-center">
            <span class="block text-sm font-bold">{{ uploading ? 'Uploading...' : 'No Image' }}</span>
            <span v-if="!uploading" class="text-[10px] opacity-60">PNG, JPG, WEBP (Max 5MB)</span>
          </div>
        </div>
      </template>

      <div v-if="!uploading && !imageUrl" class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-primary/5 cursor-pointer backdrop-blur-[1px]" @click="triggerUpload">
        <div class="bg-primary text-primary-foreground p-3 rounded-full shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
           <Upload class="h-8 w-8" />
        </div>
      </div>
    </div>

    <div class="flex gap-2">
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        @click="triggerUpload" 
        :disabled="uploading"
      >
        <Upload class="mr-2 h-4 w-4" />
        {{ imageUrl ? 'Change Image' : 'Upload Image' }}
      </Button>
      <input 
        ref="fileInput" 
        type="file" 
        class="hidden" 
        accept="image/png,image/jpeg,image/jpg,image/webp" 
        @change="handleFileChange" 
      />
    </div>
  </div>
</template>
