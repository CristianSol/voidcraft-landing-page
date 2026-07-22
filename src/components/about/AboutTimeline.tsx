import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { TIMELINE_EVENTS } from './timelineData'

export function AboutTimeline() {
  const reducedMotion = usePrefersReducedMotion()
  const listRef = useRef<HTMLOListElement>(null)
  const itemRefs = useRef(new Map<string, HTMLLIElement>())
  const [visibleIds, setVisibleIds] = useState<Set<string>>(
    () => new Set(reducedMotion ? TIMELINE_EVENTS.map((event) => event.id) : []),
  )

  useEffect(() => {
    if (reducedMotion) return

    let observer: IntersectionObserver | undefined
    let cancelled = false

    const setup = () => {
      if (cancelled) return
      observer = new IntersectionObserver(
        (entries) => {
          const revealed = entries.filter((entry) => entry.isIntersecting)
          if (revealed.length === 0) return
          setVisibleIds((prev) => {
            const next = new Set(prev)
            for (const entry of revealed) {
              next.add(entry.target.id)
              observer!.unobserve(entry.target)
            }
            return next
          })
        },
        { threshold: 0.3, rootMargin: '0px 0px -10% 0px' },
      )

      for (const el of itemRefs.current.values()) observer.observe(el)
    }

    if (typeof document.startViewTransition === 'function') {
      // El morph menú→sección (vt-panel-in en index.css) tarda ~0.95s y captura una
      // foto del panel apenas se monta: si el observer arranca antes, el primer item
      // ya queda "revelado" y su transición corre detrás de esa foto estática, invisible.
      // Se espera a que el morph termine para que la animación se vea de verdad.
      const timeout = setTimeout(setup, 525)
      return () => {
        cancelled = true
        clearTimeout(timeout)
        observer?.disconnect()
      }
    }

    // Sin View Transitions (navegación instantánea): igual hace falta un frame de
    // margen para que el navegador pinte el estado inicial oculto antes de revelarlo.
    const frame = requestAnimationFrame(() => requestAnimationFrame(setup))
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [reducedMotion])

  useEffect(() => {
    listRef.current?.style.setProperty('--timeline-fill', String(visibleIds.size / TIMELINE_EVENTS.length))
  }, [visibleIds])

  return (
    <div className="timeline-block">
      <h3 className="timeline__heading">Nuestra historia</h3>
      <ol className="timeline" ref={listRef}>
        {TIMELINE_EVENTS.map((event) => (
          <li
            key={event.id}
            id={event.id}
            ref={(el) => {
              if (el) itemRefs.current.set(event.id, el)
              else itemRefs.current.delete(event.id)
            }}
            className={`timeline-item${visibleIds.has(event.id) ? ' is-visible' : ''}`}
          >
            <span className="timeline-item__marker" aria-hidden="true" />
            <time className="timeline-item__date" dateTime={event.dateTime}>
              {event.date}
            </time>
            <h4 className="timeline-item__title">{event.title}</h4>
            <p className="timeline-item__body">{event.description}</p>
            {event.media.kind === 'image' ? (
              <div className="timeline-item__media">
                <img src={event.media.src} alt={event.media.alt} loading="lazy" />
              </div>
            ) : (
              <div className="timeline-item__media timeline-item__video-placeholder">
                <img src={event.media.posterSrc} alt={event.media.alt} loading="lazy" />
                <span className="timeline-item__play-icon" aria-hidden="true" />
                <span className="timeline-item__video-label">{event.media.label}</span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
