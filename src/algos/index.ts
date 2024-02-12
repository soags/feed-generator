import { AppContext } from '../config'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import * as sixDegLikes from './six-deg-likes'

type AlgoHandler = (ctx: AppContext, params: QueryParams, requester: string) => Promise<AlgoOutput>

const algos: Record<string, AlgoHandler> = {
  [sixDegLikes.shortname]: sixDegLikes.handler,
}

export default algos
