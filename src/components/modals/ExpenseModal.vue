<template>
  <Teleport to="body">
    <div v-if="modelValue" class="expense-modal-backdrop" @click.self="close">
      <form class="expense-modal" dir="rtl" @submit.prevent="submit">
        <header><div><p>مدیریت هزینه‌ها</p><h2>{{ isEditing ? 'ویرایش هزینه' : 'ثبت هزینه جدید' }}</h2></div><button type="button" class="icon-button" @click="close">×</button></header>
        <div v-if="serverError" class="form-error">{{ serverError }}</div>
        <div class="form-grid">
          <label>عنوان هزینه<input v-model.trim="form.title" maxlength="150" required><small v-if="errors.title">{{ errors.title }}</small></label>
          <label>دسته‌بندی<select v-model="form.category" required><option value="">انتخاب کنید</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select><small v-if="errors.category">{{ errors.category }}</small></label>
          <label>مبلغ (تومان)<input v-model="form.amount" type="number" min="1" step="0.01" required><small v-if="errors.amount">{{ errors.amount }}</small></label>
          <label>تاریخ هزینه<JalaliDatePicker v-model="form.date" :clearable="false" /><small v-if="errors.date">{{ errors.date }}</small></label>
          <label>وضعیت پرداخت<select v-model="form.payment_status"><option value="paid">پرداخت شده</option><option value="pending">در انتظار پرداخت</option><option value="cancelled">لغو شده</option></select></label>
          <label>روش پرداخت<select v-model="form.payment_method"><option value="">نامشخص</option><option value="cash">نقدی</option><option value="card">کارت‌خوان</option><option value="transfer">انتقال بانکی</option><option value="online">پرداخت آنلاین</option><option value="other">سایر</option></select></label>
          <label class="full">توضیحات<textarea v-model.trim="form.description" maxlength="200" rows="3" /></label>
          <label>شماره فاکتور/مرجع<input v-model.trim="form.reference_number" maxlength="50"></label>
        </div>
        <footer><button type="button" class="secondary" @click="close">انصراف</button><button class="primary" :disabled="loading">{{ loading ? 'در حال ذخیره…' : 'ذخیره هزینه' }}</button></footer>
      </form>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import JalaliDatePicker from '@/components/cost/JalaliDatePicker.vue'
const props = defineProps({ modelValue:Boolean, categories:{type:Array,default:()=>[]}, expense:{type:Object,default:null}, loading:Boolean, serverError:String, fieldErrors:{type:Object,default:()=>({})} })
const emit = defineEmits(['update:modelValue','submit'])
const errors=reactive({})
const tehranYmd=()=>{const values=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return `${values.find(v=>v.type==='year').value}-${values.find(v=>v.type==='month').value}-${values.find(v=>v.type==='day').value}`}
const fresh=()=>({title:'',category:'',amount:'',date:tehranYmd(),payment_status:'paid',payment_method:'',description:'',reference_number:''})
const form=reactive(fresh()), isEditing=computed(()=>Boolean(props.expense?.id))
function hydrate(){Object.assign(form,fresh(),props.expense?{...props.expense,date:props.expense.date?.slice(0,10)}:{})}
function close(){emit('update:modelValue',false)}
function submit(){Object.keys(errors).forEach(key=>delete errors[key]);if(!form.title)errors.title='عنوان هزینه الزامی است.';if(!form.category)errors.category='دسته‌بندی را انتخاب کنید.';if(!form.amount||Number(form.amount)<=0)errors.amount='مبلغ باید بزرگ‌تر از صفر باشد.';if(!form.date)errors.date='تاریخ هزینه الزامی است.';if(!Object.keys(errors).length)emit('submit',{...form})}
watch(()=>[props.modelValue,props.expense],hydrate,{immediate:true,deep:true});watch(()=>props.fieldErrors,value=>{Object.keys(errors).forEach(key=>delete errors[key]);for(const [key,messages] of Object.entries(value||{}))errors[key]=Array.isArray(messages)?messages[0]:messages},{deep:true})
</script>

<style scoped>.expense-modal-backdrop{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:1rem;background:#17203388}.expense-modal{width:min(680px,100%);max-height:calc(100vh - 2rem);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 24px 64px #11182744}.expense-modal header,.expense-modal footer{display:flex;align-items:center;justify-content:space-between;padding:1.2rem 1.5rem;border-bottom:1px solid #e5e7eb}.expense-modal footer{border-top:1px solid #e5e7eb;border-bottom:0;gap:.75rem;justify-content:flex-start}.expense-modal h2{font-size:1.2rem;margin:0}.expense-modal header p{font-size:.8rem;color:#8b6b50;margin:0 0 .2rem}.icon-button{border:0;background:transparent;font-size:1.7rem;cursor:pointer}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;padding:1.5rem}.form-grid label{display:grid;gap:.45rem;color:#374151;font-size:.9rem;font-weight:600}.form-grid input,.form-grid select,.form-grid textarea,:deep(.jalali-input){width:100%;border:1px solid #d1d5db!important;border-radius:9px!important;padding:.65rem .75rem!important;background:white!important;font:inherit!important}.form-grid .full{grid-column:1/-1}.form-grid small{font-size:.75rem;color:#b91c1c}.form-error{margin:1rem 1.5rem 0;padding:.75rem;border-radius:8px;background:#fef2f2;color:#b91c1c}.primary,.secondary{border:0;border-radius:9px;padding:.7rem 1rem;font:inherit;font-weight:700;cursor:pointer}.primary{background:#8a5e3a;color:#fff}.secondary{background:#f3f4f6;color:#374151}@media(max-width:600px){.form-grid{grid-template-columns:1fr}.form-grid .full{grid-column:auto}.expense-modal header,.expense-modal footer{padding:1rem}.form-grid{padding:1rem}}</style>
