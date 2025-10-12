class _UserMediaManager {
  public stream: MediaStream | null = null
  public $video: HTMLVideoElement

  constructor () {
    this.$video = document.createElement('video')
    this.setup()
  }

  public async start () {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    this.$video.srcObject = this.stream
    this.$video.play()
  }

  public stop () {
    if (!this.stream) return
    this.stream.getTracks().forEach((track) => track.stop())
    this.stream = null
  }

  private setup () {
    this.$video.id = 'usermedia-video'
    this.$video.muted = true
    this.$video.playsInline = true
    this.$video.loop = true
    document.body.appendChild(this.$video)
  }
}

const UserMediaManager = new _UserMediaManager()
export default UserMediaManager
