export const pricingWarningEvent = 'pricing-warning-count-changed'

export function notifyPricingWarningsChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(pricingWarningEvent))
}
