// ============================================================
// Application Constants
// ============================================================

/**
 * Firestore collection names
 */
export const COLLECTIONS = {
  USERS: 'users',
  STUDIOS: 'studios',
  STUDIO_PROFILES: 'studio_profiles',
  PORTFOLIOS: 'portfolios',
  WEDDINGS: 'weddings',
  GALLERIES: 'galleries',
  GALLERY_PHOTOS: 'gallery_photos',
} as const;

/**
 * Application routes
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  PORTFOLIO: '/portfolio',
  ADMIN_DASHBOARD: '/admin',
  // Studio dashboard routes
  STUDIO_DASHBOARD: '/dashboard',
  STUDIO_GALLERIES: '/dashboard/galleries',
  STUDIO_GALLERIES_CREATE: '/dashboard/galleries/create',
  STUDIO_SETTINGS: '/dashboard/settings',
} as const;

/**
 * Site metadata
 */
export const SITE_NAME = 'My Studios';
export const SITE_DESCRIPTION = 'Premium wedding studio portfolio platform';
