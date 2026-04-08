const ADMIN_EMAILS = new Set(['skoti88@gmail.com'])

export function isAdminEmail(email?: string | null) {
  return typeof email === 'string' && ADMIN_EMAILS.has(email.toLowerCase())
}
