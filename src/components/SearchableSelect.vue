<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Check, ChevronsUpDown, X } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Option {
  label: string;
  value: string | number;
}

const props = defineProps<{
  modelValue?: string | number | null;
  options: Option[];
  placeholder?: string;
  emptyMessage?: string;
  showAllOption?: boolean;
  class?: string;
}>();

const emit = defineEmits(["update:modelValue", "change"]);

const { t } = useI18n();
const open = ref(false);
const searchTerm = ref("");

const filteredOptions = computed(() => {
  if (!searchTerm.value) return props.options;
  const term = searchTerm.value.toLowerCase();
  return props.options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(term) ||
      String(opt.value).toLowerCase().includes(term),
  );
});

const selectedLabel = computed(() => {
  const selected = props.options.find(
    (opt) => String(opt.value) === String(props.modelValue),
  );
  return selected ? selected.label : null;
});

function handleSelect(val: string | number | null) {
  emit("update:modelValue", val);
  emit("change", val);
  open.value = false;
  searchTerm.value = "";
}

// Reset search term when opening
watch(open, (val) => {
  if (val) searchTerm.value = "";
});

function clearSelection(e: Event) {
  e.stopPropagation();
  e.preventDefault();
  searchTerm.value = "";
  handleSelect(null);
  // Ensure popover doesn't toggle
  open.value = false;
}
</script>

<template>
  <div :class="cn('relative w-full', props.class)">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          class="w-full justify-between font-normal pr-4"
          :class="!modelValue && 'text-muted-foreground'"
        >
          <span class="truncate pr-8">{{
            selectedLabel ||
            placeholder ||
            t("crud.selectOption", { module: "" }).trim()
          }}</span>
          <ChevronsUpDown class="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        class="w-[--reka-popover-trigger-width] p-0"
        align="start"
      >
        <Command v-model:search-term="searchTerm">
          <CommandInput
            :placeholder="placeholder || t('crud.searchPlaceholder')"
          />
          <CommandList>
            <CommandEmpty>{{
              emptyMessage || t("crud.noResults")
            }}</CommandEmpty>
            <CommandGroup>
              <!-- Fixed "All" Option for Filters -->
              <CommandItem
                v-if="props.showAllOption !== false"
                value="all"
                @select="handleSelect(null)"
                class="cursor-pointer"
              >
                <span>{{ t("crud.filterByModule") }}</span>
                <Check
                  :class="
                    cn(
                      'ml-auto h-4 w-4',
                      !modelValue || modelValue === 'all'
                        ? 'opacity-100'
                        : 'opacity-0',
                    )
                  "
                />
              </CommandItem>

              <CommandItem
                v-for="option in filteredOptions"
                :key="option.value"
                :value="option.label"
                @select="handleSelect(option.value)"
                class="cursor-pointer"
              >
                <span class="truncate">{{ option.label }}</span>
                <Check
                  :class="
                    cn(
                      'ml-auto h-4 w-4',
                      String(modelValue) === String(option.value)
                        ? 'opacity-100'
                        : 'opacity-0',
                    )
                  "
                />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  <!-- Clear Button - Positioned absolutely outside PopoverTrigger -->
  <div 
    v-if="(modelValue !== undefined && modelValue !== null && modelValue !== '') && modelValue !== 'all'"
    class="absolute right-9 top-1/2 -translate-y-1/2 flex items-center"
  >
    <X 
      class="h-3.5 w-3.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer p-0.5 rounded-sm hover:bg-muted" 
      @mousedown.stop
      @click.stop.prevent="clearSelection"
    />
  </div>
</div>
</template>
