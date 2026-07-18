# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este proyecto

Rediseño de la landing page del servidor de Minecraft **VoidCraft SMP** (comunidad hispana, gameplay técnico-decorativo). La página vieja que se está reemplazando es https://voidcraft.netlify.app (HTML/CSS plano); sus secciones sirven de referencia de contenido. El usuario trabaja en español: UI, commits y comunicación en español.

Se eligió React + TypeScript (en vez de HTML/JS plano) deliberadamente, pensando en agregar a futuro login y lógica más compleja.

## Comandos

- `npm run dev` — dev server de Vite en http://localhost:5173/
- `npm run build` — typecheck (`tsc -b`) + build de producción. Es el check principal; no hay tests.
- `npm run lint` — oxlint

Para verificación visual del efecto de intro, seguir la receta de `.claude/skills/verify/SKILL.md` (Edge headless con playwright-core, capturas en varios puntos del scroll).

## Arquitectura: la intro de agujero negro

Todo el efecto de entrada depende de tres piezas que se coordinan mediante un valor de progreso de scroll (0 → 1):

1. **`src/hooks/useScrollProgress.ts`** calcula el progreso sobre el recorrido de la intro (wrapper de 300vh ⇒ `scrollY / (2 * innerHeight)`) y lo publica por dos canales a la vez:
   - un **ref** que el shader lee por frame (sin re-renders de React), y
   - la **CSS variable `--intro-progress`** en `:root`, que alimenta los fades definidos en `index.css` (overlay del contenido en el tramo 0.85→1.0, hint de scroll al inicio).

2. **`src/components/intro/IntroSection.tsx`** monta la estructura: wrapper de 300vh → contenedor `position: sticky` de 100vh → `<Canvas>` de react-three-fiber + overlay con el contenido (`MainMenu` como children). La clase `is-revealed` (estado React, umbral 0.85) activa `pointer-events` y dispara el reveal escalonado: los elementos con clase `.reveal` hacen fade-up (translateY + opacity) con `transition-delay: calc(var(--reveal-i) * 90ms)` — el índice lo asigna `MainMenu` inline. Con `prefers-reduced-motion` la intro se salta por completo (sin canvas, sin animación de reveal).

3. **`src/components/intro/blackHoleShader.ts`** contiene todo el visual: es un quad que ignora la cámara (`gl_Position = vec4(position.xy, 0, 1)`) y dibuja el agujero en el fragment shader — vista inclinada (el disco de acreción vive en un plano aplanado en Y con `TILT = 0.34`, mientras horizonte/anillo de fotones siguen circulares), rotación diferencial, fbm, halo, estrellas, viñeta. El "zoom" del scroll no mueve la cámara: escala las UV (`zoom = pow(0.1, pow(uProgress, 1.6))`), curva calibrada para que el horizonte llene la pantalla justo cuando arranca el fade del contenido (~progress 0.85). Durante la caída la cámara "orbita el disco de acreción" sin que NADA rote en pantalla: las bandas del disco barren en ángulo (`orbitSweep = ease * 2.5` sumado a `swirl`) — el material circula, no la forma —, la inclinación sube de lateral a semi-cenital (`tilt = mix(0.34, 0.75, ease)`), y la trayectoria es parabólica: un offset lateral `arc` (senoidal sobre `smoothstep(0, 0.8, uProgress)`) desvía la vista a un lado a mitad de caída y la devuelve al centro en progress 0.8, antes del fade. Las vetas llevan un `smoothstep(0.25, 0.85, bands)` de contraste — sin él no se distinguen y ningún movimiento se lee. En pantallas angostas (aspect < 1) el factor `fit` aleja la vista inicial (~30% del ancho ocupado por el agujero en un móvil típico, vs 64% sin él) y converge a 1 en progress 0.8 para no romper la calibración del negro. Importante: el usuario rechazó DOS veces cualquier rotación rígida en pantalla (roll de escena completa y roll del plano del disco); si se quiere más sensación de órbita, tocar `orbitSweep`/`tilt`, nunca añadir un `mat2` de rotación. A partir de 0.92 hay un fundido a negro de garantía. El parálax del mouse (`uMouse`, suavizado por frame en `BlackHole.tsx`, solo `pointerType === 'mouse'`) se suma **antes** del zoom y se amortigua con `(1-ease)²`, así la vista converge sola al centro durante la caída. El cursor además genera una ráfaga de viento sobre el humo: `uWind` es la velocidad suavizada del mouse (ataque rápido, liberación lenta; 0 si está quieto, así el humo vuelve solo), aplicada con signo negativo al muestreo del disco (`ps`) para que el humo se vea EMPUJADO a favor del movimiento — con signo positivo parece atraído al cursor ("magnetismo"), que fue el bug de la primera versión. Nunca tocar `p` (horizonte/estrellas) con esta distorsión.

Paleta morada compartida entre shader y CSS: `#a855f7` / `#7c3aed` / `#4c1d95` (en CSS son las variables `--void-*` de `index.css`).

### Gotcha de react-three-fiber

Los uniforms del shader deben escribirse vía `material.uniforms.*` dentro de `useFrame` (ver `BlackHole.tsx`). Mutar el objeto de uniforms creado con `useMemo` y pasado como prop **no** llega al material — r3f lo clona. Esto ya causó un bug real (el aspecto de pantalla no se aplicaba y el agujero salía elíptico).

## Pendiente

- Migrar las secciones de la página vieja: Acerca de, Miembros (tours de YouTube de creadores), Galería (~15 fotos de construcciones), Afiliados, FAQ, formulario de Únete, Redes Sociales. El `MainMenu` centrado ya enlaza a esos anchors (`#acerca`, `#galeria`, …) que hoy no existen.
- Cuando existan las secciones habrá que decidir la navegación posterior a la intro (el menú actual es una pantalla central estilo menú de juego, no un navbar persistente).
- Code-splitting: el bundle es ~1 MB (296 KB gzip) por three.js; separar la intro con `import()` cuando crezca la página.
- Warning de consola esperado e inofensivo: `THREE.Clock: This module has been deprecated` (viene de r3f).
