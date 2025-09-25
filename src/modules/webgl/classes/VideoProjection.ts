import {
  BoxGeometry, ClampToEdgeWrapping, FrontSide, Group, LinearFilter, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  Raycaster, SRGBColorSpace, Vector2, Vector3, Matrix4, Ray, VideoTexture
} from 'three'
import gsap from 'gsap'
import { CanvasApp, CanvasModel } from '.'
import { CONFIG } from '@/modules/webgl/data'
import { ProjectionItem } from '@/modules/webgl/types'
import { clamp } from '@/modules/common/utils'

type ImageDataArray = Uint8ClampedArray

export default class VideoProjection extends CanvasModel {
  private currGrid: string = 'heart'
  private prevGrid: string | null = null
  private isAnimating: boolean = false
  private duration: number = 1
  private imgData: ImageDataArray = new Uint8ClampedArray(0)
  private DOM = {
    $buttons: document.querySelector('nav.buttons') as HTMLElement,
    $canvas: document.querySelector('#canvas') as HTMLCanvasElement
  }
  private grid: Record<string, number> = { width: 0, height: 0 }
  public group: Group = new Group()
  public material: MeshStandardMaterial | MeshBasicMaterial = new MeshBasicMaterial()
  public isReady = false

  // hover elevation
  private raycaster = new Raycaster()
  private mouse = new Vector2()
  private hoverIdx: { x: number, y: number } | null = null
  private lastAffected: Set<string> = new Set()
  private elevation: Record<string, number> = {}
  private meshLookupByGrid: Map<string, Map<string, Mesh>> = new Map()

  // grid bounds (in grid local space, before parent scale)
  private gridBounds: Map<string, { minX: number, maxX: number, minY: number, maxY: number }> = new Map()

  // local-plane intersection temps
  private _inv = new Matrix4()
  private _localRay = new Ray()
  private _tmpV3 = new Vector3()

  private app: CanvasApp

  constructor (app: CanvasApp) {
    super(app)
    this.app = app
    this.app.scene.add(this.group)

    this.elevation = {
      self: CONFIG.elevation,
      ring1: CONFIG.elevation * CONFIG.elevationStep,
      ring2: CONFIG.elevation * Math.pow(CONFIG.elevationStep, 4)
    }

    for (const [index, config] of CONFIG.items.entries()) {
      this.createMask(config, index)
    }

    this.DOM.$buttons.addEventListener('click', this.onClick.bind(this))
    this.DOM.$canvas.addEventListener('mousemove', this.onPointerMove.bind(this))
    this.DOM.$canvas.addEventListener('mouseleave', this.onPointerLeave.bind(this))
  }

  // ————————————————————————————————————————————————————————————————————————
  // Helpers
  private key (x: number, y: number) { return `${x},${y}` }

  private getCurrentGrid (): Group | undefined {
    return this.group.children.find(g => g.name === this.currGrid) as Group | undefined
  }

  private intersectGridLocal (grid: Group): Vector3 | null {
    this.raycaster.setFromCamera(this.mouse, this.app.camera)
    this._inv.copy(grid.matrixWorld).invert()
    this._localRay.copy(this.raycaster.ray).applyMatrix4(this._inv)

    const dz = this._localRay.direction.z
    if (Math.abs(dz) < 1e-6) return null
    const t = -this._localRay.origin.z / dz
    if (t < 0) return null

    return this._tmpV3.copy(this._localRay.origin).addScaledVector(this._localRay.direction, t)
  }

  // recompute and cache local-space bounds for a grid id
  private computeGridBounds (gridId: string) {
    const halfSpan = ((CONFIG.size - 1) / 2) * CONFIG.spacing
    this.gridBounds.set(gridId, {
      minX: -halfSpan,
      maxX:  halfSpan,
      minY: -halfSpan,
      maxY:  halfSpan
    })
  }

  // ————————————————————————————————————————————————————————————————————————
  // Video / Material
  private createVideoTexture (config: ProjectionItem, _index: number) {
    const $video = document.createElement('video')
    $video.src = config.video
    $video.crossOrigin = 'anonymous'
    $video.loop = true
    $video.muted = true
    $video.playsInline = true
    $video.play()

    const videoTexture = new VideoTexture($video)
    videoTexture.minFilter = LinearFilter
    videoTexture.magFilter = LinearFilter
    videoTexture.colorSpace = SRGBColorSpace
    videoTexture.wrapS = ClampToEdgeWrapping
    videoTexture.wrapT = ClampToEdgeWrapping

    this.material = new MeshBasicMaterial({
      map: videoTexture,
      side: FrontSide
    })
  }

  // ————————————————————————————————————————————————————————————————————————
  // Grid creation with UVs that include gaps
  private createGrid (config: ProjectionItem, index: number): void {
    this.createVideoTexture(config, index)
    const gridGroup = new Group()

    const gapX = Math.max(CONFIG.spacing - CONFIG.cubeW, 0)
    const gapY = Math.max(CONFIG.spacing - CONFIG.cubeH, 0)
    const totalW = CONFIG.size * CONFIG.cubeW + (CONFIG.size - 1) * gapX
    const totalH = CONFIG.size * CONFIG.cubeH + (CONFIG.size - 1) * gapY

    const gridLookup = new Map<string, Mesh>()
    this.meshLookupByGrid.set(config.id, gridLookup)

    for (let x = 0; x < CONFIG.size; x++) {
      for (let y = 0; y < CONFIG.size; y++) {
        // mask sampling (map CONFIG.size grid → this.grid.{width,height})
        const sx = Math.floor(x * (this.grid.width / CONFIG.size))
        const sy = Math.floor(y * (this.grid.height / CONFIG.size))
        const flippedY = this.grid.height - 1 - sy
        const pixelIndex = (flippedY * this.grid.width + sx) * 4
        const r = this.imgData[pixelIndex]
        const g = this.imgData[pixelIndex + 1]
        const b = this.imgData[pixelIndex + 2]
        const brightness = (r + g + b) / 3
        if (brightness >= 128) continue

        const geometry = new BoxGeometry(CONFIG.cubeW, CONFIG.cubeH, 0.5)

        // start position in world span that includes gaps
        const startX = x * (CONFIG.cubeW + gapX)
        const startY = y * (CONFIG.cubeH + gapY)

        // normalized UV rectangle for this cube
        let uvX = startX / totalW
        let uvY = startY / totalH
        let uvWidth = CONFIG.cubeW / totalW
        let uvHeight = CONFIG.cubeH / totalH

        const uvAttribute = geometry.attributes.uv
        const a = uvAttribute.array as Float32Array
        for (let i = 0; i < a.length; i += 2) {
          a[i]     = uvX + a[i]     * uvWidth
          a[i + 1] = uvY + a[i + 1] * uvHeight
        }
        uvAttribute.needsUpdate = true

        const mesh = new Mesh(geometry, this.material)
        mesh.position.x = (x - (CONFIG.size - 1) / 2) * CONFIG.spacing
        mesh.position.y = (y - (CONFIG.size - 1) / 2) * CONFIG.spacing
        mesh.position.z = 0
        mesh.userData = { x, y, baseZ: 0 }

        gridLookup.set(this.key(x, y), mesh)
        gridGroup.add(mesh)
      }
    }

    gridGroup.name = config.id
    gridGroup.scale.setScalar(0.5)

    this.group.add(gridGroup)
    this.isReady = true

    // cache bounds for threshold checks
    this.computeGridBounds(config.id)

    this.initInteractions(config, index)
  }

  // ————————————————————————————————————————————————————————————————————————
  // Mask
  private createMask (config: ProjectionItem, index: number) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const maskImage = new Image()
    maskImage.crossOrigin = 'anonymous'
    maskImage.onload = () => {
      if (!ctx) return
      const originalWidth = maskImage.width
      const originalHeight = maskImage.height
      const aspectRatio = originalWidth / originalHeight

      this.grid.width = aspectRatio > 1
        ? CONFIG.size
        : Math.round(CONFIG.size * aspectRatio)
      this.grid.height = aspectRatio > 1
        ? Math.round(CONFIG.size * aspectRatio)
        : CONFIG.size

      canvas.width = this.grid.width
      canvas.height = this.grid.height
      ctx.drawImage(maskImage, 0, 0, this.grid.width, this.grid.height)

      const imageData = ctx.getImageData(0, 0, this.grid.width, this.grid.height)
      this.imgData = imageData.data
      this.createGrid(config, index)
    }
    maskImage.src = config.mask
  }

  // ————————————————————————————————————————————————————————————————————————
  // Interactions
  private initInteractions (config: ProjectionItem, _index: number) {
    for (const grid of this.group.children) {
      if (grid.name === this.currGrid) continue
      grid.children.forEach((mesh) => (mesh as Mesh).scale.setScalar(0))
    }

    const btn = document.createElement('button')
    btn.dataset.id = config.id
    btn.innerHTML = config.icon.trim()
    this.DOM.$buttons.appendChild(btn)
  }

  private onClick (e: MouseEvent) {
    const btn = e.target as HTMLButtonElement | null
    if (!(btn instanceof HTMLButtonElement)) return
    if (this.isAnimating) return
    this.isAnimating = true
    this.prevGrid = this.currGrid
    this.currGrid = `${btn.dataset.id}`
    this.revealGrid()
    this.hideGrid()
  }

  private revealGrid () {
    const grid = this.group.children.find((item) => item.name === this.currGrid) as Group | undefined
    this.DOM.$canvas.dataset.video = this.currGrid
    const tl = gsap.timeline({ delay: this.duration * 0.25, defaults: { ease: 'power1.out', duration: this.duration } })

    for (const [index, child] of (grid?.children.entries() ?? [])) {
      const mesh = child as Mesh
      tl.to(mesh.scale, { x: 1, y: 1, z: 1, ease: 'power3.inOut' }, index * 0.001)
        .to(mesh.position, { z: 0 }, '<')
    }
  }

  private hideGrid () {
    const grid = this.group.children.find(item => item.name === this.prevGrid) as Group | undefined
    const tl = gsap.timeline({
      defaults: { ease: 'power1.out', duration: this.duration },
      onComplete: () => { this.isAnimating = false }
    })

    for (const [index, child] of (grid?.children.entries() ?? [])) {
      const mesh = child as Mesh
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

  // ————————————————————————————————————————————————————————————————————————
  // Hover elevation using nearest tile on local z=0 plane + threshold gate
  private onPointerMove (ev: MouseEvent) {
    const rect = this.DOM.$canvas.getBoundingClientRect()
    this.mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1

    const grid = this.getCurrentGrid()
    if (!grid) return

    const local = this.intersectGridLocal(grid)
    if (!local) {
      if (this.hoverIdx) this.resetLastAffected()
      this.hoverIdx = null
      return
    }

    // threshold: only react if the pointer is within a cube's distance (0.5)
    const bounds = this.gridBounds.get(this.currGrid)
    if (!bounds) return
    if (
      local.x < bounds.minX - CONFIG.elevationMargin ||
      local.x > bounds.maxX + CONFIG.elevationMargin ||
      local.y < bounds.minY - CONFIG.elevationMargin ||
      local.y > bounds.maxY + CONFIG.elevationMargin
    ) {
      if (this.hoverIdx) this.resetLastAffected()
      this.hoverIdx = null
      return
    }

    const N = CONFIG.size
    const S = CONFIG.spacing
    const ix = Math.round(local.x / S + (N - 1) / 2)
    const iy = Math.round(local.y / S + (N - 1) / 2)
    const x = clamp(ix, 0, N - 1)
    const y = clamp(iy, 0, N - 1)

    const lookup = this.meshLookupByGrid.get(this.currGrid)
    if (!lookup) return

    const nearest = this.findNearestExisting(x, y, lookup, 4)
    if (!nearest) {
      if (this.hoverIdx) this.resetLastAffected()
      this.hoverIdx = null
      return
    }

    if (!this.hoverIdx || this.hoverIdx.x !== nearest.x || this.hoverIdx.y !== nearest.y) {
      this.hoverIdx = nearest
      this.applyNeighborhoodElevation(nearest.x, nearest.y)
    }
  }

  private onPointerLeave () {
    this.hoverIdx = null
    this.resetLastAffected()
  }

  private applyNeighborhoodElevation (cx: number, cy: number) {
    const gridLookup = this.meshLookupByGrid.get(this.currGrid)
    if (!gridLookup) return

    const nextAffected = new Map<string, number>()
    this.addRing(nextAffected, gridLookup, cx, cy, 0, this.elevation.self)
    this.addRing(nextAffected, gridLookup, cx, cy, 1, this.elevation.ring1)
    this.addRing(nextAffected, gridLookup, cx, cy, 2, this.elevation.ring2)

    for (const key of this.lastAffected) {
      if (!nextAffected.has(key)) {
        const m = gridLookup.get(key)
        if (m) this.animateZ(m, (m.userData?.baseZ ?? 0))
      }
    }

    for (const [key, z] of nextAffected) {
      const m = gridLookup.get(key)!
      this.animateZ(m, (m.userData?.baseZ ?? 0) + z)
    }

    this.lastAffected = new Set(nextAffected.keys())
  }

  private addRing (
    targets: Map<string, number>,
    lookup: Map<string, Mesh>,
    cx: number,
    cy: number,
    d: number,
    z: number
  ) {
    if (d === 0) {
      const k = this.key(cx, cy)
      if (lookup.has(k)) targets.set(k, z)
      return
    }
    for (let dx = -d; dx <= d; dx++) {
      for (let dy = -d; dy <= d; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue
        const k = this.key(cx + dx, cy + dy)
        if (lookup.has(k)) targets.set(k, z)
      }
    }
  }

  private animateZ (mesh: Mesh, z: number) {
    gsap.to(mesh.position, { z, duration: 0.15, ease: 'power2.out', overwrite: true })
  }

  private resetLastAffected () {
    const lookup = this.meshLookupByGrid.get(this.currGrid)
    if (!lookup) return
    for (const key of this.lastAffected) {
      const m = lookup.get(key)
      if (m) this.animateZ(m, (m.userData?.baseZ ?? 0))
    }
    this.lastAffected.clear()
  }

  // find nearest existing mesh index in lookup if mask removed the center tile
  private findNearestExisting (
    cx: number,
    cy: number,
    lookup: Map<string, Mesh>,
    maxR = 3
  ): { x:number, y:number } | null {
    if (lookup.has(`${cx},${cy}`)) return { x: cx, y: cy }
    for (let r = 1; r <= maxR; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
          const k = `${cx + dx},${cy + dy}`
          if (lookup.has(k)) return { x: cx + dx, y: cy + dy }
        }
      }
    }
    return null
  }
}
