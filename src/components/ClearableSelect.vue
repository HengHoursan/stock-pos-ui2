<script setup lang="ts">
import { X, ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Option {
  label: string
  value: string | number
}

const props = defineProps<{
  modelValue?: string | number | null
  options: Option[]
  placeholder?: string
  class?: string
}>()

const emit = defineEmits(['update:modelValue', 'change'])

function handleUpdate(val: string) {
  emit('update:modelValue', val)
  emit('change', val)
}

function clearSelection(e: Event) {
  e.stopPropagation()
  e.preventDefault()
  emit('update:modelValue', '')
  emit('change', '')
}
</script>

<template>
  <div :class="cn('relative w-full', props.class)">
    <Select :model-value="String(modelValue || '')" @update:model-value="handleUpdate">
      <SelectTrigger class="w-full justify-between font-normal pr-4">
        <div class="pr-8 truncate">
          <SelectValue :placeholder="placeholder" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="option in options"
          :key="option.value"
          :value="String(option.value)"
        >
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>

    <!-- Clear Button -->
    <div 
      v-if="modelValue !== undefined && modelValue !== null && modelValue !== ''"
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
