<script setup lang="ts">
import { useDark, useToggle } from "@vueuse/core";
import { Moon, Sun } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

const isDark = useDark();
const toggleDark = useToggle(isDark);
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    @click="toggleDark()"
    class="rounded-full w-9 h-9 flex items-center justify-center transition-all hover:bg-accent group active:scale-95"
    title="Toggle Theme"
  >
    <div class="relative w-5 h-5 flex items-center justify-center overflow-hidden">
      <!-- Sun Icon -->
      <Sun
        class="h-5 w-5 transition-all duration-300 transform"
        :class="isDark ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'"
      />
      <!-- Moon Icon -->
      <Moon
        class="absolute h-5 w-5 transition-all duration-300 transform"
        :class="isDark ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'"
      />
    </div>
    <span class="sr-only">Toggle theme</span>
  </Button>
</template>
