import { useState, type CSSProperties, type MouseEvent } from 'react'
import { MENU_LINKS } from './menuLinks'

type MainMenuProps = {
  activeSection: string | null
  onNavigate: (id: string | null) => void
}

export function MainMenu({ activeSection, onNavigate }: MainMenuProps) {
  const docked = activeSection !== null
  const [navOpen, setNavOpen] = useState(false)

  let order = 0
  const stagger = (extra?: CSSProperties): CSSProperties =>
    ({ '--reveal-i': order++, ...extra }) as CSSProperties

  const goTo = (event: MouseEvent, id: string | null) => {
    event.preventDefault()
    setNavOpen(false)
    onNavigate(id)
  }

  return (
    <section className={`menu${docked ? ' menu--docked' : ''}`} id="inicio">
      {!docked && (
        <p className="reveal menu__kicker" style={stagger()}>
          Survival Multiplayer · Técnico y decorativo
        </p>
      )}
      <h1 className="reveal menu__title" style={stagger()}>
        <a href="#inicio" onClick={(e) => goTo(e, null)}>
          VOID<span>CRAFT</span>
        </a>
      </h1>
      {docked && (
        <button
          type="button"
          className="menu__burger"
          aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={navOpen}
          onClick={() => setNavOpen((open) => !open)}
        >
          {navOpen ? '✕' : '☰'}
        </button>
      )}
      <nav className={`menu__nav${navOpen ? ' is-open' : ''}`} aria-label="Navegación principal">
        {MENU_LINKS.map(([label, id], i) => (
          <a
            key={id}
            className={`reveal menu__item${activeSection === id ? ' is-active' : ''}`}
            style={stagger({ viewTransitionName: `menu-item-${i}` })}
            href={`#${id}`}
            onClick={(e) => goTo(e, id)}
          >
            {label}
          </a>
        ))}
        <a className="reveal menu__cta" style={stagger()} href="#unete">
          Únete al servidor
        </a>
      </nav>
    </section>
  )
}
