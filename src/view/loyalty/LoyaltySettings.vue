<script setup>
import { onMounted, ref } from 'vue'
import loyaltyApi from '@/api/loyalty.api'
import { getApiErrorMessage } from '@/api/error'

const tiers = ref([])
const rules = ref([])
const error = ref('')
const notice = ref('')
const savingAutomatic = ref(false)
const tier = ref({ name: '', min_spend: 0, min_orders: 0, priority: 0, benefits: {} })
const rule = ref({ name: '', rule_type: 'spend', spend_amount: 10000, points: 1, rounding: 'floor', priority: 0, stackable: true, is_active: true })
const automatic = ref({ per_order_enabled: false, monthly_spend_enabled: false, monthly_threshold: 500000, monthly_points_per_threshold: 1 })
const effectiveMonth = ref(null)

function applyAutomaticSettings(data) {
  const monthly = data.pending_monthly_spend || data.monthly_spend
  automatic.value = {
    per_order_enabled: Boolean(data.per_order?.enabled),
    monthly_spend_enabled: Boolean(monthly?.enabled),
    monthly_threshold: Number(monthly?.threshold || 500000),
    monthly_points_per_threshold: Number(monthly?.points_per_threshold || 1),
  }
  effectiveMonth.value = data.pending_monthly_spend?.effective_jalali_month || data.monthly_spend?.effective_jalali_month
}

async function load() {
  error.value = ''
  try {
    const [tierRows, ruleRows, settings] = await Promise.all([loyaltyApi.tiers(), loyaltyApi.rules(), loyaltyApi.automaticEarningSettings()])
    tiers.value = tierRows
    rules.value = ruleRows
    applyAutomaticSettings(settings)
  } catch (e) { error.value = getApiErrorMessage(e) }
}

async function saveAutomatic() {
  error.value = ''
  notice.value = ''
  savingAutomatic.value = true
  try {
    const result = await loyaltyApi.updateAutomaticEarningSettings(automatic.value)
    applyAutomaticSettings(result)
    notice.value = result.pending_monthly_spend
      ? `تغییر تنظیمات ماهانه از ماه ${result.pending_monthly_spend.effective_jalali_month} اعمال می‌شود.`
      : 'تنظیمات امتیازدهی خودکار ذخیره شد.'
  } catch (e) { error.value = getApiErrorMessage(e) }
  finally { savingAutomatic.value = false }
}

async function addTier() {
  try {
    await loyaltyApi.createTier(tier.value)
    tier.value = { name: '', min_spend: 0, min_orders: 0, priority: 0, benefits: {} }
    await load()
  } catch (e) { error.value = getApiErrorMessage(e) }
}

async function addRule() {
  try {
    await loyaltyApi.createRule(rule.value)
    rule.value = { name: '', rule_type: 'spend', spend_amount: 10000, points: 1, rounding: 'floor', priority: 0, stackable: true, is_active: true }
    await load()
  } catch (e) { error.value = getApiErrorMessage(e) }
}

onMounted(load)
</script>

<template>
  <div class="loyalty-page">
    <header class="loyalty-header"><div><h1>تنظیمات باشگاه</h1><p>سطوح عضویت و قوانین واقعی امتیازدهی</p></div></header>
    <p v-if="error" class="loyalty-error">{{ error }}</p>
    <p v-if="notice" class="loyalty-notice">{{ notice }}</p>

    <form class="loyalty-card loyalty-form" @submit.prevent="saveAutomatic">
      <div><h2>تنظیمات امتیازدهی خودکار</h2><p class="loyalty-help">هر دو روش مستقل‌اند و می‌توانند هم‌زمان برای یک فاکتور امتیاز ثبت کنند.</p></div>
      <div class="loyalty-grid-2">
        <section class="loyalty-rule-box">
          <label class="loyalty-switch"><input v-model="automatic.per_order_enabled" type="checkbox"><span>امتیاز به ازای هر فاکتور</span></label>
          <p>هر فاکتور تسویه‌شده و واجد شرایط، بدون توجه به مبلغ آن، دقیقاً ۱ امتیاز می‌گیرد.</p>
          <strong>نرخ ثابت: ۱ امتیاز</strong>
        </section>
        <section class="loyalty-rule-box">
          <label class="loyalty-switch"><input v-model="automatic.monthly_spend_enabled" type="checkbox"><span>امتیاز براساس مجموع خرید ماهانه</span></label>
          <p>خریدهای واجد شرایط در هر ماه شمسی جمع می‌شوند و مانده فقط در همان ماه حفظ می‌شود.</p>
          <label>آستانه خرید (تومان)<input v-model.number="automatic.monthly_threshold" type="number" min="1" step="1" required></label>
          <label>امتیاز هر آستانه<input v-model.number="automatic.monthly_points_per_threshold" type="number" min="1" step="1" required></label>
          <small>مثال: با آستانه ۵۰۰٬۰۰۰ تومان، خرید ۱٬۰۳۰٬۰۰۰ تومان دو آستانه کامل می‌کند.</small>
          <small v-if="effectiveMonth">ماه اثر تنظیم ماهانه: {{ effectiveMonth }}</small>
        </section>
      </div>
      <button class="admin-button admin-button--primary" :disabled="savingAutomatic">{{ savingAutomatic ? 'در حال ذخیره…' : 'ذخیره تنظیمات خودکار' }}</button>
    </form>

    <div class="loyalty-grid-2">
      <section class="loyalty-card">
        <h2>سطوح عضویت</h2>
        <table class="loyalty-table"><thead><tr><th>نام</th><th>حداقل خرید</th><th>سفارش</th></tr></thead><tbody>
          <tr v-for="x in tiers" :key="x.id"><td>{{ x.name }}</td><td>{{ Number(x.min_spend).toLocaleString('fa-IR') }}</td><td>{{ x.min_orders }}</td></tr>
          <tr v-if="!tiers.length"><td colspan="3" class="loyalty-empty">هنوز سطح عضویتی تعریف نشده است.</td></tr>
        </tbody></table>
        <form class="loyalty-form" @submit.prevent="addTier"><label>نام<input v-model="tier.name" required></label><label>حداقل خرید<input v-model.number="tier.min_spend" type="number" min="0"></label><label>حداقل سفارش<input v-model.number="tier.min_orders" type="number" min="0"></label><button class="admin-button admin-button--primary">افزودن سطح</button></form>
      </section>
      <section class="loyalty-card">
        <h2>قوانین قدیمی امتیاز</h2>
        <table class="loyalty-table"><thead><tr><th>نام</th><th>نوع</th><th>امتیاز</th><th>مبنای خرید</th></tr></thead><tbody>
          <tr v-for="x in rules" :key="x.id"><td>{{ x.name }}</td><td>{{ x.rule_type === 'spend' ? 'خرید' : 'اولین خرید' }}</td><td>{{ x.points }}</td><td>{{ x.spend_amount || '—' }}</td></tr>
          <tr v-if="!rules.length"><td colspan="4" class="loyalty-empty">هنوز قانونی تعریف نشده است.</td></tr>
        </tbody></table>
        <form class="loyalty-form" @submit.prevent="addRule"><label>نام<input v-model="rule.name" required></label><label>نوع<select v-model="rule.rule_type"><option value="spend">امتیاز خرید</option><option value="first_purchase">هدیه اولین خرید</option></select></label><label v-if="rule.rule_type === 'spend'">به ازای مبلغ<input v-model.number="rule.spend_amount" type="number" min="1"></label><label>امتیاز<input v-model.number="rule.points" type="number" min="1" required></label><button class="admin-button admin-button--primary">افزودن قانون</button></form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.loyalty-help,.loyalty-rule-box p,.loyalty-rule-box small{color:var(--muted)}
.loyalty-rule-box{display:grid;align-content:start;gap:.75rem;padding:1rem;border:1px solid var(--border);border-radius:var(--card-radius);background:var(--surface-subtle)}
.loyalty-rule-box label:not(.loyalty-switch){display:grid;gap:.35rem}
.loyalty-switch{display:flex!important;grid-template-columns:none!important;align-items:center;gap:.65rem!important;color:var(--text)!important;font-weight:700}
.loyalty-switch input{width:1.1rem;height:1.1rem}
.loyalty-notice{padding:.75rem;border-radius:var(--control-radius);background:var(--color-success-subtle);color:var(--success)}
</style>
