import {
  cleanupDemoInteractions,
  createAdminClient,
  getDemoUsersFromProfiles,
} from './demo-seed-utils.mjs'

async function main() {
  const supabase = createAdminClient()
  const demoUsers = await getDemoUsersFromProfiles(supabase)
  const demoUserIds = demoUsers.map((user) => user.id)
  const cleanupSummary = await cleanupDemoInteractions(supabase, demoUserIds)

  console.log('Demo interactions cleaned up.')
  console.log(JSON.stringify({
    demoUsers: demoUsers.length,
    ...cleanupSummary,
  }, null, 2))
}

main().catch((error) => {
  console.error('Failed to clean up demo interactions.')
  console.error(error)
  process.exit(1)
})
