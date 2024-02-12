export type DatabaseSchema = {
  post: Post
  like: Like
  sub_state: SubState
}

export type Post = {
  uri: string
  author: string  
  indexedAt: string
}

export type Like = {
  uri: string
  author: string
  createdAt: string
}

export type SubState = {
  service: string
  cursor: number
}
