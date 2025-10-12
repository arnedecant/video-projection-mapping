import { ClampToEdgeWrapping, FrontSide, Group, LinearFilter, Mesh, MeshBasicMaterial, SRGBColorSpace, Vector3, VideoTexture } from 'three'
import { Bounds, ProjectionItem } from '../types'
import { getCommaSeparatedString } from '@/modules/common/utils'
import gsap from 'gsap'
import { CONFIG } from '../data'

export const getKey = (x: number, y: number) => getCommaSeparatedString(x, y)

export const getMaterialFromVideo = (config: ProjectionItem, webcamVideo?: HTMLVideoElement): MeshBasicMaterial => {
  const $video = webcamVideo || document.createElement('video')
  
  if (!webcamVideo) {
    $video.src = config.video
    $video.crossOrigin = 'anonymous'
    $video.loop = true
    $video.muted = true
    $video.playsInline = true
    $video.play()
  }

  const videoTexture = new VideoTexture($video)
  videoTexture.minFilter = LinearFilter
  videoTexture.magFilter = LinearFilter
  videoTexture.colorSpace = SRGBColorSpace
  videoTexture.wrapS = ClampToEdgeWrapping
  videoTexture.wrapT = ClampToEdgeWrapping

  return new MeshBasicMaterial({
    map: videoTexture,
    side: FrontSide
  })
}

export const animateZ = (mesh: Mesh, z: number): void => {
  gsap.to(mesh.position, { z, duration: 0.15, ease: 'power2.out', overwrite: true })
}

export const isWithinBounds = (local: Vector3, bounds: Bounds): boolean => {
  return local.x >= bounds.minX - CONFIG.elevation.margin
    && local.x <= bounds.maxX + CONFIG.elevation.margin
    && local.y >= bounds.minY - CONFIG.elevation.margin
    && local.y <= bounds.maxY + CONFIG.elevation.margin
}

export const findNearestExistingMesh = (
  cx: number,
  cy: number,
  lookup: Map<string, Mesh>,
  maxR = 3
): { x: number, y: number } | null => {
  const cKey = getKey(cx, cy)
  if (lookup.has(cKey)) return { x: cx, y: cy }
  for (let r = 1; r <= maxR; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
        const dKey = getKey(cx + dx, cy + dy)
        if (lookup.has(dKey)) return { x: cx + dx, y: cy + dy }
      }
    }
  }
  return null
}

export const addRing = (
  targets: Map<string, number>,
  lookup: Map<string, Mesh>,
  cx: number,
  cy: number,
  d: number,
  z: number
): void => {
  if (d === 0) {
    const k = getKey(cx, cy)
    if (lookup.has(k)) targets.set(k, z)
    return
  }
  for (let dx = -d; dx <= d; dx++) {
    for (let dy = -d; dy <= d; dy++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue
      const k = getKey(cx + dx, cy + dy)
      if (lookup.has(k)) targets.set(k, z)
    }
  }
}

export const animateGridIn = (
  group: Group,
  currGridName: string,
  duration: number,
  $canvas: HTMLCanvasElement
): void => {
  const grid = group.children.find((item) => item.name === currGridName)
  $canvas.dataset.video = currGridName
  const tl = gsap.timeline({ delay: duration * 0.25, defaults: { ease: 'power1.out', duration: duration } })

  for (const [index, mesh] of (grid?.children.entries() ?? [])) {
    tl.to(mesh.scale, { x: 1, y: 1, z: 1, ease: 'power3.inOut' }, index * 0.001)
      .to(mesh.position, { z: 0 }, '<')
  }
}

export const animateGridOut = (group: Group, prevGridName: string, duration: number, onComplete: Function): void => {
  const grid = group.children.find((item) => item.name === prevGridName)
  const tl = gsap.timeline({
    defaults: { ease: 'power1.out', duration: duration },
    onComplete: () => onComplete()
  })

  for (const [index, mesh] of (grid?.children.entries() ?? [])) {
    tl.to(mesh.scale, { x: 0, y: 0, z: 0, ease: 'power3.inOut' }, index * 0.001)
      .to(mesh.position, {
        z: 6,
        onComplete: () => {
          gsap.set(mesh.scale, { x: 0, y: 0, z: 0 })
          gsap.set(mesh.position, { z: -6 })
        }
      }, '<')
  }
}
