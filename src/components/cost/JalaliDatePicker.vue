<template>
  <DatePicker
    color="var(--primary)"
    :model-value="modelValue"
    :format="modelFormat"
    display-format="jYYYY/jMM/jDD"
    locale="fa"
    :convert-numbers="true"
    :editable="false"
    :clearable="clearable"
    :min="min"
    :max="max"
    :placeholder="placeholder"
    type="date"
    input-class="jalali-input"
    @update:model-value="updateValue"
  />
</template>

<script setup>
import DatePicker from 'vue3-persian-datetime-picker'

defineProps({ modelValue: { type: String, default: '' }, modelFormat: { type: String, default: 'YYYY-MM-DD' }, clearable: { type: Boolean, default: true }, min: { type: String, default: '' }, max: { type: String, default: '' }, placeholder: { type: String, default: 'انتخاب تاریخ' } })
const emit = defineEmits(['update:modelValue'])

function updateValue(value) {
  emit('update:modelValue', value ? String(value).slice(0, 10) : '')
}
</script>
