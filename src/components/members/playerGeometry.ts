import { BoxGeometry, type BufferAttribute } from 'three'

export type Triplet = [number, number, number]

export const PART_NAMES = ['head', 'body', 'rightArm', 'leftArm', 'rightLeg', 'leftLeg'] as const
export type PartName = (typeof PART_NAMES)[number]

interface PartSpec {
  /** tamaño de la caja en px de skin (modelo classic) */
  size: Triplet
  slimSize?: Triplet
  /** origen (u,v) de la capa interior y del overlay en la textura 64×64 */
  innerUV: [number, number]
  outerUV: [number, number]
  /** cuánto se infla el overlay respecto a la caja interior (0.5 el gorro, 0.25 el resto, como en MC) */
  overlayInflate: number
  /** pivote de la articulación en el espacio del modelo (pies en y=0, modelo de 32 px) */
  pivot: Triplet
  slimPivot?: Triplet
  /** centro de la caja relativo al pivote */
  meshOffset: Triplet
}

const SPECS: Record<PartName, PartSpec> = {
  head: {
    size: [8, 8, 8],
    innerUV: [0, 0],
    outerUV: [32, 0],
    overlayInflate: 0.5,
    pivot: [0, 24, 0],
    meshOffset: [0, 4, 0],
  },
  body: {
    size: [8, 12, 4],
    innerUV: [16, 16],
    outerUV: [16, 32],
    overlayInflate: 0.25,
    pivot: [0, 12, 0],
    meshOffset: [0, 6, 0],
  },
  rightArm: {
    size: [4, 12, 4],
    slimSize: [3, 12, 4],
    innerUV: [40, 16],
    outerUV: [40, 32],
    overlayInflate: 0.25,
    pivot: [-6, 22, 0],
    slimPivot: [-5.5, 22, 0],
    meshOffset: [0, -4, 0],
  },
  leftArm: {
    size: [4, 12, 4],
    slimSize: [3, 12, 4],
    innerUV: [32, 48],
    outerUV: [48, 48],
    overlayInflate: 0.25,
    pivot: [6, 22, 0],
    slimPivot: [5.5, 22, 0],
    meshOffset: [0, -4, 0],
  },
  rightLeg: {
    size: [4, 12, 4],
    innerUV: [0, 16],
    outerUV: [0, 32],
    overlayInflate: 0.25,
    pivot: [-2, 12, 0],
    meshOffset: [0, -6, 0],
  },
  leftLeg: {
    size: [4, 12, 4],
    innerUV: [16, 48],
    outerUV: [0, 48],
    overlayInflate: 0.25,
    pivot: [2, 12, 0],
    meshOffset: [0, -6, 0],
  },
}

export interface PlayerPart {
  name: PartName
  pivot: Triplet
  meshOffset: Triplet
  inner: BoxGeometry
  overlay: BoxGeometry
  /** caja para el contorno tipo Glowing (inverted hull, BackSide) */
  outline: BoxGeometry
}

export function createPlayerParts(slim: boolean): PlayerPart[] {
  return PART_NAMES.map((name) => {
    const spec = SPECS[name]
    const size = slim && spec.slimSize ? spec.slimSize : spec.size
    const pivot = slim && spec.slimPivot ? spec.slimPivot : spec.pivot
    return {
      name,
      pivot,
      meshOffset: spec.meshOffset,
      inner: createSkinBox(size, spec.innerUV, 0),
      overlay: createSkinBox(size, spec.outerUV, spec.overlayInflate),
      outline: createSkinBox(size, spec.innerUV, spec.overlayInflate + 0.6),
    }
  })
}

export function disposePlayerParts(parts: PlayerPart[]): void {
  for (const part of parts) {
    part.inner.dispose()
    part.overlay.dispose()
    part.outline.dispose()
  }
}

function createSkinBox(size: Triplet, [u, v]: [number, number], inflate: number): BoxGeometry {
  const [w, h, d] = size
  const geometry = new BoxGeometry(w + inflate * 2, h + inflate * 2, d + inflate * 2)
  setBoxUVs(geometry, u, v, w, h, d)
  return geometry
}

/**
 * Layout estándar de skins de Minecraft: para una caja de w×h×d con origen (u,v),
 * la textura se despliega en columnas [lado derecho][frente][lado izquierdo][espalda]
 * (derecha/izquierda DEL MODELO) con top y bottom arriba. El modelo mira a +z,
 * así que su lado derecho cae en la cara -x de BoxGeometry. La cara inferior va
 * volteada en vertical, como en el juego.
 */
function setBoxUVs(geometry: BoxGeometry, u: number, v: number, w: number, h: number, d: number): void {
  const uv = geometry.getAttribute('uv') as BufferAttribute
  // rects [x1, y1, x2, y2, flipY] en el orden de caras de BoxGeometry: +x, -x, +y, -y, +z, -z
  const rects: Array<[number, number, number, number, boolean?]> = [
    [u + d + w, v + d, u + 2 * d + w, v + d + h], // +x = lado izquierdo del modelo
    [u, v + d, u + d, v + d + h], // -x = lado derecho del modelo
    [u + d, v, u + d + w, v + d], // +y (top)
    [u + d + w, v, u + d + 2 * w, v + d, true], // -y (bottom, volteado)
    [u + d, v + d, u + d + w, v + d + h], // +z (frente)
    [u + 2 * d + w, v + d, u + 2 * d + 2 * w, v + d + h], // -z (espalda)
  ]
  rects.forEach(([x1, y1, x2, y2, flipY], face) => {
    const top = flipY ? y2 : y1
    const bottom = flipY ? y1 : y2
    const i = face * 4
    // orden de vértices por cara en BoxGeometry: tl, tr, bl, br (visto desde afuera)
    uv.setXY(i, x1 / 64, 1 - top / 64)
    uv.setXY(i + 1, x2 / 64, 1 - top / 64)
    uv.setXY(i + 2, x1 / 64, 1 - bottom / 64)
    uv.setXY(i + 3, x2 / 64, 1 - bottom / 64)
  })
  uv.needsUpdate = true
}
