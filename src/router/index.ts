import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import AdminLayout from "../layouts/AdminLayout.vue";
import { useAuthStore } from "../stores/auth";

const routes: RouteRecordRaw[] = [
  // Auth Routes (Standalone, no sidebar)
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/admin/auth/Login.vue"),
    meta: { requiresGuest: true },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("../views/admin/auth/Register.vue"),
    meta: { requiresGuest: true },
  },

  // Redirect root to dashboard
  {
    path: "/",
    redirect: "/dashboard",
  },

  // Admin Routes (with AdminLayout sidebar)
  {
    path: "/",
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      // Dashboard
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("../views/admin/dashboard/DashboardIndex.vue"),
        meta: { title: "menu.dashboard" },
      },

      // Category CRUD
      {
        path: "admin/categories",
        name: "Categories",
        component: () => import("../views/admin/category/CategoryList.vue"),
        meta: { title: "menu.allCategories" },
      },
      {
        path: "admin/categories/create",
        name: "CategoryCreate",
        component: () => import("../views/admin/category/CategoryCreate.vue"),
        meta: { title: "menu.addCategory" },
      },
      {
        path: "admin/categories/:id",
        name: "CategoryDetail",
        component: () => import("../views/admin/category/CategoryDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },
      {
        path: "admin/categories/:id/edit",
        name: "CategoryEdit",
        component: () => import("../views/admin/category/CategoryEdit.vue"),
        meta: { title: "crud.editBtn" },
      },

      // Brand CRUD
      {
        path: "admin/brands",
        name: "Brands",
        component: () => import("../views/admin/brand/BrandList.vue"),
        meta: { title: "menu.allBrands" },
      },
      {
        path: "admin/brands/create",
        name: "BrandCreate",
        component: () => import("../views/admin/brand/BrandCreate.vue"),
        meta: { title: "menu.addBrand" },
      },
      {
        path: "admin/brands/:id",
        name: "BrandDetail",
        component: () => import("../views/admin/brand/BrandDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },
      {
        path: "admin/brands/:id/edit",
        name: "BrandEdit",
        component: () => import("../views/admin/brand/BrandEdit.vue"),
        meta: { title: "crud.editBtn" },
      },

      // Unit CRUD
      {
        path: "admin/units",
        name: "Units",
        component: () => import("../views/admin/unit/UnitList.vue"),
        meta: { title: "menu.allUnits" },
      },
      {
        path: "admin/units/create",
        name: "UnitCreate",
        component: () => import("../views/admin/unit/UnitCreate.vue"),
        meta: { title: "menu.addUnit" },
      },
      {
        path: "admin/units/:id",
        name: "UnitDetail",
        component: () => import("../views/admin/unit/UnitDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },
      {
        path: "admin/units/:id/edit",
        name: "UnitEdit",
        component: () => import("../views/admin/unit/UnitEdit.vue"),
        meta: { title: "crud.editBtn" },
      },

      // Currency CRUD
      {
        path: "admin/currencies",
        name: "Currencies",
        component: () => import("../views/admin/currency/CurrencyList.vue"),
        meta: { title: "menu.allCurrencies" },
      },
      {
        path: "admin/currencies/create",
        name: "CurrencyCreate",
        component: () => import("../views/admin/currency/CurrencyCreate.vue"),
        meta: { title: "menu.addCurrency" },
      },
      {
        path: "admin/currencies/:id",
        name: "CurrencyDetail",
        component: () => import("../views/admin/currency/CurrencyDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },
      {
        path: "admin/currencies/:id/edit",
        name: "CurrencyEdit",
        component: () => import("../views/admin/currency/CurrencyEdit.vue"),
        meta: { title: "crud.editBtn" },
      },

      // Discount CRUD
      // Product CRUD
      {
        path: "admin/products",
        name: "Products",
        component: () => import("../views/admin/product/ProductList.vue"),
        meta: { title: "menu.allProducts" },
      },
      {
        path: "admin/products/create",
        name: "ProductCreate",
        component: () => import("../views/admin/product/ProductCreate.vue"),
        meta: { title: "menu.addProduct" },
      },
      {
        path: "admin/products/:id",
        name: "ProductDetail",
        component: () => import("../views/admin/product/ProductDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },
      {
        path: "admin/products/:id/edit",
        name: "ProductEdit",
        component: () => import("../views/admin/product/ProductEdit.vue"),
        meta: { title: "crud.editBtn" },
      },

      // Supplier CRUD
      {
        path: "admin/suppliers",
        name: "Suppliers",
        component: () => import("../views/admin/supplier/SupplierList.vue"),
        meta: { title: "menu.allSuppliers" },
      },
      {
        path: "admin/suppliers/create",
        name: "SupplierCreate",
        component: () => import("../views/admin/supplier/SupplierCreate.vue"),
        meta: { title: "menu.addSupplier" },
      },
      {
        path: "admin/suppliers/:id",
        name: "SupplierDetail",
        component: () => import("../views/admin/supplier/SupplierDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },
      {
        path: "admin/suppliers/:id/edit",
        name: "SupplierEdit",
        component: () => import("../views/admin/supplier/SupplierEdit.vue"),
        meta: { title: "crud.editBtn" },
      },

      // Customer CRUD
      {
        path: "admin/customers",
        name: "Customers",
        component: () => import("../views/admin/customer/CustomerList.vue"),
        meta: { title: "menu.allCustomers" },
      },
      /* {
        path: 'admin/customers/create',
        name: 'CustomerCreate',
        component: () => import('../views/admin/customer/CustomerCreate.vue'),
        meta: { title: 'menu.addCustomer' },
      }, */
      {
        path: "admin/customers/:id",
        name: "CustomerDetail",
        component: () => import("../views/admin/customer/CustomerDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },
      /* {
        path: 'admin/customers/:id/edit',
        name: 'CustomerEdit',
        component: () => import('../views/admin/customer/CustomerEdit.vue'),
        meta: { title: 'crud.editBtn' },
      }, */

      // Transaction CRUD
      {
        path: "admin/transactions",
        name: "Transactions",
        component: () =>
          import("../views/admin/transaction/TransactionList.vue"),
        meta: { title: "menu.allTransactions" },
      },
      {
        path: "admin/transactions/create",
        name: "TransactionCreate",
        component: () =>
          import("../views/admin/transaction/TransactionCreate.vue"),
        meta: { title: "menu.addTransaction" },
      },
      {
        path: "admin/transactions/:id",
        name: "TransactionDetail",
        component: () =>
          import("../views/admin/transaction/TransactionDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },

      // Purchase Quotation CRUD
      {
        path: "admin/purchase-quotations",
        name: "PurchaseQuotations",
        component: () =>
          import("../views/admin/purchase_quotation/PurchaseQuotationList.vue"),
        meta: { title: "menu.allPurchaseQuotations" },
      },
      {
        path: "admin/purchase-quotations/create",
        name: "PurchaseQuotationCreate",
        component: () =>
          import("../views/admin/purchase_quotation/PurchaseQuotationCreate.vue"),
        meta: { title: "menu.addPurchaseQuotation" },
      },
      {
        path: "admin/purchase-quotations/:id",
        name: "PurchaseQuotationDetail",
        component: () =>
          import("../views/admin/purchase_quotation/PurchaseQuotationDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },

      // Purchase Order CRUD
      {
        path: "admin/purchase-orders",
        name: "PurchaseOrders",
        component: () =>
          import("../views/admin/purchase_order/PurchaseOrderList.vue"),
        meta: { title: "menu.allPurchaseOrders" },
      },
      {
        path: "admin/purchase-orders/create",
        name: "PurchaseOrderCreate",
        component: () =>
          import("../views/admin/purchase_order/PurchaseOrderCreate.vue"),
        meta: { title: "menu.addPurchaseOrder" },
      },
      {
        path: "admin/purchase-orders/:id",
        name: "PurchaseOrderDetail",
        component: () =>
          import("../views/admin/purchase_order/PurchaseOrderDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },

      // Purchase Invoice CRUD
      {
        path: "admin/purchase-invoices",
        name: "PurchaseInvoices",
        component: () =>
          import("../views/admin/purchase_invoice/PurchaseInvoiceList.vue"),
        meta: { title: "menu.allPurchaseInvoices" },
      },
      {
        path: "admin/purchase-invoices/create",
        name: "PurchaseInvoiceCreate",
        component: () =>
          import("../views/admin/purchase_invoice/PurchaseInvoiceCreate.vue"),
        meta: { title: "menu.addPurchaseInvoice" },
      },
      {
        path: "admin/purchase-invoices/:id",
        name: "PurchaseInvoiceDetail",
        component: () =>
          import("../views/admin/purchase_invoice/PurchaseInvoiceDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },

      // Purchase Payment CRUD
      {
        path: "admin/purchase-payments",
        name: "PurchasePayments",
        component: () =>
          import("../views/admin/purchase_payment/PurchasePaymentList.vue"),
        meta: { title: "menu.purchasePayments" },
      },
      {
        path: "admin/purchase-payments/create",
        name: "PurchasePaymentCreate",
        component: () =>
          import("../views/admin/purchase_payment/PurchasePaymentCreate.vue"),
        meta: { title: "menu.addPurchasePayment" },
      },
      {
        path: "admin/purchase-payments/:id",
        name: "PurchasePaymentDetail",
        component: () =>
          import("../views/admin/purchase_payment/PurchasePaymentDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },
      {
        path: "admin/purchase-payments/:id/edit",
        name: "PurchasePaymentEdit",
        component: () =>
          import("../views/admin/purchase_payment/PurchasePaymentEdit.vue"),
        meta: { title: "crud.editBtn" },
      },

      // Purchase Return CRUD
      {
        path: "admin/purchase-returns",
        name: "PurchaseReturns",
        component: () =>
          import("../views/admin/purchase_return/PurchaseReturnList.vue"),
        meta: { title: "menu.purchaseReturns" },
      },
      {
        path: "admin/purchase-returns/create",
        name: "PurchaseReturnCreate",
        component: () =>
          import("../views/admin/purchase_return/PurchaseReturnCreate.vue"),
        meta: { title: "menu.addPurchaseReturn" },
      },
      {
        path: "admin/purchase-returns/:id",
        name: "PurchaseReturnDetail",
        component: () =>
          import("../views/admin/purchase_return/PurchaseReturnDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },
      {
        path: "admin/purchase-returns/:id/edit",
        name: "PurchaseReturnEdit",
        component: () =>
          import("../views/admin/purchase_return/PurchaseReturnEdit.vue"),
        meta: { title: "crud.editBtn" },
      },

      // Sale Order CRUD
      {
        path: "admin/sale-orders",
        name: "SaleOrders",
        component: () => import("../views/admin/sale_order/SaleOrderList.vue"),
        meta: { title: "menu.allSaleOrders" },
      },
      {
        path: "admin/sale-orders/create",
        name: "SaleOrderCreate",
        component: () =>
          import("../views/admin/sale_order/SaleOrderCreate.vue"),
        meta: { title: "menu.addSaleOrder" },
      },
      {
        path: "admin/sale-orders/:id",
        name: "SaleOrderDetail",
        component: () =>
          import("../views/admin/sale_order/SaleOrderDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },

      // Sale Invoice CRUD
      {
        path: "admin/sale-invoices",
        name: "SaleInvoices",
        component: () =>
          import("../views/admin/sale_invoice/SaleInvoiceList.vue"),
        meta: { title: "menu.allSaleInvoices" },
      },
      {
        path: "admin/sale-invoices/create",
        name: "SaleInvoiceCreate",
        component: () =>
          import("../views/admin/sale_invoice/SaleInvoiceCreate.vue"),
        meta: { title: "menu.addSaleInvoice" },
      },
      {
        path: "admin/sale-invoices/:id",
        name: "SaleInvoiceDetail",
        component: () =>
          import("../views/admin/sale_invoice/SaleInvoiceDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },

      // Sale Return CRUD
      {
        path: "admin/sale-returns",
        name: "SaleReturns",
        component: () =>
          import("../views/admin/sale_return/SaleReturnList.vue"),
        meta: { title: "menu.saleReturns" },
      },
      {
        path: "admin/sale-returns/create",
        name: "SaleReturnCreate",
        component: () =>
          import("../views/admin/sale_return/SaleReturnCreate.vue"),
        meta: { title: "menu.addSaleReturn" },
      },
      {
        path: "admin/sale-returns/:id",
        name: "SaleReturnDetail",
        component: () =>
          import("../views/admin/sale_return/SaleReturnDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },
      {
        path: "admin/sale-returns/:id/edit",
        name: "SaleReturnEdit",
        component: () =>
          import("../views/admin/sale_return/SaleReturnEdit.vue"),
        meta: { title: "crud.editBtn" },
      },

      // Sale Payment CRUD
      {
        path: "admin/sale-payments",
        name: "SalePayments",
        component: () =>
          import("../views/admin/sale_payment/SalePaymentList.vue"),
        meta: { title: "menu.salePayments" },
      },
      {
        path: "admin/sale-payments/create",
        name: "SalePaymentCreate",
        component: () =>
          import("../views/admin/sale_payment/SalePaymentCreate.vue"),
        meta: { title: "menu.addSalePayment" },
      },
      {
        path: "admin/sale-payments/:id",
        name: "SalePaymentDetail",
        component: () =>
          import("../views/admin/sale_payment/SalePaymentDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },
      {
        path: "admin/sale-payments/:id/edit",
        name: "SalePaymentEdit",
        component: () =>
          import("../views/admin/sale_payment/SalePaymentEdit.vue"),
        meta: { title: "crud.editBtn" },
      },

      // Sale Quotation CRUD
      {
        path: "admin/sale-quotations",
        name: "SaleQuotations",
        component: () =>
          import("../views/admin/sale_quotation/SaleQuotationList.vue"),
        meta: { title: "menu.saleQuotations" },
      },
      {
        path: "admin/sale-quotations/create",
        name: "SaleQuotationCreate",
        component: () =>
          import("../views/admin/sale_quotation/SaleQuotationCreate.vue"),
        meta: { title: "menu.addSaleQuotation" },
      },
      {
        path: "admin/sale-quotations/:id",
        name: "SaleQuotationDetail",
        component: () =>
          import("../views/admin/sale_quotation/SaleQuotationDetail.vue"),
        meta: { title: "crud.viewBtn" },
      },
      {
        path: "admin/sale-quotations/:id/edit",
        name: "SaleQuotationEdit",
        component: () =>
          import("../views/admin/sale_quotation/SaleQuotationEdit.vue"),
        meta: { title: "crud.editBtn" },
      },

      // User CRUD
      {
        path: "admin/users",
        name: "Users",
        component: () => import("../views/admin/user/UserList.vue"),
        meta: { title: "menu.allUsers" },
      },
      {
        path: "admin/users/create",
        name: "UserCreate",
        component: () => import("../views/admin/user/UserCreate.vue"),
        meta: { title: "menu.addUser" },
      },
      {
        path: "admin/users/:id/edit",
        name: "UserEdit",
        component: () => import("../views/admin/user/UserEdit.vue"),
        meta: { title: "crud.editBtn" },
      },
      // Reports
      {
        path: "admin/reports/sales",
        name: "SalesReport",
        component: () => import("../views/admin/reports/SalesReport.vue"),
        meta: { title: "menu.salesReport" },
      },
      {
        path: "admin/reports/purchases",
        name: "PurchasesReport",
        component: () => import("../views/admin/reports/PurchasesReport.vue"),
        meta: { title: "menu.purchasesReport" },
      },
      {
        path: "admin/reports/inventory",
        name: "InventoryReport",
        component: () => import("../views/admin/reports/InventoryReport.vue"),
        meta: { title: "menu.inventoryReport" },
      },
      {
        path: "admin/reports/profit-loss",
        name: "ProfitLossReport",
        component: () => import("../views/admin/reports/ProfitLossReport.vue"),
        meta: { title: "menu.plReport" },
      },
      {
        path: "admin/reports/top-performers",
        name: "TopPerformersReport",
        component: () =>
          import("../views/admin/reports/TopPerformersReport.vue"),
        meta: { title: "menu.topPerformers" },
      },
    ],
  },

  // Catch-all fallback
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Navigation guard
router.beforeEach((to) => {
  // Pinia store must be used inside a function (after createPinia())
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  // Route requires auth but user is not logged in → redirect to login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: "Login" };
  }

  // Route is for guests only but user is already logged in → redirect to dashboard
  if (to.meta.requiresGuest && isAuthenticated) {
    return { name: "Dashboard" };
  }
});

export default router;
