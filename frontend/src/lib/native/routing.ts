import { getHomePathForRole, isStaffRole, type UserRole } from '@/types/auth'
import { STAFF_WEB_ONLY_PATH } from '@/lib/native/constants'
import { isNativeApp } from '@/lib/native/platform'

export function getAppHomePathForRole(role: UserRole): string {
  if (isNativeApp() && isStaffRole(role)) {
    return STAFF_WEB_ONLY_PATH
  }
  return getHomePathForRole(role)
}
