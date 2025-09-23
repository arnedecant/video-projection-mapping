import { CanvasApp, VideoProjection } from './webgl/classes'

export default class App {
  private canvasApp = new CanvasApp()

  constructor () {
    this.canvasApp.addModel(new VideoProjection(this.canvasApp))
  }
}
