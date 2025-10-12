export interface ProjectionConfig {
  grid: {
    size: number,
    spacing: number
  },
  cube: {
    width: number,
    height: number,
    depth: number
  },
  elevation: {
    self: number,
    step: number,
    margin: number
  },
  items: ProjectionItem[]
}

export interface ProjectionItem {
  id: string,
  icon: string,
  mask: string,
  video: string
}

export interface Bounds {
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
}
