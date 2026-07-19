import { useEffect, useRef } from 'react'

const DURATION_MS = 3100
const TRIGGER_KEYS = ['ArrowDown', 'PageDown', ' ', 'Enter']

const easeInQuad = (t: number) => t * t

/**
 * Progreso de la intro (0 → 1) disparado por el primer gesto de scroll
 * (rueda, swipe táctil o tecla). Una vez iniciado, el tween de 3.6 s corre
 * solo y no se puede acelerar ni saltar: caída que acelera hacia el final
 * (ease-in suave, t²). Devuelve un ref (sin re-renders)
 * para leerlo por frame desde el shader, y publica el valor como CSS
 * variable `--intro-progress` para los fades en CSS.
 */
export function useIntroAnimation(onChange?: (progress: number) => void) {
  const progressRef = useRef(0)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    let rafId = 0

    const publish = (progress: number) => {
      progressRef.current = progress
      document.documentElement.style.setProperty('--intro-progress', progress.toFixed(4))
      onChangeRef.current?.(progress)
    }

    const start = () => {
      removeListeners()
      const startedAt = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - startedAt) / DURATION_MS, 1)
        publish(easeInQuad(t))
        if (t < 1) rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    }

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY > 0) start()
    }
    const onTouchMove = () => start()
    const onKeyDown = (event: KeyboardEvent) => {
      if (TRIGGER_KEYS.includes(event.key)) start()
    }

    const removeListeners = () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKeyDown)
    }

    publish(0)
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKeyDown)

    return () => {
      removeListeners()
      cancelAnimationFrame(rafId)
    }
  }, [])

  return progressRef
}
