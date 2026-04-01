<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  DateFormatter,
  type DateValue,
  parseDateTime,
} from '@internationalized/date'
import { toDate } from "reka-ui/date"

import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Props {
  modelValue?: string | Date | null
  placeholder?: string
  class?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])

const df = new DateFormatter('en-US', {
  dateStyle: 'long',
})

// Internal value for reach-ui / calendar
const value = ref<DateValue>()

// Helper to convert internal DateValue to ISO string
const toISOString = (val: DateValue | undefined) => {
  if (!val) return null
  return val.toString()
}

// Watch props.modelValue to sync internal value
watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    value.value = undefined
    return
  }

  try {
    const dateStr = typeof newVal === 'string' ? newVal : newVal.toISOString()
    // Native datetime-local uses YYYY-MM-DDTHH:mm
    // parseDateTime expects YYYY-MM-DDTHH:mm:ss or similar
    // If it's a date only (YYYY-MM-DD), we might need to handle it.
    // Discount dates are usually YYYY-MM-DDTHH:mm:SSZ from backend or YYYY-MM-DDTHH:mm from input
    
    // Simple way: take first 16 or 19 chars
    const cleaned = dateStr.includes('Z') ? dateStr.replace('Z', '') : dateStr
    value.value = parseDateTime(cleaned.slice(0, 19))
  } catch (e) {
    console.error('DatePicker: Error parsing date', newVal, e)
    value.value = undefined
  }
}, { immediate: true })

// Watch internal value to emit update
watch(value, (newVal) => {
  const iso = toISOString(newVal)
  if (iso !== props.modelValue) {
    emit('update:modelValue', iso)
  }
})
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="cn(
          'w-full justify-start text-left font-normal bg-background/50 border-border/60 transition-all focus:ring-2 focus:ring-primary/20',
          !value && 'text-muted-foreground',
          props.class
        )"
      >
        <CalendarIcon class="mr-2 h-4 w-4 opacity-50" />
        {{ value ? df.format(toDate(value)) : props.placeholder }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0 border shadow-xl shadow-primary/5" align="start">
      <Calendar v-model="value" initial-focus />
    </PopoverContent>
  </Popover>
</template>
