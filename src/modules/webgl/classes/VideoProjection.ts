import {
  BoxGeometry, ClampToEdgeWrapping, FrontSide, Group, LinearFilter, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  Raycaster, SRGBColorSpace, Vector2, Vector3, Matrix4, Ray, VideoTexture
} from 'three'
import gsap from 'gsap'
import { CanvasApp, CanvasModel } from '.'
import { CONFIG } from '@/modules/webgl/data'
import { Bounds, ProjectionItem } from '@/modules/webgl/types'
import { clamp } from '@/modules/common/utils'
import { addRing, animateGridIn, animateGridOut, animateZ, findNearestExistingMesh, getKey, getMaterialFromVideo, isWithinBounds } from '../utils'

type ImageDataArray = Uint8ClampedArray

export default class VideoProjection extends CanvasModel {
  private currGrid: string = 'heart'
  private prevGrid: string | null = null
  private isAnimating: boolean = false
  private duration: number = 1
  private imgData: ImageDataArray = new Uint8ClampedArray(0)
  private DOM = {
    $body: document.querySelector('body') as HTMLBodyElement,
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
  private gridBounds: Map<string, Bounds> = new Map()

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
      ring2: CONFIG.elevation * Math.pow(CONFIG.elevationStep, 2)
    }

    for (const [index, config] of CONFIG.items.entries()) {
      this.createMask(config, index)
    }

    this.DOM.$body.style.setProperty('--total', String(CONFIG.items.length))
    this.DOM.$buttons.addEventListener('click', this.onClick.bind(this))
    this.DOM.$canvas.addEventListener('mousemove', this.onPointerMove.bind(this))
    this.DOM.$canvas.addEventListener('mouseleave', this.onPointerLeave.bind(this))
  }

  // ————————————————————————————————————————————————————————————————————————
  // Helpers
  private getCurrentGrid (): Group | undefined {
    return this.group.children.find((g) => g.name === this.currGrid) as Group | undefined
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
  // Grid creation with UVs that include gaps
  private createGrid (config: ProjectionItem, index: number): void {
    this.material = getMaterialFromVideo(config)
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

        const geometry = new BoxGeometry(CONFIG.cubeW, CONFIG.cubeH, CONFIG.cubeD)

        // start position in world span that includes gaps
        const startX = x * (CONFIG.cubeW + gapX)
        const startY = y * (CONFIG.cubeH + gapY)

        // normalized UV rectangle for this cube
        const uvX = startX / totalW
        const uvY = startY / totalH
        const uvWidth = CONFIG.cubeW / totalW
        const uvHeight = CONFIG.cubeH / totalH

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

        const key = getKey(x, y)
        gridLookup.set(key, mesh)
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

  private onClick(e: MouseEvent) {
    if (this.isAnimating) return
    const target = e.target as Element | null
    const btn = target?.closest('button')
    if (!btn || !this.DOM.$buttons.contains(btn)) return  
    const buttons = Array.from(this.DOM.$buttons.querySelectorAll<HTMLButtonElement>(':scope > button'))
    const idx = buttons.indexOf(btn)
    if (idx < 0) return

    this.DOM.$body.style.setProperty('--index', String(idx))
    this.DOM.$body.style.setProperty('--id', btn.dataset.id ?? '')
    this.DOM.$body.dataset.id = btn.dataset.id
    this.isAnimating = true
    this.prevGrid = this.currGrid
    this.currGrid = String(btn.dataset.id)
    animateGridIn(this.group, this.currGrid, this.duration, this.DOM.$canvas)
    animateGridOut(this.group, this.prevGrid, this.duration, () => this.isAnimating = false)
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
    if (!isWithinBounds(local, bounds)) {
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

    const nearest = findNearestExistingMesh(x, y, lookup, 4)
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
    addRing(nextAffected, gridLookup, cx, cy, 0, this.elevation.self)
    addRing(nextAffected, gridLookup, cx, cy, 1, this.elevation.ring1)
    addRing(nextAffected, gridLookup, cx, cy, 2, this.elevation.ring2)

    for (const key of this.lastAffected) {
      if (!nextAffected.has(key)) {
        const m = gridLookup.get(key)
        if (m) animateZ(m, (m.userData?.baseZ ?? 0))
      }
    }

    for (const [key, z] of nextAffected) {
      const m = gridLookup.get(key)!
      animateZ(m, (m.userData?.baseZ ?? 0) + z)
    }

    this.lastAffected = new Set(nextAffected.keys())
  }

  private resetLastAffected () {
    const lookup = this.meshLookupByGrid.get(this.currGrid)
    if (!lookup) return
    for (const key of this.lastAffected) {
      const m = lookup.get(key)
      if (m) animateZ(m, m.userData?.baseZ ?? 0)
    }
    this.lastAffected.clear()
  }
}
