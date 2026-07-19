import { useEffect, useState } from 'react'
import { CanvasTexture, NearestFilter, SRGBColorSpace } from 'three'

export interface LoadedSkin {
  texture: CanvasTexture
  /** modelo slim (Alex, brazos de 3 px) vs classic (Steve, 4 px) */
  slim: boolean
}

// Fuentes que sirven el PNG crudo de la skin por username, con CORS.
const SOURCES = [
  (username: string) => `https://minotar.net/skin/${username}`,
  (username: string) => `https://mc-heads.net/skin/${username}`,
]

const cache = new Map<string, Promise<LoadedSkin>>()
let fallback: LoadedSkin | null = null

export function loadSkin(username: string): Promise<LoadedSkin> {
  let promise = cache.get(username)
  if (!promise) {
    promise = fetchSkin(username).catch(() => getFallbackSkin())
    cache.set(username, promise)
  }
  return promise
}

/** Empieza con la skin fallback y cambia a la real cuando termina de bajar. */
export function useSkin(username: string): LoadedSkin {
  const [skin, setSkin] = useState<LoadedSkin>(getFallbackSkin)
  useEffect(() => {
    let alive = true
    loadSkin(username).then((loaded) => {
      if (alive) setSkin(loaded)
    })
    return () => {
      alive = false
    }
  }, [username])
  return skin
}

async function fetchSkin(username: string): Promise<LoadedSkin> {
  for (const source of SOURCES) {
    try {
      const image = await loadImage(source(username))
      // skins legacy 64×32: mejor el fallback que un mapeo roto
      if (image.naturalWidth !== 64 || image.naturalHeight !== 64) continue
      const canvas = document.createElement('canvas')
      canvas.width = 64
      canvas.height = 64
      const ctx = canvas.getContext('2d')
      if (!ctx) break
      ctx.drawImage(image, 0, 0)
      return { texture: makeTexture(canvas), slim: detectSlim(ctx) }
    } catch {
      // siguiente fuente
    }
  }
  throw new Error(`sin skin para ${username}`)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

/** En skins slim la columna extra del brazo derecho (x 54-55, y 20+) es transparente. */
function detectSlim(ctx: CanvasRenderingContext2D): boolean {
  const data = ctx.getImageData(54, 20, 2, 4).data
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) return false
  }
  return true
}

function makeTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas)
  texture.magFilter = NearestFilter
  texture.minFilter = NearestFilter
  texture.generateMipmaps = false
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** Skin procedural "fantasma del vacío" en la paleta morada, por si la red falla. */
function getFallbackSkin(): LoadedSkin {
  if (fallback) return fallback
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // regiones de la capa interior (classic); el overlay queda transparente
    ctx.fillStyle = '#2a1650'
    ctx.fillRect(0, 0, 32, 16) // cabeza
    ctx.fillRect(0, 16, 56, 16) // pierna der + torso + brazo der
    ctx.fillRect(16, 48, 32, 16) // pierna izq + brazo izq
    // cara
    ctx.fillStyle = '#4c1d95'
    ctx.fillRect(8, 8, 8, 8)
    ctx.fillStyle = '#a855f7'
    ctx.fillRect(9, 12, 2, 1)
    ctx.fillRect(13, 12, 2, 1)
  }
  fallback = { texture: makeTexture(canvas), slim: false }
  return fallback
}
