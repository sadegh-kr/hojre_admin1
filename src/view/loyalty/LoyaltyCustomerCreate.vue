<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSafeAdminBack } from '@/composables/useSafeAdminBack'
import AppBackButton from '@/components/common/AppBackButton.vue'
import loyaltyApi from '@/api/loyalty.api'
import { getApiErrorMessage } from '@/api/error'
const vueRouter=useRouter(), route=useRoute(), form=ref({phone_number:String(route.query.phone||''),name:'',birthday:'',notes:'',registration_source:'admin'}), saving=ref(false), error=ref('')
const { navigateBack } = useSafeAdminBack()
async function submit(){saving.value=true;error.value='';try{const result=await loyaltyApi.createCustomer(form.value);vueRouter.push(`/dashboard/loyalty/customers/${result.customer.customer_id}`)}catch(e){error.value=getApiErrorMessage(e)}finally{saving.value=false}}
</script>
<template><div class="loyalty-page"><header class="loyalty-header"><div><h1>ثبت سریع مشتری</h1><p>رمز عبور و رضایت تبلیغاتی در این فرایند ایجاد نمی‌شود.</p></div><AppBackButton fallback="/dashboard/loyalty/customers" /></header><form class="loyalty-card loyalty-form" @submit.prevent="submit"><p v-if="error" class="loyalty-error">{{error}}</p><label>شماره موبایل *<input v-model="form.phone_number" required inputmode="tel" autocomplete="tel" placeholder="09123456789"></label><label>نام و نام خانوادگی<input v-model="form.name" autocomplete="name"></label><label>تاریخ تولد (میلادی)<input v-model="form.birthday" type="date"></label><label>منبع ثبت‌نام<select v-model="form.registration_source"><option value="admin">ادمین</option><option value="in_store">حضوری</option><option value="phone">تلفنی</option></select></label><label>یادداشت داخلی<textarea v-model="form.notes"></textarea></label><div class="loyalty-actions"><button class="admin-button admin-button--primary" :disabled="saving">{{saving?'در حال ثبت…':'ثبت و باز کردن پروفایل'}}</button><button type="button" class="admin-button admin-button--secondary" @click="navigateBack('/dashboard/loyalty/customers')">انصراف</button></div></form></div></template>
