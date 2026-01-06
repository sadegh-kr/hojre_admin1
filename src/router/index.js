import { createRouter, createWebHistory } from "vue-router";

// Layout ها
import MainLayout from "@/layouts/MainLayout.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";

// صفحات
import LoginPage from "../view/Login.vue";
import DashboardPage from "../view/Dashboard.vue";
import {useAuthStore} from "@/store/auth.js";

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

        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
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
