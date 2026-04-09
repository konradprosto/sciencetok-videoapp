import {
  COMMENT_LIKES_PER_COMMENT,
  DEMO_PREFIX,
  DEMO_VIDEO_LIMIT,
  REPLIES_PER_ROOT,
  ROOT_COMMENTS_PER_VIDEO,
  VIDEO_LIKES_PER_VIDEO,
  VIEWS_PER_VIDEO,
  chunk,
  cleanupDemoInteractions,
  createAdminClient,
  ensureDemoUsers,
} from './demo-seed-utils.mjs'

const rootCommentTemplates = [
  'Świetne wyjaśnienie, pierwszy raz mam wrażenie że to naprawdę kliknęło.',
  'Mega dobrze się to ogląda, poproszę więcej takich materiałów.',
  'To jest dokładnie ten typ treści, dla którego warto tu wracać.',
  'Super tempo i konkrety, bez lania wody.',
  'Bardzo czytelne, nawet bez wcześniejszej wiedzy da się wejść w temat.',
  'Fajnie by było zobaczyć jeszcze rozwinięcie tego wątku w kolejnym filmie.',
]

const replyTemplates = [
  'Też tak mam, szczególnie podoba mi się sposób tłumaczenia krok po kroku.',
  'Dokładnie, ten format jest dużo bardziej przystępny niż klasyczne wykłady.',
  'Mam podobne odczucie, dobrze by było dostać jeszcze część drugą.',
  'Najbardziej siadło mi to, że wszystko jest pokazane bardzo praktycznie.',
  'Podbijam, takie materiały robią robotę na mobile.',
]

function tagDemo(text) {
  return `${DEMO_PREFIX} ${text}`
}

async function main() {
  const supabase = createAdminClient()
  const demoUsers = await ensureDemoUsers(supabase)
  const demoUserIds = demoUsers.map((user) => user.id)

  const cleanupSummary = await cleanupDemoInteractions(supabase, demoUserIds)

  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('id, title, created_at')
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(DEMO_VIDEO_LIMIT)

  if (videosError) {
    throw videosError
  }

  if (!videos?.length) {
    console.log('Brak gotowych filmów do seedowania.')
    console.log(JSON.stringify({ cleanupSummary, createdUsers: demoUsers.length }, null, 2))
    return
  }

  const rootRows = []
  const baseTime = Date.now() - 1000 * 60 * 60 * 6

  videos.forEach((video, videoIndex) => {
    for (let commentIndex = 0; commentIndex < ROOT_COMMENTS_PER_VIDEO; commentIndex += 1) {
      const user = demoUsers[(videoIndex * ROOT_COMMENTS_PER_VIDEO + commentIndex) % demoUsers.length]
      const template = rootCommentTemplates[(videoIndex + commentIndex) % rootCommentTemplates.length]

      rootRows.push({
        video_id: video.id,
        user_id: user.id,
        parent_id: null,
        content: tagDemo(template),
        created_at: new Date(baseTime + (videoIndex * 15 + commentIndex) * 60_000).toISOString(),
      })
    }
  })

  const { data: rootComments, error: rootCommentsError } = await supabase
    .from('comments')
    .insert(rootRows)
    .select('id, video_id, user_id, parent_id')

  if (rootCommentsError) {
    throw rootCommentsError
  }

  const replyRows = []

  rootComments.forEach((comment, index) => {
    for (let replyIndex = 0; replyIndex < REPLIES_PER_ROOT; replyIndex += 1) {
      const replyUser = demoUsers[(index + replyIndex + 3) % demoUsers.length]
      const template = replyTemplates[(index + replyIndex) % replyTemplates.length]

      if (replyUser.id === comment.user_id) {
        continue
      }

      replyRows.push({
        video_id: comment.video_id,
        user_id: replyUser.id,
        parent_id: comment.id,
        content: tagDemo(template),
        created_at: new Date(baseTime + (index * 10 + replyIndex + 100) * 60_000).toISOString(),
      })
    }
  })

  const { data: replyComments, error: replyCommentsError } = await supabase
    .from('comments')
    .insert(replyRows)
    .select('id, video_id, user_id, parent_id')

  if (replyCommentsError) {
    throw replyCommentsError
  }

  const replyParents = new Map(rootComments.map((comment) => [comment.id, comment.user_id]))
  const replyNotifications = replyComments
    .map((reply) => ({
      recipient_id: replyParents.get(reply.parent_id),
      actor_id: reply.user_id,
      type: 'comment_reply',
      comment_id: reply.id,
      video_id: reply.video_id,
    }))
    .filter((notification) => notification.recipient_id && notification.recipient_id !== notification.actor_id)

  if (replyNotifications.length > 0) {
    const { error: replyNotificationsError } = await supabase
      .from('notifications')
      .insert(replyNotifications)

    if (replyNotificationsError) {
      throw replyNotificationsError
    }
  }

  const allComments = [...rootComments, ...replyComments]
  const commentLikes = []

  allComments.forEach((comment, index) => {
    for (let likeIndex = 0; likeIndex < COMMENT_LIKES_PER_COMMENT; likeIndex += 1) {
      const likingUser = demoUsers[(index + likeIndex + 5) % demoUsers.length]

      if (likingUser.id === comment.user_id) {
        continue
      }

      commentLikes.push({
        user_id: likingUser.id,
        comment_id: comment.id,
      })
    }
  })

  for (const commentLikeChunk of chunk(commentLikes, 200)) {
    const { error: commentLikesError } = await supabase
      .from('comment_likes')
      .upsert(commentLikeChunk, {
        onConflict: 'user_id,comment_id',
        ignoreDuplicates: true,
      })

    if (commentLikesError) {
      throw commentLikesError
    }
  }

  const commentById = new Map(allComments.map((comment) => [comment.id, comment]))
  const commentLikeNotifications = commentLikes
    .map((like) => {
      const comment = commentById.get(like.comment_id)

      if (!comment || comment.user_id === like.user_id) {
        return null
      }

      return {
        recipient_id: comment.user_id,
        actor_id: like.user_id,
        type: 'comment_like',
        comment_id: comment.id,
        video_id: comment.video_id,
      }
    })
    .filter(Boolean)

  for (const notificationChunk of chunk(commentLikeNotifications, 200)) {
    const { error: notificationsError } = await supabase
      .from('notifications')
      .upsert(notificationChunk, {
        onConflict: 'actor_id,type,comment_id',
        ignoreDuplicates: true,
      })

    if (notificationsError) {
      throw notificationsError
    }
  }

  const videoLikes = []
  const viewRows = []

  videos.forEach((video, videoIndex) => {
    for (let likeIndex = 0; likeIndex < VIDEO_LIKES_PER_VIDEO; likeIndex += 1) {
      const user = demoUsers[(videoIndex + likeIndex + 1) % demoUsers.length]
      videoLikes.push({
        user_id: user.id,
        video_id: video.id,
      })
    }

    for (let viewIndex = 0; viewIndex < VIEWS_PER_VIDEO; viewIndex += 1) {
      const user = demoUsers[(videoIndex + viewIndex + 2) % demoUsers.length]
      viewRows.push({
        video_id: video.id,
        user_id: user.id,
        session_id: `demo:seed:${video.id}:${viewIndex}`,
      })
    }
  })

  for (const videoLikeChunk of chunk(videoLikes, 200)) {
    const { error: videoLikesError } = await supabase
      .from('likes')
      .upsert(videoLikeChunk, {
        onConflict: 'user_id,video_id',
        ignoreDuplicates: true,
      })

    if (videoLikesError) {
      throw videoLikesError
    }
  }

  for (const viewChunk of chunk(viewRows, 200)) {
    const { error: viewsError } = await supabase
      .from('views')
      .insert(viewChunk)

    if (viewsError) {
      throw viewsError
    }
  }

  for (const view of viewRows) {
    const { error: incrementError } = await supabase.rpc('increment_view_count', {
      video_id_input: view.video_id,
    })

    if (incrementError) {
      throw incrementError
    }
  }

  const summary = {
    createdUsers: demoUsers.length,
    touchedVideos: videos.length,
    rootComments: rootComments.length,
    replies: replyComments.length,
    commentLikes: commentLikes.length,
    videoLikes: videoLikes.length,
    views: viewRows.length,
    replyNotifications: replyNotifications.length,
    commentLikeNotifications: commentLikeNotifications.length,
    cleanupSummary,
  }

  console.log('Demo interactions seeded successfully.')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('Failed to seed demo interactions.')
  console.error(error)
  process.exit(1)
})
