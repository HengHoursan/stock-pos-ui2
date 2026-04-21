<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, ChevronsUpDown, X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Option {
  label: string
  value: string | number
}

const props = defineProps<{
  modelValue?: string | number | null
  options: Option[]
  placeholder?: string
  emptyMessage?: string
  class?: string
}>()

const emit = defineEmits(['update:modelValue', 'change'])

const { t } = useI18n()
const open = ref(false)
const searchTerm = ref('')

const selectedLabel = computed(() => {
  const selected = props.options.find((opt) => String(opt.value) === String(props.modelValue))
  return selected ? selected.label : null
})

function handleSelect(val: string | number | null) {
  emit('update:modelValue', val)
  emit('change', val)
  open.value = false
}

function clearSelection(e: Event) {
  e.stopPropagation()
  handleSelect(null)
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        :class="cn('w-full justify-between font-normal min-w-[200px]', !modelValue && 'text-muted-foreground', props.class)"
      >
        <span class="truncate">{{ selectedLabel || placeholder || t('crud.selectOption', { module: '' }).trim() }}</span>
        <div class="flex items-center gap-1 shrink-0 ml-2">
          <X 
            v-if="modelValue && modelValue !== 'all'" 
            class="h-3 w-3 opacity-50 hover:opacity-100 transition-opacity" 
            @click="clearSelection"
          />
          <ChevronsUpDown class="h-4 w-4 opacity-50" />
        </div>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[--reka-popover-trigger-width] p-0" align="start">
      <Command v-model="searchTerm">
        <CommandInput :placeholder="placeholder || t('crud.searchPlaceholder')" />
        <CommandList>
          <CommandEmpty>{{ emptyMessage || t('crud.noResults') }}</CommandEmpty>
          <CommandGroup>
            <!-- Fixed "All" Option for Filters -->
            <CommandItem
              value="all"
              @select="handleSelect(null)"
              class="cursor-pointer"
            >
              <span>{{ t('crud.all') }}</span>
              <Check
                :class="cn(
                  'ml-auto h-4 w-4',
                  !modelValue || modelValue === 'all' ? 'opacity-100' : 'opacity-0',
                )"
              />
            </CommandItem>
            
            <CommandItem
              v-for="option in options"
              :key="option.value"
              :value="option.label" 
              @select="handleSelect(option.value)"
              class="cursor-pointer"
            >
              <span class="truncate">{{ option.label }}</span>
              <Check
                :class="cn(
                  'ml-auto h-4 w-4',
                  String(modelValue) === String(option.value) ? 'opacity-100' : 'opacity-0',
                )"
              />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
