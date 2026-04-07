export const NOTIFICATIONS_CHANGED_EVENT = 'notifications:changed'

export function emitNotificationsChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
}
