import { getApiErrorMessage } from '@/api/error'

export const formatCostNumber = value => Number(value || 0).toLocaleString('fa-IR', { maximumFractionDigits: 3 })
export const formatMoney = value => `${formatCostNumber(value)} تومان`
export const costErrorMessage = error => getApiErrorMessage(error)
export const overheadKindLabel = value => ({
  fixed: 'ثابت', variable: 'متغیر', salary: 'حقوق و دستمزد', utility: 'آب، برق و گاز',
  maintenance: 'تعمیر و نگهداری', transport: 'حمل‌ونقل', other: 'سایر',
})[value] || value

export const tehranToday = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())
