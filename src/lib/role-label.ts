export type AppRole = "admin" | "employee" | "user" | string | null | undefined;

export function getRoleLabel(role: AppRole) {
  if (role === "admin") return "أدمن";
  if (role === "employee" || role === "user") return "مستخدم";
  return "—";
}

export function hasAdminRole(roles: AppRole[] | null | undefined) {
  return (roles ?? []).includes("admin");
}