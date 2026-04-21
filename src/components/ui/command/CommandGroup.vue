<script setup lang="ts">
import { ComboboxGroup, type ComboboxGroupProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<ComboboxGroupProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <ComboboxGroup
    v-bind="delegatedProps"
    :class="cn('overflow-hidden p-1 text-foreground [&_[reka-group-label]]:px-2 [&_[reka-group-label]]:py-1.5 [&_[reka-group-label]]:text-xs [&_[reka-group-label]]:font-medium [&_[reka-group-label]]:text-muted-foreground', props.class)"
  >
    <slot />
  </ComboboxGroup>
</template>
