export interface ProjectionConfig {
  size: number,
  spacing: number,
  items: ProjectionItem[]
}

export interface ProjectionItem {
  id: string,
  mask: string,
  video: string
}
