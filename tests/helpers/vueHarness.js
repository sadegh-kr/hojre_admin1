import { readFileSync } from 'node:fs'
import { compileScript, parse } from '@vue/compiler-sfc'
import * as Vue from 'vue'
import * as selection from '../../src/utils/bulkPricingSelection.js'
import * as pagination from '../../src/utils/clientPagination.js'
import * as presentation from '../../src/utils/pricingPresentation.js'
import * as warnings from '../../src/utils/pricingWarnings.js'

// Exercise the actual SFC setup and template without a browser or extra dependencies.
const costSource = readFileSync(new URL('../../src/utils/costControl.js', import.meta.url), 'utf8')
  .replace("'@/api/error'", JSON.stringify(new URL('../../src/api/error.js', import.meta.url).href))
export const cost = await import(`data:text/javascript;base64,${Buffer.from(costSource).toString('base64')}`)

export const flush = async () => { for (let i = 0; i < 12; i++) await Vue.nextTick() }
export function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

export function compile(path, api, overrides = {}) {
  const filename = new URL(`../../src/${path}`, import.meta.url)
  const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename: filename.pathname })
  const script = compileScript(descriptor, {
    id: path, inlineTemplate: true, templateOptions: { compilerOptions: { hoistStatic: false } },
  })
  const stub = { render: () => Vue.h('div') }
  const modules = {
    vue: Vue,
    '@/api/product-cost.api.js': { default: api },
    '@/utils/costControl': cost,
    '@/utils/bulkPricingSelection': selection,
    '@/utils/clientPagination': pagination,
    '@/utils/pricingPresentation': presentation,
    '@/utils/pricingWarnings': warnings,
    '@/components/cost/JalaliDatePicker.vue': { default: stub },
    '@/components/cost/MonthlyIngredientAnalysis.vue': { default: stub },
    '@/components/cost/BulkPricingPreview.vue': { default: stub },
    ...overrides,
  }
  const code = script.content.replace(/import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?/g, (_, bindings, source) => {
    if (!modules[source]) throw new Error(`Unexpected test dependency: ${source}`)
    return bindings.trim().startsWith('{')
      ? `const ${bindings.replace(/\bas\b/g, ':')} = modules[${JSON.stringify(source)}];`
      : `const ${bindings.trim()} = modules[${JSON.stringify(source)}].default;`
  }).replace('export default', 'return')
  return new Function('modules', code)(modules)
}

export function mount(t, component, props = {}) {
  const oldWindow = globalThis.window, oldDocument = globalThis.document, oldDocumentClass = globalThis.Document
  globalThis.Document = class extends EventTarget {}
  globalThis.window = new EventTarget()
  globalThis.document = Object.assign(new Document(), { hidden: false, activeElement: null })
  const node = (type, text = '') => ({
    type, tagName: type.toUpperCase(), text, children: [], props: {}, parent: null, value: '',
    get options() { return this.children.filter(child => child.type === 'option') },
    getAttribute(name) { return this.props[name] },
    getRootNode() { return document },
    focus() { document.activeElement = this }, scrollIntoView() {},
    addEventListener() {}, removeEventListener() {}, setAttribute() {}, removeAttribute() {},
  })
  const body = node('body'), root = node('root')
  const renderer = Vue.createRenderer({
    createElement: node, createText: text => node('#text', text), createComment: text => node('#comment', text),
    setText: (el, text) => { el.text = text },
    setElementText: (el, text) => { el.children = []; el.text = text },
    patchProp: (el, key, old, value) => { el.props[key] = value },
    parentNode: el => el.parent,
    nextSibling: el => el.parent?.children[el.parent.children.indexOf(el) + 1] || null,
    querySelector: selector => selector === 'body' ? body : null,
    insert(el, parent, anchor = null) {
      if (el.parent) el.parent.children.splice(el.parent.children.indexOf(el), 1)
      el.parent = parent
      const index = anchor ? parent.children.indexOf(anchor) : -1
      if (index < 0) parent.children.push(el)
      else parent.children.splice(index, 0, el)
    },
    remove(el) { if (el.parent) el.parent.children.splice(el.parent.children.indexOf(el), 1) },
  })
  const app = renderer.createApp(component, props)
  app.mount(root)
  t.after(() => {
    app.unmount()
    globalThis.window = oldWindow
    globalThis.document = oldDocument
    globalThis.Document = oldDocumentClass
  })
  const all = (predicate, start = root) => [start, ...start.children.flatMap(child => all(() => true, child))].filter(predicate)
  const text = (start = root) => start.type === '#comment' ? '' : `${start.text}${start.children.map(child => text(child)).join('')}`
  const button = (label, start = root) => all(el => el.type === 'button' && text(el).includes(label), start)[0]
  return { root, body, all, text, button }
}
