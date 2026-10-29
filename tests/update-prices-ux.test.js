import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { h } from 'vue'
import { changeKind, changeLabel } from '../src/utils/pricingPresentation.js'
import { pricingWarningEvent } from '../src/utils/pricingWarnings.js'
import { compile, cost, deferred, flush, mount } from './helpers/vueHarness.js'

function rows(count = 13) {
  return Array.from({ length: count }, (_, i) => ({
    product_id: String(i + 1), product_name: `محصول ${i + 1}`, current_price: '125000',
    recommendation: {
      id: i + 101, revision: `revision-${i + 1}`, can_approve: i !== 2,
      status: i === 2 ? 'incomplete' : i === 0 ? 'review_required' : 'calculated',
      status_display: i === 2 ? 'اطلاعات ناقص' : i === 0 ? 'نیازمند بررسی' : 'محاسبه‌شده',
      production_cost: '100000', suggested_price: i === 2 ? null : '150000',
      unrounded_suggested_price: '149500', difference_amount: '25000', difference_percentage: '20',
      markup_percentage: '50', rounding_step: '1000', reason_detail: 'پیشنهاد سرور',
    },
  }))
}

async function bulk(t, api = {}, data = rows()) {
  const calls = [], summaries = [], inspected = []
  const service = {
    bulkPricingPreview: async () => ({ results: data }),
    bulkPricingApprove: async payload => { calls.push(payload) }, ...api,
  }
  const ui = mount(t, compile('components/cost/BulkPricingPreview.vue', service), {
    onSummary: value => summaries.push(value), onInspect: value => inspected.push(value),
  })
  await flush()
  const checkboxes = () => ui.all(el => el.type === 'input' && el.props.type === 'checkbox')
  return { ...ui, calls, summaries, inspected, checkboxes, service }
}

test('real pricing table renders grouped Toman, server prices, statuses and blocked rows', async t => {
  const ui = await bulk(t)
  assert.match(ui.text(), /۱۲۵٬۰۰۰ تومان/)
  assert.match(ui.text(), /۱۰۰٬۰۰۰ تومان/)
  assert.match(ui.text(), /۱۵۰٬۰۰۰ تومان/)
  assert.match(ui.text(), /↑ افزایش/)
  assert.match(ui.text(), /اطلاعات ناقص/)
  assert.equal(ui.checkboxes().length, 10)
  assert.equal(ui.checkboxes()[2].props.disabled, true)
  assert.deepEqual(ui.summaries.at(-1), { eligible: 12, review: 1, selected: 0, unavailable: false })
  assert.equal(ui.calls.length, 0)
  assert.equal(ui.button('بازبینی و اعمال').props.disabled, true)
})

test('checkboxes select, highlight and deselect multiple rows without approving', async t => {
  const ui = await bulk(t)
  ui.checkboxes()[0].props.onChange()
  ui.checkboxes()[1].props.onChange()
  await flush()
  assert.equal(ui.summaries.at(-1).selected, 2)
  assert.equal(ui.all(el => el.type === 'tr' && el.props.class?.includes('is-selected')).length, 2)
  ui.checkboxes()[0].props.onChange()
  await flush()
  assert.equal(ui.summaries.at(-1).selected, 1)
  assert.equal(ui.calls.length, 0)
  ui.button('پاک‌کردن انتخاب‌ها').props.onClick()
  await flush()
  assert.equal(ui.summaries.at(-1).selected, 0)
})

test('select all stays page scoped, skips blockers, and page/size changes retain selections', async t => {
  const ui = await bulk(t)
  ui.button('انتخاب همه مجازهای این صفحه').props.onClick()
  await flush()
  assert.equal(ui.summaries.at(-1).selected, 9)
  ui.button('بعدی').props.onClick()
  await flush()
  assert.equal(ui.checkboxes().length, 3)
  assert.equal(ui.checkboxes()[0].props.checked, false)
  ui.button('انتخاب همه مجازهای این صفحه').props.onClick()
  await flush()
  assert.equal(ui.summaries.at(-1).selected, 12)
  const size = ui.all(el => el.props['aria-label'] === 'تعداد پیشنهاد قیمت در هر صفحه')[0]
  size.props['onUpdate:modelValue'](20)
  await flush()
  assert.equal(ui.checkboxes().length, 13)
  assert.equal(ui.summaries.at(-1).selected, 12)
})

test('search and moved status filter cover all products and clear prior selection', async t => {
  const ui = await bulk(t)
  ui.checkboxes()[0].props.onChange()
  await flush()
  ui.all(el => el.props.type === 'search')[0].props['onUpdate:modelValue']('محصول 13')
  await flush()
  assert.equal(ui.summaries.at(-1).selected, 0)
  assert.equal(ui.checkboxes().length, 1)
  assert.match(ui.text(), /محصول 13/)
  ui.checkboxes()[0].props.onChange()
  await flush()
  ui.all(el => el.props['aria-label'] === 'فیلتر وضعیت پیشنهاد قیمت')[0].props['onUpdate:modelValue']('incomplete')
  await flush()
  assert.equal(ui.summaries.at(-1).selected, 0)
  assert.equal(ui.checkboxes().length, 0)
  assert.match(ui.text(), /محصولی مطابق جستجو و وضعیت پیدا نشد/)
})

test('bulk confirmation submits only selected identities, blocks duplicates, refreshes applied rows', async t => {
  const pending = deferred(), calls = [], data = rows()
  let loads = 0
  const ui = await bulk(t, {
    bulkPricingPreview: async () => { loads++; return { results: data } },
    bulkPricingApprove: payload => { calls.push(payload); return pending.promise },
  })
  ui.checkboxes()[0].props.onChange()
  ui.checkboxes()[1].props.onChange()
  await flush()
  ui.button('بازبینی و اعمال').props.onClick()
  await flush()
  assert.equal(calls.length, 0)
  assert.match(ui.text(ui.body), /در صورت نامعتبر بودن حتی یک پیشنهاد، هیچ قیمتی تغییر نمی‌کند/)
  const confirm = ui.button('تأیید و اعمال قیمت‌های انتخاب‌شده', ui.body)
  const submission = confirm.props.onClick()
  confirm.props.onClick()
  await flush()
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], [
    { recommendation_id: 101, revision: 'revision-1' }, { recommendation_id: 102, revision: 'revision-2' },
  ])
  assert.equal(confirm.props.disabled, true)
  window.dispatchEvent(new Event(pricingWarningEvent))
  await flush()
  assert.equal(loads, 1)
  assert.ok(ui.text(ui.body).includes('بازبینی'))
  data[0].current_price = '150000'
  data[0].recommendation.can_approve = false
  pending.resolve({ approved_count: 2 })
  await submission
  await flush()
  assert.equal(loads, 2)
  assert.equal(ui.summaries.at(-1).selected, 0)
  assert.equal(ui.text(ui.body), '')
  assert.equal(ui.checkboxes()[0].props.disabled, true)
  assert.match(ui.text(), /۱۵۰٬۰۰۰ تومان/)
})

test('approval failure keeps confirmation and selections; stale revisions clear and reload safely', async t => {
  let status = 403, loads = 0
  const ui = await bulk(t, {
    bulkPricingPreview: async () => { loads++; return { results: rows() } },
    bulkPricingApprove: async () => { throw { response: { status, data: { message: status === 409 ? 'پیشنهاد قدیمی است؛ هیچ قیمتی تغییر نکرد.' : 'مجوز اعمال ندارید.' } } } },
  })
  ui.checkboxes()[0].props.onChange()
  await flush()
  ui.button('بازبینی و اعمال').props.onClick()
  await flush()
  await ui.button('تأیید و اعمال قیمت‌های انتخاب‌شده', ui.body).props.onClick()
  await flush()
  assert.match(ui.text(ui.body), /مجوز اعمال ندارید/)
  assert.equal(ui.summaries.at(-1).selected, 1)
  assert.equal(loads, 1)
  status = 409
  await ui.button('تأیید و اعمال قیمت‌های انتخاب‌شده', ui.body).props.onClick()
  await flush()
  assert.equal(loads, 2)
  assert.equal(ui.text(ui.body), '')
  assert.match(ui.text(), /پیشنهاد قدیمی است؛ هیچ قیمتی تغییر نکرد/)
  assert.equal(ui.checkboxes()[0].props.checked, false)
  assert.equal(ui.button('بازبینی و اعمال').props.disabled, true)
})

test('cancel and row inspection never apply prices', async t => {
  const ui = await bulk(t)
  ui.button('جزئیات و تأیید تکی').props.onClick()
  assert.equal(ui.inspected[0].product_id, '1')
  ui.checkboxes()[0].props.onChange()
  await flush()
  ui.button('بازبینی و اعمال').props.onClick()
  await flush()
  ui.button('انصراف', ui.body).props.onClick()
  await flush()
  assert.equal(ui.text(ui.body), '')
  assert.equal(ui.calls.length, 0)
})

test('loading, empty data, request failure and retry do not invent summary metrics', async t => {
  const pending = deferred()
  const ui = await bulk(t, { bulkPricingPreview: () => pending.promise })
  assert.match(ui.text(), /در حال دریافت پیشنهادها/)
  assert.equal(ui.summaries.at(-1), null)
  pending.reject(new Error('خطای دریافت'))
  await flush()
  assert.match(ui.text(), /خطای دریافت/)
  assert.equal(ui.checkboxes().length, 0)
  ui.service.bulkPricingPreview = async () => ({ results: [] })
  await ui.button('به‌روزرسانی پیشنهادها').props.onClick()
  await flush()
  assert.match(ui.text(), /محصولی برای نمایش وجود ندارد/)
  assert.equal(ui.summaries.at(-1).eligible, 0)
  assert.equal(ui.button('بازبینی و اعمال').props.disabled, true)
})

test('ingredient changes distinguish increase, decrease, verified zero and insufficient history', () => {
  for (const [value, kind] of [[12, 'increase'], [-3, 'decrease'], ['0', 'unchanged'], [null, 'unknown'], [undefined, 'unknown']]) {
    assert.equal(changeKind(value), kind)
  }
  assert.match(changeLabel(-3), /↓ کاهش/)
  assert.equal(changeLabel(null), 'اطلاعات ناکافی')
  assert.equal(cost.formatMoney(1250000), '۱٬۲۵۰٬۰۰۰ تومان')
  assert.equal(cost.formatMoney(-125000), '‎−۱۲۵٬۰۰۰ تومان')
})

test('page excludes recipe management while dedicated recipes and financial warnings remain', () => {
  const page = readFileSync(new URL('../src/view/cost/ProductionCosts.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(page, /recipe-card|recipe-table|saveRecipe|removeRecipe|ProductPricingModal/)
  assert.match(page, /API\.recipes\(id\)/)
  assert.match(page, /missingPriceLines/)
  assert.match(page, /<details ref="productDetails"/)
  assert.match(page, /@inspect="inspectProduct"/)
  const dedicated = readFileSync(new URL('../src/view/cost/CostProducts.vue', import.meta.url), 'utf8')
  assert.match(dedicated, /function openRecipe/)
  const recipe = readFileSync(new URL('../src/view/cost/ProductRecipe.vue', import.meta.url), 'utf8')
  assert.match(recipe, /API\.saveRecipe/)
  assert.match(recipe, /API\.removeRecipe/)
  const router = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
  assert.match(router, /path:\s*"recipes",\s*component:\s*CostProducts/)
})

test('monthly component preserves server comparison periods and negative/zero/missing history', async t => {
  const data = {
    current_start: '2026-09-29', current_end: '2026-10-28', previous_start: '2026-08-30', previous_end: '2026-09-28',
    comparable_count: 3, insufficient_count: 1, average_percentage: 2, highest: { name: 'شیر', change_percentage: 10 },
    ingredients: [
      { id: 1, name: 'شیر', change_percentage: 10 }, { id: 2, name: 'قهوه', change_percentage: -4 },
      { id: 3, name: 'شکر', change_percentage: 0 }, { id: 4, name: 'آرد', change_percentage: null },
    ], products: [],
  }
  const ui = mount(t, compile('components/cost/MonthlyIngredientAnalysis.vue', {
    monthlyIngredientAnalysis: async () => data,
  }))
  await flush()
  assert.match(ui.text(), /↑ افزایش · ۱۰٪/)
  assert.match(ui.text(), /↓ کاهش · ‎−۴٪/)
  assert.match(ui.text(), /بدون تغییر · ۰٪/)
  assert.match(ui.text(), /آرداطلاعات ناکافی/)
  assert.doesNotMatch(ui.text(), /اطلاعات ناکافی · ۰٪/)
  assert.match(ui.text(), /روز جاری محاسبه نمی‌شود/)
})

test('monthly loading and errors allow retry; missing comparison never becomes a zero percent', async t => {
  const pending = deferred()
  const api = { monthlyIngredientAnalysis: () => pending.promise }
  const ui = mount(t, compile('components/cost/MonthlyIngredientAnalysis.vue', api))
  assert.match(ui.text(), /در حال دریافت تحلیل/)
  pending.reject(new Error('تحلیل دریافت نشد'))
  await flush()
  assert.match(ui.text(), /تحلیل دریافت نشد/)
  api.monthlyIngredientAnalysis = async () => ({
    current_start: '2026-09-29', current_end: '2026-10-28', previous_start: '2026-08-30', previous_end: '2026-09-28',
    comparable_count: 0, insufficient_count: 1, average_percentage: null, highest: null,
    ingredients: [{ id: 1, name: 'آرد', change_percentage: null }], products: [],
  })
  await ui.button('تلاش مجدد').props.onClick()
  await flush()
  assert.match(ui.text(), /اطلاعات کافی برای محاسبه افزایش قیمت ماهانه وجود ندارد/)
  assert.match(ui.text(), /آرداطلاعات ناکافی/)
  assert.doesNotMatch(ui.text(), /۰٪/)
})

async function detail(t, extra = {}) {
  const product = { id: '1', name: 'قهوه', price: '125000', final_production_cost: '100000', is_active: true }
  const pricing = {
    policy: { configured: true, markup_percentage: '50', rounding_step: '1000', significant_change_threshold: '2' },
    recommendation: { ...rows()[0].recommendation, is_complete: true }, recommendation_history: [], price_history: [], options: [],
  }
  const calls = [], confirmations = []
  let accepted = false
  const api = {
    dashboard: async () => ({ production_costs: [product] }), product: async () => product,
    recipes: async () => [{ unit_price: '0' }], productPricing: async () => pricing,
    approveProductPricing: async (id, payload) => { calls.push({ id, payload }); return pricing }, ...extra,
  }
  const bulkStub = {
    emits: ['inspect', 'summary'],
    setup(props, { emit }) { return () => h('button', { onClick: () => emit('inspect', { product_id: '1' }) }, 'بازکردن جزئیات') },
  }
  const ui = mount(t, compile('view/cost/ProductionCosts.vue', api, {
    '@/components/cost/BulkPricingPreview.vue': { default: bulkStub },
  }))
  window.confirm = message => { confirmations.push(message); return accepted }
  await flush()
  return { ...ui, api, product, pricing, calls, confirmations, accept: () => { accepted = true } }
}

test('pricing page loads with collapsed details; inspect opens the existing individual workflow', async t => {
  const ui = await detail(t)
  assert.match(ui.text(), /آپدیت قیمت/)
  const details = ui.all(el => el.type === 'details')[0]
  assert.equal(details.props.open, false)
  assert.match(ui.text(), /ماده بدون قیمت مؤثر/)
  await ui.button('بازکردن جزئیات').props.onClick()
  await flush()
  assert.equal(details.props.open, true)
  assert.match(ui.text(), /تأیید و اعمال قیمت جدید/)
  assert.equal(ui.calls.length, 0)
})

test('individual approval keeps explicit confirmation, exact revision, duplicate guard and fresh price', async t => {
  const pending = deferred(), sent = []
  const ui = await detail(t, { approveProductPricing: (id, payload) => { sent.push({ id, payload }); return pending.promise } })
  await ui.button('تأیید و اعمال قیمت جدید').props.onClick()
  assert.equal(sent.length, 0)
  assert.match(ui.confirmations[0], /۱۵۰٬۰۰۰ تومان/)
  ui.accept()
  const approval = ui.button('تأیید و اعمال قیمت جدید').props.onClick()
  ui.button('تأیید و اعمال قیمت جدید').props.onClick()
  await flush()
  assert.deepEqual(sent, [{ id: '1', payload: { recommendation_id: 101, revision: 'revision-1' } }])
  assert.equal(ui.button('تأیید و اعمال قیمت جدید').props.disabled, true)
  ui.product.price = '150000'
  pending.resolve({ ...ui.pricing, recommendation: { ...ui.pricing.recommendation, status: 'approved', can_approve: false } })
  await approval
  await flush()
  assert.equal(ui.button('تأیید و اعمال قیمت جدید'), undefined)
  assert.match(ui.text(), /۱۵۰٬۰۰۰ تومان/)
})

test('individual stale approval shows the failure and fetches a new server recommendation', async t => {
  let reads = 0
  const ui = await detail(t, {
    productPricing: async () => {
      reads++
      return { policy: {}, recommendation: { ...rows()[0].recommendation, is_complete: true, revision: `fresh-${reads}` } }
    },
    approveProductPricing: async () => { throw { response: { status: 409, data: { message: 'نسخه پیشنهاد تغییر کرده است' } } } },
  })
  ui.accept()
  await ui.button('تأیید و اعمال قیمت جدید').props.onClick()
  await flush()
  assert.equal(reads, 2)
  assert.match(ui.text(), /نسخه پیشنهاد تغییر کرده است/)
  assert.equal(ui.product.price, '125000')
})

test('bulk pricing event refreshes individual details and preserves their collapsed state', async t => {
  let reads = 0
  const ui = await detail(t, { product: async () => { reads++; return { id: '1', name: 'قهوه', price: String(reads * 125000) } } })
  assert.equal(reads, 1)
  window.dispatchEvent(new Event(pricingWarningEvent))
  await flush()
  assert.equal(reads, 2)
  assert.match(ui.text(), /۲۵۰٬۰۰۰ تومان/)
  assert.equal(ui.all(el => el.type === 'details')[0].props.open, false)
})

test('a bulk event during an existing detail load queues a fresh read instead of losing it', async t => {
  const pending = deferred()
  let reads = 0
  const ui = await detail(t, {
    dashboard: () => {
      reads++
      return reads === 1 ? pending.promise : Promise.resolve({ production_costs: [{ id: '1', name: 'قهوه', price: '150000' }] })
    },
  })
  window.dispatchEvent(new Event(pricingWarningEvent))
  pending.resolve({ production_costs: [{ id: '1', name: 'قهوه', price: '125000' }] })
  await flush()
  assert.equal(reads, 2)
  assert.match(ui.text(), /قهوه/)
})
