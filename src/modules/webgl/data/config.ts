import imgHeart from '@/assets/heart.jpg'
import imgDrop from '@/assets/codrops.jpg'
import imgSmile from '@/assets/smile.jpg'
import imgKiswe from '@/assets/kiswe.jpg'
import vidPinkLiquid from '@/assets/pink-liquid.mp4'
import vidBlueLiquid from '@/assets/blue-liquid.mp4'
import vidPurpleLiquid from '@/assets/purple-liquid.mp4'
import vidKisweSizzle from '@/assets/kiswe-sizzle.mp4'
import { ProjectionConfig } from '@/modules/webgl/types'

const CONFIG: ProjectionConfig = {
  size: 21,
  spacing: 0.75,
  cubeW: 0.5,
  cubeH: 0.5,
  elevation: 1.5,
  elevationStep: 0.8,
  elevationMargin: 0.5, // margin between pointer <=> grid
  items: [
    {
      id: 'heart',
      mask: imgHeart,
      video: vidPinkLiquid
    },
    // {
    //   id: 'drop',
    //   mask: imgDrop,
    //   video: vidBlueLiquid
    // },
    // {
    //   id: 'smile',
    //   mask: imgSmile,
    //   video: vidPurpleLiquid
    // },
    {
      id: 'kiswe',
      mask: imgKiswe,
      video: vidKisweSizzle
    }
  ]
}

export default CONFIG
