import { useEffect, useRef } from 'react'

/**
 * Progreso de scroll (0 → 1) sobre un recorrido de `scrollHeightVh`.
 * Devuelve un ref (sin re-renders) para leerlo por frame desde el shader,
 * y publica el valor como CSS variable `--intro-progress` para los fades en CSS.
 */
export function useScrollProgress(scrollHeightVh: number, onChange?: (progress: number) => void) {
  const progressRef = useRef(0)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const update = () => {
      const total = (window.innerHeight * scrollHeightVh) / 100 - window.innerHeight
      const raw = total > 0 ? window.scrollY / total : 1
      const progress = Math.min(Math.max(raw, 0), 1)
      progressRef.current = progress
      document.documentElement.style.setProperty('--intro-progress', progress.toFixed(4))
      onChangeRef.current?.(progress)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [scrollHeightVh])

  return progressRef
}
