import type { Directive } from "vue";
import { useAuthStore } from "@/stores/auth";

/**
 * v-permission directive
 * Hides elements if the user doesn't have the required permission
 */
export const permission: Directive = {
  mounted(el, binding) {
    const { value } = binding;
    const authStore = useAuthStore();

    // If no value provided, do nothing
    if (!value) return;

    const userPermissions = authStore.user?.permissions || [];
    const roleName = authStore.user?.role?.name?.toLowerCase() || "";
    const isSuperAdmin = roleName.includes("admin") || roleName === "super admin";

    // Skip check if Super Admin
    if (isSuperAdmin) return;

    let hasPermission = false;
    if (Array.isArray(value)) {
      hasPermission = value.some((p) => userPermissions.includes(p));
    } else {
      hasPermission = userPermissions.includes(value);
    }

    if (!hasPermission) {
      // Remove element from DOM
      el.parentNode && el.parentNode.removeChild(el);
    }
  },
};
