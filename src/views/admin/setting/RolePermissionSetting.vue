<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { useAppI18n } from "@/hooks/useAppI18n";
const { layout, menu, crud, t } = useAppI18n();
import { roleService } from "@/services/role/role.service";
import { permissionService } from "@/services/permission/permission.service";
import type { Role, Permission, RolePermission } from "@/types";
import {
  ShieldAlert,
  CheckCircle2,
  Shield,
  Loader2,
  Search,
} from "lucide-vue-next";
import { toast } from "vue-sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import SearchableSelect from "@/components/SearchableSelect.vue";

const roles = ref<Role[]>([]);
const permissions = ref<Permission[]>([]);
const rolePermissions = ref<RolePermission[]>([]);
const selectedRoleId = ref<number | null>(null);

const isLoadingRoles = ref(false);
const isLoadingPermissions = ref(false);
const isSyncing = ref<Record<number, boolean>>({});
const filters = reactive({
  search: "",
  module: "",
});

const activeRolePermissions = computed(() => {
  return new Set(rolePermissions.value.map((rp) => rp.permissionId));
});

const availableModules = computed(() => {
  const modules = new Set<string>();
  permissions.value.forEach((p) => {
    modules.add(p.group || "Other");
  });
  return Array.from(modules).sort();
});

const moduleOptions = computed(() => {
  return availableModules.value.map((mod) => ({
    label: mod,
    value: mod,
  }));
});

const filteredPermissions = computed(() => {
  return permissions.value.filter((p) => {
    const searchMatch =
      !filters.search ||
      p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (p.displayName &&
        p.displayName.toLowerCase().includes(filters.search.toLowerCase()));

    // Filter by module
    const groupName = p.group || "Other";
    const moduleMatch = !filters.module || groupName === filters.module;

    return searchMatch && moduleMatch;
  });
});

// Group permissions by their 'group' field
const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {};
  filteredPermissions.value.forEach((p) => {
    const groupName = p.group || "Other";
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(p);
  });
  return groups;
});

async function fetchRoles() {
  try {
    isLoadingRoles.value = true;
    const res = await roleService.getAll();
    if (res.success && res.data) {
      roles.value = res.data;
      if (roles.value.length > 0 && !selectedRoleId.value) {
        selectRole(roles.value[0].id);
      }
    }
    console.log("Roles:", roles.value);
  } catch (error) {
    toast.error("Failed to load roles");
  } finally {
    isLoadingRoles.value = false;
  }
}

async function fetchPermissions() {
  try {
    isLoadingPermissions.value = true;
    const res = await permissionService.getAll();
    if (res.success && res.data) {
      permissions.value = res.data;
    }
  } catch (error) {
    toast.error("Failed to load permissions");
  } finally {
    isLoadingPermissions.value = false;
  }
}

async function fetchRolePermissions(roleId: number) {
  try {
    const res = await roleService.getRolePermissions(roleId);
    console.log("Raw role permissions response:", res);
    if (res.success && res.data) {
      rolePermissions.value = res.data;
      console.log("Mapped role permissions:", rolePermissions.value);
    }
  } catch (error) {
    toast.error("Failed to load role permissions");
  }
}

async function selectRole(roleId: number) {
  selectedRoleId.value = roleId;
  rolePermissions.value = []; // Reset while loading
  await fetchRolePermissions(roleId);
}

async function togglePermission(permissionId: number, checked: boolean) {
  if (!selectedRoleId.value) return;
  const roleId = selectedRoleId.value;

  isSyncing.value[permissionId] = true;
  try {
    if (checked) {
      const res = await roleService.assignPermission(roleId, permissionId);
      if (res.success) {
        // Optimistically add to state
        rolePermissions.value.push({
          roleId,
          permissionId,
          permission: permissions.value.find(
            (p) => p.id === permissionId,
          ) as Permission,
        });
        toast.success(`Permission assigned successfully`);
      } else {
        throw new Error(res.message);
      }
    } else {
      const res = await roleService.revokePermission(roleId, permissionId);
      if (res.success) {
        // Optimistically remove from state
        rolePermissions.value = rolePermissions.value.filter(
          (rp) => rp.permissionId !== permissionId,
        );
        toast.success(`Permission revoked successfully`);
      } else {
        throw new Error(res.message);
      }
    }
  } catch (error: any) {
    toast.error(error.message || "Failed to update permission");
  } finally {
    isSyncing.value[permissionId] = false;
  }
}

onMounted(() => {
  fetchPermissions();
  fetchRoles();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-medium">{{ layout.rolePermissions }}</h3>
        <p class="text-sm text-muted-foreground">
          {{ layout.rolePermissionsDesc }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <!-- Roles Sidebar -->
      <div class="col-span-1 border rounded-lg overflow-hidden bg-card">
        <div class="bg-muted px-4 py-3 border-b">
          <h4 class="font-semibold text-sm flex items-center">
            <Shield class="h-4 w-4 mr-2 text-primary" />
            {{ menu.roles }}
          </h4>
        </div>
        <div v-if="isLoadingRoles" class="flex justify-center p-8">
          <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
        <div
          v-else
          class="h-[500px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/20"
        >
          <div class="p-2 space-y-1">
            <button
              v-for="role in roles"
              :key="role.id"
              @click="selectRole(role.id)"
              class="w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group"
              :class="
                selectedRoleId === role.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              "
            >
              <div class="flex items-center gap-2">
                <span>{{ role.displayName || role.name }}</span>
              </div>
              <CheckCircle2
                v-if="selectedRoleId === role.id"
                class="h-4 w-4 text-primary"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Permissions Grid -->
      <div class="col-span-1 md:col-span-3 border rounded-lg bg-card">
        <div
          class="bg-muted px-4 py-3 border-b flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <div class="flex items-center gap-4 w-full sm:w-auto">
            <h4 class="font-semibold text-sm flex items-center shrink-0">
              <ShieldAlert class="h-4 w-4 mr-2 text-primary" />
              {{ layout.assignedPermissions }}
            </h4>
            <span
              class="text-xs text-muted-foreground font-medium shrink-0"
              v-if="selectedRoleId"
            >
              {{ activeRolePermissions.size }} / {{ permissions.length }}
              {{ layout.activePermissions }}
            </span>
          </div>

          <div
            class="flex flex-wrap items-center gap-2 w-full sm:w-auto"
            v-if="selectedRoleId"
          >
            <div class="relative w-full sm:w-64 shrink-0">
              <Search
                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
              />
              <Input
                v-model="filters.search"
                :placeholder="
                  t('crud.search', { module: layout.rolePermissions })
                "
                class="pl-8 h-9"
              />
            </div>

            <SearchableSelect
              v-model="filters.module"
              :options="moduleOptions"
              :placeholder="crud.filterByModule"
              :show-all-option="false"
              class="w-[220px] shrink-0"
            />
          </div>
        </div>

        <div
          v-if="!selectedRoleId"
          class="flex flex-col items-center justify-center h-[500px] text-muted-foreground"
        >
          <Shield class="h-12 w-12 opacity-20 mb-4" />
          <p>{{ layout.selectRolePrompt }}</p>
        </div>
        <div
          v-else-if="isLoadingPermissions"
          class="flex justify-center items-center h-[500px]"
        >
          <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <div
          v-else
          class="h-[500px] p-6 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/20"
        >
          <div class="space-y-8">
            <div
              v-for="(groupPerms, groupName) in groupedPermissions"
              :key="groupName"
            >
              <h5
                class="text-sm font-bold text-foreground mb-4 uppercase tracking-wider bg-muted/50 py-1.5 px-3 rounded inline-block"
              >
                {{ groupName }}
              </h5>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="permission in groupPerms"
                  :key="permission.id"
                  class="flex items-center justify-between p-3 border rounded-lg bg-card hover:border-primary/50 transition-colors"
                  :class="{
                    'border-primary/50 bg-primary/5': activeRolePermissions.has(
                      permission.id,
                    ),
                  }"
                >
                  <div class="flex flex-col gap-0.5">
                    <span class="text-sm font-medium">
                      {{ permission.displayName || permission.name }}
                    </span>
                    <span class="text-xs text-muted-foreground font-mono">
                      {{ permission.name }}
                    </span>
                  </div>
                  <div class="relative flex items-center">
                    <Loader2
                      v-if="isSyncing[permission.id]"
                      class="h-4 w-4 animate-spin absolute -left-6 text-primary"
                    />
                    <Switch
                      :model-value="activeRolePermissions.has(permission.id)"
                      :disabled="isSyncing[permission.id]"
                      @update:model-value="
                        (val) => togglePermission(permission.id, val)
                      "
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
