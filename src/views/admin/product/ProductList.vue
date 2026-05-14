<script setup lang="ts">
import { useAppI18n } from "@/hooks/useAppI18n";
const { t, labels, fields, crud } = useAppI18n("product");
import { ref, onMounted, reactive, watch, computed } from "vue";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  Package,
  RefreshCw,
  Loader2,
  Copy,
} from "lucide-vue-next";
import { ProductService } from "@/services/product/product.service";
import { CategoryService } from "@/services/category/category.service";
import { BrandService } from "@/services/brand/brand.service";
import { UnitService } from "@/services/unit/unit.service";
import type { Product, Category, Brand, Unit, PaginationMeta } from "@/types";
import { toast } from "vue-sonner";
import { useDebounceFn } from "@vueuse/core";
import SearchableSelect from "@/components/SearchableSelect.vue";
import ClearableSelect from "@/components/ClearableSelect.vue";

const router = useRouter();
const productService = new ProductService();
const categoryService = new CategoryService();
const brandService = new BrandService();
const unitService = new UnitService();

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const brands = ref<Brand[]>([]);
const units = ref<Unit[]>([]);

const loading = ref(true);
const filters = reactive({
  search: "",
  status: "",
  categoryId: "",
  brandId: "",
  unitId: "",
});

const categoryOptions = computed(() =>
  categories.value.map((c) => ({ label: c.name, value: c.id })),
);
const brandOptions = computed(() =>
  brands.value.map((b) => ({ label: b.name, value: b.id })),
);
const unitOptions = computed(() =>
  units.value.map((u) => ({ label: u.name, value: u.id })),
);

const statusOptions = computed(() => [
  { label: crud.active, value: "active" },
  { label: crud.inactive, value: "inactive" },
]);

const pagination = reactive<PaginationMeta>({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0,
  sortBy: "createdAt",
  sortOrder: "DESC",
});

const isDeleteDialogOpen = ref(false);
const productToDelete = ref<number | null>(null);

const selectedIds = ref<number[]>([]);
const isSelectAll = computed({
  get: () => products.value.length > 0 && selectedIds.value.length === products.value.length,
  set: (val: boolean) => {
    if (val) {
      selectedIds.value = products.value.map((p) => p.id);
    } else {
      selectedIds.value = [];
    }
  },
});

// function toggleSelection(id: number) {
//   const index = selectedIds.value.indexOf(id);
//   if (index > -1) {
//     selectedIds.value.splice(index, 1);
//   } else {
//     selectedIds.value.push(id);
//   }
// }

async function handleBulkAction(action: "delete" | "activate" | "deactivate") {
  if (selectedIds.value.length === 0) return;

  const moduleTitle = labels.title;
  
  try {
    if (action === "delete") {
      if (!confirm(t("crud.confirmBulkDelete", { count: selectedIds.value.length, module: moduleTitle }))) return;
      const res = await productService.bulkSoftDelete(selectedIds.value);
      if (res.success) {
        toast.success(t("crud.successBulkDelete", { module: moduleTitle }));
        selectedIds.value = [];
        fetchProducts();
      }
    } else {
      const status = action === "activate";
      const res = await productService.bulkUpdateStatus(selectedIds.value, status);
      if (res.success) {
        toast.success(t("crud.successBulkUpdate", { module: moduleTitle }));
        selectedIds.value = [];
        fetchProducts();
      }
    }
  } catch (error) {
    toast.error(t("crud.errorBulkAction"));
  }
}

async function duplicateProduct(id: number) {
  try {
    const res = await productService.duplicate(id);
    if (res.success) {
      toast.success(t("crud.successDuplicate", { module: labels.name }));
      fetchProducts();
    }
  } catch (error) {
    toast.error(t("crud.errorDuplicate", { module: labels.name }));
  }
}

async function fetchProducts() {
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

    // Build the filter object
    const filterObj: Record<string, any> = {};
    if (filters.status) {
      filterObj.status = filters.status;
    }
    if (filters.categoryId) {
      filterObj.categoryId = filters.categoryId;
    }
    if (filters.brandId) {
      filterObj.brandId = filters.brandId;
    }
    if (filters.unitId) {
      filterObj.unitId = filters.unitId;
    }

    if (Object.keys(filterObj).length > 0) {
      payload.filter = filterObj;
    }

    const response = await productService.getList(payload);
    if (response.success && response.data) {
      products.value = response.data.data;
      Object.assign(pagination, response.data.meta);
    }
  } catch (error) {
    console.error("Fetch products error:", error);
    toast.error(t("crud.errorFetch", { module: labels.title }));
  } finally {
    loading.value = false;
  }
}

const debouncedFetch = useDebounceFn(() => {
  pagination.page = 1;
  fetchProducts();
}, 500);

watch(
  () => filters.search,
  () => {
    debouncedFetch();
  },
);

watch(
  [
    () => filters.status,
    () => filters.categoryId,
    () => filters.brandId,
    () => filters.unitId,
  ],
  () => {
    pagination.page = 1;
    fetchProducts();
  },
);

watch(
  () => pagination.limit,
  () => {
    pagination.page = 1;
    fetchProducts();
  },
);

function handlePageChange(page: number) {
  pagination.page = page;
  fetchProducts();
}

async function toggleStatus(product: Product) {
  try {
    const newStatus = !product.status;
    const response = await productService.updateStatus({
      id: product.id,
      status: newStatus,
    });
    if (response.success) {
      product.status = newStatus;
      toast.success(t("crud.successUpdate", { module: labels.name }));
    }
  } catch (error) {
    toast.error(t("crud.errorUpdate", { module: labels.name }));
  }
}

function openDeleteDialog(id: number) {
  productToDelete.value = id;
  isDeleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!productToDelete.value) return;

  try {
    const response = await productService.softDelete(productToDelete.value);
    if (response.success) {
      toast.success(t("crud.successDelete", { module: labels.name }));
      fetchProducts();
    } else {
      toast.error(
        response.message ||
          t("crud.errorDelete", { module: labels.name }),
      );
    }
  } catch (error) {
    toast.error(t("crud.errorDelete", { module: labels.name }));
  } finally {
    isDeleteDialogOpen.value = false;
    productToDelete.value = null;
  }
}

function handleSort(column: string) {
  if (pagination.sortBy === column) {
    pagination.sortOrder = pagination.sortOrder === "ASC" ? "DESC" : "ASC";
  } else {
    pagination.sortBy = column;
    pagination.sortOrder = "ASC";
  }
  fetchProducts();
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

async function fetchFilterOptions() {
  try {
    const [catRes, brandRes, unitRes] = await Promise.all([
      categoryService.getAll(),
      brandService.getAll(),
      unitService.getAll(),
    ]);
    if (catRes.success) categories.value = catRes.data || [];
    if (brandRes.success) brands.value = brandRes.data || [];
    if (unitRes.success) units.value = unitRes.data || [];
  } catch (error) {
    console.error("Fetch filter options error:", error);
  }
}

onMounted(() => {
  fetchProducts();
  fetchFilterOptions();
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
          @click="fetchProducts"
          :disabled="loading"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
        <Button @click="router.push('/admin/products/create')">
          <Plus class="mr-2 h-4 w-4" />{{ crud.createBtn }}
          {{ labels.name }}</Button
        >
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
          :placeholder="t('crud.search', { module: labels.name })"
          class="pl-8"
          v-model="filters.search"
        />
      </div>

      <ClearableSelect
        v-model="filters.status"
        :options="statusOptions"
        :placeholder="crud.filterByStatus"
        class="w-full sm:w-[220px]"
      />

      <SearchableSelect
        v-model="filters.categoryId"
        :options="categoryOptions"
        :placeholder="crud.filterByCategory"
        :empty-message="crud.noResults"
        class="w-full sm:w-[250px]"
      />

      <SearchableSelect
        v-model="filters.unitId"
        :options="unitOptions"
        :placeholder="crud.filterByUnit"
        :empty-message="crud.noResults"
        class="w-full sm:w-[250px]"
      />
      
      <SearchableSelect
        v-model="filters.brandId"
        :options="brandOptions"
        :placeholder="crud.filterByBrand"
        :empty-message="crud.noResults"
        class="w-full sm:w-[250px]"
      />

      <Button
        v-if="
          filters.search ||
          filters.status ||
          filters.categoryId ||
          filters.brandId ||
          filters.unitId
        "
        variant="ghost"
        size="sm"
        @click="
          Object.assign(filters, {
            search: '',
            status: '',
            categoryId: '',
            brandId: '',
            unitId: '',
          })
        "
        class="h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <RefreshCw class="mr-2 h-4 w-4" />
        {{ crud.resetFilters }}
      </Button>
    </div>

    <div
      class="rounded-md border bg-card overflow-auto shadow-sm max-h-[700px] scrollbar-thin scrollbar-thumb-muted-foreground/20"
    >
      <Table class="min-w-[1200px]">
        <TableHeader>
          <TableRow>
            <TableHead class="w-[40px]">
              <input 
                type="checkbox" 
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                v-model="isSelectAll"
              />
            </TableHead>
            <TableHead class="w-[120px]">{{ fields.code }}</TableHead>
            <TableHead class="w-[80px]">{{ fields.photo }}</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                @click="handleSort('name')"
                class="-ml-4 h-8 font-medium"
                >{{ fields.name }}<ArrowUpDown class="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>{{ fields.category }}</TableHead>
            <TableHead>{{ fields.brand }}</TableHead>
            <TableHead>{{ fields.unit }}</TableHead>
            <TableHead class="text-right">{{ fields.salePrice }}</TableHead>
            <TableHead class="text-center">{{ fields.currentStock }}</TableHead>
            <TableHead>{{ fields.status }}</TableHead>
            <TableHead class="text-right">{{ crud.actions }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading && products.length === 0">
            <TableCell colspan="11" class="h-24 text-center">
              <div
                class="flex items-center justify-center text-muted-foreground italic text-sm"
              >
                <Loader2 class="h-4 w-4 animate-spin mr-2" />
                <span>{{ crud.fetchingData }}</span>
              </div>
            </TableCell>
          </TableRow>
          <template v-else-if="products.length > 0">
            <TableRow v-for="(product) in products" :key="product.id" :class="{ 'bg-muted/30': selectedIds.includes(product.id) }">
              <TableCell>
                <input 
                  type="checkbox" 
                  class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  :value="product.id"
                  v-model="selectedIds"
                />
              </TableCell>
              <TableCell>
                <code
                  class="bg-muted px-2 py-0.5 rounded text-xs font-bold text-foreground/70 border border-muted-foreground/10 uppercase"
                  >{{ product.code }}</code
                >
              </TableCell>
              <TableCell>
                <Avatar
                  class="h-9 w-9 rounded-lg border bg-muted transition-transform hover:scale-105"
                >
                  <AvatarImage
                    v-if="product.photoPath"
                    :src="product.photoPath"
                    :alt="product.name"
                  />
                  <AvatarFallback class="rounded-lg">
                    <Package class="h-4 w-4 text-muted-foreground/40" />
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell class="font-bold text-base text-foreground/90">{{
                product.name
              }}</TableCell>
              <TableCell>
                <div v-if="product.category">
                  <span class="text-sm font-medium">{{
                    product.category.name
                  }}</span>
                </div>
                <span v-else class="text-sm text-muted-foreground">-</span>
              </TableCell>
              <TableCell>
                <div v-if="product.brand">
                  <span class="text-sm font-medium">{{
                    product.brand.name
                  }}</span>
                </div>
                <span v-else class="text-sm text-muted-foreground">-</span>
              </TableCell>
              <TableCell>
                <div v-if="product.unit">
                  <span class="text-sm font-medium">{{
                    product.unit.name
                  }}</span>
                </div>
                <span v-else class="text-sm text-muted-foreground">-</span>
              </TableCell>
              <TableCell class="text-right text-base font-bold text-primary">
                {{ formatCurrency(product.detail?.salePrice || 0) }}
              </TableCell>
              <TableCell class="text-center">
                <Badge
                  variant="secondary"
                  class=""
                  :class="{
                    'text-destructive':
                      (product.detail?.currentStock || 0) <=
                      product.alertQuantity,
                  }"
                >
                  {{ Math.trunc(product.detail?.currentStock || 0) }}
                </Badge>
              </TableCell>
              <TableCell class="w-[100px]">
                <Badge
                  :variant="product.status ? 'success' : 'warning'"
                  class="cursor-pointer font-bold px-3 transition-all hover:opacity-80 active:scale-95"
                  @click="toggleStatus(product)"
                >
                  {{ product.status ? crud.active : crud.inactive }}
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
                    <DropdownMenuLabel>{{ crud.actions }}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      @click="router.push(`/admin/products/${product.id}`)"
                      class="cursor-pointer"
                    >
                      <Eye class="mr-2 h-4 w-4 opacity-70" />
                      {{ crud.viewBtn }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="router.push(`/admin/products/${product.id}/edit`)"
                      class="cursor-pointer"
                    >
                      <Pencil class="mr-2 h-4 w-4 opacity-70" />{{
                        crud.editBtn
                      }}</DropdownMenuItem
                    >
                    <DropdownMenuItem
                      @click="duplicateProduct(product.id)"
                      class="cursor-pointer"
                    >
                      <Copy class="mr-2 h-4 w-4 opacity-70" />{{
                        crud.duplicate
                      }}</DropdownMenuItem
                    >
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      class="text-destructive focus:text-destructive cursor-pointer font-medium"
                      @click="openDeleteDialog(product.id)"
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
              colspan="11"
              class="h-32 text-center text-muted-foreground"
            >
              <div class="flex flex-col items-center justify-center gap-3">
                <Package class="h-10 w-10 opacity-10" />
                <p class="font-medium">
                  {{ t("crud.noRecords", { module: labels.title }) }}
                </p>
                <Button
                  v-if="
                    filters.search ||
                    filters.status ||
                    filters.categoryId ||
                    filters.brandId ||
                    filters.unitId
                  "
                  variant="outline"
                  size="sm"
                  @click="
                    Object.assign(filters, {
                      search: '',
                      status: '',
                      categoryId: '',
                      brandId: '',
                      unitId: '',
                    })
                  "
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
          <span
            class="text-sm font-medium text-muted-foreground whitespace-nowrap"
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
            <PaginationPrevious
              class="h-8 px-2 text-foreground font-medium border-0 hover:bg-muted/50 bg-transparent"
            />

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

            <PaginationNext
              class="h-8 px-2 text-foreground font-medium border-0 hover:bg-muted/50 bg-transparent"
            />
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
            {{ t("crud.confirmDeleteDesc", { module: labels.name }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false">{{
            crud.cancel
          }}</AlertDialogCancel>
          <AlertDialogAction
            @click="confirmDelete"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >{{ crud.delete }}</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
