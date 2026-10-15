import { createRouter, createWebHistory } from "vue-router";

// Layout ها
import MainLayout from "@/layouts/MainLayout.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";

// صفحات
import LoginPage from "../view/Login.vue";
import DashboardPage from "../view/Dashboard.vue";
import {useAuthStore} from "@/store/auth.js";
import ResturantList from "@/view/ResturantList.vue";
import OrderList from "@/view/ResturantOrderList.vue";
import UserList from "@/view/UserList.vue";
import NotFound from "@/view/NotFound.vue";
import ItemList from "@/view/ItemList.vue";
import ExpensivList from "@/view/ExpensivList.vue";
import ProductManagement from "@/view/ProductManagement.vue";
import AdminAccess from "@/view/AdminAccess.vue";

const CostOverview = () => import("@/view/cost/CostOverview.vue");
const CostProducts = () => import("@/view/cost/CostProducts.vue");
const CostIngredients = () => import("@/view/cost/CostIngredients.vue");
const CostOverheads = () => import("@/view/cost/CostOverheads.vue");
const ProductRecipe = () => import("@/view/cost/ProductRecipe.vue");
const ExpenseCategories = () => import("@/view/cost/ExpenseCategories.vue");
const ProductionCosts = () => import("@/view/cost/ProductionCosts.vue");
const CostReports = () => import("@/view/cost/CostReports.vue");
const LoyaltyOverview = () => import("@/view/loyalty/LoyaltyOverview.vue");
const LoyaltyMembers = () => import("@/view/loyalty/LoyaltyMembers.vue");
const LoyaltyCustomerCreate = () => import("@/view/loyalty/LoyaltyCustomerCreate.vue");
const LoyaltyCustomerDetail = () => import("@/view/loyalty/LoyaltyCustomerDetail.vue");
const LoyaltySettings = () => import("@/view/loyalty/LoyaltySettings.vue");
const LoyaltyRewards = () => import("@/view/loyalty/LoyaltyRewards.vue");

const routes = [
    {
        path: "/",
        redirect: "/login"
    },
    {
        path: "/login",
        component: AuthLayout,
        children: [
            { path: "", component: LoginPage }
        ]
    },
    {
        path: "/dashboard",
        component: MainLayout,
        children: [
            { path: "", component: DashboardPage },
            { path: "orders", component: OrderList, meta: { requiresAdmin: true } },
            { path: "restaurant_list", component: ResturantList },
            { path: "restaurant/order-list/:restaurantId", redirect: to => ({ path: '/dashboard/orders', query: { branch: to.params.restaurantId } }) },
            { path: "user-list", component: UserList, props: true },
            { path: "item-list", component: ItemList, props: true },
            {
                path: "cost-control",
                component: ProductManagement,
                meta: { requiresOwner: true },
                children: [
                    { path: "", redirect: "/dashboard/cost-control/overview" },
                    { path: "overview", component: CostOverview },
                    { path: "expenses", component: ExpensivList },
                    { path: "expense-categories", component: ExpenseCategories, meta: { backTo: "/dashboard/cost-control/expenses", backLabel: "بازگشت به هزینه‌ها" } },
                    { path: "products", component: CostProducts },
                    { path: "products/:productId/recipe", name: "product-recipe", component: ProductRecipe },
                    { path: "materials", component: CostIngredients },
                    { path: "production-costs", component: ProductionCosts },
                    { path: "reports", component: CostReports },
                    { path: "overheads", component: CostOverheads },
                ],
            },
            { path: "expenses", redirect: "/dashboard/cost-control/expenses" },
            { path: "products", redirect: "/dashboard/cost-control/overview" },
            { path: "products/overview", redirect: "/dashboard/cost-control/overview" },
            { path: "products/catalog", redirect: "/dashboard/cost-control/products" },
            { path: "products/catalog/:productId/recipe", redirect: to => `/dashboard/cost-control/products/${to.params.productId}/recipe` },
            { path: "products/ingredients", redirect: "/dashboard/cost-control/materials" },
            { path: "products/overheads", redirect: "/dashboard/cost-control/overheads" },
            { path: "admin-access", component: AdminAccess, meta: { requiresOwner: true } },
            { path: "loyalty", component: LoyaltyOverview, meta: { requiresAdmin: true } },
            { path: "loyalty/customers", component: LoyaltyMembers, meta: { requiresAdmin: true } },
            { path: "loyalty/customers/new", component: LoyaltyCustomerCreate, meta: { requiresAdmin: true } },
            { path: "loyalty/customers/:customerId", component: LoyaltyCustomerDetail, meta: { requiresAdmin: true } },
            { path: "loyalty/points", component: LoyaltyMembers, meta: { requiresAdmin: true } },
            { path: "loyalty/wallets", component: LoyaltyMembers, meta: { requiresAdmin: true } },
            { path: "loyalty/tiers", component: LoyaltySettings, meta: { requiresOwner: true } },
            { path: "loyalty/rewards", component: LoyaltyRewards, meta: { requiresAdmin: true } },
            { path: "loyalty/reports", component: LoyaltyOverview, meta: { requiresOwner: true } },
            { path: "loyalty/settings", component: LoyaltySettings, meta: { requiresOwner: true } },
            { path: "loyalty/phone-order", component: ItemList, meta: { requiresAdmin: true, orderType: 'phone', backTo: "/dashboard/loyalty/customers", backLabel: "بازگشت به اعضا" } },
            { path: "expensiv-list", redirect: "/dashboard/cost-control/expenses" },

        ]
    },


    {
        path: "/:pathMatch(.*)*",
        component: NotFound
    }
];

const router = createRouter({
    history: createWebHistory('/management/'),
    routes
});

// مسیریابی محافظت شده
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    if (to.path.startsWith('/dashboard') && !authStore.isAuthenticated) {
        // اگر لاگین نکرده → هدایت به لاگین
        next('/login')
    } else if (to.matched.some(record => record.meta.requiresAdmin) && !authStore.isAdmin) {
        next('/dashboard')
    } else if (to.matched.some(record => record.meta.requiresOwner) && !authStore.canAccessFinancials) {
        next('/dashboard')
    } else if (to.path === '/login' && authStore.isAuthenticated) {
        // اگر قبلاً لاگین کرده → هدایت به داشبورد
        next('/dashboard')
    } else {
        next()
    }
})

export default router;
