import { onMounted } from 'vue'

/**
 * Moves focus to the current page's main heading (or <main> itself while the page is loading),
 * so keyboard and screen-reader users land on the new content after a client-side navigation.
 */
export function focusPageHeading(main: HTMLElement | null = document.querySelector('main')) {
  if (!main) return
  const target = main.querySelector<HTMLElement>('h1') ?? main
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
}

/** True when focus was parked on <main> or lost to <body>, i.e. nothing the user chose. */
export function isFocusParked(): boolean {
  const el = document.activeElement
  return !el || el === document.body || el.tagName === 'MAIN'
}

let isFirstPage = true

/**
 * Call from every routed page. After a client-side navigation the link or field that started it
 * is gone (or no longer relevant), so focus moves to the new page. The very first page of a visit
 * leaves focus alone, as a normal page load would.
 */
export function usePageFocus() {
  onMounted(() => {
    if (isFirstPage) {
      isFirstPage = false
      return
    }
    focusPageHeading()
  })
}
