/**
 * Navigation utilities for role-based routing
 */

export type Role = "requestor" | "worker";

/**
 * Get the equivalent path when switching between roles
 * e.g., /requestor/jobSpecs → /worker/jobSpecs
 */
export function getEquivalentPath(currentPath: string, targetRole: Role): string {
  // Replace the role segment in the path
  const pathWithoutRole = currentPath.replace(/^\/(requestor|worker)/, "");
  return `/${targetRole}${pathWithoutRole}`;
}

/**
 * Extract the current role from a path
 */
export function getRoleFromPath(path: string): Role | null {
  if (path.startsWith("/requestor")) return "requestor";
  if (path.startsWith("/worker")) return "worker";
  return null;
}

/**
 * Navigation items for each role
 */
export interface NavItem {
  label: string;
  href: string;
  icon: "dashboard" | "specs";
}

export function getNavItems(role: Role): NavItem[] {
  return [
    {
      label: "Dashboard",
      href: `/${role}`,
      icon: "dashboard",
    },
    {
      label: "Browse Specs",
      href: `/${role}/jobSpecs`,
      icon: "specs",
    },
  ];
}

/**
 * Check if a nav item is active based on current path
 */
export function isNavItemActive(itemHref: string, currentPath: string): boolean {
  // Exact match for dashboard
  if (itemHref === currentPath) return true;

  // For Browse Specs, match if path starts with jobSpecs
  if (itemHref.endsWith("/jobSpecs") && currentPath.includes("/jobSpecs")) {
    return true;
  }

  return false;
}
