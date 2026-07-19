import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PlayerModel } from './PlayerModel'
import { STAFF, type Member } from './membersData'
import type { Triplet } from './playerGeometry'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

const FOV = 35
const LOOK_AT: Triplet = [0, 15, 0]
const BASE_DISTANCE = 108
/** medio ancho del grupo + margen; en pantallas angostas la cámara se aleja para que quepa */
const GROUP_HALF_WIDTH = 48

interface Placement {
  position: Triplet
  rotationY: number
}

const PLACEMENTS: ReadonlyMap<string, Placement> = (() => {
  const map = new Map<string, Placement>()
  const place = (row: Member[], z: number, spacing: number) => {
    row.forEach((member, i) => {
      const x = (i - (row.length - 1) / 2) * spacing
      // cada uno gira apenas hacia el centro, como acomodándose para la foto
      map.set(member.id, { position: [x, 0, z], rotationY: -x * 0.008 })
    })
  }
  place(STAFF.filter((m) => m.row === 'back'), -9, 16)
  place(STAFF.filter((m) => m.row === 'front'), 8, 17.5)
  return map
})()

/** Cámara fija tipo foto + parallax sutil de mouse (mismo lenguaje que la intro). */
function CameraRig({ parallax }: { parallax: boolean }) {
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!parallax) return
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      target.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -((event.clientY / window.innerHeight) * 2 - 1),
      }
    }
    window.addEventListener('pointermove', onPointerMove)
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [parallax])

  useFrame(({ camera, size }, delta) => {
    const aspect = size.width / Math.max(1, size.height)
    const hFov = 2 * Math.atan(Math.tan((FOV * Math.PI) / 360) * aspect)
    const distance = Math.max(BASE_DISTANCE, GROUP_HALF_WIDTH / Math.tan(hFov / 2))
    const damping = Math.min(1, delta * 4)
    current.current.x += (target.current.x - current.current.x) * damping
    current.current.y += (target.current.y - current.current.y) * damping
    camera.position.set(current.current.x * 5, 30 + current.current.y * 3, distance)
    camera.lookAt(LOOK_AT[0], LOOK_AT[1], LOOK_AT[2])
  })
  return null
}

interface MembersSceneProps {
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function MembersScene({ selectedId, onSelect }: MembersSceneProps) {
  const reducedMotion = usePrefersReducedMotion()

  // si el canvas se desmonta con un miembro en hover, el cursor no debe quedar pegado
  useEffect(
    () => () => {
      document.body.style.cursor = ''
    },
    [],
  )

  return (
    <div className="members-scene">
      <Canvas
        flat
        dpr={[1, 2]}
        camera={{ fov: FOV, near: 1, far: 400, position: [0, 30, BASE_DISTANCE] }}
        gl={{ antialias: true }}
        onPointerMissed={() => onSelect(null)}
      >
        <CameraRig parallax={!reducedMotion} />
        <ambientLight intensity={1.15} color="#d9cef2" />
        <directionalLight position={[40, 80, 90]} intensity={2.1} />
        <directionalLight position={[-50, 30, -40]} intensity={0.9} color="#7c3aed" />
        {STAFF.map((member) => {
          const placement = PLACEMENTS.get(member.id)
          if (!placement) return null
          return (
            <PlayerModel
              key={member.id}
              member={member}
              position={placement.position}
              rotationY={placement.rotationY}
              selected={member.id === selectedId}
              animate={!reducedMotion}
              onSelect={onSelect}
            />
          )
        })}
      </Canvas>
    </div>
  )
}
