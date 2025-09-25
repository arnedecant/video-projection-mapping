import {
  imgHeart, imgDrop, imgSmile, imgKiswe, imgLungs, vidConcert, vidCrowd, vidFuture, svgYinYang, svgLungs, svgHeart, imgYinYang
} from './assets'
import { ProjectionConfig } from '@/modules/webgl/types'

const CONFIG: ProjectionConfig = {
  size: 21,
  spacing: 0.6,
  cubeW: 0.5,
  cubeH: 0.5,
  elevation: 2,
  elevationStep: 0.8,
  elevationMargin: 0.5, // margin between pointer <=> grid interaction
  items: [
    {
      id: 'heart',
      icon: svgHeart,
      mask: imgHeart,
      video: vidConcert
    },
    {
      id: 'lungs',
      icon: svgLungs,
      mask: imgLungs,
      video: vidCrowd
    },
    {
      id: 'yin-yang',
      icon: svgYinYang,
      mask: imgYinYang,
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
