<script setup lang="ts">
import { useAppI18n } from "@/hooks/useAppI18n";
const { t, labels, fields, crud } = useAppI18n("unit");
import { ref, onMounted, reactive, watch } from "vue";
import { useRouter } from "vue-router";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  MoreHorizontal,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ArrowUpDown,
  RefreshCw,
  Loader2,
  Scale
} from "lucide-vue-next";
import { UnitService } from "@/services/unit/unit.service";
import type { Unit, PaginationMeta } from "@/types";
import { toast } from "vue-sonner";
import { useDebounceFn } from "@vueuse/core";
import ClearableSelect from "@/components/ClearableSelect.vue";
import { computed } from "vue";
import { usePermissions } from "@/hooks/usePermissions";

const { hasPermission } = usePermissions();


const router = useRouter();
const unitService = new UnitService();

const units = ref<Unit[]>([]);
const loading = ref(true);
const filters = reactive({
  search: "",
  status: "",
});

const pagination = reactive<PaginationMeta>({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0,
  sortBy: "createdAt",
  sortOrder: "DESC",
});

const statusOptions = computed(() => [
  { label: crud.active, value: "active" },
  { label: crud.inactive, value: "inactive" },
]);

const isDeleteDialogOpen = ref(false);
const unitToDelete = ref<number | null>(null);

const selectedIds = ref<number[]>([]);
const isSelectAll = computed({
  get: () => units.value.length > 0 && selectedIds.value.length === units.value.length,
  set: (val: boolean) => {
    if (val) {
      selectedIds.value = units.value.map((u) => u.id);
    } else {
      selectedIds.value = [];
    }
  },
});

async function handleBulkAction(action: "delete" | "activate" | "deactivate") {
  if (selectedIds.value.length === 0) return;

  const moduleTitle = labels.title;
  
  try {
    if (action === "delete") {
      if (!confirm(t("crud.confirmBulkDelete", { count: selectedIds.value.length, module: moduleTitle }))) return;
      const res = await unitService.bulkSoftDelete(selectedIds.value);
      if (res.success) {
        toast.success(t("crud.successBulkDelete", { module: moduleTitle }));
        selectedIds.value = [];
        fetchUnits();
      }
    } else {
      const status = action === "activate";
      const res = await unitService.bulkUpdateStatus(selectedIds.value, status);
      if (res.success) {
        toast.success(t("crud.successBulkUpdate", { module: moduleTitle }));
        selectedIds.value = [];
        fetchUnits();
      }
    }
  } catch (error) {
    toast.error(t("crud.errorBulkAction"));
  }
}

async function fetchUnits() {
  loading.value = true;
  try {
    const pageNum = Number(pagination.page) || 1;
    const limitNum = Number(pagination.limit) || 10;

    const payload: any = {
      page: pageNum,
      limit: limitNum,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
    };

    if (filters.search.trim()) {
      payload.search = filters.search.trim();
    }

    if (filters.status) {
      payload.filter = { status: filters.status };
    }

    const response = await unitService.getList(payload);
    if (response.success && response.data) {
      units.value = response.data.data;
      Object.assign(pagination, response.data.meta);
    }
  } catch (error) {
    console.error("Fetch units error:", error);
    toast.error(t('crud.errorFetch', { module: labels.title }));
  } finally {
    loading.value = false;
  }
}

const debouncedFetch = useDebounceFn(() => {
  pagination.page = 1;
  fetchUnits();
}, 500);

watch(
  () => filters.search,
  () => {
    debouncedFetch();
  }
);

watch(
  () => filters.status,
  () => {
    pagination.page = 1;
    fetchUnits();
  }
);

watch(
  () => pagination.limit,
  () => {
    pagination.page = 1;
    fetchUnits();
  },
);

function handlePageChange(page: number) {
  pagination.page = page;
  fetchUnits();
}

async function toggleStatus(unit: Unit) {
  try {
    const newStatus = !unit.status;
    const response = await unitService.updateStatus({
      id: unit.id,
      status: newStatus,
    });
    if (response.success) {
      unit.status = newStatus;
      toast.success(t('crud.successUpdate', { module: labels.name }));
    }
  } catch (error) {
    toast.error(t('crud.errorUpdate', { module: labels.name }));
  }
}

function openDeleteDialog(id: number) {
  unitToDelete.value = id;
  isDeleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!unitToDelete.value) return;

  try {
    const response = await unitService.softDelete(unitToDelete.value);
    if (response.success) {
      toast.success(t('crud.successDelete', { module: labels.name }));
      fetchUnits();
    } else {
      toast.error(response.message || t('crud.errorDelete', { module: labels.name }));
    }
  } catch (error) {
    toast.error(t('crud.errorDelete', { module: labels.name }));
  } finally {
    isDeleteDialogOpen.value = false;
    unitToDelete.value = null;
  }
}

function handleSort(column: string) {
  if (pagination.sortBy === column) {
    pagination.sortOrder = pagination.sortOrder === "ASC" ? "DESC" : "ASC";
  } else {
    pagination.sortBy = column;
    pagination.sortOrder = "ASC";
  }
  fetchUnits();
}

onMounted(() => {
  fetchUnits();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold tracking-tight text-foreground">
        {{ labels.title }}
      </h2>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          @click="fetchUnits"
          :disabled="loading"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
        <Button v-permission="'unit:create'" @click="router.push('/admin/units/create')">
          <Plus class="mr-2 h-4 w-4" />{{ crud.createBtn }} {{ labels.title }}
        </Button>
      </div>
    </div>

    <div v-if="selectedIds.length > 0" class="flex items-center gap-2 p-3 bg-muted/30 border rounded-lg animate-in fade-in slide-in-from-top-2">
      <span class="text-sm font-medium mr-2">{{ t('crud.selectedCount', { count: selectedIds.length }) }}</span>
      <Button variant="outline" size="sm" @click="handleBulkAction('activate')" class="h-8">
        {{ crud.activate }}
      </Button>
      <Button variant="outline" size="sm" @click="handleBulkAction('deactivate')" class="h-8">
        {{ crud.deactivate }}
      </Button>
      <Button variant="destructive" size="sm" @click="handleBulkAction('delete')" class="h-8">
        <Trash2 class="mr-2 h-4 w-4" />
        {{ crud.delete }}
      </Button>
      <Button variant="ghost" size="sm" @click="selectedIds = []" class="h-8 ml-auto">
        {{ crud.cancel }}
      </Button>
    </div>

    <div class="flex flex-col sm:flex-row items-center gap-4">
      <div class="relative flex-1 w-full max-w-sm">
        <Search
          class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
        />
        <Input
          type="search"
          :placeholder="t('crud.search', { module: labels.title })"
          class="pl-8"
          v-model="filters.search"
        />
      </div>

      <ClearableSelect
        v-model="filters.status"
        :options="statusOptions"
        :placeholder="crud.filterByStatus"
        class="w-full sm:w-[180px]"
      />
    </div>

    <div class="rounded-md border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[40px]">
              <input 
                type="checkbox" 
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                v-model="isSelectAll"
              />
            </TableHead>
            <TableHead class="w-[180px]">{{ fields.code }}</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                @click="handleSort('name')"
                class="-ml-4 h-8 font-medium"
                >{{ fields.name }}<ArrowUpDown class="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>{{ fields.shortName }}</TableHead>
            <TableHead>{{ fields.status }}</TableHead>
            <TableHead class="text-right">{{ crud.actions }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading && units.length === 0">
            <TableCell colspan="6" class="h-24 text-center">
              <div
                class="flex items-center justify-center text-muted-foreground italic text-sm"
              >
                <Loader2 class="h-4 w-4 animate-spin mr-2" />
                <span>{{ crud.fetchingData }}</span>
              </div>
            </TableCell>
          </TableRow>
          <template v-else-if="units.length > 0">
            <TableRow v-for="(unit) in units" :key="unit.id" :class="{ 'bg-muted/30': selectedIds.includes(unit.id) }">
              <TableCell>
                <input 
                  type="checkbox" 
                  class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  :value="unit.id"
                  v-model="selectedIds"
                />
              </TableCell>
              <TableCell>
                <code
                  class="bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-foreground/70 border border-muted-foreground/10 uppercase"
                  >{{ unit.code }}</code
                >
              </TableCell>
              <TableCell class="font-bold text-base text-foreground/90">{{
                unit.name
              }}</TableCell>
              <TableCell class="text-muted-foreground text-sm italic font-medium">{{
                unit.
              }}</TableCell>
              <TableCell class="w-[100px]">
                <Badge
                  :variant="unit.status ? 'success' : 'warning'"
                  class="font-bold px-3 transition-all"
                  :class="hasPermission('unit:update') ? 'cursor-pointer hover:opacity-80 active:scale-95' : 'cursor-default opacity-70'"
                  @click="hasPermission('unit:update') && toggleStatus(unit)"
                >
                  {{ unit.status ? crud.active : crud.inactive }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                      variant="ghost"
                      class="h-8 w-8 p-0 hover:bg-muted/80 rounded-full"
                    >
                      <span class="sr-only">Open menu</span>
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-[180px]">
                    <DropdownMenuLabel
                      class="text-xs uppercase text-muted-foreground font-bold"
                      >{{ crud.actions }}</DropdownMenuLabel
                    >
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      @click="router.push(`/admin/units/${unit.id}`)"
                      class="cursor-pointer"
                    >
                      <Eye class="mr-2 h-4 w-4 opacity-70" />{{
                        crud.viewBtn
                      }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      v-permission="'unit:update'"
                      @click="router.push(`/admin/units/${unit.id}/edit`)"
                      class="cursor-pointer"
                    >
                      <Pencil class="mr-2 h-4 w-4 opacity-70" />{{
                        crud.editBtn
                      }}</DropdownMenuItem
                    >
                    <DropdownMenuSeparator v-permission="'unit:delete'" />
                    <DropdownMenuItem
                      v-permission="'unit:delete'"
                      class="text-destructive focus:text-destructive cursor-pointer font-medium"
                      @click="openDeleteDialog(unit.id)"
                    >
                      <Trash2 class="mr-2 h-4 w-4" />{{
                        crud.delete
                      }}</DropdownMenuItem
                    >
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell
              colspan="6"
              class="h-32 text-center text-muted-foreground"
            >
              <div class="flex flex-col items-center justify-center gap-3">
                <Scale class="h-10 w-10 opacity-10" />
                <p class="font-medium">
                  {{ t("crud.noRecords", { module: labels.title }) }}
                </p>
                <Button
                  v-if="filters.search || filters.status"
                  variant="outline"
                  size="sm"
                  @click="Object.assign(filters, { search: '', status: '' })"
                  class="h-8"
                >
                  {{ crud.resetFilters }}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div
      class="flex items-center justify-end px-4 py-4 border-t bg-muted/5 rounded-b-lg"
    >
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-muted-foreground whitespace-nowrap"
            >{{ crud.rowsPerPage }}</span
          >
          <Select
            :model-value="pagination.limit.toString()"
            @update:model-value="
              (v) => (pagination.limit = parseInt(v as string))
            "
          >
            <SelectTrigger class="h-8 w-[70px] bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Pagination
          v-if="pagination.totalItems > 0"
          :total="pagination.totalItems"
          :items-per-page="pagination.limit"
          :sibling-count="1"
          :show-edges="false"
          v-model:page="pagination.page"
          @update:page="handlePageChange"
        >
          <PaginationContent v-slot="{ items }" class="flex items-center gap-1">
            <PaginationPrevious class="h-8 px-2 text-foreground font-medium border-0 hover:bg-muted/50 bg-transparent" />
            
            <template v-for="(item, index) in items">
              <PaginationItem
                v-if="item.type === 'page'"
                :key="index"
                :value="item.value"
                :is-active="item.value === pagination.page"
                class="w-8 h-8 p-0 font-medium"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else :key="item.type" :index="index" />
            </template>
            
            <PaginationNext class="h-8 px-2 text-foreground font-medium border-0 hover:bg-muted/50 bg-transparent" />
          </PaginationContent>
        </Pagination>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ crud.confirmDelete }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('crud.confirmDeleteDesc', { module: labels.name }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false">{{ crud.cancel }}</AlertDialogCancel>
          <AlertDialogAction
            @click="confirmDelete"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >{{ crud.delete }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
