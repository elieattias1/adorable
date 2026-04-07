/**
 * Admin user IDs bypass all plan limits.
 * Set ADMIN_USER_IDS=uuid1,uuid2 in your .env.local (server-side)
 * Set NEXT_PUBLIC_ADMIN_USER_IDS=uuid1,uuid2 for client-side checks
 */
export function isAdminUser(userId: string): boolean {
  const raw = process.env.ADMIN_USER_IDS ?? process.env.NEXT_PUBLIC_ADMIN_USER_IDS ?? ''
  if (!raw) return false
  return raw.split(',').map(s => s.trim()).includes(userId)
}

/** Client-safe version using the public env var */
export function isAdminUserClient(userId: string): boolean {
  const raw = process.env.NEXT_PUBLIC_ADMIN_USER_IDS ?? ''
  if (!raw) return false
  return raw.split(',').map(s => s.trim()).includes(userId)
}
