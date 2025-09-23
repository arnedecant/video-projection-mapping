import { AmbientLight, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { OrbitControls } from '@three-ts/orbit-controls'
import { CanvasModel } from '.'

export default class CanvasApp {
  public models: CanvasModel[] = []
  public canvas: HTMLCanvasElement
  public renderer: WebGLRenderer
  public scene: Scene
  public camera: PerspectiveCamera
  public controls: OrbitControls
  public pixelRatio = 1

  public lights = {
    ambient: new AmbientLight(0xffffff),
    directional: new DirectionalLight(0xffffff, 10)
  }

  private _rafId = 0

  constructor (selector: string = '#canvas') {
    this.canvas = document.querySelector(selector) as HTMLCanvasElement

    // Renderer
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      alpha: true
    })
    this.renderer.setClearColor(0x000000, 0)

    // Initial size (will be corrected on first frame)
    this.pixelRatio = Math.min(window.devicePixelRatio ?? 1, 2)
    const w = this.canvas.clientWidth ?? window.innerWidth
    const h = this.canvas.clientHeight ?? window.innerHeight
    this.renderer.setPixelRatio(this.pixelRatio)
    this.renderer.setSize(w, h, false)

    // Scene / Camera / Controls
    this.scene = new Scene()
    this.camera = new PerspectiveCamera(35, w / h, 0.1, 100)
    this.camera.position.z = 6

    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true

    // Lights
    this.lights.directional.position.set(5, 5, 5)
    this.scene.add(this.lights.directional, this.lights.ambient)

    // Start loop (no window 'resize' listener needed)
    this.loop = this.loop.bind(this)
    this._rafId = requestAnimationFrame(this.loop)
  }

  /** Resize only when the displayed size or DPR actually changed. */
  private resizeIfNeeded (): void {
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2)
    const canvas = this.renderer.domElement

    // Use CSS pixel size (layout) as the target backbuffer size.
    const width = Math.floor(canvas.clientWidth ?? window.innerWidth)
    const height = Math.floor(canvas.clientHeight ?? window.innerHeight)

    const needBackbufferResize =
      canvas.width !== Math.floor(width * dpr) ||
      canvas.height !== Math.floor(height * dpr)

    const needDprUpdate = this.renderer.getPixelRatio() !== dpr

    if (needBackbufferResize || needDprUpdate) {
      // Why: set DPR before setSize so internal buffers match.
      this.renderer.setPixelRatio(dpr)
      this.renderer.setSize(width, height, false)
      this.camera.aspect = width > 0 && height > 0 ? width / height : 1
      this.camera.updateProjectionMatrix()
      this.pixelRatio = dpr
    }
  }

  public addModel (model: CanvasModel) {
    this.models.push(model)
  }

  public loop (): void {
    this._rafId = requestAnimationFrame(this.loop)
    this.resizeIfNeeded()
    this.controls.update()
    this.models.forEach((model) => model.update())
    this.renderer.render(this.scene, this.camera)
  }

  public dispose(): void {
    cancelAnimationFrame(this._rafId)
    this.controls.dispose()
    this.renderer.dispose()
  }
}
