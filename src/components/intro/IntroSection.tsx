import { useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { BlackHole } from './BlackHole'
import { useScrollProgress } from '../../hooks/useScrollProgress'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

const INTRO_HEIGHT_VH = 300
const REVEAL_AT = 0.85

export function IntroSection({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false)
  const progressRef = useScrollProgress(INTRO_HEIGHT_VH, (progress) => {
    setRevealed(progress >= REVEAL_AT)
  })
  const reducedMotion = usePrefersReducedMotion()

  if (reducedMotion) {
    return (
      <div className="intro intro--static">
        <div className="intro__overlay is-revealed">{children}</div>
      </div>
    )
  }

  return (
    <div className="intro" style={{ height: `${INTRO_HEIGHT_VH}vh` }}>
      <div className="intro__sticky">
        <Canvas
          className="intro__canvas"
          dpr={[1, 2]}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
        >
          <BlackHole progressRef={progressRef} />
        </Canvas>
        <p className="intro__hint" aria-hidden="true">
          Desliza hacia el vacío
        </p>
        <div className={`intro__overlay${revealed ? ' is-revealed' : ''}`}>{children}</div>
      </div>
    </div>
  )
}
