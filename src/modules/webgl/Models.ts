import {
  BoxGeometry, ClampToEdgeWrapping, FrontSide, Group, LinearFilter, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Scene, SRGBColorSpace, VideoTexture
} from 'three'
import AppGL from './AppGL'

export default class Models {
  private grid: Record<string, number> = {
    size: 10,
    spacing: 0.75
  }
  private isReady: boolean = false
  private scene: Scene
  private material: MeshStandardMaterial|MeshBasicMaterial = new MeshStandardMaterial({ color: 0xff0000 })
  private group: Group = new Group()
  private $video: HTMLVideoElement
  private videoTexture: VideoTexture

	constructor (app: AppGL) {
    this.scene = app.scene
    this.scene.add(this.group)
    this.$video = document.createElement('video')
		this.videoTexture = new VideoTexture(this.$video)
    this.createGrid()
  }

  private createVideoTexture() {
		this.$video.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
		this.$video.crossOrigin = 'anonymous'
		this.$video.loop = true
		this.$video.muted = true
		this.$video.play()

		this.videoTexture.minFilter = LinearFilter
		this.videoTexture.magFilter = LinearFilter
		this.videoTexture.colorSpace = SRGBColorSpace
		this.videoTexture.wrapS = ClampToEdgeWrapping
		this.videoTexture.wrapT = ClampToEdgeWrapping

		this.material = new MeshBasicMaterial({ 
			map: this.videoTexture,
			side: FrontSide
		})
  }

  private createGrid (): void {
    this.createVideoTexture()

    const gridGroup = new Group()
    this.group.add(gridGroup)

    for (let x = 0; x < this.grid.size; x++) {
      for (let y = 0; y < this.grid.size; y++) {
        const geometry = new BoxGeometry(0.5, 0.5, 0.5)

        // Create individual geometry for each box to have unique UV mapping
        // Calculate UV coordinates for this specific box
        const uvX = x / this.grid.size
        const uvY = y / this.grid.size // Remove the flip to match correct orientation
        const uvWidth = 1 / this.grid.size
        const uvHeight = 1 / this.grid.size

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
        mesh.position.x = (x - (this.grid.size - 1) / 2) * this.grid.spacing
        mesh.position.y = (y - (this.grid.size - 1) / 2) * this.grid.spacing
        mesh.position.z = 0;
        gridGroup.add(mesh)
      }
    }
    
    this.group.scale.setScalar(0.5)
    this.isReady = true
  }
}
