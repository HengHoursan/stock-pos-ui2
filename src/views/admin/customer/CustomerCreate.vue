<script setup lang="ts">
/* 
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import { ref } from "vue";
import { useRouter } from "vue-router";
... (all logic commented out for security)
*/
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ChevronLeft, Lock } from "lucide-vue-next";

const router = useRouter();
</script>

<template>
  <div class="space-y-4 max-w-2xl mx-auto pt-10">
    <div class="flex items-center gap-4">
      <Button variant="outline" size="icon" @click="router.back()">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <h2 class="text-3xl font-bold tracking-tight text-foreground">{{ $t('modules.customer') }}</h2>
    </div>

    <Card class="border-dashed border-2 shadow-none bg-muted/30">
      <CardHeader class="text-center pt-10">
        <div class="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Lock class="h-8 w-8 text-muted-foreground opacity-40" />
        </div>
        <CardTitle class="text-2xl font-bold text-muted-foreground">{{ $t('common.featureDisabled') || 'Management Disabled' }}</CardTitle>
      </CardHeader>
      <CardContent class="text-center pb-10">
        <p class="text-muted-foreground max-w-sm mx-auto">
          Customer creation and editing have been disabled to ensure data integrity using fixed default profiles (Dine In / Dine Out).
        </p>
      </CardContent>
      <CardFooter class="flex justify-center pb-10 pt-0">
        <Button variant="secondary" @click="router.push('/admin/customers')">
          Return to Customer List
        </Button>
      </CardFooter>
    </Card>

    <!-- Original form logic commented out below -->
    <!-- 
    <form @submit="onSubmit" id="customerForm">
    ...
    </form>
    -->
  </div>
</template>
