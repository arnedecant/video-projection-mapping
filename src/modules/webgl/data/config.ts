import imgHeart from '@/assets/heart.jpg'
import imgDrop from '@/assets/codrops.jpg'
import imgSmile from '@/assets/smile.jpg'
import vidPinkLiquid from '@/assets/pink-liquid.mp4'
import vidBlueLiquid from '@/assets/blue-liquid.mp4'
import vidPurpleLiquid from '@/assets/purple-liquid.mp4'
import { ProjectionConfig } from '@/modules/webgl/types'

const CONFIG: ProjectionConfig = {
  size: 22,
  spacing: 0.75,
  items: [
    {
      id: 'heart',
      mask: imgHeart,
      video: vidPinkLiquid
    },
    {
      id: 'drop',
      mask: imgDrop,
      video: vidBlueLiquid
    },
    {
      id: 'smile',
      mask: imgSmile,
      video: vidPurpleLiquid
    }
  ]
}

export default CONFIG
