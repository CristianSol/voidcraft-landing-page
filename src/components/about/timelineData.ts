export type TimelineMedia =
  | { kind: 'image'; src: string; alt: string }
  | { kind: 'video-placeholder'; posterSrc: string; alt: string; label: string }

export interface TimelineEvent {
  id: string
  date: string
  dateTime: string
  title: string
  description: string
  media: TimelineMedia
}

// Contenido placeholder: reemplazar con la historia real del servidor
export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'fundacion',
    date: 'Marzo 2022',
    dateTime: '2022-03-01',
    title: 'Se planta la bandera',
    description:
      'Un grupo de amigos genera el mundo y levanta el primer spawn. Nace VoidCraft SMP como un survival hispano pensado para durar.',
    media: { kind: 'image', src: '/timeline/fundacion.svg', alt: 'Ilustración del spawn fundacional del servidor' },
  },
  {
    id: 'primera-megaconstruccion',
    date: 'Julio 2022',
    dateTime: '2022-07-15',
    title: 'La primera megaconstrucción',
    description:
      'El castillo del acantilado se convierte en el primer proyecto colectivo: semanas de trabajo entre varios miembros y la prueba de que la comunidad podía construir en grande.',
    media: { kind: 'image', src: '/timeline/megaconstruccion.svg', alt: 'Ilustración de un castillo sobre un acantilado' },
  },
  {
    id: 'evento-comunitario',
    date: 'Enero 2023',
    dateTime: '2023-01-20',
    title: 'Guerra de PvP de verano',
    description:
      'El primer evento organizado del servidor: arenas construidas por la comunidad, equipos y una final que todavía se recuerda.',
    media: { kind: 'image', src: '/timeline/evento-comunitario.svg', alt: 'Ilustración de fuegos artificiales sobre una arena de combate' },
  },
  {
    id: 'hito-redstone',
    date: 'Septiembre 2023',
    dateTime: '2023-09-10',
    title: 'La compuerta de 16 bits',
    description:
      'Una calculadora de redstone funcional marca el techo técnico del servidor: gameplay técnico y decorativo conviviendo en el mismo mundo.',
    media: { kind: 'image', src: '/timeline/hito-redstone.svg', alt: 'Ilustración de circuitos de redstone' },
  },
  {
    id: 'recorrido-en-video',
    date: 'Marzo 2024',
    dateTime: '2024-03-05',
    title: 'Recorrido en video por el spawn',
    description:
      'Un video-tour graba dos años de construcciones acumuladas alrededor del spawn original, de punta a punta.',
    media: {
      kind: 'video-placeholder',
      posterSrc: '/timeline/video-poster.svg',
      alt: 'Miniatura de un recorrido en video por el spawn',
      label: 'Video próximamente',
    },
  },
  {
    id: 'temporada-actual',
    date: '2026',
    dateTime: '2026-01-10',
    title: 'La temporada actual',
    description:
      'La comunidad sigue creciendo: nuevos proyectos, nuevas caras y la misma idea de siempre — construir algo entre todos.',
    media: { kind: 'image', src: '/timeline/temporada-actual.svg', alt: 'Ilustración de un paisaje de Minecraft con un mapa' },
  },
]
