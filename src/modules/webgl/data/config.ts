import imgHeart from '@/assets/heart.jpg'
import imgDrop from '@/assets/codrops.jpg'
import imgSmile from '@/assets/smile.jpg'
import imgKiswe from '@/assets/kiswe.jpg'
import vidConcert from '@/assets/concert.mp4'
import vidCrowd from '@/assets/crowd.mp4'
import vidFuture from '@/assets/future.mp4'
import vidKisweSizzle from '@/assets/kiswe-sizzle.mp4'
import { ProjectionConfig } from '@/modules/webgl/types'

const CONFIG: ProjectionConfig = {
  size: 21,
  spacing: 0.75,
  cubeW: 0.5,
  cubeH: 0.5,
  elevation: 2,
  elevationStep: 0.8,
  elevationMargin: 0.5, // margin between pointer <=> grid
  items: [
    {
      id: 'heart',
      mask: imgHeart,
      video: vidConcert
    },
    {
      id: 'drop',
      mask: imgDrop,
      video: vidCrowd
    },
    {
      id: 'smile',
      mask: imgSmile,
      video: vidFuture
    },
    // {
    //   id: 'kiswe',
    //   mask: imgKiswe,
    //   video: vidKisweSizzle
    // }
  ]
}

export default CONFIG
