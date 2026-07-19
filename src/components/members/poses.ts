import type { PartName, Triplet } from './playerGeometry'

/** Rotaciones (Euler, radianes) por articulación. Poses estáticas: es una foto. */
export interface Pose extends Partial<Record<PartName, Triplet>> {
  /** desplazamiento vertical del modelo entero (px de skin), p. ej. para sentarse */
  yOffset?: number
}

const d = (deg: number): number => (deg * Math.PI) / 180

const POSE_DEFS = {
  victoria: {
    head: [d(-6), 0, 0],
    rightArm: [d(-10), 0, d(-150)],
    leftArm: [d(-10), 0, d(150)],
  },
  saludo: {
    head: [0, 0, d(6)],
    rightArm: [0, 0, d(-160)],
    leftArm: [d(5), 0, d(6)],
  },
  jarra: {
    head: [d(-4), 0, 0],
    rightArm: [d(-12), 0, d(-28)],
    leftArm: [d(-12), 0, d(28)],
  },
  apunta: {
    head: [d(-8), 0, d(-4)],
    rightArm: [d(-125), 0, d(-14)],
    leftArm: [d(4), 0, d(8)],
  },
  sentado: {
    rightLeg: [d(-90), 0, d(-4)],
    leftLeg: [d(-90), 0, d(4)],
    rightArm: [d(-38), 0, d(-6)],
    leftArm: [d(-38), 0, d(6)],
    yOffset: -10.5,
  },
  sentadoSaludo: {
    head: [0, 0, d(-6)],
    rightLeg: [d(-90), 0, d(-6)],
    leftLeg: [d(-90), 0, d(6)],
    rightArm: [0, 0, d(-155)],
    leftArm: [d(-38), 0, d(6)],
    yOffset: -10.5,
  },
  sentadoRelajado: {
    head: [d(4), 0, d(5)],
    body: [d(-6), 0, 0],
    rightLeg: [d(-90), 0, d(-10)],
    leftLeg: [d(-48), 0, d(8)],
    rightArm: [d(28), 0, d(-10)],
    leftArm: [d(28), 0, d(10)],
    yOffset: -10.5,
  },
  sentadoManosRodillas: {
    head: [0, 0, d(-8)],
    rightLeg: [d(-90), 0, d(-12)],
    leftLeg: [d(-90), 0, d(12)],
    rightArm: [d(-58), 0, d(-8)],
    leftArm: [d(-58), 0, d(8)],
    yOffset: -10.5,
  },
} satisfies Record<string, Pose>

export type PoseName = keyof typeof POSE_DEFS

export const POSES: Record<PoseName, Pose> = POSE_DEFS
