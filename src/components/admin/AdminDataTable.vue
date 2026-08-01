<template>
  <section class="admin-data-table" :aria-busy="loading">
    <header class="data-table-header">
      <div><h1>{{ title }}</h1><p>{{ total.toLocaleString('fa-IR') }} مورد</p></div>
      <div class="data-table-tools"><slot name="tools" /></div>
    </header>

    <div v-if="error" class="table-state error-state" role="alert">
      <strong>دریافت اطلاعات ناموفق بود</strong><span>{{ error }}</span><button class="secondary-btn" @click="$emit('retry')">تلاش مجدد</button>
    </div>
    <div v-else-if="initialLoading" class="table-state loading-state"><i></i><span>در حال دریافت اطلاعات…</span></div>
    <template v-else>
      <div v-if="rows.length" class="desktop-table-wrap">
        <table>
          <thead><tr><th v-for="column in columns" :key="column.key" :class="{ sortable: column.sortable }"><button v-if="column.sortable" @click="toggleSort(column.key)">{{ column.label }} <span>{{ sortIcon(column.key) }}</span></button><span v-else>{{ column.label }}</span></th><th v-if="$slots.actions">عملیات</th></tr></thead>
          <tbody><tr v-for="row in rows" :key="row.id"><td v-for="column in columns" :key="column.key" :data-label="column.label"><slot :name="`cell-${column.key}`" :row="row">{{ row[column.key] || '—' }}</slot></td><td v-if="$slots.actions" data-label="عملیات"><slot name="actions" :row="row" /></td></tr></tbody>
        </table>
      </div>
      <div v-if="rows.length" class="mobile-cards"><article v-for="row in rows" :key="row.id"><div class="mobile-card-title"><slot name="mobile-title" :row="row" /></div><dl><template v-for="column in mobileColumns" :key="column.key"><dt>{{ column.label }}</dt><dd><slot :name="`cell-${column.key}`" :row="row">{{ row[column.key] || '—' }}</slot></dd></template></dl><div v-if="$slots.actions" class="mobile-card-actions"><slot name="actions" :row="row" /></div></article></div>
      <div v-else class="table-state empty-state"><strong>{{ emptyTitle }}</strong><span>{{ emptyDescription }}</span><button v-if="hasFilters" class="secondary-btn" @click="$emit('clear')">پاک کردن فیلترها</button></div>
      <footer v-if="total" class="table-pagination"><div>نمایش {{ from.toLocaleString('fa-IR') }} تا {{ to.toLocaleString('fa-IR') }} از {{ total.toLocaleString('fa-IR') }}</div><label>ردیف <select :value="pageSize" @change="$emit('page-size', Number($event.target.value))"><option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option></select></label><div class="page-buttons"><button :disabled="page === 1 || loading" @click="$emit('page', page - 1)">قبلی</button><span>{{ page.toLocaleString('fa-IR') }} از {{ totalPages.toLocaleString('fa-IR') }}</span><button :disabled="page >= totalPages || loading" @click="$emit('page', page + 1)">بعدی</button></div></footer>
    </template>
    <div v-if="loading && !initialLoading" class="refreshing" aria-label="در حال به‌روزرسانی" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ title: String, rows: { type: Array, default: () => [] }, columns: { type: Array, default: () => [] }, total: { type: Number, default: 0 }, page: { type: Number, default: 1 }, pageSize: { type: Number, default: 10 }, loading: Boolean, initialLoading: Boolean, error: String, sort: { type: String, default: '' }, hasFilters: Boolean, emptyTitle: { type: String, default: 'موردی یافت نشد' }, emptyDescription: { type: String, default: 'نتیجه‌ای برای نمایش وجود ندارد.' } })
const emit = defineEmits(['sort', 'page', 'page-size', 'retry', 'clear'])
const pageSizes = [10, 20, 50]
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const from = computed(() => props.total ? (props.page - 1) * props.pageSize + 1 : 0)
const to = computed(() => Math.min(props.page * props.pageSize, props.total))
const mobileColumns = computed(() => props.columns.filter(column => column.mobile !== false))
function toggleSort(key) { const next = props.sort === key ? `-${key}` : key; emit('sort', next) }
function sortIcon(key) { return props.sort === key ? '↑' : props.sort === `-${key}` ? '↓' : '↕' }
</script>

<style scoped>
.admin-data-table{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow);overflow:hidden}.data-table-header,.table-pagination{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.25rem;background:var(--surface-raised);border-bottom:1px solid var(--border)}h1,p{margin:0}h1{font-size:1.1rem;color:var(--text)}p{margin-top:.25rem;font-size:.82rem;color:var(--muted)}.data-table-tools{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}.desktop-table-wrap{overflow:auto;overscroll-behavior-inline:contain;scrollbar-color:var(--border-strong) transparent;scrollbar-width:thin}table{width:100%;min-width:780px;border-collapse:collapse}th,td{padding:.9rem 1rem;text-align:right;border-bottom:1px solid var(--border);vertical-align:middle;color:var(--text)}th{position:sticky;top:0;background:var(--surface-raised);font-size:.82rem;color:var(--muted);white-space:nowrap}th button{border:0;background:transparent;color:inherit;font:inherit;font-weight:700;padding:0;cursor:pointer}th button span{color:var(--primary);margin-right:.25rem}tbody tr:hover{background:var(--surface-hover)}tbody tr:last-child td{border-bottom:0}.table-state{min-height:260px;display:grid;place-content:center;justify-items:center;gap:.65rem;padding:2rem;text-align:center;color:var(--muted)}.table-state strong{color:var(--text)}.loading-state i{width:30px;height:30px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin .75s linear infinite}.error-state strong{color:var(--danger)}.secondary-btn,.page-buttons button{border:1px solid var(--border-strong);background:var(--surface);color:var(--text);border-radius:8px;padding:.55rem .75rem;cursor:pointer}.secondary-btn:hover,.page-buttons button:not(:disabled):hover{border-color:var(--primary);color:var(--primary)}.table-pagination{border-top:1px solid var(--border);border-bottom:0;flex-wrap:wrap;font-size:.82rem;color:var(--muted)}.table-pagination label{display:flex;align-items:center;gap:.4rem}.table-pagination select{border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:7px;padding:.35rem}.page-buttons{display:flex;align-items:center;gap:.5rem}.page-buttons button:disabled{opacity:.45;cursor:not-allowed}.mobile-cards{display:none}.refreshing{position:absolute;top:0;right:0;left:0;height:3px;background:linear-gradient(90deg,transparent,var(--primary),transparent);animation:loading 1s infinite}@keyframes spin{to{transform:rotate(360deg)}}@keyframes loading{from{transform:translateX(-100%)}to{transform:translateX(100%)}}@media(max-width:720px){.data-table-header{align-items:flex-start;flex-direction:column}.desktop-table-wrap{display:none}.mobile-cards{display:grid;gap:.75rem;padding:.75rem;background:var(--surface-subtle)}.mobile-cards article{padding:1rem;background:var(--surface);border:1px solid var(--border);border-radius:12px}.mobile-card-title{font-weight:800;color:var(--text);padding-bottom:.7rem;margin-bottom:.65rem;border-bottom:1px solid var(--border)}dl{display:grid;grid-template-columns:minmax(90px,.8fr) minmax(0,1.2fr);gap:.65rem;margin:0;font-size:.86rem}dt{color:var(--muted)}dd{margin:0;color:var(--text);text-align:left;overflow-wrap:anywhere}.mobile-card-actions{display:flex;gap:.5rem;padding-top:.9rem;margin-top:.9rem;border-top:1px solid var(--border)}.table-pagination{align-items:flex-start;flex-direction:column}.page-buttons{width:100%;justify-content:space-between}}
</style>
