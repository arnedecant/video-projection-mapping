import {
  imgHeart, imgDrop, imgSmile, imgKiswe, imgLungs, vidConcert, vidCrowd, vidFuture, svgYinYang, svgLungs, svgHeart,
  imgYinYang, imgHome, svgHome, svgKiswe, vidKisweSizzle, imgVideo, svgVideo, svgShareNodes, imgShareNodes
} from './assets'
import { ProjectionConfig } from '@/modules/webgl/types'

const CONFIG: ProjectionConfig = {
  grid: {
    size: 21,
    spacing: 0.6
  },
  cube: {
    width: 0.5,
    height: 0.5,
    depth: 0.25
  },
  elevation: {
    self: 2,
    step: 0.5,
    margin: 0.5 // margin between pointer <=> grid interaction
  },
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
      id: 'home',
      icon: svgHome,
      mask: imgHome,
      video: vidFuture
    },
    // {
    //   id: 'share-nodes',
    //   icon: svgShareNodes,
    //   mask: imgShareNodes,
    //   video: vidCrowd
    // },
    // {
    //   id: 'kiswe',
    //   icon: svgKiswe,
    //   mask: imgKiswe,
    //   video: vidKisweSizzle
    // }
  ]
}

export default CONFIG
