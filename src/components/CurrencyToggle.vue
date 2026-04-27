<script setup lang="ts">
import { useCurrencyStore } from "@/stores/currency";
import { Coins, ChevronsUpDown } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const currencyStore = useCurrencyStore();

function formatRate(rate: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 4,
  }).format(rate);
}
</script>

<template>
  <DropdownMenu v-if="currencyStore.availableCurrencies.length > 0">
    <DropdownMenuTrigger as-child>
      <Button 
        variant="outline" 
        size="sm" 
        class="h-8 gap-2 px-3 text-sm font-medium border-muted-foreground/20 hover:border-primary/50 transition-colors shadow-sm"
      >
        <div class="flex items-center gap-1.5">
          <Coins class="h-4 w-4 text-primary" />
          <span class="">{{ currencyStore.activeCurrency?.symbol }}</span>
          <span class="hidden sm:inline font-semibold opacity-70">{{ currencyStore.activeCurrency?.code }}</span>
        </div>
        <ChevronsUpDown class="h-3.5 w-3.5 opacity-50" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuItem
        v-for="currency in currencyStore.availableCurrencies"
        :key="currency.id"
        class="cursor-pointer gap-3 p-2 focus:bg-primary/5"
        @click="currencyStore.setCurrency(currency)"
      >
        <div class="flex h-6 w-6 items-center justify-center rounded-sm bg-muted text-xs font-bold ring-1 ring-border">
          {{ currency.symbol }}
        </div>
        <div class="flex flex-1 flex-col">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold leading-none">{{ currency.code }}</span>
            <span v-if="currency.exchangeRate !== 1" class="text-[10px] bg-primary/10 text-primary px-1 rounded">
              ×{{ formatRate(currency.exchangeRate) }}
            </span>
          </div>
          <span class="text-[10px] text-muted-foreground">{{ currency.currency }}</span>
        </div>
        <span v-if="currencyStore.activeCurrency?.id === currency.id" class="text-primary text-xs font-bold">✓</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
