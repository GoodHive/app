/**
 * Configuration for protected routes that require authentication
 */

export const protectedRoutes = [
  '/talents/my-profile',
  '/companies/my-profile',
  '/user-profile',
  '/companies/create-job'
];

/**
 * Check if a given path is a protected route
 * @param path - The path to check
 * @returns true if the path requires authentication
 */
export const isProtectedRoute = (path: string): boolean => {
  return protectedRoutes.some(route => path.startsWith(route));
};