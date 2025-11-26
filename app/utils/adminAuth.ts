"use client";

import Cookies from "js-cookie";

/**
 * Get authentication headers for admin API requests
 * Returns null if no token is found (caller should handle redirect)
 * 
 * Usage in components:
 * const getAuthHeaders = () => {
 *   const token = Cookies.get("admin_token");
 *   if (!token) {
 *     router.push("/admin/login");
 *     return null;
 *   }
 *   return getAdminAuthHeaders();
 * };
 */
export function getAdminAuthHeaders(token?: string): Record<string, string> | null {
  const adminToken = token || Cookies.get("admin_token");
  if (!adminToken) {
    return null;
  }
  return {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  };
}

