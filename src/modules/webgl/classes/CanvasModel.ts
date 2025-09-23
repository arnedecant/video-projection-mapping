import { Group, MeshBasicMaterial, MeshStandardMaterial, Scene } from 'three'
import CanvasApp from './CanvasApp'

export default class CanvasModel {
  public isReady: boolean = false
  public scene: Scene
  public material: MeshStandardMaterial|MeshBasicMaterial = new MeshStandardMaterial({ color: 0xff0000 })
  public group: Group = new Group()

  constructor (app: CanvasApp) {
    this.scene = app.scene
    this.scene.add(this.group)
  }

  public update () {

  }
}
