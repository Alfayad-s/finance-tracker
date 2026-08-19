import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(
  active: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!active) return
    const node = containerRef.current
    if (!node) return

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const getFocusable = () =>
      [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.getAttribute('aria-hidden') !== 'true',
      )

    const frame = window.requestAnimationFrame(() => {
      if (node.contains(document.activeElement)) return
      const items = getFocusable()
      ;(items[0] ?? node).focus()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = getFocusable()
      if (items.length === 0) {
        event.preventDefault()
        node.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (previous && document.body.contains(previous)) previous.focus()
    }
  }, [active, containerRef])
}
