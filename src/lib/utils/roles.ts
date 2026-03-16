import type { UserRole } from '@/types/database';

export function isDeveloper(role: UserRole | undefined): boolean {
  return role === 'developer';
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'admin' || role === 'developer';
}

export function canManageRoles(role: UserRole | undefined): boolean {
  return role === 'developer';
}

export function canDeleteUsers(role: UserRole | undefined): boolean {
  return role === 'developer';
}

export function canEditOtherProfiles(role: UserRole | undefined): boolean {
  return role === 'admin' || role === 'developer';
}
