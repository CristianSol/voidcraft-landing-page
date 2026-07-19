import { useEffect, useMemo } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { BackSide, DoubleSide, MeshBasicMaterial, MeshLambertMaterial } from 'three'
import { createPlayerParts, disposePlayerParts, type Triplet } from './playerGeometry'
import { useSkin } from './minecraftSkin'
import { POSES } from './poses'
import type { Member } from './membersData'

const ZERO: Triplet = [0, 0, 0]

interface PlayerModelProps {
  member: Member
  position: Triplet
  rotationY: number
  selected: boolean
  /** false con prefers-reduced-motion: el glow queda fijo, sin pulso */
  animate: boolean
  onSelect: (id: string) => void
}

export function PlayerModel({ member, position, rotationY, selected, animate, onSelect }: PlayerModelProps) {
  const { texture, slim } = useSkin(member.username)
  const parts = useMemo(() => createPlayerParts(slim), [slim])
  useEffect(() => () => disposePlayerParts(parts), [parts])

  const materials = useMemo(
    () => ({
      inner: new MeshLambertMaterial({ map: texture }),
      overlay: new MeshLambertMaterial({ map: texture, transparent: true, alphaTest: 0.4, side: DoubleSide }),
    }),
    [texture],
  )
  useEffect(
    () => () => {
      materials.inner.dispose()
      materials.overlay.dispose()
    },
    [materials],
  )

  // Glowing de MC: inverted hull morado alrededor de la silueta
  const outlineMaterial = useMemo(
    () => new MeshBasicMaterial({ color: '#a855f7', side: BackSide, transparent: true, opacity: 0.9, depthWrite: false }),
    [],
  )
  useEffect(() => () => outlineMaterial.dispose(), [outlineMaterial])

  useFrame(({ clock }) => {
    if (!selected) return
    outlineMaterial.opacity = animate ? 0.65 + Math.sin(clock.elapsedTime * 4.5) * 0.3 : 0.9
  })

  const pose = POSES[member.pose]

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect(member.id)
  }

  return (
    <group
      position={[position[0], position[1] + (pose.yOffset ?? 0), position[2]]}
      rotation-y={rotationY}
      onClick={handleClick}
      onPointerOver={(event) => {
        event.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
    >
      {parts.map((part) => (
        <group key={part.name} position={part.pivot} rotation={pose[part.name] ?? ZERO}>
          <mesh geometry={part.inner} position={part.meshOffset} material={materials.inner} />
          <mesh geometry={part.overlay} position={part.meshOffset} material={materials.overlay} />
          <mesh geometry={part.outline} position={part.meshOffset} material={outlineMaterial} visible={selected} />
        </group>
      ))}
    </group>
  )
}
