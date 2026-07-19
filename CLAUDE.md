# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este proyecto

Rediseño de la landing page del servidor de Minecraft **VoidCraft SMP** (comunidad hispana, gameplay técnico-decorativo). La página vieja que se está reemplazando es https://voidcraft.netlify.app (HTML/CSS plano); sus secciones sirven de referencia de contenido. El usuario trabaja en español: UI, commits y comunicación en español.

Se eligió React + TypeScript (en vez de HTML/JS plano) deliberadamente, pensando en agregar a futuro login y lógica más compleja.

## Comandos

- `npm run dev` — dev server de Vite en http://localhost:5173/
- `npm run build` — typecheck (`tsc -b`) + build de producción. Es el check principal; no hay tests.
- `npm run lint` — oxlint

Para verificación visual del efecto de intro, seguir la receta de `.claude/skills/verify/SKILL.md` (Edge headless con playwright-core; disparar la intro con un evento `wheel` y capturar en varios instantes del tween de 4 s).

## Arquitectura: la intro de agujero negro

Todo el efecto de entrada depende de tres piezas que se coordinan mediante un valor de progreso (0 → 1):

1. **`src/hooks/useIntroAnimation.ts`** produce el progreso: la intro NO está atada al scroll. El hook espera el primer gesto (`wheel` con deltaY > 0, `touchmove`, o tecla ArrowDown/PageDown/Space/Enter) y dispara un tween de 3.6 s con `easeInQuad` que corre solo de 0 a 1 — decisión del usuario: no se puede acelerar ni saltar (los listeners se quitan al disparar), no hay vuelta atrás, y la caída acelera hacia el final (el usuario probó ease-out, luego `easeInCubic`, y se quedó con t² porque el arranque de t³ se sentía demasiado congelado). El progreso cruza el umbral del reveal, 0.85, a ~3.3 s (el usuario ajustó la duración para que la entrada del menú caiga ahí): el fade del overlay se comprime al último tramo y el reveal escalonado del menú — transiciones CSS en tiempo real — carga con la entrada. El valor se publica por dos canales a la vez:
   - un **ref** que el shader lee por frame (sin re-renders de React), y
   - la **CSS variable `--intro-progress`** en `:root`, que alimenta los fades definidos en `index.css` (overlay del contenido en el tramo 0.85→1.0, hint de scroll al inicio).

2. **`src/components/intro/IntroSection.tsx`** monta la estructura: contenedor de 100vh → `<Canvas>` de react-three-fiber + overlay con el contenido (`MainMenu` como children). La clase `is-revealed` (estado React, umbral 0.85) activa `pointer-events` y dispara el reveal escalonado: los elementos con clase `.reveal` hacen fade-up (translateY + opacity) con `transition-delay: calc(var(--reveal-i) * 90ms)` — el índice lo asigna `MainMenu` inline. Con `prefers-reduced-motion` la intro se salta por completo (sin canvas, sin animación de reveal).

3. **`src/components/intro/blackHoleShader.ts`** contiene todo el visual: es un quad que ignora la cámara (`gl_Position = vec4(position.xy, 0, 1)`) y dibuja el agujero en el fragment shader — vista inclinada (el disco de acreción vive en un plano aplanado en Y con `TILT = 0.34`, mientras horizonte/anillo de fotones siguen circulares), rotación diferencial, fbm, halo, estrellas, viñeta. El "zoom" del scroll no mueve la cámara: escala las UV (`zoom = pow(0.1, pow(uProgress, 1.6))`), curva calibrada para que el horizonte llene la pantalla justo cuando arranca el fade del contenido (~progress 0.85). Durante la caída la cámara "orbita el disco de acreción" sin que NADA rote en pantalla: las bandas del disco barren en ángulo (`orbitSweep = ease * 2.5` sumado a `swirl`) — el material circula, no la forma —, la inclinación sube de lateral a semi-cenital (`tilt = mix(0.34, 0.75, ease)`), y la trayectoria es parabólica: un offset lateral `arc` (senoidal sobre `smoothstep(0, 0.8, uProgress)`) desvía la vista a un lado a mitad de caída y la devuelve al centro en progress 0.8, antes del fade. Las vetas llevan un `smoothstep(0.25, 0.85, bands)` de contraste — sin él no se distinguen y ningún movimiento se lee. En pantallas angostas (aspect < 1) el factor `fit` aleja la vista inicial (~30% del ancho ocupado por el agujero en un móvil típico, vs 64% sin él) y converge a 1 en progress 0.8 para no romper la calibración del negro. Importante: el usuario rechazó DOS veces cualquier rotación rígida en pantalla (roll de escena completa y roll del plano del disco); si se quiere más sensación de órbita, tocar `orbitSweep`/`tilt`, nunca añadir un `mat2` de rotación. A partir de 0.92 hay un fundido a negro de garantía. El parálax del mouse (`uMouse`, suavizado por frame en `BlackHole.tsx`, solo `pointerType === 'mouse'`) se suma **antes** del zoom y se amortigua con `(1-ease)²`, así la vista converge sola al centro durante la caída. El cursor además genera una ráfaga de viento sobre el humo: `uWind` es la velocidad suavizada del mouse (ataque rápido, liberación lenta; 0 si está quieto, así el humo vuelve solo), aplicada con signo negativo al muestreo del disco (`ps`) para que el humo se vea EMPUJADO a favor del movimiento — con signo positivo parece atraído al cursor ("magnetismo"), que fue el bug de la primera versión. Nunca tocar `p` (horizonte/estrellas) con esta distorsión.

Paleta morada compartida entre shader y CSS: `#a855f7` / `#7c3aed` / `#4c1d95` (en CSS son las variables `--void-*` de `index.css`).

## Navegación post-intro: menú ↔ navbar con View Transitions

La navegación es SPA-style dentro del overlay de 100vh: `activeSection: string | null` vive en `App.tsx`. Al elegir una opción, el menú centrado se transforma en navbar superior con un morph de la **View Transitions API** (`document.startViewTransition` + `flushSync`; fallback instantáneo si no existe la API o hay `prefers-reduced-motion`). Claves:

- `MainMenu` renderiza los **mismos elementos DOM** en ambos modos (clase `menu--docked` cambia el layout); el morph depende de eso. Los `view-transition-name` van por CSS (`menu-title`, `menu-cta`, `section-panel`) o inline (`menu-item-N`).
- Clic en el título VOIDCRAFT dockeado vuelve al menú centrado (anima a la inversa).
- Móvil (≤720px): solo el logo hace el morph; los links viven en un desplegable bajo la hamburguesa (`navOpen` en `MainMenu`).
- **Gotcha**: `view-transition-name` fuerza stacking context — `.section-panel` se pintaba encima del desplegable móvil hasta darle `z-index: 10` a `.menu--docked`. Ya causó un bug real (los links del desplegable no recibían clics).
- Las secciones con contenido viven en el mapa `SECTIONS` de `App.tsx` (`acerca` → `AboutSection`, `miembros` → `MembersSection`, ambas placeholder); las opciones sin componente muestran "Sección en construcción". Los labels/ids viven en `src/components/layout/menuLinks.ts`. Al cambiar de sección a sección, ambos paneles comparten `view-transition-name: section-panel`: el viejo hace fade-out rápido (0.15 s) y el nuevo entra con el fade-up retrasado (0.35 s) — queda un beat en negro deliberado entre ambos.

## Sección Miembros: foto grupal 3D (`src/components/members/`)

Escena R3F con el staff posando como en una foto (fila de atrás de pie, delantera sentada); clic en un miembro = glow estilo Glowing de MC + tarjeta HTML con nombre/rol. Claves:

- **Sin skinview3d, a propósito**: esa librería depende de three 0.156 y el proyecto usa 0.185 (npm duplicaría three, ~600 KB extra). El modelo del jugador se construye a mano: `playerGeometry.ts` genera las 6 cajas + overlays con los UVs del layout estándar de skins 64×64 — columnas [lado derecho][frente][lado izquierdo][espalda] del modelo; como el modelo mira a +z, su derecha cae en la cara **-x** de BoxGeometry; la cara inferior va volteada en vertical. El orden de vértices por cara de BoxGeometry es tl,tr,bl,br visto desde afuera.
- `minecraftSkin.ts`: skins por username en runtime (minotar.net, fallback mc-heads.net; cache de promesas por username), detección slim/classic por alpha en la zona (54,20), y skin procedural morada "fantasma del vacío" si la red falla o la skin es legacy 64×32. Texturas con `NearestFilter` + `SRGBColorSpace`; el Canvas usa `flat` (sin tone mapping) para color fiel de pixel art.
- Poses estáticas en `poses.ts` (rotaciones Euler por articulación + `yOffset`), asignadas por miembro en `membersData.ts`. **Gotcha aprendido**: rotar piernas en X (hacia la cámara) casi no se lee de frente por el escorzo — una pose "agachado" parecía de pie a tamaño completo y tapaba la fila de atrás; por eso la fila delantera usa variantes sentadas (piernas a -90°, `yOffset` -10.5).
- Glow de selección: inverted hull (tercera caja por parte, inflada ~0.85, `BackSide`, morado `#a855f7`, `depthWrite: false`) con pulso de opacidad en `useFrame` — sin postprocesado ni dependencias nuevas. Selección con raycast nativo de r3f (`onClick` en el group, `onPointerMissed` del Canvas deselecciona).
- Cámara fija tipo foto + parallax de mouse (mismo patrón de suavizado y `pointerType === 'mouse'` que `BlackHole.tsx`); la distancia se recalcula por frame según el aspect para que el grupo entero quepa en pantallas angostas. Con `prefers-reduced-motion`: sin parallax y glow fijo (la escena queda).
- La tarjeta (`.member-card`) es HTML absoluto sobre el canvas, en `MembersSection`; hay una lista `sr-only` de botones como espejo accesible. El canvas solo existe con la sección abierta (los dos canvas conviven sin problema de rendimiento). r3f pone `touch-action: none` al canvas; `index.css` lo pisa con `pan-y` para no bloquear el scroll del panel en táctil.
- El fondo de la escena es `public/members-bg.png` (hoy: screenshot del End con el Ender Dragon, de Wikimedia Commons) — **reemplazable por cualquier imagen**: el CSS de `.members-scene` le pone encima tinte oscuro + halo morado para que las skins resalten, así que casi cualquier paisaje de Minecraft funciona. El canvas es transparente (`gl alpha` por defecto) y la imagen vive detrás como background CSS.

### Gotcha de react-three-fiber

Los uniforms del shader deben escribirse vía `material.uniforms.*` dentro de `useFrame` (ver `BlackHole.tsx`). Mutar el objeto de uniforms creado con `useMemo` y pasado como prop **no** llega al material — r3f lo clona. Esto ya causó un bug real (el aspecto de pantalla no se aplicaba y el agujero salía elíptico).

## Pendiente

- Cuando existan secciones debajo de la intro, el body volverá a tener overflow: habrá que bloquear el scroll de página (`overflow: hidden` en `body`) hasta que la intro termine (`revealed`), para que el gesto inicial no desplace la página además de disparar la caída.
- Migrar las secciones de la página vieja: Acerca de (hoy placeholder), Galería (~15 fotos de construcciones), Afiliados, FAQ, formulario de Únete, Redes Sociales. Cada una se registra en el mapa `SECTIONS` de `App.tsx`.
- Miembros: hoy solo el staff (9) en la foto 3D; faltan los ~38 miembros restantes de la página vieja (agregar a `membersData.ts`; la escena acomoda por fila), los tours de YouTube por creador y las redes de cada miembro en la tarjeta.
- El CTA "Únete al servidor" apunta a `#unete`, que aún no existe como sección navegable.
- Code-splitting: el bundle es ~1 MB (296 KB gzip) por three.js; separar la intro con `import()` cuando crezca la página.
- Warning de consola esperado e inofensivo: `THREE.Clock: This module has been deprecated` (viene de r3f).
