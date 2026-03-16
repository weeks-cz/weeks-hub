export const APP_NAME = 'Weeks Hub';
export const APP_DESCRIPTION = 'Interní systém pro tým Weeks';

export const ALLOWED_EMAIL_DOMAIN = 'weeks.cz';

export const ROUTES = {
  home: '/',
  login: '/auth/login',
  authCallback: '/auth/callback',
  authError: '/auth/error',
  dashboard: '/dashboard',
  board: '/board',
  calendar: '/calendar',
  camps: '/camps',
  formulare: '/formulare',
  analytics: '/analytics',
  admin: '/admin',
  adminUsers: '/admin/users',
  profile: '/profile',
  profileEdit: '/profile/edit',
} as const;

export const NAV_ITEMS = [
  { label: 'Dashboard', href: ROUTES.dashboard, icon: 'LayoutDashboard' as const },
  { label: 'Board', href: ROUTES.board, icon: 'Kanban' as const },
  { label: 'Kalendář', href: ROUTES.calendar, icon: 'Calendar' as const },
  { label: 'Tábory', href: ROUTES.camps, icon: 'Tent' as const },
  { label: 'Formuláře', href: ROUTES.formulare, icon: 'FileText' as const },
  { label: 'Analytika', href: ROUTES.analytics, icon: 'BarChart3' as const },
] as const;
