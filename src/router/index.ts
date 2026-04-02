import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  // Auth Routes (Standalone, no sidebar)
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/admin/auth/Login.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/admin/auth/Register.vue'),
    meta: { requiresGuest: true },
  },

  // Redirect root to dashboard
  {
    path: '/',
    redirect: '/dashboard',
  },

  // Admin Routes (with AdminLayout sidebar)
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      // Dashboard
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/admin/dashboard/DashboardIndex.vue'),
      },

      // Category CRUD
      {
        path: 'admin/categories',
        name: 'Categories',
        component: () => import('../views/admin/category/CategoryList.vue'),
      },
      {
        path: 'admin/categories/create',
        name: 'CategoryCreate',
        component: () => import('../views/admin/category/CategoryCreate.vue'),
      },
      {
        path: 'admin/categories/:id',
        name: 'CategoryDetail',
        component: () => import('../views/admin/category/CategoryDetail.vue'),
      },
      {
        path: 'admin/categories/:id/edit',
        name: 'CategoryEdit',
        component: () => import('../views/admin/category/CategoryEdit.vue'),
      },

      // Brand CRUD
      {
        path: 'admin/brands',
        name: 'Brands',
        component: () => import('../views/admin/brand/BrandList.vue'),
      },
      {
        path: 'admin/brands/create',
        name: 'BrandCreate',
        component: () => import('../views/admin/brand/BrandCreate.vue'),
      },
      {
        path: 'admin/brands/:id',
        name: 'BrandDetail',
        component: () => import('../views/admin/brand/BrandDetail.vue'),
      },
      {
        path: 'admin/brands/:id/edit',
        name: 'BrandEdit',
        component: () => import('../views/admin/brand/BrandEdit.vue'),
      },

      // Unit CRUD
      {
        path: 'admin/units',
        name: 'Units',
        component: () => import('../views/admin/unit/UnitList.vue'),
      },
      {
        path: 'admin/units/create',
        name: 'UnitCreate',
        component: () => import('../views/admin/unit/UnitCreate.vue'),
      },
      {
        path: 'admin/units/:id',
        name: 'UnitDetail',
        component: () => import('../views/admin/unit/UnitDetail.vue'),
      },
      {
        path: 'admin/units/:id/edit',
        name: 'UnitEdit',
        component: () => import('../views/admin/unit/UnitEdit.vue'),
      },

      // Currency CRUD
      {
        path: 'admin/currencies',
        name: 'Currencies',
        component: () => import('../views/admin/currency/CurrencyList.vue'),
      },
      {
        path: 'admin/currencies/create',
        name: 'CurrencyCreate',
        component: () => import('../views/admin/currency/CurrencyCreate.vue'),
      },
      {
        path: 'admin/currencies/:id',
        name: 'CurrencyDetail',
        component: () => import('../views/admin/currency/CurrencyDetail.vue'),
      },
      {
        path: 'admin/currencies/:id/edit',
        name: 'CurrencyEdit',
        component: () => import('../views/admin/currency/CurrencyEdit.vue'),
      },

      // Discount CRUD
      // Product CRUD
      {
        path: 'admin/products',
        name: 'Products',
        component: () => import('../views/admin/product/ProductList.vue'),
      },
      {
        path: 'admin/products/create',
        name: 'ProductCreate',
        component: () => import('../views/admin/product/ProductCreate.vue'),
      },
      {
        path: 'admin/products/:id',
        name: 'ProductDetail',
        component: () => import('../views/admin/product/ProductDetail.vue'),
      },
      {
        path: 'admin/products/:id/edit',
        name: 'ProductEdit',
        component: () => import('../views/admin/product/ProductEdit.vue'),
      },
    ],
  },

  // Catch-all fallback
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guard
router.beforeEach((to) => {
  // Pinia store must be used inside a function (after createPinia())
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  // Route requires auth but user is not logged in → redirect to login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'Login' }
  }

  // Route is for guests only but user is already logged in → redirect to dashboard
  if (to.meta.requiresGuest && isAuthenticated) {
    return { name: 'Dashboard' }
  }
})

export default router
