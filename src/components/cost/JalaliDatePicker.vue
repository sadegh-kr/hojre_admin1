<template>
  <DatePicker
    :model-value="modelValue"
    :format="modelFormat"
    display-format="jYYYY/jMM/jDD"
    :editable="false"
    :clearable="clearable"
    :placeholder="placeholder"
    type="date"
    input-class="jalali-input"
    @update:model-value="updateValue"
  />
</template>

<script setup>
import DatePicker from 'vue3-persian-datetime-picker'

defineProps({ modelValue: { type: String, default: '' }, modelFormat: { type: String, default: 'YYYY-MM-DD' }, clearable: { type: Boolean, default: true }, placeholder: { type: String, default: 'انتخاب تاریخ' } })
const emit = defineEmits(['update:modelValue'])

function updateValue(value) {
  emit('update:modelValue', value ? String(value).slice(0, 10) : '')
}
</script>
