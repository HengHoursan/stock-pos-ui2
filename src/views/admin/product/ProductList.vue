<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
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
  Loader2
} from "lucide-vue-next";
import { ProductService } from "@/services/product/product.service";
import { CategoryService } from "@/services/category/category.service";
import { BrandService } from "@/services/brand/brand.service";
import { UnitService } from "@/services/unit/unit.service";
import type { 
  Product, 
  Category, 
  Brand, 
  Unit, 
  PaginationMeta 
} from "@/types";
import { toast } from "vue-sonner";
import { useDebounceFn } from "@vueuse/core";

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
const searchQuery = ref("");
const statusFilter = ref<string | undefined>(undefined);
const categoryIdFilter = ref<string | undefined>(undefined);
const brandIdFilter = ref<string | undefined>(undefined);
const unitIdFilter = ref<string | undefined>(undefined);

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

    if (searchQuery.value.trim()) {
      payload.search = searchQuery.value.trim();
    }

    // Build the filter object
    const filters: Record<string, string> = {};
    if (statusFilter.value && statusFilter.value !== "all") {
      filters.status = statusFilter.value;
    }
    if (categoryIdFilter.value && categoryIdFilter.value !== "all") {
      filters.categoryId = categoryIdFilter.value;
    }
    if (brandIdFilter.value && brandIdFilter.value !== "all") {
      filters.brandId = brandIdFilter.value;
    }
    if (unitIdFilter.value && unitIdFilter.value !== "all") {
      filters.unitId = unitIdFilter.value;
    }

    if (Object.keys(filters).length > 0) {
      payload.filter = filters;
    }

    const response = await productService.getList(payload);
    if (response.success && response.data) {
      products.value = response.data.data;
      Object.assign(pagination, response.data.meta);
    }
  } catch (error) {
    console.error("Fetch products error:", error);
    toast.error(t('crud.errorFetch', { module: t('modules.products') }));
  } finally {
    loading.value = false;
  }
}

const debouncedFetch = useDebounceFn(() => {
  pagination.page = 1;
  fetchProducts();
}, 500);

watch(searchQuery, () => {
  debouncedFetch();
});

watch([statusFilter, categoryIdFilter, brandIdFilter, unitIdFilter], () => {
  pagination.page = 1;
  fetchProducts();
});

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
      toast.success(t('crud.successUpdate', { module: t('modules.product') }));
    }
  } catch (error) {
    toast.error(t('crud.errorUpdate', { module: t('modules.product') }));
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
      toast.success(t('crud.successDelete', { module: t('modules.product') }));
      fetchProducts();
    } else {
      toast.error(response.message || t('crud.errorDelete', { module: t('modules.product') }));
    }
  } catch (error) {
    toast.error(t('crud.errorDelete', { module: t('modules.product') }));
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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

async function fetchFilterOptions() {
  try {
    const [catRes, brandRes, unitRes] = await Promise.all([
      categoryService.getAll(),
      brandService.getAll(),
      unitService.getAll()
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
      <h2 class="text-3xl font-bold tracking-tight text-foreground">{{ $t('modules.products') }}</h2>
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
          <Plus class="mr-2 h-4 w-4" />{{ $t('crud.createBtn') }} {{ $t('modules.product') }}</Button>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row items-center gap-4">
      <div class="relative flex-1 w-full max-w-sm">
        <Search
          class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
        />
        <Input
          type="search"
          :placeholder="$t('crud.search', { module: $t('modules.product') })"
          class="pl-8"
          v-model="searchQuery"
        />
      </div>

      <Select v-model="statusFilter">
        <SelectTrigger class="w-full sm:w-[180px]">
          <SelectValue :placeholder="$t('crud.filterByStatus')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ $t('crud.allStatus') }}</SelectItem>
          <SelectItem value="active">{{ $t('crud.active') }}</SelectItem>
          <SelectItem value="inactive">{{ $t('crud.inactive') }}</SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="categoryIdFilter">
        <SelectTrigger class="w-full sm:w-[180px]">
          <SelectValue :placeholder="$t('crud.filterByCategory')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ $t('modules.categories') }}</SelectItem>
          <SelectItem v-for="cat in categories" :key="cat.id" :value="cat.id.toString()">
            {{ cat.name }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="brandIdFilter">
        <SelectTrigger class="w-full sm:w-[180px]">
          <SelectValue :placeholder="$t('crud.filterByBrand')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ $t('modules.brands') }}</SelectItem>
          <SelectItem v-for="brand in brands" :key="brand.id" :value="brand.id.toString()">
            {{ brand.name }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="unitIdFilter">
        <SelectTrigger class="w-full sm:w-[180px]">
          <SelectValue :placeholder="$t('crud.filterByUnit')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ $t('modules.units') }}</SelectItem>
          <SelectItem v-for="unit in units" :key="unit.id" :value="unit.id.toString()">
            {{ unit.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="rounded-md border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[20px]">#</TableHead>
            <TableHead class="w-[120px]">{{ $t('fields.code') }}</TableHead>
            <TableHead class="w-[80px]">{{ $t('fields.photo') }}</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                @click="handleSort('name')"
                class="-ml-4 h-8 font-medium"
              >{{ $t('fields.name') }}<ArrowUpDown class="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>{{ $t('modules.category') }}</TableHead>
            <TableHead>{{ $t('modules.brand') }}</TableHead>
            <TableHead>{{ $t('modules.unit') }}</TableHead>
            <TableHead class="text-right">{{ $t('fields.salePrice') }}</TableHead>
            <TableHead class="text-center">{{ $t('fields.currentStock') }}</TableHead>
            <TableHead>{{ $t('fields.status') }}</TableHead>
            <TableHead class="text-right">{{ $t('crud.actions') }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading && products.length === 0">
            <TableCell colspan="11" class="h-24 text-center">
              <div
                class="flex items-center justify-center text-muted-foreground italic text-sm"
              >
                <Loader2 class="h-4 w-4 animate-spin mr-2" />
                <span>{{ $t('crud.fetchingData') }}</span>
              </div>
            </TableCell>
          </TableRow>
          <template v-else-if="products.length > 0">
            <TableRow
              v-for="(product, index) in products"
              :key="product.id"
            >
              <TableCell class="font-medium text-muted-foreground">
                {{ (pagination.page - 1) * pagination.limit + index + 1 }}
              </TableCell>
              <TableCell>
                <code
                  class="bg-muted px-2 py-0.5 rounded text-xs font-mono font-bold text-foreground/70 border border-muted-foreground/10 uppercase"
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
                   <span class="text-sm font-medium">{{ product.category.name }}</span>
                </div>
                <span v-else class="text-sm text-muted-foreground">-</span>
              </TableCell>
              <TableCell>
                <div v-if="product.brand">
                   <span class="text-sm font-medium">{{ product.brand.name }}</span>
                </div>
                <span v-else class="text-sm text-muted-foreground">-</span>
              </TableCell>
              <TableCell>
                <div v-if="product.unit">
                   <span class="text-sm font-medium">{{ product.unit.name }}</span>
                </div>
                <span v-else class="text-sm text-muted-foreground">-</span>
              </TableCell>
              <TableCell class="text-right font-mono text-base font-bold text-primary">
                {{ formatCurrency(product.detail?.salePrice || 0) }}
              </TableCell>
              <TableCell class="text-center">
                <Badge 
                  variant="secondary" 
                  class="font-mono"
                  :class="{ 'text-destructive': (product.detail?.currentStock || 0) <= product.alertQuantity }"
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
                  {{ product.status ? $t('crud.active') : $t('crud.inactive') }}
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
                      >{{ $t('crud.actions') }}</DropdownMenuLabel
                    >
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      @click="router.push(`/admin/products/${product.id}`)"
                      class="cursor-pointer"
                    >
                      <Eye class="mr-2 h-4 w-4 opacity-70" /> {{ $t('crud.viewBtn') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="
                        router.push(`/admin/products/${product.id}/edit`)
                      "
                      class="cursor-pointer"
                    >
                      <Pencil class="mr-2 h-4 w-4 opacity-70" />{{ $t('crud.editBtn') }}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      class="text-destructive focus:text-destructive cursor-pointer font-medium"
                      @click="openDeleteDialog(product.id)"
                    >
                      <Trash2 class="mr-2 h-4 w-4" />{{ $t('crud.delete') }}</DropdownMenuItem>
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
                <p class="font-medium">{{ $t('crud.noRecords', { module: $t('modules.products') }) }}</p>
                <Button
                  v-if="searchQuery || (statusFilter && statusFilter !== 'all') || (categoryIdFilter && categoryIdFilter !== 'all') || (brandIdFilter && brandIdFilter !== 'all') || (unitIdFilter && unitIdFilter !== 'all')"
                  variant="outline"
                  size="sm"
                  @click="
                    searchQuery = '';
                    statusFilter = undefined;
                    categoryIdFilter = undefined;
                    brandIdFilter = undefined;
                    unitIdFilter = undefined;
                  "
                  class="h-8"
                >
                  {{ $t('crud.resetFilters') }}
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
            >{{ $t('crud.rowsPerPage') }}</span
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
          <AlertDialogTitle>{{ $t('crud.confirmDelete') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ $t('crud.confirmDeleteDesc', { module: $t('modules.product') }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false"
            >{{ $t('crud.cancel') }}</AlertDialogCancel
          >
          <AlertDialogAction
            @click="confirmDelete"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >{{ $t('crud.delete') }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
