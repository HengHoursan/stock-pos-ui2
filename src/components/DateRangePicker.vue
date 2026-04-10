<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  getLocalTimeZone,
  parseDate,
} from '@internationalized/date'
import {
  type DateRange,
  RangeCalendarRoot,
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeCalendarNext,
  RangeCalendarPrev,
  useDateFormatter,
} from 'reka-ui'
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { useI18n } from 'vue-i18n'

interface Props {
  modelValue?: { start: string | Date | null; end: string | Date | null } | null
  placeholder?: string
  class?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])
const { t, locale } = useI18n()

// Reactive formatter based on active locale
const formatter = computed(() => useDateFormatter(locale.value === 'kh' ? 'km-KH' : 'en-US'))

// Internal range value for RangeCalendarRoot
const value = ref<DateRange>({
  start: undefined,
  end: undefined,
})

const formattedRange = computed(() => {
  if (!value.value.start) return props.placeholder || t('crud.dateRangePlaceholder')
  const startStr = formatter.value.custom(value.value.start.toDate(getLocalTimeZone()), { dateStyle: 'medium' })
  if (!value.value.end) return startStr
  const endStr = formatter.value.custom(value.value.end.toDate(getLocalTimeZone()), { dateStyle: 'medium' })
  return `${startStr} — ${endStr}`
})

function clearRange(e: Event) {
  e.stopPropagation()
  value.value = { start: undefined, end: undefined }
}

// Watch internal value change to emit ISO strings
watch(value, (newVal) => {
  if (newVal.start && newVal.end) {
    emit('update:modelValue', {
      start: newVal.start.toString(),
      end: newVal.end.toString()
    })
  } else if (!newVal.start && !newVal.end) {
    emit('update:modelValue', null)
  }
}, { deep: true })

// Sync from external modelValue (e.g. reset)
watch(() => props.modelValue, (newVal) => {
  if (!newVal || (!newVal.start && !newVal.end)) {
    if (value.value.start || value.value.end) {
      value.value = { start: undefined, end: undefined }
    }
    return
  }
  // Parse ISO string back to DateValue if needed
  try {
    if (newVal.start && typeof newVal.start === 'string' && !value.value.start) {
      value.value.start = parseDate(newVal.start.substring(0, 10))
    }
    if (newVal.end && typeof newVal.end === 'string' && !value.value.end) {
      value.value.end = parseDate(newVal.end.substring(0, 10))
    }
  } catch {
    // Ignore parse errors for non-standard date strings
  }
}, { immediate: true })
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="cn(
          'w-full justify-start text-left font-normal bg-background/50 border-border/60 transition-all focus:ring-2 focus:ring-primary/20 pr-8',
          !value.start && 'text-muted-foreground',
          props.class
        )"
      >
        <CalendarIcon class="mr-2 h-4 w-4 opacity-50" />
        <span class="truncate">{{ formattedRange }}</span>
        
        <div v-if="value.start" @click="clearRange" class="absolute right-2 p-1 hover:bg-muted rounded-full transition-colors">
            <X class="h-3 w-3 opacity-50" />
        </div>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0 border shadow-xl shadow-primary/5" align="start">
      <RangeCalendarRoot
        v-model="value"
        v-slot="{ grid, weekDays }"
        class="p-3"
        :number-of-months="2"
      >
        <RangeCalendarHeader class="relative flex w-full items-center justify-between pt-1">
          <RangeCalendarPrev
            class="inline-flex items-center cursor-pointer justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          >
            <ChevronLeft class="h-4 w-4" />
          </RangeCalendarPrev>
          <RangeCalendarHeading class="text-sm font-medium" />
          <RangeCalendarNext
            class="inline-flex items-center cursor-pointer justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          >
            <ChevronRight class="h-4 w-4" />
          </RangeCalendarNext>
        </RangeCalendarHeader>

        <div class="flex flex-col gap-y-4 mt-4 sm:flex-row sm:gap-x-4 sm:gap-y-0">
          <RangeCalendarGrid v-for="month in grid" :key="month.value.toString()" class="w-full border-collapse space-y-1">
            <RangeCalendarGridHead>
              <RangeCalendarGridRow class="flex">
                <RangeCalendarHeadCell
                  v-for="day in weekDays"
                  :key="day"
                  class="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]"
                >
                  {{ day }}
                </RangeCalendarHeadCell>
              </RangeCalendarGridRow>
            </RangeCalendarGridHead>
            <RangeCalendarGridBody>
              <RangeCalendarGridRow v-for="(weekDates, index) in month.rows" :key="`weekDate-${index}`" class="flex mt-2 w-full">
                <RangeCalendarCell
                  v-for="weekDate in weekDates"
                  :key="weekDate.toString()"
                  :date="weekDate"
                  class="relative text-center text-sm p-0 [&:has([data-selected])]:bg-accent first:[&:has([data-selected])]:rounded-l-md last:[&:has([data-selected])]:rounded-r-md focus-within:relative focus-within:z-20"
                >
                  <RangeCalendarCellTrigger
                    :day="weekDate"
                    :month="month.value"
                    class="inline-flex items-center justify-center rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 w-9 p-0 font-normal data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:opacity-100 data-[today]:bg-accent data-[today]:text-accent-foreground data-[outside-view]:text-muted-foreground data-[outside-view]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[selection-start]:bg-primary data-[selection-start]:text-primary-foreground data-[selection-end]:bg-primary data-[selection-end]:text-primary-foreground data-[disabled]:text-muted-foreground data-[disabled]:opacity-50 data-[unavailable]:text-muted-foreground data-[unavailable]:line-through"
                  />
                </RangeCalendarCell>
              </RangeCalendarGridRow>
            </RangeCalendarGridBody>
          </RangeCalendarGrid>
        </div>
      </RangeCalendarRoot>
    </PopoverContent>
  </Popover>
</template>
