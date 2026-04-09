import { createClient } from '@supabase/supabase-js'

export const DEMO_PREFIX = '[DEMO]'
export const DEMO_USER_COUNT = 12
export const DEMO_VIDEO_LIMIT = 10
export const ROOT_COMMENTS_PER_VIDEO = 3
export const REPLIES_PER_ROOT = 2
export const VIDEO_LIKES_PER_VIDEO = 5
export const COMMENT_LIKES_PER_COMMENT = 2
export const VIEWS_PER_VIDEO = 10

const displayNames = [
  'Demo Astro',
  'Demo Atom',
  'Demo Lab',
  'Demo Orbit',
  'Demo Nova',
  'Demo Quark',
  'Demo Photon',
  'Demo Pulse',
  'Demo Scope',
  'Demo Vector',
  'Demo Signal',
  'Demo Helix',
]

export const demoUsersSeed = Array.from({ length: DEMO_USER_COUNT }, (_, index) => {
  const number = String(index + 1).padStart(2, '0')

  return {
    email: `demo.sciencetok.${number}@example.com`,
    username: `demo_sciencetok_${number}`,
    displayName: `${displayNames[index]} ${number}`,
    bio: `${DEMO_PREFIX} Konto testowe ScienceTok do seedowania komentarzy i interakcji.`,
    password: `ScienceTokDemo!${number}Aa`,
  }
})

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function chunk(items, size) {
  const result = []

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }

  return result
}

export async function listAllAuthUsers(supabase) {
  const users = []
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw error
    }

    users.push(...data.users)

    if (data.users.length < perPage) {
      break
    }

    page += 1
  }

  return users
}

export async function ensureDemoUsers(supabase) {
  const existingUsers = await listAllAuthUsers(supabase)
  const usersByEmail = new Map(existingUsers.map((user) => [user.email, user]))
  const demoUsers = []

  for (const seedUser of demoUsersSeed) {
    let authUser = usersByEmail.get(seedUser.email)

    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: seedUser.email,
        password: seedUser.password,
        email_confirm: true,
        user_metadata: {
          username: seedUser.username,
        },
      })

      if (error) {
        throw error
      }

      authUser = data.user
    }

    demoUsers.push({
      id: authUser.id,
      email: seedUser.email,
      username: seedUser.username,
      display_name: seedUser.displayName,
      bio: seedUser.bio,
      avatar_url: null,
    })
  }

  const profileRows = demoUsers.map(({ id, username, display_name, bio, avatar_url }) => ({
    id,
    username,
    display_name,
    bio,
    avatar_url,
  }))

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profileRows, { onConflict: 'id' })

  if (profileError) {
    throw profileError
  }

  return demoUsers
}

export async function getDemoUsersFromProfiles(supabase) {
  const usernames = demoUsersSeed.map((user) => user.username)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .in('username', usernames)

  if (error) {
    throw error
  }

  return data ?? []
}

export function aggregateByVideo(rows) {
  return rows.reduce((accumulator, row) => {
    accumulator[row.video_id] = (accumulator[row.video_id] || 0) + 1
    return accumulator
  }, {})
}

export async function decrementDemoViewCounts(supabase, demoUserIds) {
  if (demoUserIds.length === 0) {
    return 0
  }

  const { data: demoViews, error: viewsError } = await supabase
    .from('views')
    .select('video_id')
    .in('user_id', demoUserIds)

  if (viewsError) {
    throw viewsError
  }

  if (!demoViews?.length) {
    return 0
  }

  const countsByVideo = aggregateByVideo(demoViews)
  const videoIds = Object.keys(countsByVideo)
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('id, view_count')
    .in('id', videoIds)

  if (videosError) {
    throw videosError
  }

  for (const video of videos ?? []) {
    const nextCount = Math.max((video.view_count || 0) - (countsByVideo[video.id] || 0), 0)
    const { error: updateError } = await supabase
      .from('videos')
      .update({ view_count: nextCount })
      .eq('id', video.id)

    if (updateError) {
      throw updateError
    }
  }

  return demoViews.length
}

export async function cleanupDemoInteractions(supabase, demoUserIds) {
  if (demoUserIds.length === 0) {
    return {
      removedViews: 0,
      removedVideoLikes: 0,
      removedCommentLikes: 0,
      removedComments: 0,
      removedNotifications: 0,
    }
  }

  const removedViews = await decrementDemoViewCounts(supabase, demoUserIds)

  const { count: notificationsByActor, error: notificationsActorError } = await supabase
    .from('notifications')
    .delete({ count: 'exact' })
    .in('actor_id', demoUserIds)

  if (notificationsActorError) {
    throw notificationsActorError
  }

  const { count: notificationsByRecipient, error: notificationsRecipientError } = await supabase
    .from('notifications')
    .delete({ count: 'exact' })
    .in('recipient_id', demoUserIds)

  if (notificationsRecipientError) {
    throw notificationsRecipientError
  }

  const { count: removedCommentLikes, error: commentLikesError } = await supabase
    .from('comment_likes')
    .delete({ count: 'exact' })
    .in('user_id', demoUserIds)

  if (commentLikesError) {
    throw commentLikesError
  }

  const { count: removedVideoLikes, error: videoLikesError } = await supabase
    .from('likes')
    .delete({ count: 'exact' })
    .in('user_id', demoUserIds)

  if (videoLikesError) {
    throw videoLikesError
  }

  const { error: viewsDeleteError } = await supabase
    .from('views')
    .delete()
    .in('user_id', demoUserIds)

  if (viewsDeleteError) {
    throw viewsDeleteError
  }

  const { count: removedComments, error: commentsError } = await supabase
    .from('comments')
    .delete({ count: 'exact' })
    .in('user_id', demoUserIds)

  if (commentsError) {
    throw commentsError
  }

  return {
    removedViews,
    removedVideoLikes: removedVideoLikes ?? 0,
    removedCommentLikes: removedCommentLikes ?? 0,
    removedComments: removedComments ?? 0,
    removedNotifications: (notificationsByActor ?? 0) + (notificationsByRecipient ?? 0),
  }
}
