<template>
  <section class="monthly-analysis" dir="rtl" aria-label="تحلیل ماهانه قیمت مواد">
    <header><h3>تغییر قیمت مواد اولیه</h3><small>مقایسه دو دوره ۳۰روزه · شاخص رسمی تورم نیست</small></header>
    <p v-if="loading">در حال دریافت تحلیل…</p>
    <p v-else-if="error" role="alert">{{ error }} <button type="button" class="cost-text" @click="load">تلاش مجدد</button></p>
    <template v-else-if="data">
      <p class="dates">دوره اخیر: {{ date(data.current_start) }} تا {{ date(data.current_end) }} · دوره قبل: {{ date(data.previous_start) }} تا {{ date(data.previous_end) }}</p>
      <div class="metrics">
        <div><span>میانگین تغییر قیمت مواد</span><strong>{{ percent(data.average_percentage) }}</strong></div>
        <div><span>بیشترین افزایش</span><strong>{{ data.highest ? `${data.highest.name} · ${percent(data.highest.change_percentage)}` : (data.comparable_count ? 'افزایش مثبتی ثبت نشده' : 'نامشخص') }}</strong></div>
        <div><span>قابل مقایسه / اطلاعات ناکافی</span><strong>{{ number(data.comparable_count) }} / {{ number(data.insufficient_count) }}</strong></div>
      </div>
      <p v-if="!data.comparable_count" role="status">اطلاعات کافی برای محاسبه افزایش قیمت ماهانه وجود ندارد.</p>
      <details><summary>جزئیات تغییر مواد و محصولات متأثر</summary>
        <p class="method">آخرین قیمت هر دوره، با واحد تاریخی و نوع قیمت یکسان مقایسه می‌شود؛ روز جاری محاسبه نمی‌شود.</p>
        <ul class="rows"><li v-for="item in data.ingredients" :key="item.id"><span>{{ item.name }}</span><span :class="`change-${changeKind(item.change_percentage)}`">{{ changeLabel(item.change_percentage) }}<template v-if="item.change_percentage != null"> · {{ percent(item.change_percentage) }}</template></span></li></ul>
        <p v-if="!data.ingredients.length">ماده‌ای در این رستوران ثبت نشده است.</p>
        <h4>اثر مواد بر محصولات</h4>
        <p class="method">این درصدها مربوط به مواد اولیه‌اند؛ مقایسه تاریخی کل بهای تولید در دسترس نیست.</p>
        <ul class="rows products"><li v-for="product in data.products" :key="product.id"><strong>{{ product.name }}</strong><span>پوشش: {{ number(product.comparable_count) }} قابل مقایسه، {{ number(product.unavailable_count) }} نامشخص · میانگین مواد: {{ percent(product.average_percentage) }} · بیشترین افزایش: {{ percent(product.highest_increase) }}</span><small v-for="(item, index) in product.increased" :key="index">{{ item.name }} ({{ number(item.quantity) }} {{ item.unit }})، {{ percent(item.change_percentage) }}</small></li></ul>
      </details>
    </template>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import API from '@/api/product-cost.api.js'
import { costErrorMessage, formatCostNumber as number } from '@/utils/costControl'
import { changeKind, changeLabel } from '@/utils/pricingPresentation'

const data = ref(null)
const loading = ref(true)
const error = ref('')
const date = value => new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
const percent = value => value == null ? 'نامشخص' : `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(Number(value))}٪`
async function load() {
  loading.value = true
  error.value = ''
  try { data.value = await API.monthlyIngredientAnalysis() }
  catch (err) { error.value = costErrorMessage(err, 'دریافت تحلیل ماهانه ممکن نیست.') }
  finally { loading.value = false }
}
onMounted(load)
</script>

<style scoped>
.monthly-analysis { padding: 1rem; border: 1px solid var(--border); border-radius: var(--card-radius); background: var(--surface); min-width: 0; font-size: .8rem; }
header h3, h4 { margin: 0 0 .4rem; }
header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .35rem; }
header small, .dates, .method { opacity: .8; }
.dates { margin: .3rem 0 .6rem; font-size: .72rem; }
.metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); gap: .6rem; }
.metrics div { padding: .7rem; border: 1px solid var(--border); border-radius: 8px; min-width: 0; }
.metrics span, .metrics strong { display: block; overflow-wrap: anywhere; }
.metrics strong { margin-top: .4rem; }
details { margin-top: .8rem; }
summary { cursor: pointer; }
.rows { list-style: none; padding: 0; }
.rows li { display: flex; gap: .5rem; justify-content: space-between; padding: .4rem 0; border-bottom: 1px solid var(--border); }
.products li { display: grid; }
.change-increase{color:var(--danger-text)}.change-decrease{color:var(--success-text)}.change-unchanged,.change-unknown{color:var(--muted)}
@media(max-width:640px){.monthly-analysis{padding:.8rem}.metrics{grid-template-columns:1fr;gap:.1rem}.metrics div{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.3rem 0;border:0}.metrics strong{margin-top:0}header small{font-size:.65rem}}
</style>
