---
name: verify
description: Cómo compilar, lanzar y verificar visualmente la landing de VoidCraft (Vite + React + R3F).
---

# Verificar VoidCraft landing

- Build/typecheck: `npm run build` (tsc -b + vite build).
- Dev server: `npm run dev` en background → http://localhost:5173/.
- Superficie GUI: manejar con headless Edge vía `playwright-core` (channel `msedge`, ya instalado en Windows; `npm i playwright-core` en el scratchpad, no en el proyecto).
- Flujo clave a manejar: la intro ocupa 300vh; progreso de scroll = `scrollY / (2 * innerHeight)`. Capturar en progress 0 / 0.5 / 0.8 / 0.92 / 1: agujero negro (horizonte circular, disco aplanado en vista lateral) → caída → negro total (~0.85) → reveal escalonado del menú central → menú completo (esperar ~1.2s tras llegar al final para que termine el stagger).
- Probe de parálax: `page.mouse.move` a la izquierda y derecha con ~900ms de espera (el suavizado tarda) → el agujero debe desplazarse en dirección opuesta; ojo: el mouse puede quedar hovering un ítem del menú y dejarlo blanco en la captura final.
- Probe de ráfaga de viento: barrido rápido con `page.mouse.move(x2, y, { steps: 10 })` sobre la estela y captura inmediata (~120ms) → humo desplazado a favor del movimiento; captura 1.5s después → humo de vuelta a su posición (el viento es velocidad del mouse, no posición). En scroll medio (progress 0.5) el agujero debe verse desplazado del centro (trayectoria parabólica, vuelve al centro en 0.8) y con vetas de humo bien visibles; ninguna forma rota en pantalla (el barrido orbital vive en el ángulo de muestreo de las bandas y solo se aprecia en movimiento).
- Comprobar: overlay `.intro__overlay` con `opacity:1` y `pointer-events:auto` al final (CTA `.menu__cta` visible), `opacity:0`/`none` arriba (reversible); viewport móvil 390x844 → el horizonte debe seguir siendo un círculo (corrección de aspecto vía uniform `uResolution`) ocupando ~30% del ancho al inicio (factor `fit` de encuadre en pantallas angostas), centrado al píxel. Para medir centrado/tamaño con precisión usar `measure.js` (pngjs sobre la captura: bbox del negro contiguo desde el centro) — el humo asimétrico crea ilusión de descentrado, medir antes de "corregir".
- Gotcha conocido: los uniforms del shader deben escribirse vía `material.uniforms.*` dentro de `useFrame` — mutar el objeto del `useMemo` pasado como prop no llega al material (r3f lo clona).
- Warning esperado e inofensivo en consola: `THREE.Clock: This module has been deprecated`.
