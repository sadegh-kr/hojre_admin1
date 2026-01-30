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
            { path: "restaurant_list", component: ResturantList },
            { path: "restaurant/order-list/:restaurantId", component: OrderList, props: true },
            { path: "user-list", component: UserList, props: true },

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
    } else if (to.path === '/login' && authStore.isAuthenticated) {
        // اگر قبلاً لاگین کرده → هدایت به داشبورد
        next('/dashboard')
    } else {
        next()
    }
})

export default router;
