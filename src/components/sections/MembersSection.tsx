import { useRef, useState } from 'react'
import { MembersScene } from '../members/MembersScene'
import { STAFF } from '../members/membersData'

export function MembersSection() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = STAFF.find((m) => m.id === selectedId)
  // la tarjeta conserva el último miembro para que el fade-out no se vacíe
  const lastShownRef = useRef(STAFF[0])
  if (selected) lastShownRef.current = selected
  const card = selected ?? lastShownRef.current

  return (
    <section className="section-panel" id="miembros" aria-labelledby="miembros-titulo">
      <div className="section-panel__inner section-panel__inner--wide">
        <h2 id="miembros-titulo">Miembros</h2>
        <p>
          El staff de VoidCraft SMP posando para la foto. Haz clic en un miembro para conocerlo.
        </p>
        <div className="members-stage">
          <MembersScene selectedId={selectedId} onSelect={setSelectedId} />
          <aside
            className={`member-card${selected ? ' is-open' : ''}`}
            aria-live="polite"
            aria-hidden={!selected}
          >
            <h3>{card.displayName}</h3>
            <p className="member-card__role">{card.role}</p>
            <button
              type="button"
              className="member-card__close"
              onClick={() => setSelectedId(null)}
              aria-label="Cerrar tarjeta"
              tabIndex={selected ? 0 : -1}
            >
              ×
            </button>
          </aside>
        </div>
        {/* selector accesible por teclado / lector de pantalla, espejo de la escena */}
        <ul className="sr-only" aria-label="Miembros del staff">
          {STAFF.map((member) => (
            <li key={member.id}>
              <button type="button" onClick={() => setSelectedId(member.id)}>
                {member.displayName} — {member.role}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
