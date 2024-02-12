import { DeleteResult } from 'kysely'
import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
    const ops = await getOpsByType(evt)

    const likesToCreate = ops.likes.creates.map((create) => {
      return {
        uri: create.uri,
        author: create.author,
        createdAt: create.record.createdAt,
      }
    })

    // Likeの削除は素直に削除
    const likesToDelete = ops.likes.deletes.map((del) => del.uri)
    if (likesToDelete.length > 0) {
      const res = await this.db
        .deleteFrom('like')
        .where('uri', 'in', likesToDelete)
        .execute()
      const deletedRows = this.totalDeleteRows(res)
      if (deletedRows > 0) {
        // console.log('Delete like:', deletedRows)
      }
    }

    // Likeをユーザーごとに最大10件まで保存
    for (const like of likesToCreate) {
      const authorLikesDB = await this.db
        .selectFrom('like')
        .selectAll()
        .where('author', '=', like.author)
        .orderBy('createdAt', 'asc')
        .execute()

      const allLikesDB = await this.db
        .selectFrom('like')
        .selectAll()
        .execute()

      console.log('Author:', like.author,  'saved', authorLikesDB.length, 'likes', '/', 'total', allLikesDB.length)

      if (authorLikesDB.length === 10) {
        const res = await this.db
          .deleteFrom('like')
          .where('uri', '=', authorLikesDB[0].uri)
          .execute()
        const deletedRows = this.totalDeleteRows(res)
        if (deletedRows > 0) {
          // console.log('Delete like:', deletedRows)
        }
      }

      const ins = await this.db
        .insertInto('like')
        .values(like)
        .onConflict((oc) => oc.doNothing())
        .execute()
      // console.log('Insert post:', ins.length)
    }
  }

  totalDeleteRows(result: DeleteResult[]) {
    return result.reduce((prev, curr) => prev + curr.numDeletedRows, BigInt(0))
  }
}
