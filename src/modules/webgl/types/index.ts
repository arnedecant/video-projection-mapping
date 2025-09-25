export interface ProjectionConfig {
  size: number,
  spacing: number,
  cubeW: number,
  cubeH: number,
  cubeD: number,
  elevation: number,
  elevationStep: number,
  elevationMargin: number,
  items: ProjectionItem[]
}

export interface ProjectionItem {
  id: string,
  icon: string,
  mask: string,
  video: string
}
