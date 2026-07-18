import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ShaderMaterial } from 'three'
import { blackHoleFragmentShader, blackHoleVertexShader } from './blackHoleShader'

interface BlackHoleProps {
  progressRef: { readonly current: number }
}

export function BlackHole({ progressRef }: BlackHoleProps) {
  const materialRef = useRef<ShaderMaterial>(null)

  const mouseTarget = useRef<[number, number]>([0, 0])
  const mousePrev = useRef<[number, number]>([0, 0])
  const wind = useRef<[number, number]>([0, 0])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uResolution: { value: [1, 1] },
      uMouse: { value: [0, 0] },
      uWind: { value: [0, 0] },
    }),
    [],
  )

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      mouseTarget.current = [
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1),
      ]
    }
    window.addEventListener('pointermove', onPointerMove)
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [])

  // Los uniforms se escriben vía material.uniforms (r3f puede clonar el objeto
  // pasado como prop, así que mutar el objeto del useMemo no llega al shader).
  useFrame(({ clock, size }, delta) => {
    const material = materialRef.current
    if (!material) return
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uProgress.value = progressRef.current
    material.uniforms.uResolution.value = [size.width, size.height]

    const mouse = material.uniforms.uMouse.value as [number, number]
    const damping = Math.min(1, delta * 4)
    mouse[0] += (mouseTarget.current[0] - mouse[0]) * damping
    mouse[1] += (mouseTarget.current[1] - mouse[1]) * damping

    // Viento: velocidad del mouse escalada y acotada, con ataque rápido y
    // liberación lenta — la ráfaga aparece al mover y se disipa al parar.
    const dt = Math.max(delta, 1e-3)
    const [targetX, targetY] = mouseTarget.current
    let windX = ((targetX - mousePrev.current[0]) / dt) * 0.25
    let windY = ((targetY - mousePrev.current[1]) / dt) * 0.25
    mousePrev.current = [targetX, targetY]
    const magnitude = Math.hypot(windX, windY)
    if (magnitude > 1.2) {
      windX *= 1.2 / magnitude
      windY *= 1.2 / magnitude
    }
    const current = wind.current
    const rising = magnitude > Math.hypot(current[0], current[1])
    const smoothing = Math.min(1, delta * (rising ? 8 : 1.8))
    current[0] += (windX - current[0]) * smoothing
    current[1] += (windY - current[1]) * smoothing
    const windUniform = material.uniforms.uWind.value as [number, number]
    windUniform[0] = current[0]
    windUniform[1] = current[1]
  })

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={blackHoleVertexShader}
        fragmentShader={blackHoleFragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}
