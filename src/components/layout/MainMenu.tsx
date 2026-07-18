import type { CSSProperties } from 'react'

const LINKS: Array<[label: string, href: string]> = [
  ['Acerca de nosotros', '#acerca'],
  ['Miembros', '#miembros'],
  ['Galería', '#galeria'],
  ['Afiliados', '#afiliados'],
  ['Preguntas frecuentes', '#faq'],
  ['Redes sociales', '#redes'],
]

export function MainMenu() {
  let order = 0
  const stagger = (): CSSProperties => ({ '--reveal-i': order++ }) as CSSProperties

  return (
    <section className="menu" id="inicio">
      <p className="reveal menu__kicker" style={stagger()}>
        Survival Multiplayer · Técnico y decorativo
      </p>
      <h1 className="reveal menu__title" style={stagger()}>
        VOID<span>CRAFT</span>
      </h1>
      <nav className="menu__nav" aria-label="Navegación principal">
        {LINKS.map(([label, href]) => (
          <a key={href} className="reveal menu__item" style={stagger()} href={href}>
            {label}
          </a>
        ))}
      </nav>
      <a className="reveal menu__cta" style={stagger()} href="#unete">
        Únete al servidor
      </a>
    </section>
  )
}
