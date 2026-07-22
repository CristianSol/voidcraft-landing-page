import { AboutTimeline } from '../about/AboutTimeline'

export function AboutSection() {
  return (
    <section className="section-panel" id="acerca" aria-labelledby="acerca-titulo">
      <div className="section-panel__inner">
        <h2 id="acerca-titulo">Acerca de nosotros</h2>
        <p>
          VoidCraft SMP es un servidor de Minecraft survival de la comunidad hispana, enfocado en el
          gameplay técnico y decorativo. Aquí conviven granjas industriales, redstone al límite y
          megaconstrucciones con alma.
        </p>
        <p>
          Somos una comunidad pequeña y cercana: cada miembro aporta su estilo, y los proyectos
          colectivos — desde el spawn hasta las obras del End — se levantan entre todos.
        </p>
        <p>
          Este texto es un placeholder: acá irá la historia del servidor, sus temporadas y lo que
          hace única a la comunidad.
        </p>
        <AboutTimeline />
      </div>
    </section>
  )
}
