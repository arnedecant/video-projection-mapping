import {
  BoxGeometry, ClampToEdgeWrapping, FrontSide, Group, LinearFilter, Mesh, MeshBasicMaterial,
  SRGBColorSpace, VideoTexture
} from 'three'
import { CanvasApp, CanvasModel } from '.'
import CONFIG from '@/modules/webgl/data/config'
import { ProjectionItem } from '@/modules/webgl/types'
import gsap from 'gsap'

export default class VideoProjection extends CanvasModel {
  private currGrid: string = 'heart'
  private prevGrid: string|null = null
  private isAnimating: boolean = false
  private duration: number = 1
  private imgData: ImageDataArray = new Uint8ClampedArray(0)
  private DOM = {
    $buttons: document.querySelector('nav.buttons') as HTMLElement,
    $canvas: document.querySelector('#canvas') as HTMLCanvasElement
  }
  private grid: Record<string, number> = {
    width: 0,
    height: 0
  }

	constructor (app: CanvasApp) {
    super(app)

    for (const [index, config] of CONFIG.items.entries()) {
      this.createMask(config, index)
    }

    this.DOM.$buttons.addEventListener('click', this.onClick.bind(this))
  }

  private createVideoTexture (config: ProjectionItem, index: number) {
    const $video = document.createElement('video')
		$video.src = config.video
		$video.crossOrigin = 'anonymous'
		$video.loop = true
		$video.muted = true
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

  private createGrid (config: ProjectionItem, index: number): void {
    this.createVideoTexture(config, index)
    const gridGroup = new Group()

    for (let x = 0; x < CONFIG.size; x++) {
      for (let y = 0; y < CONFIG.size; y++) {
        const geometry = new BoxGeometry(0.5, 0.5, 0.5)

        // Get pixel color from mask (sample at grid position)
        // Flip Y coordinate to match image orientation
        const flippedY = this.grid.height - 1 - y
        const pixelIndex = (flippedY * this.grid.width + x) * 4
        const r = this.imgData[pixelIndex]
        const g = this.imgData[pixelIndex + 1]
        const b = this.imgData[pixelIndex + 2]

        // Calculate brightness (0 = black, 255 = white)
        const brightness = (r + g + b) / 3

        // Only create box if pixel is dark (black shows, white hides)
        if (brightness >= 128) continue // Threshold for black vs white

        // Create individual geometry for each box to have unique UV mapping
        // Calculate UV coordinates for this specific box
        const uvX = x / CONFIG.size
        const uvY = y / CONFIG.size // Remove the flip to match correct orientation
        const uvWidth = 1 / CONFIG.size
        const uvHeight = 1 / CONFIG.size
        
        // Get the UV attribute
        const uvAttribute = geometry.attributes.uv
        const uvArray = uvAttribute.array
        
        // Map each face of the box to show the same portion of video
        // We'll focus on the front face (face 4) for the main projection
        for (let i = 0; i < uvArray.length; i += 2) {
          // Map all faces to the same UV region for consistency
          uvArray[i] = uvX + (uvArray[i] * uvWidth)     // U coordinate
          uvArray[i + 1] = uvY + (uvArray[i + 1] * uvHeight) // V coordinate
        }
        
        // Mark the attribute as needing update
        uvAttribute.needsUpdate = true
        
        const mesh = new Mesh(geometry, this.material)

        mesh.position.x = (x - (CONFIG.size - 1) / 2) * CONFIG.spacing
        mesh.position.y = (y - (CONFIG.size - 1) / 2) * CONFIG.spacing
        mesh.position.z = 0

        gridGroup.add(mesh)
      }
    }
    
    gridGroup.name = config.id
    gridGroup.scale.setScalar(0.5)

    this.group.add(gridGroup)
    this.isReady = true

    this.initInteractions(config, index)
  }

  private createMask (config: ProjectionItem, index: number) {
    // Create a canvas to read mask pixel data
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    const maskImage = new Image()
    maskImage.crossOrigin = 'anonymous'
    maskImage.onload = () => {
      if (!ctx) return
      // Get original image dimensions to preserve aspect ratio
      const originalWidth = maskImage.width
      const originalHeight = maskImage.height
      const aspectRatio = originalWidth / originalHeight

      // Calculate grid dimensions based on aspect ratio
      this.grid.width = aspectRatio > 1
        ? CONFIG.size
        : Math.round(CONFIG.size * aspectRatio)
      this.grid.height = aspectRatio > 1
        ? Math.round(CONFIG.size * aspectRatio)
        : CONFIG.size

      canvas.width = this.grid.width
      canvas.height = this.grid.height
      ctx?.drawImage(maskImage, 0, 0, this.grid.width, this.grid.height)

      const imageData = ctx.getImageData(0, 0, this.grid.width, this.grid.height)
      this.imgData = imageData.data
      this.createGrid(config, index)
    }

    maskImage.src = config.mask
  }

  private initInteractions (config: ProjectionItem, index: number) {    
    for (const grid of this.group.children) {
      if (grid.name === this.currGrid) continue
      grid.children.forEach((mesh) => mesh.scale.setScalar(0))
    }

    const btn = document.createElement('button')
    btn.dataset.id = config.id
    btn.textContent = config.id
    this.DOM.$buttons.appendChild(btn)
  }

  onClick (e: MouseEvent) {
    const btn = e.target as HTMLButtonElement|null
    if (!(btn instanceof HTMLButtonElement)) return
    if (this.isAnimating) return
    this.isAnimating = true
    this.prevGrid = this.currGrid
    this.currGrid = `${btn.dataset.id}`
    this.revealGrid()
    this.hideGrid()
  }

  revealGrid () {
    const grid = this.group.children.find((item) => item.name === this.currGrid)
    this.DOM.$canvas.dataset.video = this.currGrid
    const tl = gsap.timeline({ delay: this.duration * 0.25, defaults: { ease: 'power1.out', duration: this.duration } })

    for (const [index, child] of grid?.children.entries() ?? []) {
      tl
        .to(child.scale, { x: 1, y: 1, z: 1, ease: 'power3.inOut' }, index * 0.001)
        .to(child.position, { z: 0 }, '<')
    }
  }

  hideGrid () {
    // Filter the current grid based on this.old value
    const grid = this.group.children.find(item => item.name === this.prevGrid)
    const tl = gsap.timeline({
      defaults: { ease: 'power1.out', duration: this.duration },
      onComplete: () => { this.isAnimating = false }
    })
    
    for (const [index, child] of grid?.children.entries() ?? []) {
      tl
        .to(child.scale, { x: 0, y: 0, z: 0, ease: 'power3.inOut' }, index * 0.001)
        .to(child.position, {
          z: 6,
          onComplete: () => {
            gsap.set(child.scale, { x: 0, y: 0, z: 0 })
            gsap.set(child.position, { z: - 6 })
          }
        }, '<')
    }
  }

  public update () {
    super.update()
  }
}
