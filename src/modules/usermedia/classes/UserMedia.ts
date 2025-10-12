class _UserMediaManager {
  public stream: MediaStream | null = null
  public $video: HTMLVideoElement

  constructor () {
    this.$video = document.createElement('video')
  }

  public async init () {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    this.$video.srcObject = this.stream
    this.$video.play()
  }
}

const UserMediaManager = new _UserMediaManager()
export default UserMediaManager
